import { useEffect, useRef, useState, useCallback } from "react";
import { chatApi } from "../lib/chatApi";

const DEBOUNCE_MS = 300;

export function useChatSearch() {
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  const runSearch = useCallback((term) => {
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    Promise.all([
      chatApi.searchContacts(term, { signal: controller.signal }),
      chatApi.searchMessages(term, { signal: controller.signal }),
    ])
      .then(([contacts, messageResults]) => {
        if (requestId !== requestIdRef.current) return;
        setConversations(contacts.conversations || []);
        setEmployees(contacts.employees || []);
        setMessages(messageResults || []);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        if (requestId !== requestIdRef.current) return;
        setError(err?.response?.data?.error || "Couldn't complete the search. Please try again.");
        setConversations([]);
        setEmployees([]);
        setMessages([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!trimmed) {
      requestIdRef.current += 1;
      abortRef.current?.abort();
      setConversations([]);
      setEmployees([]);
      setMessages([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    debounceRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  const isSearching = Boolean(query.trim());
  const hasResults = conversations.length > 0 || employees.length > 0 || messages.length > 0;
  const isEmpty = isSearching && !loading && !error && !hasResults;

  const retry = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed) runSearch(trimmed);
  }, [query, runSearch]);

  return {
    query,
    setQuery,
    conversations,
    employees,
    messages,
    loading,
    error,
    isSearching,
    hasResults,
    isEmpty,
    retry,
  };
}

export default useChatSearch;