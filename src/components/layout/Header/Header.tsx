import { NavLink } from 'react-router-dom';
import { LuHouse, LuLayers } from 'react-icons/lu';

import { APP_CONFIG } from '@configs';
import { PATHS } from '@routes/config/paths';

import styles from './Header.module.scss';

// ---------------------------------------------------------------------------
// Module-level constant — no reactive dependencies, safe outside the component
// ---------------------------------------------------------------------------
const navLinks = [
  { name: 'Home',       path: PATHS.HOME,            icon: <LuHouse  aria-hidden="true" size={22} /> },
  { name: 'Components', path: PATHS.COMPONENTS_DEMO, icon: <LuLayers aria-hidden="true" size={22} /> },
];

/**
 * Header
 * Layout component
 */
export const Header = ({ className }: { className?: string }) => {
  return (
    <header className={className ? `${styles.root} ${className}` : styles.root}>
      <nav className={styles.nav} aria-label="Main navigation">
        <NavLink to="/" className={styles.navBrand!}>
          {APP_CONFIG.appName}
        </NavLink>
        <ul className={styles.navLinks}>
          {navLinks.map(({ name, path, icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
                }
              >
                {icon} {name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};
