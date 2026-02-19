import React, { useState } from 'react';
import { LuDownload, LuHeart, LuTrash2, LuCheck, LuX } from 'react-icons/lu';

import { Button } from '@components';
import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

import styles from './ComponentsDemoPage.module.scss';

/**
 * Components Demo Page
 *
 * A comprehensive demonstration of all components in the project.
 * Showcases design patterns, usage examples, and interactive features.
 */
export const ComponentsDemoPage = () => {
  useDocumentTitle(routeMetadata[PATHS.COMPONENTS_DEMO].title);

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleLoadingClick = (buttonId: string) => {
    setLoadingStates(prev => ({ ...prev, [buttonId]: true }));

    // Simulate async operation
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [buttonId]: false }));
    }, 2000);
  };

  const buttonVariants = [
    { name: 'Primary', variant: 'primary' as const },
    { name: 'Secondary', variant: 'secondary' as const },
    { name: 'Tertiary', variant: 'tertiary' as const },
    { name: 'Outline', variant: 'outline' as const },
    { name: 'Ghost', variant: 'ghost' as const },
    { name: 'Danger', variant: 'danger' as const },
    { name: 'Success', variant: 'success' as const },
  ];

  const buttonSizes = [
    { name: 'Small', size: 'sm' as const },
    { name: 'Medium', size: 'md' as const },
    { name: 'Large', size: 'lg' as const },
  ];

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1>Components Library</h1>
        <p>A comprehensive showcase of all reusable components in the project.</p>
      </header>

      <section className={styles.content}>
        {/* Button Component Section */}
        <section className={styles.section}>
          <h2>Button Component</h2>
          <p>
            A comprehensive, reusable button component with multiple variants, sizes, and states.
          </p>

          {/* Variants Section */}
          <div className={styles.subsection}>
            <h3>Button Variants</h3>
            <p>Different visual styles for different use cases.</p>

            <div className={styles.buttonGrid}>
              {buttonVariants.map(({ name, variant }) => (
                <div key={variant} className={styles.buttonExample}>
                  <h4>{name}</h4>
                  <Button variant={variant}>{name} Button</Button>
                </div>
              ))}
            </div>
          </div>

          {/* Sizes Section */}
          <div className={styles.subsection}>
            <h3>Button Sizes</h3>
            <p>Different sizes for different contexts and hierarchies.</p>

            <div className={styles.buttonGrid}>
              {buttonSizes.map(({ name, size }) => (
                <div key={size} className={styles.buttonExample}>
                  <h4>{name}</h4>
                  <Button variant="primary" size={size}>
                    {name} Button
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Icons Section */}
          <div className={styles.subsection}>
            <h3>Buttons with Icons</h3>
            <p>Buttons can include icons for better visual communication.</p>

            <div className={styles.buttonGrid}>
              <div className={styles.buttonExample}>
                <h4>Left Icon (Default)</h4>
                <Button variant="primary" icon={<LuDownload size={18} />}>
                  Download
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Right Icon</h4>
                <Button variant="outline" icon={<LuHeart size={18} />} iconPosition="right">
                  Like
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Danger with Icon</h4>
                <Button variant="danger" icon={<LuTrash2 size={18} />}>
                  Delete
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Icon Only</h4>
                <Button variant="ghost" icon={<LuCheck size={18} />}>
                  <span className="sr-only">Confirm</span>
                </Button>
              </div>
            </div>
          </div>

          {/* States Section */}
          <div className={styles.subsection}>
            <h3>Button States</h3>
            <p>Different states for different interactions.</p>

            <div className={styles.buttonGrid}>
              <div className={styles.buttonExample}>
                <h4>Default</h4>
                <Button variant="primary">Default Button</Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Disabled</h4>
                <Button variant="primary" disabled>
                  Disabled Button
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Loading</h4>
                <Button
                  variant="primary"
                  loading={loadingStates['loading-demo'] ?? false}
                  onClick={() => handleLoadingClick('loading-demo')}
                >
                  {loadingStates['loading-demo'] ? 'Loading...' : 'Click to Load'}
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Loading with Icon</h4>
                <Button
                  variant="outline"
                  loading={loadingStates['loading-icon'] ?? false}
                  onClick={() => handleLoadingClick('loading-icon')}
                >
                  {loadingStates['loading-icon'] ? 'Processing...' : 'Process Data'}
                </Button>
              </div>
            </div>
          </div>

          {/* Full Width Section */}
          <div className={styles.subsection}>
            <h3>Full Width Buttons</h3>
            <p>Buttons that span the full width of their container.</p>

            <div className={styles.fullWidthGrid}>
              <div className={styles.buttonExample}>
                <h4>Primary Full Width</h4>
                <Button variant="primary" fullWidth>
                  Full Width Primary Button
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Outline Full Width</h4>
                <Button variant="outline" fullWidth>
                  Full Width Outline Button
                </Button>
              </div>
            </div>
          </div>

          {/* Interactive Examples */}
          <div className={styles.subsection}>
            <h3>Interactive Examples</h3>
            <p>Real-world examples of button usage.</p>

            <div className={styles.interactiveGrid}>
              <div className={styles.buttonExample}>
                <h4>Form Submit</h4>
                <Button
                  variant="success"
                  icon={<LuCheck size={18} />}
                  loading={loadingStates['form-submit'] ?? false}
                  onClick={() => handleLoadingClick('form-submit')}
                >
                  {loadingStates['form-submit'] ? 'Submitting...' : 'Submit Form'}
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Cancel Action</h4>
                <Button variant="ghost" icon={<LuX size={18} />}>
                  Cancel
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Danger Action</h4>
                <Button
                  variant="danger"
                  icon={<LuTrash2 size={18} />}
                  loading={loadingStates['danger-action'] ?? false}
                  onClick={() => handleLoadingClick('danger-action')}
                >
                  {loadingStates['danger-action'] ? 'Deleting...' : 'Delete Item'}
                </Button>
              </div>
            </div>
          </div>

          {/* Accessibility Section */}
          <div className={styles.subsection}>
            <h3>Accessibility Features</h3>
            <p>The Button component includes comprehensive accessibility features:</p>

            <ul className={styles.accessibilityList}>
              <li>Proper ARIA attributes for disabled and loading states</li>
              <li>Focus-visible outline for keyboard navigation</li>
              <li>Screen reader support for loading states</li>
              <li>Proper button semantics and roles</li>
              <li>Keyboard interaction support</li>
              <li>High contrast color schemes</li>
            </ul>
          </div>
        </section>
      </section>
    </div>
  );
};
