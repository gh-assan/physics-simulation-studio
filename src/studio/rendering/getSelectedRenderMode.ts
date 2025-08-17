import type { RenderSystemMode } from './RenderSystemFactory';

/**
 * Determine the render system mode at runtime.
 * Priority (highest to lowest):
 * - URL query param: ?renderMode=adapter
 * - localStorage: 'renderMode' or 'studio.renderMode'
 * - Env (Vite): import.meta.env.VITE_RENDER_MODE
 * - Env (Node/Jest): process.env.RENDER_MODE
 * - Default: 'adapter'
 */
export function getSelectedRenderMode(): RenderSystemMode {
  try {
    // URL param
    if (typeof window !== 'undefined' && typeof window.location?.search === 'string') {
      const search = window.location.search || '';
      const match = search.match(/[?&]renderMode=([^&]+)/);
      const mode = match ? decodeURIComponent(match[1]) : undefined;
      if (mode === 'adapter') return 'adapter';
    }

    // localStorage
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      const lsMode = window.localStorage.getItem('renderMode') || window.localStorage.getItem('studio.renderMode');
      if (lsMode === 'adapter') return 'adapter';
    }

    // Vite env (avoid direct import.meta reference for ts-jest)
    const viteMode = (() => {
      try {
        // Executed at runtime only; safe in non-Vite contexts
        // eslint-disable-next-line no-new-func
        const fn = new Function(
          'try { return (typeof import !== "undefined" && import.meta && import.meta.env && import.meta.env.VITE_RENDER_MODE) } catch { return undefined }'
        );
        return fn() as string | undefined;
      } catch {
        return undefined;
      }
    })();
    if (viteMode === 'adapter') return 'adapter';

    // Node/Jest env
    if (typeof process !== 'undefined' && process.env && typeof process.env.RENDER_MODE === 'string') {
      const envMode = process.env.RENDER_MODE;
      if (envMode === 'adapter') return 'adapter';
    }
  } catch {
    // fall through to default
  }
  return 'adapter';
}
