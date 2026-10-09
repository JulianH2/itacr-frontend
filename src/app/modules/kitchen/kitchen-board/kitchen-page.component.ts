import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '@shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-kitchen-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      heading="Cocina"
      description="Pantalla de cocina (KDS) con pedidos en tiempo real."
    />
  `,
})
export class KitchenPageComponent {}
