import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

import styles from './NotFoundPage.module.scss';

const NotFoundPage = (): ReactElement => {
  useDocumentTitle(routeMetadata[PATHS.NOT_FOUND].title);

  return (
    <div className={styles.root}>
      <section className={styles.errorSection}>
        <div className={styles.errorContent}>
          <div className={styles.errorCode}>404</div>
          <h1 className={styles.errorTitle}>Page Not Found</h1>
          <p className={styles.errorDescription}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to={PATHS.HOME} className={styles.backLink}>
            &larr; Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
};

export default NotFoundPage;
