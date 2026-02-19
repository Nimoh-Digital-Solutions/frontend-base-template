import { NavLink } from 'react-router-dom';
import { LuHouse, LuLayers } from 'react-icons/lu';

import { APP_CONFIG } from '@configs';
import { PATHS } from '@routes/config/paths';

import styles from './Header.module.scss';

/**
 * Header
 * Layout component
 */
export const Header = ({ className }: { className?: string }) => {
  // navLinks is driven by PATHS constants — rename/add routes here in one place
  const navLinks = [
    { name: 'Home', path: PATHS.HOME, icon: <LuHouse size={22} /> },
    { name: 'Components', path: PATHS.COMPONENTS_DEMO, icon: <LuLayers size={22} /> },
  ];

  return (
    <header className={className ? `${styles.root} ${className}` : styles.root}>
      <nav className={styles.nav}>
        <NavLink to="/" className={styles.navBrand}>
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
