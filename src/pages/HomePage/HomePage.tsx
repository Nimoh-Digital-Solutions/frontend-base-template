import type { ReactElement } from 'react';
import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

import styles from './HomePage.module.scss';

const HomePage = (): ReactElement => {
  useDocumentTitle(routeMetadata[PATHS.HOME].title);

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Welcome to React Starter Kit</h1>
        <p className={styles.heroSubtitle}>
          A modern React foundation with TypeScript, Vite, and comprehensive tooling
        </p>
      </section>

      <section className={styles.features}>
        <h2>Key Features</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <h3>React 19 + TypeScript</h3>
            <p>Latest React with full TypeScript support for type safety</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Vite Build Tool</h3>
            <p>Lightning-fast development and optimized production builds</p>
          </div>
          <div className={styles.featureCard}>
            <h3>CSS Modules</h3>
            <p>Scoped styling with TypeScript support and no naming conflicts</p>
          </div>
          <div className={styles.featureCard}>
            <h3>PWA Ready</h3>
            <p>Progressive Web App support with offline capabilities</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
