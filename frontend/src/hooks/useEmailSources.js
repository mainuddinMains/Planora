import { useState, useEffect } from 'react';
import { getEmailSources, createEmailSource, deleteEmailSource } from '../api';

export function useEmailSources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmailSources();
      setSources(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addSource(data) {
    const saved = await createEmailSource(data);
    setSources(prev => [...prev, saved]);
    return saved;
  }

  async function removeSource(id) {
    await deleteEmailSource(id);
    setSources(prev => prev.filter(s => s.id !== id));
  }

  return {
    sources,
    loading,
    error,
    addSource,
    removeSource,
    refresh: loadSources
  };
}
