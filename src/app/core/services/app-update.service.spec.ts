import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate, UnrecoverableStateEvent, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';

import { AppUpdateService, PAGE_RELOAD, UPDATE_ACTION, UPDATE_MESSAGE } from './app-update.service';

describe('AppUpdateService', () => {
  let versionUpdates: Subject<VersionEvent>;
  let unrecoverable: Subject<UnrecoverableStateEvent>;
  let updateAccepted: Subject<void>;
  let reload: ReturnType<typeof vi.fn>;
  let open: ReturnType<typeof vi.fn>;

  function createService(isEnabled: boolean): AppUpdateService {
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: { isEnabled, versionUpdates, unrecoverable } },
        { provide: MatSnackBar, useValue: { open } },
        { provide: PAGE_RELOAD, useValue: reload },
      ],
    });
    return TestBed.inject(AppUpdateService);
  }

  beforeEach(() => {
    versionUpdates = new Subject<VersionEvent>();
    unrecoverable = new Subject<UnrecoverableStateEvent>();
    updateAccepted = new Subject<void>();
    reload = vi.fn();
    open = vi.fn(() => ({ onAction: () => updateAccepted }));
  });

  it('should offer the update and reload only when the user accepts it when a new version is ready', () => {
    // Arrange
    createService(true).start();

    // Act
    versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old' },
      latestVersion: { hash: 'new' },
    });

    // Assert
    expect(open).toHaveBeenCalledWith(UPDATE_MESSAGE, UPDATE_ACTION);
    expect(reload).not.toHaveBeenCalled();
    updateAccepted.next();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('should ignore version events that are not ready to use', () => {
    // Arrange
    createService(true).start();

    // Act
    versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'new' } });

    // Assert
    expect(open).not.toHaveBeenCalled();
  });

  it('should reload right away when the service worker state is unrecoverable', () => {
    // Arrange
    createService(true).start();

    // Act
    unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing files' });

    // Assert
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('should do nothing when the service worker is disabled', () => {
    // Arrange
    const service = createService(false);

    // Act
    service.start();
    unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing files' });

    // Assert
    expect(reload).not.toHaveBeenCalled();
  });
});
