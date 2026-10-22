import { breadcrumbsFor } from './breadcrumbs';

describe('breadcrumbsFor', () => {
  it('should return one crumb when the url is a top level screen', () => {
    expect(breadcrumbsFor('/orders')).toEqual([{ label: 'Pedidos', url: '/orders' }]);
  });

  it('should skip the id and keep the full url on the last crumb when the url is a detail', () => {
    expect(breadcrumbsFor('/orders/detail/abc-123')).toEqual([
      { label: 'Pedidos', url: '/orders' },
      { label: 'Detalle', url: '/orders/detail/abc-123' },
    ]);
  });

  it('should ignore the query string and fragment when the url has them', () => {
    expect(breadcrumbsFor('/orders/summary?table=5#top')).toEqual([
      { label: 'Pedidos', url: '/orders' },
      { label: 'Resumen', url: '/orders/summary' },
    ]);
  });

  it('should return nothing when the url is the home page', () => {
    expect(breadcrumbsFor('/')).toEqual([]);
  });

  it('should return nothing when a segment is not a known screen', () => {
    expect(breadcrumbsFor('/constructor')).toEqual([]);
  });
});
