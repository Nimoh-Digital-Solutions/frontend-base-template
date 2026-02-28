import { type ReactElement, useMemo } from 'react';
import clsx from 'clsx';

import type { PaginationProps } from './Pagination.interface';
import styles from './Pagination.module.scss';

/**
 * Builds the list of page numbers and ellipsis markers to display.
 *
 * Returns an array of numbers (page numbers) and `null` values (ellipsis).
 * The first and last pages are always shown, with ellipsis where gaps exist.
 */
function getPageRange(current: number, total: number, maxVisible: number): (number | null)[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  // Shift window when near the edges
  if (current - half < 2) {
    end = Math.min(total - 1, maxVisible - 1);
  }
  if (current + half > total - 1) {
    start = Math.max(2, total - maxVisible + 2);
  }

  const pages: (number | null)[] = [1];

  if (start > 2) pages.push(null);
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push(null);

  pages.push(total);
  return pages;
}

/**
 * Pagination
 *
 * A page-number navigation bar for paginated data.
 * Shows first/last pages with ellipsis and configurable visible range.
 *
 * @example
 * <Pagination currentPage={1} totalPages={10} onPageChange={setPage} />
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
  labels,
  ariaLabel = 'Pagination',
  className,
}: PaginationProps): ReactElement | null {
  const pages = useMemo(
    () => getPageRange(currentPage, totalPages, maxVisible),
    [currentPage, totalPages, maxVisible],
  );

  if (totalPages <= 1) return null;

  const prevLabel = labels?.previous ?? '← Previous';
  const nextLabel = labels?.next ?? 'Next →';

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ul className={styles.pagination}>
        {/* Previous */}
        <li>
          <button
            type="button"
            className={styles.button}
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Go to previous page"
          >
            {prevLabel}
          </button>
        </li>

        {/* Page numbers */}
        {pages.map((page, idx) =>
          page === null ? (
            <li key={`ellipsis-${idx}`} aria-hidden="true">
              <span className={styles.ellipsis}>…</span>
            </li>
          ) : (
            <li key={page}>
              <button
                type="button"
                className={clsx(styles.button, page === currentPage && styles.active)}
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            </li>
          ),
        )}

        {/* Next */}
        <li>
          <button
            type="button"
            className={styles.button}
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Go to next page"
          >
            {nextLabel}
          </button>
        </li>
      </ul>
    </nav>
  );
}

Pagination.displayName = 'Pagination';
