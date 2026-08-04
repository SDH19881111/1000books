import {
  READING_WORLDS,
  SHOP_BOOK_STAR_BUDGET,
  getReadingWorld,
} from '@/lib/bookEconomy';

export type GameCurrency = 'bookStars' | 'hearts';
export type GameArea = 'character' | 'room' | 'yard' | 'rabbit';
export type GameItemSource =
  | 'starter'
  | 'shop'
  | 'heart-shop'
  | 'milestone'
  | 'discovery'
  | 'legendary';

export interface GameItem {
  id: string;
  name: string;
  area: GameArea;
  slot: string;
  art?: string;
  iconArt?: string;
  emoji: string;
  source: GameItemSource;
  worldId: string;
  currency?: GameCurrency;
  price?: number;
  unlockAt?: number;
}

interface ShopItemDefinition {
  id: string;
  name: string;
  area: GameArea;
  slot: string;
  emoji: string;
  price: number;
  art?: string;
}

interface ReadingRewardDefinition {
  id: string;
  name: string;
  area: GameArea;
  slot: string;
  emoji: string;
  art?: string;
}

const WORLD_SHOP_ITEMS: Record<string, ShopItemDefinition[]> = {
  'cozy-room': [
    { id: 'hat-reading-ribbon', name: '독서 리본', area: 'character', slot: 'hat', emoji: '🎀', price: 40 },
    { id: 'room-rug', name: '딸기 우유 러그', area: 'room', slot: 'rug', art: 'rug', emoji: '🍓', price: 50 },
    { id: 'face-glasses', name: '동그란 안경', area: 'character', slot: 'face', art: 'glasses', emoji: '👓', price: 60 },
    { id: 'back-bookbag', name: '꼬마 책가방', area: 'character', slot: 'back', emoji: '🎒', price: 60 },
    { id: 'yard-flowers', name: '무지개 꽃밭', area: 'yard', slot: 'flowers', art: 'flowers', emoji: '🌈', price: 70 },
    { id: 'room-shelf', name: '구름 책장', area: 'room', slot: 'shelf', art: 'shelf', emoji: '📚', price: 80 },
  ],
  'story-forest': [
    { id: 'hat-forest-leaf', name: '이야기 나뭇잎 모자', area: 'character', slot: 'hat', emoji: '🍃', price: 50 },
    { id: 'outfit-forest', name: '숲속 탐험가', area: 'character', slot: 'outfit', emoji: '🦺', price: 70 },
    { id: 'backpack-mint', name: '별빛 가방', area: 'character', slot: 'back', art: 'backpack', emoji: '🎒', price: 80 },
    { id: 'room-acorn-lamp', name: '도토리 조명', area: 'room', slot: 'lamp', emoji: '🌰', price: 90 },
    { id: 'yard-firefly-lantern', name: '반딧불 랜턴', area: 'yard', slot: 'swing', emoji: '🏮', price: 100 },
    { id: 'yard-treehouse', name: '비밀 나무집', area: 'yard', slot: 'tree', emoji: '🏡', price: 130 },
  ],
  'ocean-library': [
    { id: 'face-ocean-goggles', name: '바다 탐험 고글', area: 'character', slot: 'face', emoji: '🥽', price: 60 },
    { id: 'hat-shell', name: '조개 왕관', area: 'character', slot: 'hat', emoji: '🐚', price: 80 },
    { id: 'outfit-diver', name: '꼬마 잠수부', area: 'character', slot: 'outfit', emoji: '🤿', price: 100 },
    { id: 'room-coral-lamp', name: '산호초 조명', area: 'room', slot: 'lamp', emoji: '🪸', price: 110 },
    { id: 'yard-bubble-fountain', name: '방울 분수', area: 'yard', slot: 'flowers', emoji: '🫧', price: 120 },
    { id: 'back-fish-bag', name: '열대어 가방', area: 'character', slot: 'back', emoji: '🐠', price: 130 },
  ],
  'magic-kingdom': [
    { id: 'hat-fairy', name: '요정 모자', area: 'character', slot: 'hat', emoji: '🪄', price: 90 },
    { id: 'face-magic-sparkle', name: '마법 별빛', area: 'character', slot: 'face', emoji: '✨', price: 100 },
    { id: 'room-magic-castle', name: '작은 마법성', area: 'room', slot: 'shelf', emoji: '🏰', price: 110 },
    { id: 'yard-magic-crystal', name: '마법 수정', area: 'yard', slot: 'tree', emoji: '💎', price: 110 },
    { id: 'back-magic-wand', name: '별빛 요술봉', area: 'character', slot: 'back', emoji: '🪄', price: 120 },
    { id: 'outfit-wizard', name: '별빛 마법사', area: 'character', slot: 'outfit', art: 'outfit-wizard', emoji: '🧙‍♀️', price: 150 },
  ],
  'cloud-village': [
    { id: 'hat-cloud', name: '톡신 구름 모자', area: 'character', slot: 'hat', emoji: '☁️', price: 80 },
    { id: 'face-rainbow', name: '무지개 페인팅', area: 'character', slot: 'face', emoji: '🌈', price: 100 },
    { id: 'room-cloud-bed', name: '구름 침대', area: 'room', slot: 'rug', emoji: '🛏️', price: 120 },
    { id: 'back-sky-bag', name: '하늘빛 가방', area: 'character', slot: 'back', emoji: '🎒', price: 130 },
    { id: 'yard-swing', name: '구름 그네', area: 'yard', slot: 'swing', art: 'swing', emoji: '🎠', price: 140 },
    { id: 'outfit-cloud-wings', name: '구름 날개 의상', area: 'character', slot: 'outfit', emoji: '🪶', price: 150 },
  ],
  'space-library': [
    { id: 'face-robot-badge', name: '로봇 배지', area: 'character', slot: 'face', emoji: '🤖', price: 80 },
    { id: 'room-planet-lamp', name: '행성 조명', area: 'room', slot: 'lamp', emoji: '🪐', price: 100 },
    { id: 'room-moon-rug', name: '반달 러그', area: 'room', slot: 'rug', emoji: '🌙', price: 120 },
    { id: 'yard-rocket-garden', name: '로켓 정원', area: 'yard', slot: 'tree', emoji: '🚀', price: 140 },
    { id: 'hat-space-helmet', name: '은하수 헬멧', area: 'character', slot: 'hat', emoji: '👨‍🚀', price: 150 },
    { id: 'outfit-space-silver', name: '은빛 우주 탐험가', area: 'character', slot: 'outfit', emoji: '🚀', price: 170 },
  ],
  'dino-booktown': [
    { id: 'face-dino-explorer', name: '화석 탐험 안경', area: 'character', slot: 'face', emoji: '🔎', price: 80 },
    { id: 'hat-fossil', name: '화석 모자', area: 'character', slot: 'hat', emoji: '🦴', price: 100 },
    { id: 'room-fossil-display', name: '화석 전시대', area: 'room', slot: 'shelf', emoji: '🦴', price: 120 },
    { id: 'yard-dino-tree', name: '시대를 넘은 나무', area: 'yard', slot: 'tree', emoji: '🌴', price: 140 },
    { id: 'outfit-dino', name: '꼬마 공룡 의상', area: 'character', slot: 'outfit', emoji: '🦖', price: 160 },
    { id: 'yard-dino-friend', name: '아기 공룡 친구', area: 'yard', slot: 'swing', emoji: '🦕', price: 200 },
  ],
  'snow-kingdom': [
    { id: 'room-snow-rug', name: '눈결정 러그', area: 'room', slot: 'rug', emoji: '❄️', price: 80 },
    { id: 'back-snow-scarf', name: '포근한 눈꽃 목도리', area: 'character', slot: 'back', emoji: '🧣', price: 100 },
    { id: 'room-ice-lantern', name: '얼음 랜턴', area: 'room', slot: 'lamp', emoji: '🏮', price: 120 },
    { id: 'yard-snowman', name: '책 읽는 눈사람', area: 'yard', slot: 'tree', emoji: '☃️', price: 140 },
    { id: 'outfit-snow-princess', name: '눈꽃 공주 의상', area: 'character', slot: 'outfit', emoji: '👗', price: 180 },
    { id: 'hat-ice-crown', name: '얼음 왕관', area: 'character', slot: 'hat', emoji: '👑', price: 200 },
  ],
  'dragon-kingdom': [
    { id: 'face-knight-medal', name: '용기의 훈장', area: 'character', slot: 'face', emoji: '🏅', price: 70 },
    { id: 'yard-dragon-tower', name: '용의 망반', area: 'yard', slot: 'tree', emoji: '🗼️', price: 90 },
    { id: 'room-dragon-egg', name: '반짝이는 용의 알', area: 'room', slot: 'lamp', emoji: '🥚', price: 110 },
    { id: 'hat-dragon-helmet', name: '용기사 투구', area: 'character', slot: 'hat', emoji: '🪖', price: 140 },
    { id: 'outfit-dragon-knight', name: '용기사 의상', area: 'character', slot: 'outfit', emoji: '⚔️', price: 200 },
    { id: 'yard-baby-dragon', name: '아기 용 친구', area: 'yard', slot: 'swing', emoji: '🐉', price: 250 },
  ],
  'golden-library': [
    { id: 'face-golden-star', name: '황금별 페인팅', area: 'character', slot: 'face', emoji: '⭐', price: 70 },
    { id: 'room-golden-shelf', name: '황금 책장', area: 'room', slot: 'shelf', emoji: '📚', price: 90 },
    { id: 'yard-golden-fountain', name: '황금별 분수', area: 'yard', slot: 'flowers', emoji: '⛲', price: 110 },
    { id: 'room-golden-throne', name: '천권의 왕좌', area: 'room', slot: 'rug', emoji: '🪑', price: 140 },
    { id: 'outfit-legend-reader', name: '전설의 독서왕', area: 'character', slot: 'outfit', emoji: '🧙', price: 170 },
    { id: 'hat-crown', name: '황금 왕관', area: 'character', slot: 'hat', art: 'crown', emoji: '👑', price: 300 },
  ],
};

