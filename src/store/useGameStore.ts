import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BOOK_STAR_MILESTONES,
  BOOK_STARS_PER_BOOK,
  getCurrentReadingWorld,
  getMilestoneBookStars,
} from '@/lib/bookEconomy';
import {
  GAME_ITEMS,
  STARTER_ITEM_IDS,
  getGameItem,
  getItemRequiredBooks,
} from '@/lib/gameCatalog';

export const GAME_STORAGE_KEY = '1000books-game-storage';
export const GAME_STORAGE_VERSION = 3;

export interface RewardableBook {
  id: string;
  isProse: boolean;
  isEnglish: boolean;
  stampedAt?: string;
}

export interface BookRewardRecord {
  bookRewardedAt: string;
  bookStarActive: boolean;
  bookStarRevokedAt?: string;
  proseCreditedAt?: string;
  englishCreditedAt?: string;
  discoveryRolledAt?: string;
  discoveredItemId?: string;
}

export interface ItemTransform {
  x: number;
  y: number;
  scale: number;
}

export const DEFAULT_ITEM_TRANSFORM: ItemTransform = { x: 0, y: 0, scale: 1 };
export const MIN_ITEM_SCALE = 0.7;
export const MAX_ITEM_SCALE = 1.5;
const MAX_ITEM_OFFSET = 0.75;

export interface BookRewardResult {
  bookStarsGranted: number;
  bookStarsRevoked: number;
  heartsGranted: number;
  proseCredited: boolean;
  englishCredited: boolean;
}

export interface RewardLedgerState {
  bookStars: number;
  bookStarDebt: number;
  hearts: number;
  bookRewardLedger: Record<string, BookRewardRecord>;
  claimedHeartMilestones: string[];
  claimedBookStarMilestones: number[];
}

export interface RewardLedgerUpdate {
  state: RewardLedgerState;
  result: BookRewardResult;
}

export type PurchaseResult =
  | 'purchased'
  | 'owned'
  | 'locked'
  | 'not-for-sale'
  | 'needs-rabbit'
  | 'insufficient-book-stars'
  | 'insufficient-hearts';

interface GameStore extends RewardLedgerState {
  rabbitAdopted: boolean;
  ownedItemIds: string[];
  equippedBearItems: string[];
  equippedRabbitItems: string[];
  itemTransforms: Record<string, ItemTransform>;

  syncReadingProgress: (books: RewardableBook[]) => void;
  purchaseItem: (itemId: string, readCount: number) => PurchaseResult;
  toggleEquippedItem: (itemId: string) => void;
  setItemTransform: (itemId: string, transform: ItemTransform) => void;
}

