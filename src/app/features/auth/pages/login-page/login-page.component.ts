import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '@shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      heading="Iniciar sesión"
      description="Acceso del personal con PIN de 4 dígitos."
    />
  `,
})
export class LoginPageComponent {}
