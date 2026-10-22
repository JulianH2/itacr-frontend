import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

/** Creates a component, sets its inputs and waits until it is stable. */
export async function renderComponent<T>(
  component: Type<T>,
  inputs: Readonly<Record<string, unknown>> = {},
): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(component);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  await fixture.whenStable();
  return fixture;
}

export function rootElement(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}
