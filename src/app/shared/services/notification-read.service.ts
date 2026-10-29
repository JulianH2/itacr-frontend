import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { PushNotificationsService } from './push-notifications.service';

const NOTIFICATION_PARAM = 'notification';
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A tapped "order ready" notice opens its page with `?notification=<id>` (HU_09). This records it as read and removes the
 * parameter from the address, so a reload or a shared link does not count it again. It works even when the tap is what
 * opened the app.
 */
@Injectable({ providedIn: 'root' })
export class NotificationReadService {
  private readonly router = inject(Router);
  private readonly push = inject(PushNotificationsService);

  start(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.recordFromUrl());
  }

  private recordFromUrl(): void {
    const tree = this.router.parseUrl(this.router.url);
    const notificationId = tree.queryParams[NOTIFICATION_PARAM];
    if (typeof notificationId !== 'string') {
      return;
    }
    if (GUID.test(notificationId)) {
      void this.push.markRead(notificationId);
    }
    tree.queryParams = Object.fromEntries(
      Object.entries(tree.queryParams).filter(([key]) => key !== NOTIFICATION_PARAM),
    );
    void this.router.navigateByUrl(tree, { replaceUrl: true });
  }
}
