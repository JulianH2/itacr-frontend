import { Injectable, signal } from '@angular/core';

import type { IconName } from '@shared/components/icon/icon-paths';

export const TOAST_DURATION_MS = 6000;

export interface Toast {
  readonly id: number;
  readonly title: string;
  readonly message: string;
  readonly icon: IconName;
}

export interface ToastRequest {
  readonly title: string;
  readonly message: string;
  readonly icon?: IconName;
}

/** In-app notifications ("Nueva actualización: Orden #1042 lista en 8 min"). Each one closes itself. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly state = signal<readonly Toast[]>([]);

  readonly toasts = this.state.asReadonly();

  show(request: ToastRequest): number {
    const toast: Toast = {
      id: this.nextId++,
      title: request.title,
      message: request.message,
      icon: request.icon ?? 'bell',
    };
    this.state.update((toasts) => [...toasts, toast]);
    setTimeout(() => this.dismiss(toast.id), TOAST_DURATION_MS);
    return toast.id;
  }

  dismiss(id: number): void {
    this.state.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
