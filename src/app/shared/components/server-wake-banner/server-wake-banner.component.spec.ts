import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerWakeService } from '@shared/services/server-wake.service';

import { ServerWakeBannerComponent } from './server-wake-banner.component';

describe('ServerWakeBannerComponent', () => {
  let fixture: ComponentFixture<ServerWakeBannerComponent>;
  let wake: ServerWakeService;

  const element = (testId: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${testId}"]`);

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerWakeBannerComponent);
    wake = TestBed.inject(ServerWakeService);
    fixture.detectChanges();
  });

  it('shows nothing while the server answers', () => {
    expect(element('server-waking')).toBeNull();
    expect(element('server-failed')).toBeNull();
  });

  it('tells the user the data will load by itself while the server wakes up', () => {
    wake.retrying();
    fixture.detectChanges();

    expect(element('server-waking')?.textContent).toContain('Despertando el servidor');
    expect(element('server-waking')?.getAttribute('role')).toBe('status');
    expect(element('server-failed')).toBeNull();
  });

  it('shows the final error as an alert and lets the user close it', () => {
    wake.failed();
    fixture.detectChanges();

    expect(element('server-failed')?.textContent).toContain('No pudimos conectar con el servidor');
    expect(element('server-failed')?.getAttribute('role')).toBe('alert');

    element('server-failed-dismiss')?.click();
    fixture.detectChanges();

    expect(element('server-failed')).toBeNull();
  });

  it('goes away once the server answers', () => {
    wake.retrying();
    fixture.detectChanges();

    wake.awake();
    fixture.detectChanges();

    expect(element('server-waking')).toBeNull();
  });
});
