export interface PaginationProps {
  /** Current active page (1-based). */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Callback fired when the user selects a page. */
  onPageChange: (page: number) => void;
  /** Maximum number of page buttons to show (excluding prev/next). Default 5. */
  maxVisible?: number | undefined;
  /** Labels for previous/next buttons — useful for i18n. */
  labels?: {
    previous?: string;
    next?: string;
  } | undefined;
  /** Accessible label for the nav element. Default 'Pagination'. */
  ariaLabel?: string | undefined;
  className?: string | undefined;
}
