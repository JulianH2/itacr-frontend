import { Pipe, type PipeTransform } from '@angular/core';

const MXN_FORMAT = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a number as Mexican pesos with two decimals, e.g. `$129.00`. */
@Pipe({ name: 'mxnPrice' })
export class MxnPricePipe implements PipeTransform {
  transform(value: number): string {
    return MXN_FORMAT.format(value);
  }
}