const EMPTY_REWARD_RESULT: BookRewardResult = {
  bookStarsGranted: 0,
  bookStarsRevoked: 0,
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

function creditBookStars(state: RewardLedgerState, amount: number) {
  const debtPaid = Math.min(state.bookStarDebt, amount);
  return {
    bookStars: state.bookStars + amount - debtPaid,
    bookStarDebt: state.bookStarDebt - debtPaid,
  };
}

function revokeBookStars(state: RewardLedgerState, amount: number) {
  const starsRemoved = Math.min(state.bookStars, amount);
  return {
    bookStars: state.bookStars - starsRemoved,
    bookStarDebt: state.bookStarDebt + amount - starsRemoved,
  };
}

function rewardLedgerFromStore(state: GameStore): RewardLedgerState {
  return {
    bookStars: state.bookStars,
    bookStarDebt: state.bookStarDebt,
    hearts: state.hearts,
    bookRewardLedger: state.bookRewardLedger,
    claimedHeartMilestones: state.claimedHeartMilestones,
    claimedBookStarMilestones: state.claimedBookStarMilestones,
  };
}

export function calculateBookRewardUpdate(
  state: RewardLedgerState,
  book: RewardableBook,
  now = new Date().toISOString()
): RewardLedgerUpdate {
  const existingRecord = state.bookRewardLedger[book.id];
  const shouldGrantBookStars = !existingRecord || !existingRecord.bookStarActive;
  const nextRecord: BookRewardRecord = existingRecord
    ? {
        ...existingRecord,
        bookStarActive: true,
        bookStarRevokedAt: undefined,
      }
    : {
        bookRewardedAt: now,
        bookStarActive: true,
      };

  let heartsGranted = 0;
  let proseCredited = false;
  let englishCredited = false;
  const claimedHeartMilestones = [...state.claimedHeartMilestones];

  if (book.isProse && !nextRecord.proseCreditedAt) {
    const nextCount = getCreditedCount(state.bookRewardLedger, 'proseCreditedAt') + 1;
    nextRecord.proseCreditedAt = now;
    proseCredited = true;

    if (nextCount % 10 === 0) {
      const milestoneKey = `prose:${nextCount}`;
      if (!claimedHeartMilestones.includes(milestoneKey)) {
        claimedHeartMilestones.push(milestoneKey);
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
      if (!claimedHeartMilestones.includes(milestoneKey)) {
        claimedHeartMilestones.push(milestoneKey);
        heartsGranted += 1;
      }
    }
  }

  if (!shouldGrantBookStars && !proseCredited && !englishCredited) {
    return { state, result: EMPTY_REWARD_RESULT };
  }

  const wallet = shouldGrantBookStars
    ? creditBookStars(state, BOOK_STARS_PER_BOOK)
    : { bookStars: state.bookStars, bookStarDebt: state.bookStarDebt };

  return {
    state: {
      ...state,
      ...wallet,
      hearts: state.hearts + heartsGranted,
      bookRewardLedger: {
        ...state.bookRewardLedger,
        [book.id]: nextRecord,
      },
      claimedHeartMilestones,
    },
    result: {
      bookStarsGranted: shouldGrantBookStars ? BOOK_STARS_PER_BOOK : 0,
      bookStarsRevoked: 0,
      heartsGranted,
      proseCredited,
      englishCredited,
    },
  };
}

export function calculateBookRewardRevocation(
  state: RewardLedgerState,
  bookId: string,
  now = new Date().toISOString()
): RewardLedgerUpdate {
  const record = state.bookRewardLedger[bookId];
  if (!record?.bookStarActive) {
    return { state, result: EMPTY_REWARD_RESULT };
  }

  const wallet = revokeBookStars(state, BOOK_STARS_PER_BOOK);
  return {
    state: {
      ...state,
      ...wallet,
      bookRewardLedger: {
        ...state.bookRewardLedger,
        [bookId]: {
          ...record,
          bookStarActive: false,
          bookStarRevokedAt: now,
        },
      },
    },
    result: {
      ...EMPTY_REWARD_RESULT,
      bookStarsRevoked: BOOK_STARS_PER_BOOK,
    },
  };
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sortReadBooks(books: RewardableBook[]) {
  return [...books].sort((left, right) => {
    const timeDifference = (left.stampedAt ?? '').localeCompare(right.stampedAt ?? '');
    return timeDifference || left.id.localeCompare(right.id);
  });
}

function normalizeStringArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : fallback;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeItemTransform(value: unknown): ItemTransform {
  if (!value || typeof value !== 'object') return { ...DEFAULT_ITEM_TRANSFORM };
  const transform = value as Partial<ItemTransform>;
  const rawX = typeof transform.x === 'number' && Number.isFinite(transform.x) ? transform.x : 0;
  const rawY = typeof transform.y === 'number' && Number.isFinite(transform.y) ? transform.y : 0;
  const rawScale = typeof transform.scale === 'number' && Number.isFinite(transform.scale)
    ? transform.scale
    : 1;

  // v2에 저장된 값이 픽셀 좌표라면 장면 크기 비율로 변환합니다.
  const normalizedX = Math.abs(rawX) <= 1 ? rawX : rawX / 360;
  const normalizedY = Math.abs(rawY) <= 1 ? rawY : rawY / 360;

  return {
    x: clamp(normalizedX, -MAX_ITEM_OFFSET, MAX_ITEM_OFFSET),
    y: clamp(normalizedY, -MAX_ITEM_OFFSET, MAX_ITEM_OFFSET),
    scale: clamp(rawScale, MIN_ITEM_SCALE, MAX_ITEM_SCALE),
  };
}

function normalizeItemTransforms(value: unknown) {
  if (!value || typeof value !== 'object') return {};

  return Object.fromEntries(
    Object.entries(value).map(([itemId, transform]) => [
      itemId,
      normalizeItemTransform(transform),
    ])
  );
}

export function migratePersistedGameState(persistedState: unknown) {
  const state = (persistedState ?? {}) as Partial<GameStore>;
  const rawLedger = state.bookRewardLedger ?? {};
  const bookRewardLedger = Object.fromEntries(
    Object.entries(rawLedger).map(([bookId, record]) => [
      bookId,
      {
        ...record,
        bookStarActive: record.bookStarActive ?? true,
      },
    ])
  );
  const ownedItemIds = Array.from(new Set([
    ...STARTER_ITEM_IDS,
    ...normalizeStringArray(state.ownedItemIds),
  ]));

  return {
    ...state,
    bookStars: typeof state.bookStars === 'number' ? Math.max(0, state.bookStars) : 0,
    bookStarDebt: typeof state.bookStarDebt === 'number' ? Math.max(0, state.bookStarDebt) : 0,
    hearts: typeof state.hearts === 'number' ? Math.max(0, state.hearts) : 0,
    bookRewardLedger,
    claimedHeartMilestones: normalizeStringArray(state.claimedHeartMilestones),
    claimedBookStarMilestones: Array.isArray(state.claimedBookStarMilestones)
      ? state.claimedBookStarMilestones.filter((milestone): milestone is number => typeof milestone === 'number')
      : [],
    rabbitAdopted: state.rabbitAdopted ?? false,
    ownedItemIds,
    equippedBearItems: normalizeStringArray(state.equippedBearItems, ['outfit-basic']),
    equippedRabbitItems: normalizeStringArray(state.equippedRabbitItems),
    itemTransforms: normalizeItemTransforms(state.itemTransforms),
  } as GameStore;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      bookStars: 0,
      bookStarDebt: 0,
      hearts: 0,
      bookRewardLedger: {},
      claimedHeartMilestones: [],
      claimedBookStarMilestones: [],
      rabbitAdopted: false,
      ownedItemIds: STARTER_ITEM_IDS,
      equippedBearItems: ['outfit-basic'],
      equippedRabbitItems: [],
      itemTransforms: {},

      syncReadingProgress: (books) => {
        const currentState = get();
        const now = new Date().toISOString();
        const sortedBooks = sortReadBooks(books);
        const readBookIds = new Set(sortedBooks.map((book) => book.id));
        let rewardState = rewardLedgerFromStore(currentState);
        let ownedItemIds = [...currentState.ownedItemIds];

        sortedBooks.forEach((book, index) => {
          rewardState = calculateBookRewardUpdate(rewardState, book, now).state;
          const record = rewardState.bookRewardLedger[book.id];
          if (record.discoveryRolledAt) return;

          const ordinal = index + 1;
          const world = getCurrentReadingWorld(ordinal - 1);
          const positionInWorld = ordinal - world.unlockAt;
          const availableDiscoveries = GAME_ITEMS.filter(
            (item) =>
              item.source === 'discovery' &&
              item.worldId === world.id &&
              !ownedItemIds.includes(item.id)
          );
          const roll = hashString(`${book.id}:${world.id}`);
          const guaranteedDiscovery = positionInWorld === 50 || positionInWorld === 100;
          const shouldDiscover = availableDiscoveries.length > 0 &&
            (roll % 100 < 8 || guaranteedDiscovery);
          const discoveredItem = shouldDiscover
            ? availableDiscoveries[roll % availableDiscoveries.length]
            : undefined;

          rewardState = {
            ...rewardState,
            bookRewardLedger: {
              ...rewardState.bookRewardLedger,
              [book.id]: {
                ...record,
                discoveryRolledAt: now,
                discoveredItemId: discoveredItem?.id,
              },
            },
          };
          if (discoveredItem) ownedItemIds.push(discoveredItem.id);
        });

        Object.entries(rewardState.bookRewardLedger).forEach(([bookId, record]) => {
          if (record.bookStarActive && !readBookIds.has(bookId)) {
            rewardState = calculateBookRewardRevocation(rewardState, bookId, now).state;
          }
        });

        const claimedBookStarMilestones = [...rewardState.claimedBookStarMilestones];
        BOOK_STAR_MILESTONES.forEach((milestone) => {
          if (sortedBooks.length < milestone || claimedBookStarMilestones.includes(milestone)) return;
          const wallet = creditBookStars(rewardState, getMilestoneBookStars(milestone));
          rewardState = { ...rewardState, ...wallet };
          claimedBookStarMilestones.push(milestone);
        });
        rewardState = { ...rewardState, claimedBookStarMilestones };

        const automaticRewardIds = GAME_ITEMS
          .filter(
            (item) =>
              (item.source === 'milestone' || item.source === 'legendary') &&
              (item.unlockAt ?? Number.POSITIVE_INFINITY) <= sortedBooks.length &&
              !ownedItemIds.includes(item.id)
          )
          .map((item) => item.id);
        ownedItemIds = Array.from(new Set([...ownedItemIds, ...automaticRewardIds]));

        set({
          ...rewardState,
          ownedItemIds,
        });
      },

      purchaseItem: (itemId, readCount) => {
        const state = get();
        const item = getGameItem(itemId);

        if (!item || !item.currency || item.price === undefined) return 'not-for-sale';
        if (state.ownedItemIds.includes(itemId)) return 'owned';
        if (readCount < getItemRequiredBooks(item)) return 'locked';
        if (item.source !== 'shop' && item.source !== 'heart-shop') return 'not-for-sale';
        if (item.area === 'rabbit' && item.id !== 'rabbit-pet' && !state.rabbitAdopted) {
          return 'needs-rabbit';
        }

        if (item.currency === 'bookStars') {
          if (state.bookStars < item.price) return 'insufficient-book-stars';
          set({
            bookStars: state.bookStars - item.price,
            ownedItemIds: [...state.ownedItemIds, itemId],
          });
          return 'purchased';
        }

        if (state.hearts < item.price) return 'insufficient-hearts';
        set({
          hearts: state.hearts - item.price,
          rabbitAdopted: item.id === 'rabbit-pet' ? true : state.rabbitAdopted,
          ownedItemIds: [...state.ownedItemIds, itemId],
        });
        return 'purchased';
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
          itemTransforms: {
            ...state.itemTransforms,
            [itemId]: normalizeItemTransform(transform),
          },
        }));
      },
    }),
    {
      name: GAME_STORAGE_KEY,
      version: GAME_STORAGE_VERSION,
      migrate: migratePersistedGameState,
    }
  )
);