const WORLD_READING_REWARDS: Record<string, ReadingRewardDefinition[]> = {
  'cozy-room': [
    { id: 'reward-cozy-cushion', name: '포근한 책 방석', area: 'room', slot: 'rug', emoji: '🪴' },
    { id: 'reward-cozy-mug', name: '따뜻한 코코아', area: 'room', slot: 'lamp', emoji: '☕' },
    { id: 'reward-cozy-bird', name: '책 읽는 새 친구', area: 'yard', slot: 'swing', emoji: '🐦' },
  ],
  'story-forest': [
    { id: 'reward-forest-fox', name: '이야기 여우', area: 'yard', slot: 'swing', emoji: '🦊' },
    { id: 'yard-tree', name: '이야기 나무', area: 'yard', slot: 'tree', art: 'tree', emoji: '🌳' },
    { id: 'reward-forest-book', name: '숲의 비밀책', area: 'room', slot: 'shelf', emoji: '📗' },
  ],
  'ocean-library': [
    { id: 'reward-ocean-turtle', name: '바다거북 친구', area: 'yard', slot: 'swing', emoji: '🐢' },
    { id: 'reward-ocean-pearl', name: '인어의 진주', area: 'room', slot: 'lamp', emoji: '🪸' },
    { id: 'reward-ocean-book', name: '파도의 비밀책', area: 'room', slot: 'shelf', emoji: '📘' },
  ],
  'magic-kingdom': [
    { id: 'reward-magic-owl', name: '마법 부엉이', area: 'yard', slot: 'swing', emoji: '🦉' },
    { id: 'reward-magic-potion', name: '무지개 마법 물약', area: 'room', slot: 'lamp', emoji: '🧪' },
    { id: 'reward-magic-book', name: '마법사의 비밀책', area: 'room', slot: 'shelf', emoji: '📕' },
  ],
  'cloud-village': [
    { id: 'reward-cloud-bird', name: '하늘빛 새', area: 'yard', slot: 'swing', emoji: '🐦' },
    { id: 'yard-swing-reward', name: '전설의 구름 그네', area: 'yard', slot: 'swing', art: 'swing', emoji: '🎠' },
    { id: 'reward-cloud-star', name: '손안의 작은 별', area: 'room', slot: 'lamp', emoji: '🌟' },
  ],
  'space-library': [
    { id: 'reward-space-alien', name: '꼬마 외계인', area: 'yard', slot: 'swing', emoji: '👽' },
    { id: 'outfit-space', name: '우주 탐험가', area: 'character', slot: 'outfit', art: 'outfit-space', emoji: '🚀' },
    { id: 'reward-space-book', name: '은하수 도감', area: 'room', slot: 'shelf', emoji: '📘' },
  ],
  'dino-booktown': [
    { id: 'reward-dino-egg', name: '아기 공룡 알', area: 'room', slot: 'lamp', emoji: '🥚' },
    { id: 'reward-dino-footprint', name: '공룡 발자국', area: 'room', slot: 'rug', emoji: '🐾' },
    { id: 'reward-dino-book', name: '공룡 백과사전', area: 'room', slot: 'shelf', emoji: '📗' },
  ],
  'snow-kingdom': [
    { id: 'reward-snow-penguin', name: '독서왕 펭궄', area: 'yard', slot: 'swing', emoji: '🐧' },
    { id: 'reward-snow-globe', name: '눈꽃 스노우볼', area: 'room', slot: 'lamp', emoji: '🌐' },
    { id: 'reward-snow-book', name: '겨울 동화책', area: 'room', slot: 'shelf', emoji: '📘' },
  ],
  'dragon-kingdom': [
    { id: 'reward-dragon-shield', name: '용기사의 방패', area: 'character', slot: 'back', emoji: '🛡️' },
    { id: 'reward-dragon-flame', name: '작은 용의 불꽃', area: 'room', slot: 'lamp', emoji: '🔥' },
    { id: 'reward-dragon-book', name: '용의 전설책', area: 'room', slot: 'shelf', emoji: '📕' },
  ],
  'golden-library': [
    { id: 'reward-golden-key', name: '대도서관의 황금 열쇠', area: 'character', slot: 'back', emoji: '🔑' },
    { id: 'reward-golden-star', name: '천 번째 별빛', area: 'room', slot: 'lamp', emoji: '🌟' },
    { id: 'reward-golden-book', name: '천권의 전설책', area: 'room', slot: 'shelf', emoji: '📖' },
  ],
};

