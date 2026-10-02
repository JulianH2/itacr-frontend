import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '@shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      heading="Catálogo"
      description="Productos, combos y categorías del menú."
    />
  `,
})
export class CatalogPageComponent {}
