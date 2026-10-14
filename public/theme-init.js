// Applies the saved theme before the first render so there is no flash of the wrong palette.
// It is an external, synchronous script (not inline) because the QA and production CSP only
// allow script-src 'self'. Keep it tiny and dependency-free.
(function () {
  var STORAGE_KEY = 'itacr.theme';
  var THEME_COLORS = { light: '#5a3e37', dark: '#1c1715' };
  var saved = null;

  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    // Storage can be blocked (private mode); fall back to the system preference.
  }

  if (saved !== 'light' && saved !== 'dark') {
    return;
  }

  document.documentElement.setAttribute('data-theme', saved);

  var metas = document.querySelectorAll('meta[name="theme-color"]');
  for (var i = 0; i < metas.length; i++) {
    metas[i].setAttribute('content', THEME_COLORS[saved]);
    metas[i].removeAttribute('media');
  }
})();
