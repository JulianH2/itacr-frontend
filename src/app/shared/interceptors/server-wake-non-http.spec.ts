import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, throwError } from 'rxjs';

import { environment } from '@env/environment';
import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { ServerWakeService } from '@shared/services/server-wake.service';

import { serverWakeInterceptor } from './server-wake.interceptor';

describe('serverWakeInterceptor with an error that is not an HTTP answer', () => {
  it('should count the server as awake and not try again', async () => {
    // Arrange
    const failure = new Error('boom');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([serverWakeInterceptor, () => throwError(() => failure)]),
        ),
        { provide: ConnectionStatusService, useValue: { online: signal(true) } },
      ],
    });
    const wake = TestBed.inject(ServerWakeService);
    const awake = vi.spyOn(wake, 'awake');
    const retrying = vi.spyOn(wake, 'retrying');

    // Act
    const request = firstValueFrom(
      TestBed.inject(HttpClient).get(`${environment.apiBaseUrl}/catalog/products`),
    );

    // Assert
    await expect(request).rejects.toBe(failure);
    expect(awake).toHaveBeenCalled();
    expect(retrying).not.toHaveBeenCalled();
  });
});
