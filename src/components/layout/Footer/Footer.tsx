import { APP_CONFIG } from '@configs';

import styles from './Footer.module.scss';

/**
 * Footer
 * Layout component
 */
export const Footer = ({ className }: { className?: string }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={className ? `${styles.root} ${className}` : styles.root}>
      <p>
        &copy; {currentYear} {APP_CONFIG.appName}. All rights reserved.
      </p>
    </footer>
  );
};