const WORLD_LEGENDARY_REWARDS: Record<string, ReadingRewardDefinition> = {
  'cozy-room': { id: 'legend-cozy-library', name: '포근한 도서관', area: 'room', slot: 'shelf', emoji: '🏠' },
  'story-forest': { id: 'legend-forest-spirit', name: '이야기 숲의 정령', area: 'yard', slot: 'tree', emoji: '🦌' },
  'ocean-library': { id: 'legend-ocean-whale', name: '별고래 친구', area: 'yard', slot: 'swing', emoji: '🐋' },
  'magic-kingdom': { id: 'legend-magic-dragon', name: '마법 드래곤', area: 'yard', slot: 'swing', emoji: '🐲' },
  'cloud-village': { id: 'legend-cloud-castle', name: '구름 성', area: 'yard', slot: 'tree', emoji: '🏰' },
  'space-library': { id: 'legend-space-robot', name: '전설의 로봇', area: 'yard', slot: 'swing', emoji: '🤖' },
  'dino-booktown': { id: 'legend-dino-king', name: '공룡 왕 친구', area: 'yard', slot: 'swing', emoji: '🦖' },
  'snow-kingdom': { id: 'legend-ice-palace', name: '얼음 궁전', area: 'yard', slot: 'tree', emoji: '🏰' },
  'dragon-kingdom': { id: 'legend-dragon-friend', name: '별빛 용 친구', area: 'yard', slot: 'swing', emoji: '🐉' },
  'golden-library': { id: 'legend-thousand-books', name: '천권의 여왕', area: 'character', slot: 'outfit', emoji: '🌟' },
};

