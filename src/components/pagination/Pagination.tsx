import { ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import React, { useRef } from 'react';
import styles from './Pagination.module.css';

type PaginationSize = 'S' | 'M' | 'L';

export type PaginationProps = {
  currentPage: number;
  totalRows: number;
  pageSize: number;

  onPageChange: (page: number) => void;

  nPagesShowing?: number;
  width?: number;
  hide?: boolean;
  disableGoTo?: boolean;
  className?: string;

  size?: PaginationSize;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ');
}

export default function Pagination({
  currentPage,
  totalRows,
  pageSize,
  onPageChange,
  nPagesShowing = 5,
  width = 9999,
  hide = false,
  disableGoTo = false,
  className,
  size = 'S',
}: PaginationProps) {
  const nPages = Math.max(0, Math.ceil(totalRows / Math.max(1, pageSize)));
  const canShowNumbers = width > 500;
  const refInput = useRef<HTMLInputElement>(null);

  const sizeClass = {
    S: styles.S,
    M: styles.M,
    L: styles.L,
  }[size];

  const safeCurrent = nPages === 0 ? 1 : clamp(currentPage, 1, nPages);

  const goTo = React.useCallback(
    (page: number) => {
      if (nPages === 0) return;
      const next = clamp(page, 1, nPages);
      if (next !== safeCurrent) onPageChange(next);
    },
    [nPages, onPageChange, safeCurrent],
  );

  const renderSidePages = (left: boolean) => {
    const arr = Array.from({ length: nPagesShowing }, (_, i) => i + 1);
    if (left) arr.reverse();

    return arr
      .map((offset) => {
        const page = left ? safeCurrent - offset : safeCurrent + offset;
        if (page < 1 || page > nPages) return null;

        return (
          <button
            key={`${left ? 'L' : 'R'}-${page}`}
            type="button"
            className={styles.pgItem}
            onClick={() => goTo(page)}
            aria-label={`Ir a la página ${page}`}
          >
            {page}
          </button>
        );
      })
      .filter(Boolean);
  };

  const leftArrowDisabled = safeCurrent === 1 || nPages === 0;
  const rightArrowDisabled = safeCurrent === nPages || nPages === 0;

  const showLeftEllipsis = canShowNumbers && safeCurrent - nPagesShowing > 1;
  const showRightEllipsis = canShowNumbers && safeCurrent + nPagesShowing < nPages;

  const [goToValue, setGoToValue] = React.useState<string>('');

  if (hide) return null;

  return (
    <div className={cx(styles.pgWrap, sizeClass, className)} aria-label="Paginación">
      <button
        type="button"
        className={styles.pgBtn}
        onClick={() => goTo(safeCurrent - 1)}
        disabled={leftArrowDisabled}
        aria-label="Página anterior"
      >
        <ArrowBigLeft className={styles.pgIcon} strokeWidth={'1px'} />
      </button>

      <div className={styles.pgCenter}>
        {showLeftEllipsis ? (
          <div className={styles.pgEnds}>
            <button type="button" className={styles.pgItem} onClick={() => goTo(1)} aria-label="Ir a la primera página">
              1
            </button>
            <span className={styles.pgEllipsis} aria-hidden="true">
              …
            </span>
          </div>
        ) : (
          <div className={styles.pgEnds} />
        )}

        {canShowNumbers ? <div className={styles.pgSide}>{renderSidePages(true)}</div> : null}

        <div className={styles.pgCurrent} aria-current="page">
          {nPages === 0 ? 0 : safeCurrent}
        </div>

        {canShowNumbers ? <div className={styles.pgSide}>{renderSidePages(false)}</div> : null}

        {showRightEllipsis ? (
          <div className={styles.pgEnds}>
            <span className={styles.pgEllipsis} aria-hidden="true">
              …
            </span>
            <button
              type="button"
              className={styles.pgItem}
              onClick={() => goTo(nPages)}
              aria-label="Ir a la última página"
            >
              {nPages}
            </button>
          </div>
        ) : (
          <div className={styles.pgEnds} />
        )}

        {!disableGoTo ? (
          <input
            ref={refInput}
            className={styles.pgInput}
            placeholder="Ir a"
            inputMode="numeric"
            type="number"
            value={goToValue}
            min={1}
            max={nPages || 1}
            onChange={(e) => {
              const raw = e.target.value;
              setGoToValue(raw);

              if (raw === '') return;
              const parsed = Number(raw);
              if (!Number.isFinite(parsed)) return;

              const page = Math.trunc(parsed);
              if (page >= 1 && page <= nPages) goTo(page);
            }}
            aria-label="Ir a página"
            disabled={nPages === 0}
          />
        ) : null}
      </div>

      <button
        type="button"
        className={styles.pgBtn}
        onClick={() => goTo(safeCurrent + 1)}
        disabled={rightArrowDisabled}
        aria-label="Página siguiente"
      >
        <ArrowBigRight className={styles.pgIcon} strokeWidth={'1px'} />
      </button>
    </div>
  );
}
