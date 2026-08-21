import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateBookRewardRevocation,
  calculateBookRewardUpdate,
  migratePersistedGameState,
  RewardLedgerState,
  useGameStore,
} from '@/store/useGameStore';
import {
  DEFAULT_REWARD_SETTINGS,
  normalizeRewardSettings,
} from '@/lib/rewardSettings';

function emptyLedger(overrides: Partial<RewardLedgerState> = {}): RewardLedgerState {
  return {
    bookStars: 0,
    bookStarDebt: 0,
    hearts: 0,
    bookRewardLedger: {},
    claimedHeartMilestones: [],
    claimedBookStarMilestones: [],
    claimedBookStarRewards: {},
    ...overrides,
  };
}

test('new books receive the configured star amount and keep that amount on restamp', () => {
  const initialSettings = normalizeRewardSettings({
    ...DEFAULT_REWARD_SETTINGS,
    bookStarsPerBook: 25,
  });
  const changedSettings = normalizeRewardSettings({
    ...DEFAULT_REWARD_SETTINGS,
    bookStarsPerBook: 100,
  });
  const book = { id: 'book-1', isProse: false, isEnglish: false };

  const granted = calculateBookRewardUpdate(emptyLedger(), book, '2026-01-01T00:00:00.000Z', initialSettings);
  assert.equal(granted.state.bookStars, 25);
  assert.equal(granted.result.bookStarsGranted, 25);
  assert.equal(granted.state.bookRewardLedger[book.id].bookStarsGranted, 25);

  const revoked = calculateBookRewardRevocation(granted.state, book.id, '2026-01-02T00:00:00.000Z');
  assert.equal(revoked.state.bookStars, 0);
  assert.equal(revoked.result.bookStarsRevoked, 25);

  const restamped = calculateBookRewardUpdate(
    revoked.state,
    book,
    '2026-01-03T00:00:00.000Z',
    changedSettings
  );
  assert.equal(restamped.state.bookStars, 25);
  assert.equal(restamped.result.bookStarsGranted, 25);
});

test('prose and English heart rules can be configured independently', () => {
  const settings = normalizeRewardSettings({
    ...DEFAULT_REWARD_SETTINGS,
    proseBooksPerHeart: 2,
    proseHeartsPerReward: 3,
    englishBooksPerHeart: 1,
    englishHeartsPerReward: 2,
  });

  const first = calculateBookRewardUpdate(
    emptyLedger(),
    { id: 'book-1', isProse: true, isEnglish: false },
    '2026-01-01T00:00:00.000Z',
    settings
  );
  assert.equal(first.result.heartsGranted, 0);

  const second = calculateBookRewardUpdate(
    first.state,
    { id: 'book-2', isProse: true, isEnglish: true },
    '2026-01-02T00:00:00.000Z',
    settings
  );
  assert.equal(second.result.heartsGranted, 5);
  assert.equal(second.state.hearts, 5);
  assert.deepEqual(second.state.claimedHeartMilestones.sort(), ['english:1', 'prose:2']);
});

test('legacy game data receives safe reward defaults without losing its ledger', () => {
  const migrated = migratePersistedGameState({
    bookStars: 30,
    hearts: 2,
    bookRewardLedger: {
      legacy: {
        bookRewardedAt: '2025-01-01T00:00:00.000Z',
        bookStarActive: true,
      },
    },
  });

  assert.equal(migrated.bookStars, 30);
  assert.equal(migrated.hearts, 2);
  assert.equal(migrated.rewardSettings.bookStarsPerBook, 10);
  assert.equal(migrated.bookRewardLedger.legacy.bookStarsGranted, 10);
  assert.deepEqual(migrated.claimedBookStarRewards, {});
  assert.deepEqual(migrated.currencyAdjustments, []);
});

test('configured milestone bonuses are granted once during progress sync', () => {
  const settings = normalizeRewardSettings({
    ...DEFAULT_REWARD_SETTINGS,
    bookStarsPerBook: 1,
    milestoneBookStars: {
      ...DEFAULT_REWARD_SETTINGS.milestoneBookStars,
      10: 77,
    },
  });
  useGameStore.setState({
    bookStars: 0,
    bookStarDebt: 0,
    hearts: 0,
    rewardSettings: settings,
    currencyAdjustments: [],
    bookRewardLedger: {},
    claimedHeartMilestones: [],
    claimedBookStarMilestones: [],
    claimedBookStarRewards: {},
  });

  const books = Array.from({ length: 10 }, (_, index) => ({
    id: `book-${index + 1}`,
    isProse: false,
    isEnglish: false,
    stampedAt: new Date(2026, 0, index + 1).toISOString(),
  }));
  useGameStore.getState().syncReadingProgress(books);
  assert.equal(useGameStore.getState().bookStars, 87);
  assert.deepEqual(useGameStore.getState().claimedBookStarMilestones, [10]);
  assert.equal(useGameStore.getState().claimedBookStarRewards[10], 77);

  useGameStore.getState().syncReadingProgress(books);
  assert.equal(useGameStore.getState().bookStars, 87);
});

test('manual adjustments cannot make a balance negative and are audited', () => {
  useGameStore.setState({ bookStars: 5, hearts: 2, currencyAdjustments: [] });
  const adjustCurrency = useGameStore.getState().adjustCurrency;

  assert.equal(adjustCurrency('bookStars', -6, 'too much'), 'insufficient-balance');
  assert.equal(useGameStore.getState().bookStars, 5);
  assert.equal(adjustCurrency('bookStars', 7, '관리자 보너스'), 'adjusted');
  assert.equal(useGameStore.getState().bookStars, 12);
  assert.equal(adjustCurrency('hearts', -1, '잘못 지급된 하트 회수'), 'adjusted');
  assert.equal(useGameStore.getState().hearts, 1);
  assert.equal(useGameStore.getState().currencyAdjustments.length, 2);
  assert.equal(useGameStore.getState().currencyAdjustments[1].balanceAfter, 1);
});
