import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

const MAX_INITIALS = 2;

/** "Daniela Ávila" -> "DA" (accents dropped, as in the mockup). A single word gives one letter; an empty name gives "?". */
export function initialsOf(name: string): string {
  const letters = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, MAX_INITIALS)
    .map((word) => word.charAt(0).toLocaleUpperCase('es-MX'));
  return letters.length === 0 ? '?' : letters.join('');
}

/** Round user avatar with initials (sizes 32, 40 and 56 px from the component sheet). */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="avatar"
    [class]="'avatar avatar--' + size()"
    role="img"
    [attr.aria-label]="name()"
    >{{ initials() }}</span
  >`,
  styles: `
    :host {
      display: inline-flex;
    }

    .avatar {
      align-items: center;
      background: var(--color-primary);
      border-radius: var(--radius-pill);
      color: var(--color-on-primary);
      display: inline-flex;
      flex: none;
      font-family: var(--font-family);
      font-weight: 600;
      justify-content: center;
      user-select: none;
    }

    .avatar--sm {
      font-size: 13px;
      height: var(--space-4);
      width: var(--space-4);
    }

    .avatar--md {
      font-size: 16px;
      height: var(--space-5);
      width: var(--space-5);
    }

    .avatar--lg {
      font-size: 18px;
      height: 56px;
      width: 56px;
    }
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly size = input<AvatarSize>('md');

  protected readonly initials = computed(() => initialsOf(this.name()));
}