const WORLD_DISCOVERY_REWARDS: Record<string, ReadingRewardDefinition[]> = {
  'cozy-room': [
    { id: 'discover-cozy-cookie', name: '숨은 별 쿠키', area: 'room', slot: 'lamp', emoji: '🍪' },
    { id: 'discover-cozy-cat', name: '책방 고양이', area: 'room', slot: 'rug', emoji: '🐱' },
  ],
  'story-forest': [
    { id: 'discover-forest-rabbit', name: '숲속 토끼', area: 'yard', slot: 'swing', emoji: '🐇' },
    { id: 'discover-forest-mushroom', name: '별빛 버섯', area: 'yard', slot: 'flowers', emoji: '🍄' },
  ],
  'ocean-library': [
    { id: 'discover-ocean-dolphin', name: '미소 돌고래', area: 'yard', slot: 'swing', emoji: '🐬' },
    { id: 'discover-ocean-treasure', name: '바다 보물상자', area: 'room', slot: 'shelf', emoji: '🧰' },
  ],
  'magic-kingdom': [
    { id: 'discover-magic-frog', name: '마법 개구리', area: 'yard', slot: 'swing', emoji: '🐸' },
    { id: 'discover-magic-mirror', name: '비밀의 거울', area: 'room', slot: 'lamp', emoji: '🪞' },
  ],
  'cloud-village': [
    { id: 'discover-cloud-rainbow', name: '숨은 쌍무지개', area: 'yard', slot: 'tree', emoji: '🌈' },
    { id: 'discover-cloud-balloon', name: '별빛 열기구', area: 'yard', slot: 'swing', emoji: '🎈' },
  ],
  'space-library': [
    { id: 'discover-space-ufo', name: '꼬마 UFO', area: 'yard', slot: 'swing', emoji: '🛸' },
    { id: 'discover-space-comet', name: '행운의 혜성', area: 'yard', slot: 'tree', emoji: '☄️' },
  ],
  'dino-booktown': [
    { id: 'discover-dino-amber', name: '숨은 호박 화석', area: 'room', slot: 'lamp', emoji: '💎' },
    { id: 'discover-dino-baby', name: '깜짝 아기 공룡', area: 'yard', slot: 'swing', emoji: '🦕' },
  ],
  'snow-kingdom': [
    { id: 'discover-snow-fox', name: '눈꽃 여우', area: 'yard', slot: 'swing', emoji: '🦊' },
    { id: 'discover-snow-diamond', name: '얼음 다이아몬드', area: 'room', slot: 'lamp', emoji: '💎' },
  ],
  'dragon-kingdom': [
    { id: 'discover-dragon-map', name: '용의 비밀 지도', area: 'room', slot: 'shelf', emoji: '🗺️' },
    { id: 'discover-dragon-gem', name: '용의 보석', area: 'room', slot: 'lamp', emoji: '💎' },
  ],
  'golden-library': [
    { id: 'discover-golden-feather', name: '황금 깃털펜', area: 'room', slot: 'shelf', emoji: '🪶' },
    { id: 'discover-golden-crown', name: '숨은 별의 왕관', area: 'character', slot: 'hat', emoji: '👑' },
  ],
};

