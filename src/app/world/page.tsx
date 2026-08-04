'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { GAME_ITEMS, GameItem } from '@/lib/gameCatalog';
import { useBookStore } from '@/store/useBookStore';
import { useGameStore } from '@/store/useGameStore';

type WorldView = 'room' | 'yard' | 'rabbit';
type ItemFilter = 'owned' | 'shop';

const SPRITES: Record<string, { sheet: 'bear' | 'item' | 'rabbit'; position: string }> = {
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

interface SpriteProps {
  art: string;
  className?: string;
  label?: string;
}

function Sprite({ art, className = '', label }: SpriteProps) {
  const sprite = SPRITES[art];
  if (!sprite) return <span className={className}>✨</span>;

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`game-sprite game-sprite-${sprite.sheet} ${className}`}
      style={{ backgroundPosition: sprite.position }}
    />
  );
}

function currencyLabel(item: GameItem) {
  if (item.currency === 'hearts') return `♥ ${item.price}`;
  if (item.currency === 'bookStars') return `★ ${item.price}`;
  if (item.unlockAt) return `${item.unlockAt}권 보상`;
  return '기본 아이템';
}

export default function WorldPage() {
  const [view, setView] = useState<WorldView>('room');
  const [filter, setFilter] = useState<ItemFilter>('owned');
  const [message, setMessage] = useState('책을 읽고 별과 하트를 모아 꾸며봐요!');

  const books = useBookStore((state) => state.books);
  const bookStars = useGameStore((state) => state.bookStars);
  const hearts = useGameStore((state) => state.hearts);
  const ledger = useGameStore((state) => state.bookRewardLedger);
  const rabbitAdopted = useGameStore((state) => state.rabbitAdopted);
  const ownedItemIds = useGameStore((state) => state.ownedItemIds);
  const equippedBearItems = useGameStore((state) => state.equippedBearItems);
  const equippedRabbitItems = useGameStore((state) => state.equippedRabbitItems);
  const purchaseItem = useGameStore((state) => state.purchaseItem);
  const toggleEquippedItem = useGameStore((state) => state.toggleEquippedItem);

  const readCount = books.filter((book) => book.status === 'read').length;
  const proseCount = Object.values(ledger).filter((record) => record.proseCreditedAt).length;
  const englishCount = Object.values(ledger).filter((record) => record.englishCreditedAt).length;

  const outfit = GAME_ITEMS.find(
    (item) => item.slot === 'outfit' && equippedBearItems.includes(item.id)
  ) ?? GAME_ITEMS[0];

  const visibleItems = useMemo(() => {
    const areaItems = GAME_ITEMS.filter((item) => {
      if (view === 'rabbit') return item.area === 'rabbit';
      return item.area === 'character' || item.area === view;
    });

    if (filter === 'owned') {
      return areaItems.filter((item) => ownedItemIds.includes(item.id));
    }
    return areaItems.filter((item) => !ownedItemIds.includes(item.id));
  }, [filter, ownedItemIds, view]);

  const handleItem = (item: GameItem) => {
    const owned = ownedItemIds.includes(item.id);

    if (!owned) {
      if (item.source === 'milestone') {
        setMessage(`📚 ${item.unlockAt}권을 완독하면 자동으로 열려요.`);
        return;
      }

      if (item.area === 'rabbit' && item.id !== 'rabbit-pet' && !rabbitAdopted) {
        setMessage('🐰 먼저 하트 5개로 토끼 친구를 만나주세요.');
        return;
      }

      if (purchaseItem(item.id)) {
        setMessage(item.id === 'rabbit-pet' ? '🐰 토끼 친구가 가족이 되었어요!' : `🎁 ${item.name}을(를) 얻었어요!`);
      } else {
        setMessage(item.currency === 'hearts' ? '♥ 하트가 부족해요.' : '★ 책별이 부족해요.');
      }
      return;
    }

    if (item.id === 'rabbit-pet') {
      setMessage('🐰 토끼 친구는 곰 옆에서 함께 지내요.');
      return;
    }

    toggleEquippedItem(item.id);
    const isEquipped = item.area === 'rabbit'
      ? equippedRabbitItems.includes(item.id)
      : equippedBearItems.includes(item.id);
    setMessage(isEquipped ? `${item.name}을(를) 벗었어요.` : `${item.name}을(를) 착용했어요!`);
  };

  const hasSceneItem = (itemId: string) =>
    ownedItemIds.includes(itemId) && equippedBearItems.includes(itemId);

  return (
    <div className="min-h-screen pb-28">
      <header className="bg-gradient-to-br from-indigo-400 via-purple-300 to-pink-300 px-4 pb-5 pt-10 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-purple-100">나만의 독서 세계</p>
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
      </header>

      <main className="space-y-4 px-3 py-4">
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-purple-100/70 p-1">
          {([
            ['room', '🏠 방'],
            ['yard', '🌳 마당'],
            ['rabbit', '🐰 토끼 친구'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={`rounded-xl py-2 text-xs font-black transition-colors ${
                view === value ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <section
          aria-label={
            view === 'yard'
              ? '곰돌이의 마당'
              : view === 'rabbit'
                ? '곰돌이와 작은 토끼 친구 꾸미기'
                : '곰돌이의 방'
          }
          className={`game-world-scene ${view === 'yard' ? 'game-world-yard' : 'game-world-room'}`}
        >
          <div className="game-world-sparkles" aria-hidden>✦　·　✧</div>
          {view !== 'yard' && <div className="game-world-window" aria-hidden />}
          {view === 'yard' && <div className="game-world-cloud" aria-hidden />}

          {view === 'room' && hasSceneItem('room-rug') && (
            <Sprite art="rug" className="game-scene-rug" />
          )}
          {view === 'room' && hasSceneItem('room-shelf') && (
            <Sprite art="shelf" className="game-scene-shelf" />
          )}
          {view === 'yard' && hasSceneItem('yard-tree') && (
            <Sprite art="tree" className="game-scene-tree" />
          )}
          {view === 'yard' && hasSceneItem('yard-flowers') && (
            <Sprite art="flowers" className="game-scene-flowers" />
          )}
          {view === 'yard' && hasSceneItem('yard-swing') && (
            <Sprite art="swing" className="game-scene-swing" />
          )}

          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className={`game-bear-wrap ${view === 'rabbit' ? 'game-bear-with-rabbit' : ''}`}
          >
            {equippedBearItems.includes('backpack-mint') && (
              <Sprite art="backpack" className="game-bear-backpack" />
            )}
            <Sprite art={outfit.art} className="game-bear" label={outfit.name} />
            {equippedBearItems.includes('hat-crown') && (
              <Sprite art="crown" className="game-bear-crown" />
            )}
            {equippedBearItems.includes('face-glasses') && (
              <Sprite art="glasses" className="game-bear-glasses" />
            )}
          </motion.div>

          <motion.div
            animate={rabbitAdopted ? { y: [0, -3, 0] } : undefined}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`game-rabbit-wrap ${view === 'rabbit' ? 'game-rabbit-focus' : ''}`}
          >
            {rabbitAdopted ? (
              <>
                {equippedRabbitItems.includes('rabbit-backpack') && <Sprite art="rabbit-backpack" className="game-rabbit-layer game-rabbit-back" />}
                <Sprite art="rabbit-base" className="game-rabbit-base" label="곰돌이의 작은 토끼 친구" />
                {equippedRabbitItems.map((itemId) => {
                  if (itemId === 'rabbit-backpack') return null;
                  const item = GAME_ITEMS.find((candidate) => candidate.id === itemId);
                  return item ? <Sprite key={item.id} art={item.art} className="game-rabbit-layer" /> : null;
                })}
              </>
            ) : (
              <>
                <Sprite art="rabbit-base" className="game-rabbit-base game-rabbit-disabled" label="아직 만나지 않은 작은 토끼 친구" />
                <div className="game-rabbit-locked"><strong>♥ 5</strong></div>
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
                ['shop', '상점'],
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
              {filter === 'owned' ? '아직 보유한 아이템이 없어요.' : '현재 화면에서 살 수 있는 아이템을 모두 모았어요!'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {visibleItems.map((item) => {
                const owned = ownedItemIds.includes(item.id);
                const equipped = item.area === 'rabbit'
                  ? equippedRabbitItems.includes(item.id)
                  : equippedBearItems.includes(item.id);
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleItem(item)}
                    className={`flex min-h-24 items-center gap-2 rounded-2xl border p-2 text-left transition-colors ${
                      equipped
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-100 bg-white/80 hover:bg-pink-50'
                    }`}
                  >
                    <Sprite art={item.art} className="game-item-icon" />
                    <span className="min-w-0 flex-1">
                      <strong className="block text-xs text-gray-700">{item.name}</strong>
                      <span className="mt-1 block text-[10px] font-bold text-purple-500">
                        {equipped ? '✓ 사용 중' : owned ? '사용하기' : currencyLabel(item)}
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
