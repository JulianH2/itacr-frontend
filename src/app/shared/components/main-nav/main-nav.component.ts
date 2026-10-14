import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import type { NavigationLink } from '@shared/navigation/navigation-link';
import { AvatarComponent } from '../avatar/avatar.component';
import { BrandMarkComponent } from '../brand-mark/brand-mark.component';
import { IconComponent } from '../icon/icon.component';

const NAV_ICON_SIZE = 22;
const BRAND_MARK_SIZE = 28;

/**
 * Staff navigation. One element, two layouts: the bottom tab bar on phones and the wine sidebar
 * on wide screens (mockup sheet 3/3). Only the links of the employee's role are passed in.
 */
@Component({
  selector: 'app-main-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, AvatarComponent, BrandMarkComponent, IconComponent],
  templateUrl: './main-nav.component.html',
  styleUrl: './main-nav.component.scss',
})
export class MainNavComponent {
  readonly links = input.required<readonly NavigationLink[]>();
  readonly employeeName = input.required<string>();
  readonly roleLabel = input.required<string>();

  readonly exit = output<void>();

  protected readonly iconSize = NAV_ICON_SIZE;
  protected readonly brandSize = BRAND_MARK_SIZE;
}
