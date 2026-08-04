'use client';

import { useEffect } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { useGameStore } from '@/store/useGameStore';

export default function GameProgressSync() {
  const books = useBookStore((state) => state.books);
  const syncReadingProgress = useGameStore((state) => state.syncReadingProgress);

  useEffect(() => {
    const readBooks = books.filter((book) => book.status === 'read');
    syncReadingProgress(
      readBooks.map((book) => ({
        id: book.id,
        isProse: book.isProse,
        isEnglish: book.isEnglish,
        stampedAt: book.stampedAt,
      }))
    );
  }, [books, syncReadingProgress]);

  return null;
}
