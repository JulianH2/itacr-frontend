import type { IconName } from '@shared/components/icon/icon-paths';

export interface NavigationLink {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
}
