import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App, NAVIGATION_LINKS } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app when it is bootstrapped', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
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

  it('should render one navigation link per feature when the app starts', async () => {
    // Arrange
    const fixture = TestBed.createComponent(App);

    // Act
    await fixture.whenStable();

    // Assert
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('.app-toolbar__nav a');
    expect(links.length).toBe(NAVIGATION_LINKS.length);
  });
});
