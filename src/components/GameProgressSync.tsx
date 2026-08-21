'use client';

import { useEffect, useState } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { useGameStore } from '@/store/useGameStore';

export default function GameProgressSync() {
  const [hydrated, setHydrated] = useState(false);
  const books = useBookStore((state) => state.books);
  const syncReadingProgress = useGameStore((state) => state.syncReadingProgress);

  useEffect(() => {
    let active = true;

    const hydrateStores = async () => {
      await useBookStore.persist.rehydrate();
      await useGameStore.persist.rehydrate();
      if (active) setHydrated(true);
    };

    void hydrateStores();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const readBooks = books.filter((book) => book.status === 'read');
    syncReadingProgress(
      readBooks.map((book) => ({
        id: book.id,
        isProse: book.isProse,
        isEnglish: book.isEnglish,
        stampedAt: book.stampedAt,
      }))
    );
  }, [books, hydrated, syncReadingProgress]);

  return null;
}
