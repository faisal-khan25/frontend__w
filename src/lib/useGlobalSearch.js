import { useEffect, useRef, useState, useCallback } from "react";
import { searchApi, SEARCH_MODULES } from "../lib/searchApi";

const EMPTY_RESULTS = Object.fromEntries(SEARCH_MODULES.map((m) => [m, []]));
const EMPTY_COUNTS = Object.fromEntries(SEARCH_MODULES.map((m) => [m, 0]));
const DEBOUNCE_MS = 350;

export function useGlobalSearch({ perModuleLimit = 5 } = {}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const runSearch = useCallback(
    (term) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      searchApi
        .globalSearch(term, perModuleLimit)
        .then((data) => {
          if (requestId !== requestIdRef.current) return;
          setResults(data.results || EMPTY_RESULTS);
          setCounts(data.counts || EMPTY_COUNTS);
          setTotal(data.total || 0);
          setLoading(false);
        })
        .catch((err) => {
          if (requestId !== requestIdRef.current) return;
          setError(err?.response?.data?.error || "Couldn't complete the search. Please try again.");
          setResults(EMPTY_RESULTS);
          setCounts(EMPTY_COUNTS);
          setTotal(0);
          setLoading(false);
        });
    },
    [perModuleLimit]
  );

  useEffect(() => {
    const trimmed = query.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!trimmed) {
      requestIdRef.current += 1;
      setResults(EMPTY_RESULTS);
      setCounts(EMPTY_COUNTS);
      setTotal(0);
      setLoading(false);
      setError(null);
      return undefined;
    }

    debounceRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  const hasResults = total > 0;
  const isEmpty = !loading && !error && query.trim() && !hasResults;

  return { query, setQuery, results, counts, total, loading, error, hasResults, isEmpty };
}

export default useGlobalSearch;