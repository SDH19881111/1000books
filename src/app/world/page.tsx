'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import Navbar from '@/components/Navbar';
import {
  BOOK_STARS_PER_BOOK,
  READING_WORLDS,
  SHOP_BOOK_STAR_BUDGET,
  getCurrentReadingWorld,
  getNextReadingWorld,
  getReadingWorld,
} from '@/lib/bookEconomy';
import {
  GAME_ITEMS,
  GameItem,
  SHOP_ITEM_COUNT,
  getGameItem,
  getItemRequiredBooks,
  getItemWorld,
} from '@/lib/gameCatalog';
import { useBookStore } from '@/store/useBookStore';
import {
  DEFAULT_ITEM_TRANSFORM,
  MAX_ITEM_SCALE,
  MIN_ITEM_SCALE,
  useGameStore,
} from '@/store/useGameStore';
import type { ItemTransform, PurchaseResult } from '@/store/useGameStore';

type WorldView = 'room' | 'yard' | 'rabbit';
type ItemFilter = 'owned' | 'shop';

interface SpriteDefinition {
  sheet: 'bear' | 'item' | 'rabbit' | 'world';
  position: string;
  backgroundImage?: string;
  backgroundSize?: string;
}

const BASE_SPRITES: Record<string, SpriteDefinition> = {
  'outfit-basic': { sheet: 'bear', position: '0% 50%' },
  'outfit-wizard': { sheet: 'bear', position: '50% 50%' },
  'outfit-space': { sheet: 'bear', position: '100% 50%' },
  crown: { sheet: 'item', position: '0% 0%' },
  glasses: { sheet: 'item', position: '33.333% 0%' },
  backpack: { sheet: 'item', position: '100% 0%' },
  rug: { sheet: 'item', position: '33.333% 33.333%' },
  shelf: { sheet: 'item', position: '66.667% 33.333%' },
  flowers: { sheet: 'item', position: '0% 66.667%' },
  tree: { sheet: 'item', position: '33.333% 66.667%' },
  swing: { sheet: 'item', position: '66.667% 66.667%' },
  'rabbit-base': { sheet: 'rabbit', position: '0% 0%' },
  'rabbit-bow': { sheet: 'rabbit', position: '50% 0%' },
  'rabbit-glasses': { sheet: 'rabbit', position: '100% 0%' },
  'rabbit-wizard': { sheet: 'rabbit', position: '0% 50%' },
  'rabbit-scarf': { sheet: 'rabbit', position: '50% 50%' },
  'rabbit-necklace': { sheet: 'rabbit', position: '100% 50%' },
  'rabbit-backpack': { sheet: 'rabbit', position: '0% 100%' },
  'rabbit-carrot': { sheet: 'rabbit', position: '50% 100%' },
  'rabbit-book': { sheet: 'rabbit', position: '100% 100%' },
};

const WORLD_SPRITES = Object.fromEntries(
  READING_WORLDS.flatMap((world) =>
    Array.from({ length: 12 }, (_, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);

      return [
        `world-${world.id}-${index}`,
        {
          sheet: 'world',
          position: `${(column / 3) * 100}% ${(row / 3) * 100}%`,
          backgroundImage: `url('/game/world-${world.id}-sprites.png')`,
          backgroundSize: '400% 400%',
        } satisfies SpriteDefinition,
      ];
    })
  )
) as Record<string, SpriteDefinition>;

const SPRITES: Record<string, SpriteDefinition> = {
  ...BASE_SPRITES,
  ...WORLD_SPRITES,
};

interface SpriteProps {
  art?: string;
  className?: string;
  label?: string;
}

interface SceneSize {
  width: number;
  height: number;
}

interface AdjustableSpriteProps {
  itemId: string;
  art?: string;
  className: string;
  editMode: boolean;
  selected: boolean;
  sceneRef: RefObject<HTMLElement | null>;
  sceneSize: SceneSize;
  transform: ItemTransform;
  onSelect: (itemId: string) => void;
  onTransformChange: (itemId: string, transform: ItemTransform) => void;
}

function Sprite({ art, className = '', label }: SpriteProps) {
  const sprite = art ? SPRITES[art] : undefined;
  if (!sprite) {
    return <span className={`game-item-placeholder ${className}`} aria-hidden />;
  }

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`game-sprite game-sprite-${sprite.sheet} ${className}`}
      style={{
        backgroundImage: sprite.backgroundImage,
        backgroundPosition: sprite.position,
        backgroundSize: sprite.backgroundSize,
      }}
    />
  );
}

