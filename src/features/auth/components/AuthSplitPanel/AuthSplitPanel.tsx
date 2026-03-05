import type { ReactNode } from 'react';

import { motion, useReducedMotion } from 'motion/react';

import { BackgroundPaths } from '../BackgroundPaths/BackgroundPaths';

import styles from './AuthSplitPanel.module.scss';

export interface AuthSplitPanelProps {
  /**
   * Controls which side the branding panel appears on.
   * true  → branding left, form right  (login)
   * false → branding right, form left  (register / forgot-password)
   */
  isLogin: boolean;
  /** Content rendered inside the dark branding panel (logo, headlines, avatars). */
  brandingContent: ReactNode;
  /** Content rendered inside the light form panel. */
  formContent: ReactNode;
}

/**
 * AuthSplitPanel
 *
 * Full-viewport two-panel layout for authentication screens.
 *
 * On desktop (≥ 1024px):
 *   - Left / right panels swap order via Framer Motion `layout` spring
 *     when `isLogin` toggles, creating a smooth panel-slide effect.
 *   - Dark panel: deep purple + animated BackgroundPaths SVG overlay.
 *   - Light panel: warm off-white form area.
 *
 * On mobile (< 1024px):
 *   - Only the light form panel is shown; the dark panel is hidden.
 *   - A small mobile logo strip is rendered above the form.
 *
 * Respects `prefers-reduced-motion` — disables the panel swap animation
 * when the user has requested reduced motion.
 */
export function AuthSplitPanel({ isLogin, brandingContent, formContent }: AuthSplitPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <main className={styles.root}>
      {/* ── Dark / Branding panel ────────────────────────────────── */}
      <motion.div
        layout
        className={`${styles.brandPanel} ${isLogin ? styles.orderFirst : styles.orderLast}`}
        transition={panelTransition}
      >
        {/* Animated background SVG */}
        <BackgroundPaths />

        {/* Gradient overlay */}
        <div className={styles.gradient} aria-hidden="true" />

        {/* Branding slot */}
        <div className={styles.brandContent}>
          {brandingContent}
        </div>
      </motion.div>

      {/* ── Light / Form panel ────────────────────────────────────────────── */}
      <motion.div
        layout
        className={`${styles.formPanel} ${isLogin ? styles.orderLast : styles.orderFirst}`}
        transition={panelTransition}
      >
        <div className={styles.formContent}>
          {formContent}
        </div>
      </motion.div>
    </main>
  );
}
