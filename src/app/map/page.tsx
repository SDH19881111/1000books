'use client';

import { motion } from 'framer-motion';
import { useBookStore, MILESTONES } from '@/store/useBookStore';
import Navbar from '@/components/Navbar';

const TOTAL = 1000;
const COLS = 25;

export default function MapPage() {
  const books = useBookStore((state) => state.books);
  const readCount = books.filter((book) => book.status === 'read').length;

  const milestoneSet = new Set(MILESTONES);

  const getCellState = (num: number) => {
    if (num <= readCount) {
      if (milestoneSet.has(num)) return 'milestone';
      return 'read';
    }
    return 'empty';
  };

  return (
    <div className="min-h-screen pb-28">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-indigo-300 via-purple-200 to-pink-200 pt-12 pb-8 px-5 relative overflow-hidden">
        <div className="absolute top-4 right-6 text-4xl opacity-20">🗺️</div>
        <div className="absolute bottom-2 left-4 text-2xl opacity-20">🏰</div>
        <h1 className="font-pen text-3xl text-white drop-shadow">1000권 독서 지도</h1>
        <p className="text-purple-100 text-sm mt-1">
          {readCount}권 완독 · 남은 칸 {TOTAL - readCount}개
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 범례 */}
        <div className="flex gap-4 justify-center glass-card rounded-2xl py-3">
          {[
            { color: 'bg-gradient-to-br from-pink-300 to-rose-400', label: '읽은 책' },
            { color: 'bg-gradient-to-br from-yellow-300 to-orange-400', label: '마일스톤', star: true },
            { color: 'bg-pink-100', label: '남은 칸' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded-sm ${item.color} flex items-center justify-center`}>
                {item.star && <span className="text-[8px]">⭐</span>}
              </div>
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>

        {/* 진행 요약 */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-700">전체 진행률</span>
            <span className="text-sm font-black text-pink-600">
              {readCount}/{TOTAL}권
            </span>
          </div>
          <div className="h-3 bg-pink-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(readCount / TOTAL) * 100}%` }}
              transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
              className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-right">
            {((readCount / TOTAL) * 100).toFixed(1)}% 달성
          </p>
        </div>

        {/* 1000칸 그리드 */}
        <div className="glass-card rounded-2xl p-3 overflow-hidden">
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: TOTAL }).map((_, i) => {
              const num = i + 1;
              const state = getCellState(num);
              const isMilestone = milestoneSet.has(num);

              return (
                <motion.div
                  key={i}
                  className={`relative cursor-default rounded-[2px] ${
                    state === 'milestone'
                      ? 'bg-gradient-to-br from-yellow-300 to-orange-400'
                      : state === 'read'
                      ? 'bg-gradient-to-br from-pink-300 to-rose-400'
                      : 'bg-pink-100/50'
                  }`}
                  style={{ aspectRatio: '1' }}
                >
                  {isMilestone && state !== 'empty' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span style={{ fontSize: '5px' }}>⭐</span>
                    </div>
                  )}
                  {/* 현재 위치 표시 */}
                  {num === readCount && (
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute inset-0 rounded-[2px] ring-1 ring-white"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 마일스톤 목록 */}
        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3">🏆 마일스톤 현황</h3>
          <div className="grid grid-cols-4 gap-2">
            {MILESTONES.map((m) => {
              const achieved = readCount >= m;
              return (
                <div
                  key={m}
                  className={`text-center rounded-xl py-2 px-1 ${
                    achieved
                      ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border border-yellow-300'
                      : 'bg-gray-100 border border-gray-200 opacity-60'
                  }`}
                >
                  <p className="text-lg">{achieved ? '🏆' : '⬜'}</p>
                  <p className={`text-[10px] font-bold ${achieved ? 'text-orange-600' : 'text-gray-400'}`}>
                    {m}권
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  );
}
