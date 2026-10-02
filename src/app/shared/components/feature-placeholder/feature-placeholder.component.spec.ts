import { TestBed } from '@angular/core/testing';

import { FeaturePlaceholderComponent } from './feature-placeholder.component';

describe('FeaturePlaceholderComponent', () => {
  it('should render the heading and description when both inputs are set', async () => {
    // Arrange
    await TestBed.configureTestingModule({
      imports: [FeaturePlaceholderComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(FeaturePlaceholderComponent);
    fixture.componentRef.setInput('heading', 'Pedidos');
    fixture.componentRef.setInput('description', 'Toma de pedidos del mesero.');

    // Act
    await fixture.whenStable();

    // Assert
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toBe('Pedidos');
    expect(element.textContent).toContain('Toma de pedidos del mesero.');
  });
});
