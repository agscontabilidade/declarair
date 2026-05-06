import { useState, useEffect } from 'react';

export function usePersistedForm<T>(key: string, initialValue: T) {
  // Use a unique key per form instance or context if needed
  const storageKey = `form_persistence_${key}`;

  const [form, setForm] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading persisted form:', e);
    }
    return initialValue;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(form));
  }, [form, storageKey]);

  const clearForm = () => {
    localStorage.removeItem(storageKey);
    setForm(initialValue);
  };

  return [form, setForm, clearForm] as const;
}
