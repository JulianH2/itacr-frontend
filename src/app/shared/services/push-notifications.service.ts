import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';

/** Who the browser's notices are for: the signed-in waiter, or the customer of a pickup order. */
export type PushTarget =
  { readonly kind: 'waiter' } | { readonly kind: 'pickup'; readonly clientOrderId: string };

/** `unsupported`: no service worker (development, old browser) or no Notification API. */
export type PushPermission = 'unsupported' | 'default' | 'granted' | 'denied';

interface PublicKeyResponse {
  readonly publicKey: string;
}

/**
 * "Order ready" notices (HU_09). The browser subscribes through the Angular service worker with the API's VAPID key, and
 * the subscription is saved for the waiter or for the customer of a pickup order. The notices are built by the API; the
 * service worker shows them and opens the order when one is tapped, even with the app closed.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private readonly swPush = inject(SwPush, { optional: true });
  private readonly http = inject(HttpClient);
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly permissionState = signal<PushPermission>(this.readPermission());

  readonly permission = this.permissionState.asReadonly();

  /**
   * Asks for permission, subscribes this browser and saves it for the target. Call it from a tap: browsers only show the
   * permission prompt in answer to the user. Returns whether the notices are on.
   */
  async enable(target: PushTarget): Promise<boolean> {
    if (this.swPush === null || this.permissionState() === 'unsupported') {
      return false;
    }
    try {
      const { publicKey } = await firstValueFrom(
        this.http.get<PublicKeyResponse>(`${environment.apiBaseUrl}/public/push/public-key`),
      );
      const subscription = await this.swPush.requestSubscription({ serverPublicKey: publicKey });
      await this.save(target, subscription);
      return true;
    } catch (error: unknown) {
      console.error('Failed to turn on the notifications', error);
      return false;
    } finally {
      this.permissionState.set(this.readPermission());
    }
  }

  /**
   * With permission already granted, saves the current subscription for the target again, without any prompt: another
   * waiter may have signed in on this phone, or the customer made a new order.
   */
  async refresh(target: PushTarget): Promise<void> {
    if (this.swPush === null || this.permissionState() !== 'granted') {
      return;
    }
    try {
      const subscription = await firstValueFrom(this.swPush.subscription);
      if (subscription !== null) {
        await this.save(target, subscription);
      }
    } catch (error: unknown) {
      console.error('Failed to refresh the notifications subscription', error);
    }
  }

  /** Records that a notice was opened. A failure is not shown: it only affects a statistic. */
  async markRead(notificationId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(
          `${environment.apiBaseUrl}/public/notifications/${encodeURIComponent(notificationId)}/read`,
          null,
        ),
      );
    } catch (error: unknown) {
      console.error('Failed to record the notification as read', error);
    }
  }

  private async save(target: PushTarget, subscription: PushSubscription): Promise<void> {
    const { endpoint, keys } = subscription.toJSON();
    const body = { endpoint, p256dh: keys?.['p256dh'] ?? '', auth: keys?.['auth'] ?? '' };
    const url =
      target.kind === 'waiter'
        ? `${environment.apiBaseUrl}/push/subscriptions`
        : `${environment.apiBaseUrl}/public/orders/${encodeURIComponent(target.clientOrderId)}/push-subscription`;
    await firstValueFrom(this.http.post<void>(url, body));
  }

  private readPermission(): PushPermission {
    const notifications = this.window?.Notification;
    if (this.swPush?.isEnabled !== true || notifications === undefined) {
      return 'unsupported';
    }
    return notifications.permission === 'default' ? 'default' : notifications.permission;
  }
}
