import { Outlet } from 'react-router-dom';

import { Footer, Header } from '@components';

import styles from './AppLayout.module.scss';

const AppLayout = () => {
  return (
    <div className={styles.root}>
      <Header className={styles.header} />

      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer className={styles.footer} />
    </div>
  );
};

export default AppLayout;
