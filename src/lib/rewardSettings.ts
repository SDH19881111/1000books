import {
  BOOK_STAR_MILESTONES,
  BOOK_STAR_MILESTONE_REWARDS,
  BOOK_STARS_PER_BOOK,
} from './bookEconomy';

export interface RewardSettings {
  bookStarsPerBook: number;
  proseBooksPerHeart: number;
  proseHeartsPerReward: number;
  englishBooksPerHeart: number;
  englishHeartsPerReward: number;
  milestoneBookStars: Record<number, number>;
}

export const DEFAULT_REWARD_SETTINGS: RewardSettings = {
  bookStarsPerBook: BOOK_STARS_PER_BOOK,
  proseBooksPerHeart: 10,
  proseHeartsPerReward: 1,
  englishBooksPerHeart: 10,
  englishHeartsPerReward: 1,
  milestoneBookStars: { ...BOOK_STAR_MILESTONE_REWARDS },
};

function toInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

export function normalizeRewardSettings(value: unknown): RewardSettings {
  const settings = value && typeof value === 'object'
    ? value as Partial<RewardSettings>
    : {};
  const milestoneBookStars = settings.milestoneBookStars &&
    typeof settings.milestoneBookStars === 'object'
    ? settings.milestoneBookStars
    : {};

  return {
    bookStarsPerBook: toInteger(
      settings.bookStarsPerBook,
      DEFAULT_REWARD_SETTINGS.bookStarsPerBook,
      0,
      10_000
    ),
    proseBooksPerHeart: toInteger(
      settings.proseBooksPerHeart,
      DEFAULT_REWARD_SETTINGS.proseBooksPerHeart,
      1,
      1_000
    ),
    proseHeartsPerReward: toInteger(
      settings.proseHeartsPerReward,
      DEFAULT_REWARD_SETTINGS.proseHeartsPerReward,
      0,
      100
    ),
    englishBooksPerHeart: toInteger(
      settings.englishBooksPerHeart,
      DEFAULT_REWARD_SETTINGS.englishBooksPerHeart,
      1,
      1_000
    ),
    englishHeartsPerReward: toInteger(
      settings.englishHeartsPerReward,
      DEFAULT_REWARD_SETTINGS.englishHeartsPerReward,
      0,
      100
    ),
    milestoneBookStars: Object.fromEntries(
      BOOK_STAR_MILESTONES.map((milestone) => [
        milestone,
        toInteger(
          milestoneBookStars[milestone],
          DEFAULT_REWARD_SETTINGS.milestoneBookStars[milestone],
          0,
          100_000
        ),
      ])
    ),
  };
}

export function getConfiguredMilestoneBookStars(
  settings: RewardSettings,
  milestone: number
) {
  return settings.milestoneBookStars[milestone] ?? 0;
}
