import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '@shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      heading="Panel de gerencia"
      description="Métricas de ventas y operación del restaurante."
    />
  `,
})
export class DashboardPageComponent {}
