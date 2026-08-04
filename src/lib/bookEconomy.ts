export const TOTAL_BOOK_GOAL = 1000;
export const BOOK_STARS_PER_BOOK = 10;

export const BOOK_STAR_MILESTONE_REWARDS = {
  10: 20,
  30: 30,
  50: 50,
  100: 100,
  200: 150,
  300: 200,
  500: 300,
  1000: 500,
} as const;

export type BookStarMilestone = keyof typeof BOOK_STAR_MILESTONE_REWARDS;

export const BOOK_STAR_MILESTONES = Object.keys(BOOK_STAR_MILESTONE_REWARDS)
  .map(Number)
  .sort((a, b) => a - b);

export const TOTAL_BASE_BOOK_STARS = TOTAL_BOOK_GOAL * BOOK_STARS_PER_BOOK;
export const TOTAL_MILESTONE_BOOK_STARS = Object.values(BOOK_STAR_MILESTONE_REWARDS)
  .reduce((total, reward) => total + reward, 0);
export const TOTAL_GUARANTEED_BOOK_STARS =
  TOTAL_BASE_BOOK_STARS + TOTAL_MILESTONE_BOOK_STARS;
export const SHOP_BOOK_STAR_BUDGET = 9250;

export interface ReadingWorld {
  id: string;
  name: string;
  emoji: string;
  startBook: number;
  endBook: number;
  unlockAt: number;
  description: string;
}

export const READING_WORLDS: ReadingWorld[] = [
  { id: 'cozy-room', name: '포근한 독서방', emoji: '🏠', startBook: 1, endBook: 100, unlockAt: 0, description: '첫 의상과 방, 마당을 꾸며요.' },
  { id: 'story-forest', name: '이야기 숲', emoji: '🌳', startBook: 101, endBook: 200, unlockAt: 100, description: '동물 친구와 나무집을 만나요.' },
  { id: 'ocean-library', name: '바닷속 도서관', emoji: '🌊', startBook: 201, endBook: 300, unlockAt: 200, description: '해양 의상과 수족관을 열어요.' },
  { id: 'magic-kingdom', name: '마법 왕국', emoji: '🏰', startBook: 301, endBook: 400, unlockAt: 300, description: '마법사와 성, 마법 소품을 얻어요.' },
  { id: 'cloud-village', name: '구름 마을', emoji: '☁️', startBook: 401, endBook: 500, unlockAt: 400, description: '날개와 구름 집을 꾸며요.' },
  { id: 'space-library', name: '우주 도서관', emoji: '🚀', startBook: 501, endBook: 600, unlockAt: 500, description: '우주복과 행성, 로봇 친구를 만나요.' },
  { id: 'dino-booktown', name: '공룡 책마을', emoji: '🦕', startBook: 601, endBook: 700, unlockAt: 600, description: '공룡 의상과 화석 정원을 열어요.' },
  { id: 'snow-kingdom', name: '눈꽃 왕국', emoji: '❄️', startBook: 701, endBook: 800, unlockAt: 700, description: '겨울 의상과 얼음 궁전을 얻어요.' },
  { id: 'dragon-kingdom', name: '용의 왕국', emoji: '🐉', startBook: 801, endBook: 900, unlockAt: 800, description: '아기 용과 기사 의상을 만나요.' },
  { id: 'golden-library', name: '황금 대도서관', emoji: '🌟', startBook: 901, endBook: 1000, unlockAt: 900, description: '전설 세트와 최종 캐릭터를 열어요.' },
];

export function getReadingWorld(worldId: string) {
  return READING_WORLDS.find((world) => world.id === worldId);
}

export function getCurrentReadingWorld(readCount: number) {
  return [...READING_WORLDS]
    .reverse()
    .find((world) => readCount >= world.unlockAt) ?? READING_WORLDS[0];
}

export function getNextReadingWorld(readCount: number) {
  return READING_WORLDS.find((world) => world.unlockAt > readCount) ?? null;
}

export function getMilestoneBookStars(milestone: number) {
  return BOOK_STAR_MILESTONE_REWARDS[milestone as BookStarMilestone] ?? 0;
}
