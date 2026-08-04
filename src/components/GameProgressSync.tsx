'use client';

import { useEffect } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { useGameStore } from '@/store/useGameStore';

export default function GameProgressSync() {
  const books = useBookStore((state) => state.books);
  const recordBookRewards = useGameStore((state) => state.recordBookRewards);
  const syncMilestoneItems = useGameStore((state) => state.syncMilestoneItems);

  useEffect(() => {
    const readBooks = books.filter((book) => book.status === 'read');
    readBooks.forEach((book) => {
      recordBookRewards({
        id: book.id,
        isProse: book.isProse,
        isEnglish: book.isEnglish,
      });
    });
    syncMilestoneItems(readBooks.length);
  }, [books, recordBookRewards, syncMilestoneItems]);

  return null;
}
