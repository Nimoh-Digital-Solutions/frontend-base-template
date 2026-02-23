import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { LuHouse, LuLayers, LuSun, LuMoon } from 'react-icons/lu';

import { APP_CONFIG } from '@configs';
import { PATHS } from '@routes/config/paths';
import { useThemeContext } from '@contexts';

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
export const Header = ({ className }: { className?: string }): ReactElement => {
  const { theme, toggleTheme } = useThemeContext();

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
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <LuSun size={20} aria-hidden="true" /> : <LuMoon size={20} aria-hidden="true" />}
        </button>
      </nav>
    </header>
  );
};
