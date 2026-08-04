import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BOOK_STAR_MILESTONES } from '@/lib/bookEconomy';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  isProse: boolean;
  isEnglish: boolean;
  status: 'unread' | 'read';
  stampedAt?: string;
  addedAt: string;
}

export interface Reward {
  id: string;
  milestone: number;
  imageUrl: string;
  title: string;
  unlockedAt: string;
}

export const MILESTONES = BOOK_STAR_MILESTONES;
export const BOOK_STORAGE_KEY = '1000books-storage';
export const BOOK_STORAGE_VERSION = 2;

export const MILESTONE_REWARDS: Record<number, { title: string; emoji: string; description: string }> = {
  10:   { title: '마법 요정',     emoji: '🧚',  description: '10권을 읽은 당신은 마법 요정이에요!' },
  30:   { title: '무지개 유니콘', emoji: '🦄',  description: '30권! 무지개를 타는 유니콘처럼 멋져요!' },
  50:   { title: '별빛 공주',     emoji: '⭐',  description: '50권 달성! 별빛처럼 빛나는 공주님!' },
  100:  { title: '드래곤 기사',   emoji: '🐉',  description: '100권! 용감한 드래곤 기사님이에요!' },
  200:  { title: '우주 탐험가',   emoji: '🚀',  description: '200권! 우주를 누비는 탐험가!' },
  300:  { title: '마법사',        emoji: '🧙‍♀️', description: '300권! 모든 마법을 배운 마법사!' },
  500:  { title: '전설의 독서왕', emoji: '👑',  description: '500권! 전설이 된 독서왕!' },
  1000: { title: '천권의 여왕',   emoji: '🌟',  description: '1000권! 천권의 여왕! 당신은 최고예요!' },
};

export const PRAISE_MESSAGES = [
  '우와! 최고야! 🎉',
  '정말 멋져! ✨',
  '대단해! 👏',
  '와~ 천재! 🌟',
  '짱이야! 💖',
  '완전 멋진걸! 🦋',
  '최고최고! 🏆',
  '독서왕! 📚',
];

interface BookStore {
  books: Book[];
  rewards: Reward[];
  lastPraiseMessage: string;
  pendingUndo: string | null;

  addBook: (book: Omit<Book, 'id' | 'addedAt' | 'status'>) => void;
  removeBook: (id: string) => void;
  stampBook: (id: string) => { isNewMilestone: boolean; milestone?: number };
  unstampBook: (id: string) => void;
  getReadCount: () => number;
  getNextMilestone: () => number | null;
  getUnlockedMilestones: () => number[];
  setPendingUndo: (id: string | null) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
}

export function migratePersistedBookState(persistedState: unknown) {
  const state = persistedState as Partial<BookStore>;
  const books = Array.isArray(state.books)
    ? state.books.map((book) => ({
        ...book,
        isProse: book.isProse ?? false,
        isEnglish: book.isEnglish ?? false,
      }))
    : [];

  return {
    ...state,
    books,
  } as BookStore;
}

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      books: [],
      rewards: [],
      lastPraiseMessage: PRAISE_MESSAGES[0],
      pendingUndo: null,

      addBook: (book) => {
        const newBook: Book = {
          ...book,
          id: `book_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          status: 'unread',
          addedAt: new Date().toISOString(),
        };
        set((state) => ({ books: [...state.books, newBook] }));
      },

      removeBook: (id) => {
        set((state) => ({ books: state.books.filter((b) => b.id !== id) }));
      },

      stampBook: (id) => {
        const state = get();
        const targetBook = state.books.find((book) => book.id === id);

        if (!targetBook || targetBook.status === 'read') {
          return { isNewMilestone: false };
        }

        const prevReadCount = state.books.filter((b) => b.status === 'read').length;
        const praiseIdx = Math.floor(Math.random() * PRAISE_MESSAGES.length);

        set((s) => ({
          books: s.books.map((b) =>
            b.id === id
              ? { ...b, status: 'read', stampedAt: new Date().toISOString() }
              : b
          ),
          lastPraiseMessage: PRAISE_MESSAGES[praiseIdx],
          pendingUndo: id,
        }));

        const newReadCount = prevReadCount + 1;
        const isMilestone = MILESTONES.includes(newReadCount);
        const isNewMilestone = isMilestone &&
          !state.rewards.some((reward) => reward.milestone === newReadCount);

        if (isNewMilestone) {
          const rewardInfo = MILESTONE_REWARDS[newReadCount];
          const newReward: Reward = {
            id: `reward_${newReadCount}`,
            milestone: newReadCount,
            imageUrl: '',
            title: rewardInfo.title,
            unlockedAt: new Date().toISOString(),
          };
          set((s) => ({
            rewards: s.rewards.some((r) => r.milestone === newReadCount)
              ? s.rewards
              : [...s.rewards, newReward],
          }));
          return { isNewMilestone: true, milestone: newReadCount };
        }
        return { isNewMilestone: false };
      },

      unstampBook: (id) => {
        set((s) => {
          const newBooks = s.books.map((b) =>
            b.id === id ? { ...b, status: 'unread' as const, stampedAt: undefined } : b
          );
          return {
            books: newBooks,
            pendingUndo: null,
          };
        });
      },

      setPendingUndo: (id) => set({ pendingUndo: id }),

      updateBook: (id, updates) => {
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        }));
      },

      getReadCount: () => get().books.filter((b) => b.status === 'read').length,

      getNextMilestone: () => {
        const readCount = get().getReadCount();
        return MILESTONES.find((m) => m > readCount) ?? null;
      },

      getUnlockedMilestones: () => {
        const readCount = get().getReadCount();
        return MILESTONES.filter((m) => m <= readCount);
      },
    }),
    {
      name: BOOK_STORAGE_KEY,
      version: BOOK_STORAGE_VERSION,
      migrate: migratePersistedBookState,
    }
  )
);
