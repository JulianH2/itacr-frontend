import { inject, Injectable, InjectionToken } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

export const PAGE_RELOAD = new InjectionToken<() => void>('PAGE_RELOAD', {
  providedIn: 'root',
  factory: () => () => location.reload(),
});

export const UPDATE_MESSAGE = 'Hay una nueva versión disponible.';
export const UPDATE_ACTION = 'Actualizar';

function isVersionReady(event: VersionEvent): event is VersionReadyEvent {
  return event.type === 'VERSION_READY';
}

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackBar = inject(MatSnackBar);
  private readonly reload = inject(PAGE_RELOAD);

  start(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.swUpdate.versionUpdates.pipe(filter(isVersionReady)).subscribe(() => this.offerUpdate());
    this.swUpdate.unrecoverable.subscribe(() => this.reload());
  }

  private offerUpdate(): void {
    this.snackBar
      .open(UPDATE_MESSAGE, UPDATE_ACTION)
      .onAction()
      .subscribe(() => this.reload());
  }
}