function AdjustableSprite({
  itemId,
  art,
  className,
  editMode,
  selected,
  sceneRef,
  sceneSize,
  transform,
  onSelect,
  onTransformChange,
}: AdjustableSpriteProps) {
  const item = getGameItem(itemId);
  const label = item?.name ?? '꾸미기 아이템';

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (sceneSize.width <= 1 || sceneSize.height <= 1) return;
    onTransformChange(itemId, {
      x: transform.x + info.offset.x / sceneSize.width,
      y: transform.y + info.offset.y / sceneSize.height,
      scale: transform.scale,
    });
  };

  return (
    <motion.button
      type="button"
      data-layout-item={itemId}
      aria-label={`${label} 위치 조정`}
      aria-pressed={editMode ? selected : undefined}
      disabled={!editMode}
      drag={editMode}
      dragConstraints={sceneRef}
      dragElastic={0}
      dragMomentum={false}
      onClick={() => onSelect(itemId)}
      onDragStart={() => onSelect(itemId)}
      onDragEnd={handleDragEnd}
      className={`game-editable-item ${selected ? 'game-editable-selected' : ''} ${className}`}
      style={{
        x: transform.x * sceneSize.width,
        y: transform.y * sceneSize.height,
        scale: transform.scale,
      }}
    >
      <Sprite art={art} label={label} className="game-adjustable-sprite" />
    </motion.button>
  );
}

function itemStatusLabel(item: GameItem, readCount: number) {
  const requiredBooks = getItemRequiredBooks(item);
  if (readCount < requiredBooks) return `🔒 ${requiredBooks}권에 열림`;
  if (item.source === 'discovery') return '🎁 행운 발견';
  if (item.source === 'legendary') return `🏆 ${item.unlockAt}권 세계 완성`;
  if (item.source === 'milestone') return `📚 ${item.unlockAt}권 독서 보상`;
  if (item.currency === 'hearts') return `♥ ${item.price}`;
  if (item.currency === 'bookStars') return `★ ${item.price}`;
  return '기본 아이템';
}

function purchaseFailureMessage(result: PurchaseResult, item: GameItem) {
  if (result === 'locked') {
    return `🔒 ${getItemRequiredBooks(item)}권을 읽으면 살 수 있어요.`;
  }
  if (result === 'needs-rabbit') return '🐰 먼저 토끼 친구를 만나주세요.';
  if (result === 'insufficient-hearts') return '♥ 하트가 부족해요.';
  if (result === 'insufficient-book-stars') return '★ 책별이 부족해요. 책 한 권마다 10책별을 얻어요.';
  return '지금은 얻을 수 없는 아이템이에요.';
}

