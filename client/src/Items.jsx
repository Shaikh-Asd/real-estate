import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FixedSizeList as List } from "react-window";

const PAGE_SIZE = 20;
const ROW_HEIGHT = 104;
const SKELETON_ROWS = 6;
const LIST_OVERSCAN = 2;

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

const ListRow = memo(function ListRow({ index, style, data }) {
  const item = data[index];
  if (!item) return null;
  const inStock = item.inStock !== false;
  return (
    <div style={style} className="virtual-row" role="listitem">
      <div className="virtual-row-inner">
        <div className="card-top">
          <span className="pill">{item.category}</span>
          <span className={`stock ${inStock ? "stock--yes" : "stock--no"}`}>
            {inStock ? "In stock" : "Out"}
          </span>
        </div>
        <p className="card-title">{item.name}</p>
        <p className="price">${item.price.toFixed(2)}</p>
      </div>
    </div>
  );
});

export default function Items() {
  const [queryInput, setQueryInput] = useState("");
  const query = useDebounced(queryInput, 300);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const listWrapRef = useRef(null);
  const [listSize, setListSize] = useState({ width: 640, height: 400 });
  const rafRef = useRef(0);

  const onSearchChange = useCallback((e) => {
    setQueryInput(e.target.value);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });

    setLoading(true);
    setError(null);

    fetch(`/api/items?${params}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Request failed");
        return r.json();
      })
      .then((json) => {
        if (controller.signal.aborted) return;
        setData(json);
      })
      .catch((e) => {
        if (e.name === "AbortError" || controller.signal.aborted) return;
        setError(e.message || "Something went wrong");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, page]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stats", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!controller.signal.aborted && json) setStats(json);
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;
  const items = data?.items ?? [];

  useLayoutEffect(() => {
    const el = listWrapRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const width = Math.max(240, Math.floor(r.width));
      const height = Math.max(200, Math.floor(r.height));
      setListSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    };

    const schedule = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [loading, data]);

  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goNext = useCallback(() => setPage((p) => Math.min(pages, p + 1)), [pages]);

  const rangeLabel = useMemo(() => {
    if (!data || total === 0) return "No results";
    const start = (data.page - 1) * data.pageSize + 1;
    const end = Math.min(data.page * data.pageSize, total);
    return `${start}–${end} of ${total}`;
  }, [data, total]);

  const listKey = useMemo(() => `${query}|${page}`, [query, page]);

  return (
    <>
      <header className="items-header">
        <label className="search">
          <span className="sr-only">Search catalog</span>
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search by name or category…"
            value={queryInput}
            onChange={onSearchChange}
            autoComplete="off"
            aria-busy={loading}
          />
        </label>
        {stats && (
          <p className="stats-line" aria-live="polite">
            Dataset: <strong>{stats.total}</strong> items · avg ${stats.avgPrice} ·{" "}
            <strong>{stats.inStock}</strong> in stock
          </p>
        )}
      </header>

      {error && (
        <div className="banner banner--error" role="alert">
          {error}
        </div>
      )}

      <section className="panel" aria-busy={loading}>
        <div className="panel-head">
          <span className="muted">{rangeLabel}</span>
          <div className="pager">
            <button type="button" className="btn" onClick={goPrev} disabled={loading || page <= 1}>
              Previous
            </button>
            <span className="page-indicator">
              Page <strong>{data?.page ?? page}</strong> of {pages}
            </span>
            <button
              type="button"
              className="btn"
              onClick={goNext}
              disabled={loading || page >= pages}
            >
              Next
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="skeleton-virtual" aria-hidden>
            {Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="empty">Nothing matches that search. Try another term.</p>
        ) : (
          <div
            ref={listWrapRef}
            className="virtual-list-wrap"
            role="list"
            aria-label="Search results"
          >
            <List
              key={listKey}
              height={listSize.height}
              width={listSize.width}
              itemCount={items.length}
              itemSize={ROW_HEIGHT}
              itemData={items}
              overscanCount={LIST_OVERSCAN}
            >
              {ListRow}
            </List>
          </div>
        )}

        {loading && data && <div className="overlay" aria-hidden />}
      </section>
    </>
  );
}