function buildWorldItems(): GameItem[] {
  return READING_WORLDS.flatMap((world) => {
    const shopItems = WORLD_SHOP_ITEMS[world.id].map<GameItem>((item) => ({
      ...item,
      source: 'shop',
      worldId: world.id,
      currency: 'bookStars',
    }));

    const milestoneOffsets = [25, 50, 75];
    const milestoneItems = WORLD_READING_REWARDS[world.id].map<GameItem>((item, index) => ({
      ...item,
      source: 'milestone',
      worldId: world.id,
      unlockAt: world.unlockAt + milestoneOffsets[index],
    }));

    const legendaryItem: GameItem = {
      ...WORLD_LEGENDARY_REWARDS[world.id],
      source: 'legendary',
      worldId: world.id,
      unlockAt: world.endBook,
    };

    const discoveryItems = WORLD_DISCOVERY_REWARDS[world.id].map<GameItem>((item) => ({
      ...item,
      source: 'discovery',
      worldId: world.id,
    }));

    const worldItems = [...shopItems, ...milestoneItems, ...discoveryItems, legendaryItem];

    return worldItems.map((item, index) => ({
      ...item,
      iconArt: `world-${world.id}-${index}`,
    }));
  });
}

const HEART_SHOP_ITEMS: GameItem[] = [
  { id: 'rabbit-pet', name: '토끼 친구', area: 'rabbit', slot: 'pet', art: 'rabbit-base', emoji: '🐰', source: 'heart-shop', worldId: 'story-forest', currency: 'hearts', price: 5 },
  { id: 'rabbit-bow', name: '별빛 분홍 리본', area: 'rabbit', slot: 'rabbit-head', art: 'rabbit-bow', emoji: '🎀', source: 'heart-shop', worldId: 'story-forest', currency: 'hearts', price: 1 },
  { id: 'rabbit-glasses', name: '토끼 동그란 안경', area: 'rabbit', slot: 'rabbit-face', art: 'rabbit-glasses', emoji: '👓', source: 'heart-shop', worldId: 'story-forest', currency: 'hearts', price: 1 },
  { id: 'rabbit-wizard', name: '토끼 마법사 모자', area: 'rabbit', slot: 'rabbit-head', art: 'rabbit-wizard', emoji: '🧙', source: 'heart-shop', worldId: 'magic-kingdom', currency: 'hearts', price: 1 },
  { id: 'rabbit-scarf', name: '별무늬 목도리', area: 'rabbit', slot: 'rabbit-neck', art: 'rabbit-scarf', emoji: '🧣', source: 'heart-shop', worldId: 'snow-kingdom', currency: 'hearts', price: 1 },
  { id: 'rabbit-necklace', name: '별빛 목걸이', area: 'rabbit', slot: 'rabbit-neck', art: 'rabbit-necklace', emoji: '💎', source: 'heart-shop', worldId: 'golden-library', currency: 'hearts', price: 1 },
  { id: 'rabbit-backpack', name: '꼬마 책가방', area: 'rabbit', slot: 'rabbit-back', art: 'rabbit-backpack', emoji: '🎒', source: 'heart-shop', worldId: 'story-forest', currency: 'hearts', price: 1 },
  { id: 'rabbit-carrot', name: '당근 장난감', area: 'rabbit', slot: 'rabbit-prop', art: 'rabbit-carrot', emoji: '🥕', source: 'heart-shop', worldId: 'dino-booktown', currency: 'hearts', price: 1 },
  { id: 'rabbit-book', name: '토끼 그림책', area: 'rabbit', slot: 'rabbit-prop', art: 'rabbit-book', emoji: '📖', source: 'heart-shop', worldId: 'story-forest', currency: 'hearts', price: 1 },
];

