import { renderComponent, rootElement } from '@shared/testing/render';
import { initialsOf, AvatarComponent } from './avatar.component';

describe('initialsOf', () => {
  it('should return the first letters of the first two words when the name has several', () => {
    expect(initialsOf('Daniela Ávila Pérez')).toBe('DA');
  });

  it('should return one letter when the name is a single word', () => {
    expect(initialsOf('guillermo')).toBe('G');
  });

  it('should return a question mark when the name is empty', () => {
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('AvatarComponent', () => {
  it('should show the initials and name the person for screen readers when it is rendered', async () => {
    // Act
    const fixture = await renderComponent(AvatarComponent, { name: 'Daniela Ávila' });

    // Assert
    const avatar = rootElement(fixture).querySelector('[role="img"]');
    expect(avatar?.textContent?.trim()).toBe('DA');
    expect(avatar?.getAttribute('aria-label')).toBe('Daniela Ávila');
  });
});
