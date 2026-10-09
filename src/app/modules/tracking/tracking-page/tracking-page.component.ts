import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '@shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-tracking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      heading="Seguimiento"
      description="Estado de tu pedido y notificaciones."
    />
  `,
})
export class TrackingPageComponent {}
