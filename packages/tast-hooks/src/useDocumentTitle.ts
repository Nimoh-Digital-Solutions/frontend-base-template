import { useEffect } from 'react';

/**
 * useDocumentTitle
 *
 * Sets document.title on mount and restores the previous title on unmount.
 * Optionally appends the app name for consistent branding across all pages.
 *
 * @param title - The page-specific title (e.g. 'Home', 'Dashboard')
 * @param appName - Optional app name to append (e.g. 'My App' → "Home | My App")
 *
 * @example
 * // With app name
 * useDocumentTitle('Home', APP_CONFIG.appName);
 * // document.title => "Home | React Starter Kit"
 *
 * // Without app name
 * useDocumentTitle('Home');
 * // document.title => "Home"
 */
export function useDocumentTitle(title: string, appName?: string): void {
  useEffect(() => {
    const prev = document.title;
    document.title = appName ? `${title} | ${appName}` : title;

    // Announce the new page title to screen readers via an aria-live region.
    // document.title updates alone are not reliably announced by all AT/browser
    // combinations during SPA navigation.  A single shared announcer element is
    // created on first use and reused on subsequent route changes.
    let announcer = document.getElementById('route-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'route-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      // Visually hidden but accessible to screen readers:
      announcer.style.cssText =
        'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap';
      document.body.appendChild(announcer);
    }
    announcer.textContent = document.title;

    return () => {
      document.title = prev;
    };
  }, [title, appName]);
}