export const GAME_ITEMS: GameItem[] = [
  { id: 'outfit-basic', name: '기본 곰돌이', area: 'character', slot: 'outfit', art: 'outfit-basic', emoji: '🐻', source: 'starter', worldId: 'cozy-room' },
  ...buildWorldItems(),
  ...HEART_SHOP_ITEMS,
];

export const STARTER_ITEM_IDS = GAME_ITEMS
  .filter((item) => item.source === 'starter')
  .map((item) => item.id);

export const WORLD_CONTENT_ITEM_COUNT = GAME_ITEMS.filter((item) =>
  ['shop', 'milestone', 'discovery', 'legendary'].includes(item.source)
).length;

export const SHOP_ITEM_COUNT = GAME_ITEMS.filter((item) => item.source === 'shop').length;

export const SHOP_ITEM_PRICE_TOTAL = GAME_ITEMS
  .filter((item) => item.source === 'shop' && item.currency === 'bookStars')
  .reduce((total, item) => total + (item.price ?? 0), 0);

if (process.env.NODE_ENV !== 'production') {
  if (WORLD_CONTENT_ITEM_COUNT !== 120) {
    throw new Error(`세계 콘텐츠는 120개여야 합니다. 현재: ${WORLD_CONTENT_ITEM_COUNT}개`);
  }
  if (SHOP_ITEM_COUNT !== 60 || SHOP_ITEM_PRICE_TOTAL !== SHOP_BOOK_STAR_BUDGET) {
    throw new Error(
      `상점은 60개, 총 ${SHOP_BOOK_STAR_BUDGET}책별이어야 합니다. ` +
      `현재: ${SHOP_ITEM_COUNT}개, ${SHOP_ITEM_PRICE_TOTAL}책별`
    );
  }
}

export function getGameItem(itemId: string) {
  return GAME_ITEMS.find((item) => item.id === itemId);
}

export function getItemWorld(item: GameItem) {
  return getReadingWorld(item.worldId) ?? READING_WORLDS[0];
}

export function getItemRequiredBooks(item: GameItem) {
  if (item.source === 'milestone' || item.source === 'legendary') {
    return item.unlockAt ?? 0;
  }
  return getItemWorld(item).unlockAt;
}

export function isItemAvailable(item: GameItem, readCount: number) {
  return readCount >= getItemRequiredBooks(item);
}
