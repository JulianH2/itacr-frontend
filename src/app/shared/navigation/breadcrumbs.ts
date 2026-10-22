export interface Breadcrumb {
  readonly label: string;
  readonly url: string;
}

/** Spanish labels of the URL segments that are screens. Segments not listed (ids) are skipped. */
const SEGMENT_LABELS: Readonly<Record<string, string>> = {
  pickup: 'Pedido para recoger',
  orders: 'Pedidos',
  summary: 'Resumen',
  sent: 'Enviado',
  detail: 'Detalle',
  catalog: 'Menú',
  kitchen: 'Cocina',
  manager: 'Gerencia',
  tracking: 'Seguimiento',
  login: 'Iniciar sesión',
  password: 'Usuario y contraseña',
  redirect: 'Redirigiendo',
  offline: 'Conexión',
};

/** "/orders/detail/42?x=1" -> [Pedidos (/orders), Detalle (/orders/detail/42)]. The last crumb is the current page. */
export function breadcrumbsFor(url: string): readonly Breadcrumb[] {
  const path = url.split(/[?#]/)[0] ?? '';
  const segments = path.split('/').filter((segment) => segment.length > 0);
  const crumbs: Breadcrumb[] = [];
  let lastLabelled = -1;

  segments.forEach((segment, index) => {
    const label = Object.hasOwn(SEGMENT_LABELS, segment) ? SEGMENT_LABELS[segment] : undefined;
    if (label !== undefined) {
      crumbs.push({ label, url: '/' + segments.slice(0, index + 1).join('/') });
      lastLabelled = index;
    }
  });

  // The current page links to the full URL, ids included.
  const last = crumbs.at(-1);
  if (last && lastLabelled >= 0) {
    crumbs[crumbs.length - 1] = { label: last.label, url: '/' + segments.join('/') };
  }
  return crumbs;
}
