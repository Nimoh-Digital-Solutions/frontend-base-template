import { useEffect } from 'react';

import { APP_CONFIG } from '@configs';

/**
 * useDocumentTitle
 *
 * Sets document.title on mount and restores the previous title on unmount.
 * Appends the app name for consistent branding across all pages.
 *
 * @example
 * useDocumentTitle('Home');
 * // document.title => "Home | React Starter Kit"
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | ${APP_CONFIG.appName}`;

    return () => {
      document.title = prev;
    };
  }, [title]);
}
