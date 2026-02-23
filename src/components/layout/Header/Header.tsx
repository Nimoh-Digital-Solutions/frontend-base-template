import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { LuHouse, LuLayers, LuSun, LuMoon, LuSunMedium } from 'react-icons/lu';

import { APP_CONFIG } from '@configs';
import { PATHS } from '@routes/config/paths';
import { useThemeContext } from '@contexts';

import styles from './Header.module.scss';

const navLinks = [
  { name: 'Home',       path: PATHS.HOME,            icon: <LuHouse  aria-hidden="true" size={22} /> },
  { name: 'Components', path: PATHS.COMPONENTS_DEMO, icon: <LuLayers aria-hidden="true" size={22} /> },
];

const themeConfig = {
  light: { icon: <LuMoon  size={20} aria-hidden="true" />, label: 'Switch to dim mode'  },
  dim:   { icon: <LuSun   size={20} aria-hidden="true" />, label: 'Switch to dark mode' },
  dark:  { icon: <LuSunMedium size={20} aria-hidden="true" />, label: 'Switch to light mode' },
} as const;

/**
 * Header
 * Layout component — includes light → dim → dark theme cycler.
 */
export const Header = ({ className }: { className?: string }): ReactElement => {
  const { theme, toggleTheme } = useThemeContext();
  const { icon, label } = themeConfig[theme] ?? themeConfig.light;

  return (
    <header className={className ? `${styles.root} ${className}` : styles.root}>
      <nav className={styles.nav} aria-label="Main navigation">
        <NavLink to="/" className={styles.navBrand!}>
          {APP_CONFIG.appName}
        </NavLink>
        <ul className={styles.navLinks}>
          {navLinks.map(({ name, path, icon: navIcon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
                }
              >
                {navIcon} {name}
              </NavLink>
            </li>
          ))}
        </ul>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={label}
          title={label}
          data-theme-current={theme}
        >
          {icon}
          <span className={styles.themeLabel}>{theme}</span>
        </button>
      </nav>
    </header>
  );
};
