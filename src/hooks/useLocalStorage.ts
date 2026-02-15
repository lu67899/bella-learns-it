import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

// Simple in-memory pub/sub to sync useLocalStorage across components
const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, cb: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  return () => { listeners.get(key)?.delete(cb); };
}

function notify(key: string) {
  listeners.get(key)?.forEach((cb) => cb());
}

function getSnapshot<T>(key: string, initialValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    (cb) => subscribe(key, cb),
    () => {
      try {
        const item = window.localStorage.getItem(key);
        return item ?? JSON.stringify(initialValue);
      } catch {
        return JSON.stringify(initialValue);
      }
    }
  );

  const parsed: T = JSON.parse(value);

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const current = getSnapshot(key, initialValue);
    const resolved = newValue instanceof Function ? newValue(current) : newValue;
    window.localStorage.setItem(key, JSON.stringify(resolved));
    notify(key);
  }, [key, initialValue]);

  return [parsed, setValue];
}
