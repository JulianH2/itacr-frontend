import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type Observable, firstValueFrom } from 'rxjs';

import { ACCESS_REQUEST_MESSAGES } from '../models/access-requests.messages';
import type { AccessRequests } from '../models/manager.models';
import { MANAGER_API } from './manager-api';

/** What the last action did, to tell the manager: a success or the reason it failed. */
export interface AccessRequestFeedback {
  readonly kind: 'success' | 'error';
  readonly message: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return ACCESS_REQUEST_MESSAGES.network;
    }
    const detail = (error.error as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return ACCESS_REQUEST_MESSAGES.unexpected;
}

/** The answers that mean another manager already attended the request, so the list on screen is out of date. */
function isStale(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    (error.status === HttpStatusCode.Conflict || error.status === HttpStatusCode.NotFound)
  );
}

/**
 * State of the section of access requests of the manager's dashboard (HU_15): the accounts to approve or reject and the PIN resets to
 * answer. The list is read again after every action, and also when the API says another manager answered first, so it never shows a
 * request that is gone. While one action is in flight no other starts, so a double tap cannot send it twice.
 *
 * Provided by the section, so leaving the dashboard drops it.
 */
@Injectable()
export class AccessRequestsStore {
  private readonly api = inject(MANAGER_API);
  private readonly destroyRef = inject(DestroyRef);

  private readonly requestsState = signal<AccessRequests | null>(null);
  private readonly loadingState = signal(false);
  private readonly loadFailedState = signal(false);
  private readonly busyState = signal<string | null>(null);
  private readonly feedbackState = signal<AccessRequestFeedback | null>(null);

  /** The pending requests; null before the first answer. */
  readonly requests = this.requestsState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly loadFailed = this.loadFailedState.asReadonly();
  /** The employee whose request is being sent, or null. */
  readonly busyEmployeeId = this.busyState.asReadonly();
  readonly feedback = this.feedbackState.asReadonly();

  /** Loaded and with nothing to attend (CA4). */
  readonly isEmpty = computed(() => {
    const requests = this.requestsState();
    return requests !== null && requests.accounts.length === 0 && requests.pinResets.length === 0;
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loadingState.set(true);
    this.api
      .getAccessRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => {
          this.requestsState.set(requests);
          this.loadFailedState.set(false);
          this.loadingState.set(false);
        },
        error: (error: unknown) => {
          console.error('Failed to load the access requests', error);
          this.loadFailedState.set(true);
          this.loadingState.set(false);
        },
      });
  }

  approve(employeeId: string, fullName: string): Promise<boolean> {
    return this.run(
      employeeId,
      () => this.api.approveAccount(employeeId),
      ACCESS_REQUEST_MESSAGES.approved(fullName),
    );
  }

  reject(employeeId: string, fullName: string): Promise<boolean> {
    return this.run(
      employeeId,
      () => this.api.rejectAccount(employeeId),
      ACCESS_REQUEST_MESSAGES.rejected(fullName),
    );
  }

  /** True when the PIN was assigned, so the form that asked for it can close. */
  assignTemporaryPin(employeeId: string, fullName: string, pin: string): Promise<boolean> {
    return this.run(
      employeeId,
      () => this.api.assignTemporaryPin(employeeId, pin),
      ACCESS_REQUEST_MESSAGES.pinAssigned(fullName),
    );
  }

  dismissFeedback(): void {
    this.feedbackState.set(null);
  }

  private async run(
    employeeId: string,
    action: () => Observable<void>,
    successMessage: string,
  ): Promise<boolean> {
    if (this.busyState() !== null) {
      return false;
    }
    this.busyState.set(employeeId);
    this.feedbackState.set(null);
    try {
      await firstValueFrom(action());
      this.feedbackState.set({ kind: 'success', message: successMessage });
      this.refresh();
      return true;
    } catch (error) {
      this.feedbackState.set({ kind: 'error', message: errorMessage(error) });
      if (isStale(error)) {
        this.refresh();
      }
      return false;
    } finally {
      this.busyState.set(null);
    }
  }
}