export default function WorldPage() {
  const books = useBookStore((state) => state.books);
  const readCount = books.filter((book) => book.status === 'read').length;
  const currentWorld = getCurrentReadingWorld(readCount);
  const nextWorld = getNextReadingWorld(readCount);

  const [view, setView] = useState<WorldView>('room');
  const [filter, setFilter] = useState<ItemFilter>('owned');
  const [selectedWorldId, setSelectedWorldId] = useState(currentWorld.id);
  const [message, setMessage] = useState(`책 한 권을 읽으면 ${BOOK_STARS_PER_BOOK}책별을 얻어요!`);
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [selectedLayoutItemId, setSelectedLayoutItemId] = useState<string | null>(null);
  const [sceneSize, setSceneSize] = useState<SceneSize>({ width: 1, height: 1 });
  const sceneRef = useRef<HTMLElement>(null);

  const bookStars = useGameStore((state) => state.bookStars);
  const bookStarDebt = useGameStore((state) => state.bookStarDebt);
  const hearts = useGameStore((state) => state.hearts);
  const ledger = useGameStore((state) => state.bookRewardLedger);
  const rabbitAdopted = useGameStore((state) => state.rabbitAdopted);
  const ownedItemIds = useGameStore((state) => state.ownedItemIds);
  const equippedBearItems = useGameStore((state) => state.equippedBearItems);
  const equippedRabbitItems = useGameStore((state) => state.equippedRabbitItems);
  const itemTransforms = useGameStore((state) => state.itemTransforms);
  const purchaseItem = useGameStore((state) => state.purchaseItem);
  const toggleEquippedItem = useGameStore((state) => state.toggleEquippedItem);
  const setItemTransform = useGameStore((state) => state.setItemTransform);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const updateSceneSize = () => {
      const bounds = scene.getBoundingClientRect();
      setSceneSize({ width: bounds.width, height: bounds.height });
    };

    updateSceneSize();
    const observer = new ResizeObserver(updateSceneSize);
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  const selectedWorld = getReadingWorld(selectedWorldId) ?? currentWorld;
  const selectedLayoutItem = selectedLayoutItemId
    ? getGameItem(selectedLayoutItemId)
    : undefined;
  const proseCount = Object.values(ledger).filter((record) => record.proseCreditedAt).length;
  const englishCount = Object.values(ledger).filter((record) => record.englishCreditedAt).length;

  const outfit = GAME_ITEMS.find(
    (item) => item.art && item.slot === 'outfit' && equippedBearItems.includes(item.id)
  ) ?? GAME_ITEMS[0];

  const visibleItems = useMemo(() => {
    const areaItems = GAME_ITEMS.filter((item) => {
      if (item.worldId !== selectedWorld.id) return false;
      if (view === 'rabbit') return item.area === 'rabbit';
      return item.area === 'character' || item.area === view;
    });

    if (filter === 'owned') {
      return areaItems.filter((item) => ownedItemIds.includes(item.id));
    }
    return areaItems.filter(
      (item) => item.source !== 'starter' && !ownedItemIds.includes(item.id)
    );
  }, [filter, ownedItemIds, selectedWorld.id, view]);

  const selectedWorldContent = GAME_ITEMS.filter(
    (item) =>
      item.worldId === selectedWorld.id &&
      ['shop', 'milestone', 'discovery', 'legendary'].includes(item.source)
  );
  const selectedWorldOwnedCount = selectedWorldContent.filter((item) =>
    ownedItemIds.includes(item.id)
  ).length;

  const genericEquippedItems = GAME_ITEMS.filter(
    (item) =>
      !item.art &&
      item.iconArt &&
      equippedBearItems.includes(item.id) &&
      (item.area === 'character' || item.area === view)
  );

  const getSavedTransform = (itemId: string) =>
    itemTransforms[itemId] ?? DEFAULT_ITEM_TRANSFORM;

  const handleViewChange = (nextView: WorldView) => {
    setView(nextView);
    setSelectedLayoutItemId(null);
  };

  const handleLayoutEditToggle = () => {
    const nextEditing = !layoutEditMode;
    setLayoutEditMode(nextEditing);
    if (!nextEditing) setSelectedLayoutItemId(null);
    setMessage(nextEditing
      ? '배치할 아이템을 누르고 끌어보세요. 위치와 크기는 자동 저장돼요.'
      : '아이템 배치를 저장했어요.');
  };

  const adjustSelectedItemScale = (amount: number) => {
    if (!selectedLayoutItemId) return;
    const transform = getSavedTransform(selectedLayoutItemId);
    const scale = Math.min(MAX_ITEM_SCALE, Math.max(MIN_ITEM_SCALE, transform.scale + amount));
    setItemTransform(selectedLayoutItemId, { ...transform, scale });
  };

  const resetSelectedItemTransform = () => {
    if (!selectedLayoutItemId) return;
    setItemTransform(selectedLayoutItemId, { ...DEFAULT_ITEM_TRANSFORM });
    setMessage(`${selectedLayoutItem?.name ?? '아이템'} 위치를 처음 상태로 돌렸어요.`);
  };

  const handleWorld = (worldId: string) => {
    const world = getReadingWorld(worldId);
    if (!world) return;
    if (readCount < world.unlockAt) {
      setMessage(`🔒 ${world.name}은 ${world.unlockAt}권을 읽으면 열려요.`);
      return;
    }
    setSelectedWorldId(world.id);
    setSelectedLayoutItemId(null);
    setMessage(`${world.emoji} ${world.name} 아이템을 보고 있어요.`);
  };

  const handleItem = (item: GameItem) => {
    const owned = ownedItemIds.includes(item.id);

    if (!owned) {
      if (item.source === 'milestone' || item.source === 'legendary') {
        setMessage(`📚 ${item.unlockAt}권을 완독하면 자동으로 열려요.`);
        return;
      }
      if (item.source === 'discovery') {
        setMessage('🎁 책을 읽는 동안 보물상자에서 행운으로 발견할 수 있어요.');
        return;
      }

      const result = purchaseItem(item.id, readCount);
      if (result === 'purchased' || result === 'owned') {
        setMessage(item.id === 'rabbit-pet'
          ? '🐰 토끼 친구가 가족이 되었어요!'
          : `🎁 ${item.name}을(를) 얻었어요!`);
      } else {
        setMessage(purchaseFailureMessage(result, item));
      }
      return;
    }

    if (item.id === 'rabbit-pet') {
      setMessage('🐰 토끼 친구는 곰 옆에서 함께 지내요.');
      return;
    }

    toggleEquippedItem(item.id);
    if (selectedLayoutItemId === item.id) setSelectedLayoutItemId(null);
    const isEquipped = item.area === 'rabbit'
      ? equippedRabbitItems.includes(item.id)
      : equippedBearItems.includes(item.id);
    setMessage(isEquipped ? `${item.name}을(를) 벗었어요.` : `${item.name}을(를) 사용했어요!`);
  };

  const hasSceneItem = (itemId: string) =>
    ownedItemIds.includes(itemId) && equippedBearItems.includes(itemId);

  const renderAdjustableSprite = (itemId: string, art: string | undefined, className: string) => (
    <AdjustableSprite
      key={itemId}
      itemId={itemId}
      art={art}
      className={className}
      editMode={layoutEditMode}
      selected={selectedLayoutItemId === itemId}
      sceneRef={sceneRef}
      sceneSize={sceneSize}
      transform={getSavedTransform(itemId)}
      onSelect={setSelectedLayoutItemId}
      onTransformChange={setItemTransform}
    />
  );

  return (
    <div className="min-h-screen pb-28">
      <header className="bg-gradient-to-br from-indigo-400 via-purple-300 to-pink-300 px-4 pb-5 pt-10 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-purple-100">나만의 1,000권 독서 세계</p>
            <h1 className="font-pen text-4xl drop-shadow">책별 마을</h1>
          </div>
          <div className="flex gap-2 text-xs font-black">
            <div className="rounded-2xl bg-white/25 px-3 py-2 backdrop-blur-sm">★ {bookStars}</div>
            <div className="rounded-2xl bg-pink-500/30 px-3 py-2 backdrop-blur-sm">♥ {hearts}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-purple-800">
          <span className="rounded-full bg-white/70 px-2.5 py-1">📚 완독 {readCount}권</span>
          <span className="rounded-full bg-amber-50/90 px-2.5 py-1">📖 줄글 {proseCount}권</span>
          <span className="rounded-full bg-sky-50/90 px-2.5 py-1">🔤 영어 {englishCount}권</span>
        </div>
        {bookStarDebt > 0 && (
          <p className="mt-2 rounded-xl bg-white/20 px-3 py-2 text-[10px] font-bold">
            도장 취소로 회수할 {bookStarDebt}책별은 다음 보상에서 자동 정산돼요.
          </p>
        )}
      </header>

      <main className="space-y-4 px-3 py-4">
        <section className="rounded-3xl border border-amber-100 bg-white/80 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-amber-500">{currentWorld.emoji} 현재 세계</p>
              <h2 className="text-sm font-black text-gray-700">{currentWorld.name}</h2>
            </div>
            <p className="text-right text-[10px] font-bold text-gray-400">
              1권 = {BOOK_STARS_PER_BOOK}책별<br />
              상점 {SHOP_ITEM_COUNT}개 = {SHOP_BOOK_STAR_BUDGET.toLocaleString()}책별
            </p>
          </div>
          {nextWorld ? (
            <p className="mt-2 text-[10px] text-purple-500">
              다음 {nextWorld.emoji} {nextWorld.name}까지 {nextWorld.unlockAt - readCount}권
            </p>
          ) : (
            <p className="mt-2 text-[10px] font-bold text-amber-500">🏆 1,000권 모든 세계가 열렸어요!</p>
          )}
        </section>

        <section aria-label="독서 세계 선택" className="-mx-3 overflow-x-auto px-3 pb-1">
          <div className="flex w-max gap-2">
            {READING_WORLDS.map((world) => {
              const unlocked = readCount >= world.unlockAt;
              const selected = world.id === selectedWorld.id;
              return (
                <button
                  key={world.id}
                  type="button"
                  aria-pressed={selected}
                  aria-disabled={!unlocked}
                  onClick={() => handleWorld(world.id)}
                  className={`w-24 rounded-2xl border px-2 py-2 text-left transition-colors ${
                    selected
                      ? 'border-purple-300 bg-purple-100 text-purple-700'
                      : unlocked
                        ? 'border-white bg-white/80 text-gray-600'
                        : 'border-gray-100 bg-gray-100/80 text-gray-400'
                  }`}
                >
                  <span className={`block text-xl ${unlocked ? '' : 'grayscale'}`}>{unlocked ? world.emoji : '🔒'}</span>
                  <strong className="mt-1 block text-[10px] leading-tight">{world.name}</strong>
                  <span className="mt-1 block text-[9px]">{world.startBook}~{world.endBook}권</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-purple-100 bg-purple-50/80 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <strong className="text-xs text-purple-700">{selectedWorld.emoji} {selectedWorld.name}</strong>
              <p className="mt-0.5 text-[10px] text-purple-400">{selectedWorld.description}</p>
            </div>
            <span className="whitespace-nowrap rounded-full bg-white px-2 py-1 text-[10px] font-black text-purple-500">
              {selectedWorldOwnedCount}/12
            </span>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-purple-100/70 p-1">
          {([
            ['room', '🏠 방'],
            ['yard', '🌳 마당'],
            ['rabbit', '🐰 토끼 친구'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => handleViewChange(value)}
              className={`rounded-xl py-2 text-xs font-black transition-colors ${
                view === value ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <section className={`game-layout-editor ${layoutEditMode ? 'game-layout-editor-active' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <strong className="text-xs text-purple-700">아이템 위치 조정</strong>
              <p className="mt-0.5 text-[10px] text-purple-400">
                {layoutEditMode ? '아이템을 선택하고 끌어서 배치해요.' : '배치 편집을 켜면 위치와 크기를 바꿀 수 있어요.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLayoutEditToggle}
              className="whitespace-nowrap rounded-xl bg-purple-600 px-3 py-2 text-[11px] font-black text-white shadow-sm"
            >
              {layoutEditMode ? '편집 완료' : '배치 편집'}
            </button>
          </div>

          {layoutEditMode && (
            <div className="mt-2 flex min-h-10 items-center justify-between gap-2 rounded-xl bg-white/85 px-2 py-1.5">
              {selectedLayoutItem ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-gray-600">
                    {selectedLayoutItem.name} · {Math.round(getSavedTransform(selectedLayoutItem.id).scale * 100)}%
                  </span>
                  <button
                    type="button"
                    aria-label="아이템 작게"
                    onClick={() => adjustSelectedItemScale(-0.1)}
                    disabled={getSavedTransform(selectedLayoutItem.id).scale <= MIN_ITEM_SCALE}
                    className="game-layout-control"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    aria-label="아이템 크게"
                    onClick={() => adjustSelectedItemScale(0.1)}
                    disabled={getSavedTransform(selectedLayoutItem.id).scale >= MAX_ITEM_SCALE}
                    className="game-layout-control"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={resetSelectedItemTransform}
                    className="rounded-lg bg-purple-50 px-2 py-1.5 text-[10px] font-black text-purple-600"
                  >
                    원래 위치
                  </button>
                </>
              ) : (
                <p className="w-full text-center text-[10px] font-bold text-purple-400">
                  장면에 놓인 아이템을 먼저 선택해주세요.
                </p>
              )}
            </div>
          )}
        </section>

        <section
          ref={sceneRef}
          aria-label={view === 'yard' ? '곰돌이의 마당' : view === 'rabbit' ? '곰돌이와 토끼 친구' : '곰돌이의 방'}
          className={`game-world-scene ${view === 'yard' ? 'game-world-yard' : 'game-world-room'} ${layoutEditMode ? 'game-world-editing' : ''}`}
        >
          <div className="game-world-sparkles" aria-hidden>✦　·　✧</div>
          {view !== 'yard' && <div className="game-world-window" aria-hidden />}
          {view === 'yard' && <div className="game-world-cloud" aria-hidden />}

          {view === 'room' && hasSceneItem('room-rug') && renderAdjustableSprite('room-rug', 'rug', 'game-scene-rug')}
          {view === 'room' && hasSceneItem('room-shelf') && renderAdjustableSprite('room-shelf', 'shelf', 'game-scene-shelf')}
          {view === 'yard' && hasSceneItem('yard-tree') && renderAdjustableSprite('yard-tree', 'tree', 'game-scene-tree')}
          {view === 'yard' && hasSceneItem('yard-flowers') && renderAdjustableSprite('yard-flowers', 'flowers', 'game-scene-flowers')}
          {view === 'yard' && hasSceneItem('yard-swing') && renderAdjustableSprite('yard-swing', 'swing', 'game-scene-swing')}
          {view === 'yard' && hasSceneItem('yard-swing-reward') && renderAdjustableSprite('yard-swing-reward', 'swing', 'game-scene-swing')}

          {genericEquippedItems.map((item) => (
            renderAdjustableSprite(
              item.id,
              item.iconArt,
              `game-generic-item game-generic-${item.area} game-generic-${item.slot}`
            )
          ))}

          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className={`game-bear-wrap ${view === 'rabbit' ? 'game-bear-with-rabbit' : ''}`}
          >
            {equippedBearItems.includes('backpack-mint') && renderAdjustableSprite('backpack-mint', 'backpack', 'game-bear-backpack')}
            <Sprite art={outfit.art} className="game-bear" label={outfit.name} />
            {equippedBearItems.includes('hat-crown') && renderAdjustableSprite('hat-crown', 'crown', 'game-bear-crown')}
            {equippedBearItems.includes('face-glasses') && renderAdjustableSprite('face-glasses', 'glasses', 'game-bear-glasses')}
          </motion.div>

          <motion.div
            animate={rabbitAdopted ? { y: [0, -3, 0] } : undefined}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`game-rabbit-wrap ${view === 'rabbit' ? 'game-rabbit-focus' : ''}`}
          >
            {rabbitAdopted ? (
              <>
                {equippedRabbitItems.includes('rabbit-backpack') && renderAdjustableSprite('rabbit-backpack', 'rabbit-backpack', 'game-rabbit-layer game-rabbit-back')}
                <Sprite art="rabbit-base" className="game-rabbit-base" label="곰돌이의 작은 토끼 친구" />
                {equippedRabbitItems.map((itemId) => {
                  if (itemId === 'rabbit-backpack') return null;
                  const item = GAME_ITEMS.find((candidate) => candidate.id === itemId);
                  return item?.art
                    ? renderAdjustableSprite(item.id, item.art, 'game-rabbit-layer')
                    : null;
                })}
              </>
            ) : (
              <>
                <Sprite art="rabbit-base" className="game-rabbit-base game-rabbit-disabled" label="아직 만나지 않은 토끼 친구" />
                <div className="game-rabbit-locked"><strong>{readCount < 100 ? '🔒 100권' : '♥ 5'}</strong></div>
              </>
            )}
          </motion.div>
        </section>

        <p role="status" className="rounded-2xl bg-white/80 px-3 py-2 text-center text-xs font-bold text-purple-600 shadow-sm">
          {message}
        </p>

        <section className="glass-card rounded-3xl border border-purple-100 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-gray-700">꾸미기 아이템</h2>
              <p className="text-[10px] text-gray-400">보유 아이템을 누르면 착용하거나 배치해요.</p>
            </div>
            <div className="flex rounded-xl bg-gray-100 p-1 text-[10px] font-bold">
              {([
                ['owned', '보유'],
                ['shop', '상점·보상'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-2.5 py-1.5 ${filter === value ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <div className="rounded-2xl bg-purple-50 py-8 text-center text-xs text-purple-400">
              {filter === 'owned' ? '이 화면에 배치할 보유 아이템이 없어요.' : '이 화면의 아이템을 모두 모았어요!'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {visibleItems.map((item) => {
                const owned = ownedItemIds.includes(item.id);
                const equipped = item.area === 'rabbit'
                  ? equippedRabbitItems.includes(item.id)
                  : equippedBearItems.includes(item.id);
                const itemWorld = getItemWorld(item);
                const itemLocked = !owned && readCount < getItemRequiredBooks(item);
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleItem(item)}
                    className={`relative flex min-h-24 items-center gap-2 overflow-hidden rounded-2xl border p-2 text-left transition-colors ${
                      equipped
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-100 bg-white/80 hover:bg-pink-50'
                    }`}
                  >
                    {itemLocked && <span className="absolute right-2 top-2 text-xs">🔒</span>}
                    <Sprite art={item.iconArt ?? item.art} label={item.name} className="game-item-icon" />
                    <span className="min-w-0 flex-1">
                      <strong className="block text-xs text-gray-700">{item.name}</strong>
                      <span className="mt-0.5 block text-[9px] text-gray-400">{itemWorld.emoji} {itemWorld.name}</span>
                      <span className="mt-1 block text-[10px] font-bold text-purple-500">
                        {equipped ? '✓ 사용 중' : owned ? '사용하기' : itemStatusLabel(item, readCount)}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Navbar />
    </div>
  );
}
