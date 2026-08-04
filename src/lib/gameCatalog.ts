export type GameCurrency = 'bookStars' | 'hearts';
export type GameArea = 'character' | 'room' | 'yard' | 'rabbit';
export type GameItemSource = 'starter' | 'shop' | 'heart-shop' | 'milestone';

export interface GameItem {
  id: string;
  name: string;
  area: GameArea;
  slot: string;
  art: string;
  source: GameItemSource;
  currency?: GameCurrency;
  price?: number;
  unlockAt?: number;
}

export const GAME_ITEMS: GameItem[] = [
  { id: 'outfit-basic', name: '기본 곰돌이', area: 'character', slot: 'outfit', art: 'outfit-basic', source: 'starter' },
  { id: 'outfit-wizard', name: '별빛 마법사', area: 'character', slot: 'outfit', art: 'outfit-wizard', source: 'shop', currency: 'bookStars', price: 60 },
  { id: 'outfit-space', name: '우주 탐험가', area: 'character', slot: 'outfit', art: 'outfit-space', source: 'milestone', unlockAt: 30 },
  { id: 'hat-crown', name: '황금 왕관', area: 'character', slot: 'hat', art: 'crown', source: 'shop', currency: 'bookStars', price: 80 },
  { id: 'face-glasses', name: '동그란 안경', area: 'character', slot: 'face', art: 'glasses', source: 'shop', currency: 'bookStars', price: 30 },
  { id: 'backpack-mint', name: '별빛 가방', area: 'character', slot: 'back', art: 'backpack', source: 'shop', currency: 'bookStars', price: 50 },
  { id: 'room-rug', name: '딸기 우유 러그', area: 'room', slot: 'rug', art: 'rug', source: 'shop', currency: 'bookStars', price: 30 },
  { id: 'room-shelf', name: '구름 책장', area: 'room', slot: 'shelf', art: 'shelf', source: 'shop', currency: 'bookStars', price: 70 },
  { id: 'yard-flowers', name: '무지개 꽃밭', area: 'yard', slot: 'flowers', art: 'flowers', source: 'shop', currency: 'bookStars', price: 40 },
  { id: 'yard-tree', name: '이야기 나무', area: 'yard', slot: 'tree', art: 'tree', source: 'milestone', unlockAt: 30 },
  { id: 'yard-swing', name: '구름 그네', area: 'yard', slot: 'swing', art: 'swing', source: 'milestone', unlockAt: 100 },
  { id: 'rabbit-pet', name: '토끼 친구', area: 'rabbit', slot: 'pet', art: 'rabbit-base', source: 'heart-shop', currency: 'hearts', price: 5 },
  { id: 'rabbit-bow', name: '별빛 분홍 리본', area: 'rabbit', slot: 'rabbit-head', art: 'rabbit-bow', source: 'heart-shop', currency: 'hearts', price: 1 },
  { id: 'rabbit-glasses', name: '토끼 동그란 안경', area: 'rabbit', slot: 'rabbit-face', art: 'rabbit-glasses', source: 'heart-shop', currency: 'hearts', price: 1 },
  { id: 'rabbit-wizard', name: '토끼 마법사 모자', area: 'rabbit', slot: 'rabbit-head', art: 'rabbit-wizard', source: 'heart-shop', currency: 'hearts', price: 1 },
  { id: 'rabbit-scarf', name: '별무늬 목도리', area: 'rabbit', slot: 'rabbit-neck', art: 'rabbit-scarf', source: 'heart-shop', currency: 'hearts', price: 1 },
  { id: 'rabbit-necklace', name: '별빛 목걸이', area: 'rabbit', slot: 'rabbit-neck', art: 'rabbit-necklace', source: 'heart-shop', currency: 'hearts', price: 1 },
  { id: 'rabbit-backpack', name: '꼬마 책가방', area: 'rabbit', slot: 'rabbit-back', art: 'rabbit-backpack', source: 'heart-shop', currency: 'hearts', price: 1 },
  { id: 'rabbit-carrot', name: '당근 장난감', area: 'rabbit', slot: 'rabbit-prop', art: 'rabbit-carrot', source: 'heart-shop', currency: 'hearts', price: 1 },
  { id: 'rabbit-book', name: '토끼 그림책', area: 'rabbit', slot: 'rabbit-prop', art: 'rabbit-book', source: 'heart-shop', currency: 'hearts', price: 1 },
];

export const STARTER_ITEM_IDS = GAME_ITEMS
  .filter((item) => item.source === 'starter')
  .map((item) => item.id);

export function getGameItem(itemId: string) {
  return GAME_ITEMS.find((item) => item.id === itemId);
}
