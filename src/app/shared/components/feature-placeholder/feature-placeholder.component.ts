import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Presentational card shown by feature pages until their user stories are implemented.
 */
@Component({
  selector: 'app-feature-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feature-placeholder.component.html',
  styleUrl: './feature-placeholder.component.scss',
})
export class FeaturePlaceholderComponent {
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
}
