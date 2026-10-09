import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { EmployeeRole } from '@shared/auth/auth.models';
import { SESSION_STORAGE, SessionService } from '@shared/auth/session.service';
import { loginResponse } from '@shared/testing/auth-fixtures';
import { MemoryStorage } from '@shared/testing/memory-storage';

import { App, NAVIGATION_BY_ROLE } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: SESSION_STORAGE, useValue: new MemoryStorage() }],
    }).compileComponents();
  });

  it('should render the brand name when the app starts', async () => {
    // Arrange
    const fixture = TestBed.createComponent(App);

    // Act
    await fixture.whenStable();

    // Assert
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.app-toolbar__brand')?.textContent?.trim()).toBe('ITACR');
  });

  it('should hide the navigation and profile when nobody is logged in', async () => {
    // Arrange
    const fixture = TestBed.createComponent(App);

    // Act
    await fixture.whenStable();

    // Assert
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.app-toolbar__nav')).toBeNull();
    expect(element.querySelector('[data-testid="logout"]')).toBeNull();
  });

  it('should show only the links of the role when a waiter is logged in', async () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Waiter));
    const fixture = TestBed.createComponent(App);

    // Act
    await fixture.whenStable();

    // Assert
    const element = fixture.nativeElement as HTMLElement;
    const links = element.querySelectorAll('.app-toolbar__nav a');
    expect(links.length).toBe(NAVIGATION_BY_ROLE[EmployeeRole.Waiter].length);
    expect(element.querySelector('[data-testid="profile-name"]')?.textContent).toContain('Ana M.');
  });

  // The manager can follow the kitchen queue, so the kitchen link is part of their navigation.
  it('should link the kitchen board when a manager is logged in', async () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Manager));
    const fixture = TestBed.createComponent(App);

    // Act
    await fixture.whenStable();

    // Assert
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('.app-toolbar__nav a');
    expect(Array.from(links, (link) => link.getAttribute('href'))).toContain('/kitchen');
  });

  it('should clear the session and go to login when the employee logs out', async () => {
    // Arrange
    const session = TestBed.inject(SessionService);
    session.start(loginResponse(EmployeeRole.Waiter));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    // Act
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="logout"]')
      ?.click();
    await fixture.whenStable();

    // Assert
    expect(session.session()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
