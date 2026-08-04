import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GAME_ITEMS, STARTER_ITEM_IDS, getGameItem } from '@/lib/gameCatalog';

export const GAME_STORAGE_KEY = '1000books-game-storage';
export const GAME_STORAGE_VERSION = 1;

export interface RewardableBook {
  id: string;
  isProse: boolean;
  isEnglish: boolean;
}

export interface BookRewardRecord {
  bookRewardedAt: string;
  proseCreditedAt?: string;
  englishCreditedAt?: string;
}

export interface ItemTransform {
  x: number;
  y: number;
  scale: number;
}

export interface BookRewardResult {
  bookStarsGranted: number;
  heartsGranted: number;
  proseCredited: boolean;
  englishCredited: boolean;
}

export interface RewardLedgerState {
  bookStars: number;
  hearts: number;
  bookRewardLedger: Record<string, BookRewardRecord>;
  claimedHeartMilestones: string[];
}

export interface RewardLedgerUpdate {
  state: RewardLedgerState;
  result: BookRewardResult;
}

interface GameStore {
  bookStars: number;
  hearts: number;
  bookRewardLedger: Record<string, BookRewardRecord>;
  claimedHeartMilestones: string[];
  rabbitAdopted: boolean;
  ownedItemIds: string[];
  equippedBearItems: string[];
  equippedRabbitItems: string[];
  itemTransforms: Record<string, ItemTransform>;

  recordBookRewards: (book: RewardableBook) => BookRewardResult;
  syncMilestoneItems: (readCount: number) => void;
  purchaseItem: (itemId: string) => boolean;
  toggleEquippedItem: (itemId: string) => void;
  setItemTransform: (itemId: string, transform: ItemTransform) => void;
}

const EMPTY_REWARD_RESULT: BookRewardResult = {
  bookStarsGranted: 0,
  heartsGranted: 0,
  proseCredited: false,
  englishCredited: false,
};

function getCreditedCount(
  ledger: Record<string, BookRewardRecord>,
  field: 'proseCreditedAt' | 'englishCreditedAt'
) {
  return Object.values(ledger).filter((record) => Boolean(record[field])).length;
}

export function calculateBookRewardUpdate(
  state: RewardLedgerState,
  book: RewardableBook,
  now = new Date().toISOString()
): RewardLedgerUpdate {
  const existingRecord = state.bookRewardLedger[book.id];
  const nextRecord: BookRewardRecord = existingRecord
    ? { ...existingRecord }
    : { bookRewardedAt: now };

  let bookStarsGranted = 0;
  let heartsGranted = 0;
  let proseCredited = false;
  let englishCredited = false;
  const claimedMilestones = [...state.claimedHeartMilestones];

  if (!existingRecord) {
    bookStarsGranted = 10;
  }

  if (book.isProse && !nextRecord.proseCreditedAt) {
    const nextCount = getCreditedCount(state.bookRewardLedger, 'proseCreditedAt') + 1;
    nextRecord.proseCreditedAt = now;
    proseCredited = true;

    if (nextCount % 10 === 0) {
      const milestoneKey = `prose:${nextCount}`;
      if (!claimedMilestones.includes(milestoneKey)) {
        claimedMilestones.push(milestoneKey);
        heartsGranted += 1;
      }
    }
  }

  if (book.isEnglish && !nextRecord.englishCreditedAt) {
    const nextCount = getCreditedCount(state.bookRewardLedger, 'englishCreditedAt') + 1;
    nextRecord.englishCreditedAt = now;
    englishCredited = true;

    if (nextCount % 10 === 0) {
      const milestoneKey = `english:${nextCount}`;
      if (!claimedMilestones.includes(milestoneKey)) {
        claimedMilestones.push(milestoneKey);
        heartsGranted += 1;
      }
    }
  }

  const result = {
    bookStarsGranted,
    heartsGranted,
    proseCredited,
    englishCredited,
  };

  if (!bookStarsGranted && !proseCredited && !englishCredited) {
    return { state, result: EMPTY_REWARD_RESULT };
  }

  return {
    state: {
      bookStars: state.bookStars + bookStarsGranted,
      hearts: state.hearts + heartsGranted,
      bookRewardLedger: {
        ...state.bookRewardLedger,
        [book.id]: nextRecord,
      },
      claimedHeartMilestones: claimedMilestones,
    },
    result,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      bookStars: 0,
      hearts: 0,
      bookRewardLedger: {},
      claimedHeartMilestones: [],
      rabbitAdopted: false,
      ownedItemIds: STARTER_ITEM_IDS,
      equippedBearItems: ['outfit-basic'],
      equippedRabbitItems: [],
      itemTransforms: {},

      recordBookRewards: (book) => {
        const state = get();
        const update = calculateBookRewardUpdate(state, book);
        if (update.state !== state) set(update.state);
        return update.result;
      },

      syncMilestoneItems: (readCount) => {
        const state = get();
        const newlyUnlocked = GAME_ITEMS
          .filter(
            (item) =>
              item.source === 'milestone' &&
              (item.unlockAt ?? Number.POSITIVE_INFINITY) <= readCount &&
              !state.ownedItemIds.includes(item.id)
          )
          .map((item) => item.id);

        if (newlyUnlocked.length === 0) return;
        set({ ownedItemIds: [...state.ownedItemIds, ...newlyUnlocked] });
      },

      purchaseItem: (itemId) => {
        const state = get();
        const item = getGameItem(itemId);

        if (!item || !item.currency || item.price === undefined) return false;
        if (state.ownedItemIds.includes(itemId)) return true;
        if (item.area === 'rabbit' && item.id !== 'rabbit-pet' && !state.rabbitAdopted) {
          return false;
        }

        if (item.currency === 'bookStars') {
          if (state.bookStars < item.price) return false;
          set({
            bookStars: state.bookStars - item.price,
            ownedItemIds: [...state.ownedItemIds, itemId],
          });
          return true;
        }

        if (state.hearts < item.price) return false;
        set({
          hearts: state.hearts - item.price,
          rabbitAdopted: item.id === 'rabbit-pet' ? true : state.rabbitAdopted,
          ownedItemIds: [...state.ownedItemIds, itemId],
        });
        return true;
      },

      toggleEquippedItem: (itemId) => {
        const state = get();
        const item = getGameItem(itemId);
        if (!item || !state.ownedItemIds.includes(itemId)) return;
        if (item.area === 'rabbit' && item.id === 'rabbit-pet') return;

        const isRabbitItem = item.area === 'rabbit';
        const equippedItems = isRabbitItem
          ? state.equippedRabbitItems
          : state.equippedBearItems;
        const isEquipped = equippedItems.includes(itemId);
        const sameSlotIds = GAME_ITEMS
          .filter((candidate) => candidate.slot === item.slot && candidate.area === item.area)
          .map((candidate) => candidate.id);
        const nextEquipped = isEquipped
          ? equippedItems.filter((id) => id !== itemId)
          : [
              ...equippedItems.filter((id) => !sameSlotIds.includes(id)),
              itemId,
            ];

        if (isRabbitItem) {
          set({ equippedRabbitItems: nextEquipped });
        } else {
          set({ equippedBearItems: nextEquipped });
        }
      },

      setItemTransform: (itemId, transform) => {
        set((state) => ({
          itemTransforms: { ...state.itemTransforms, [itemId]: transform },
        }));
      },
    }),
    {
      name: GAME_STORAGE_KEY,
      version: GAME_STORAGE_VERSION,
    }
  )
);
