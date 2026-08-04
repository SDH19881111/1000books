'use client';

import { motion } from 'framer-motion';
import { MILESTONES } from '@/store/useBookStore';

interface StampMapProps {
  readCount: number;
  totalCells?: number;
}

export default function StampMap({ readCount, totalCells = 100 }: StampMapProps) {
  const cols = 10;

  // 마일스톤 위치 계산
  const milestoneSet = new Set(MILESTONES.filter((m) => m <= totalCells));

  const getCellColor = (index: number) => {
    const cellNum = index + 1;
    if (cellNum <= readCount) {
      if (milestoneSet.has(cellNum)) return 'milestone';
      return 'read';
    }
    return 'empty';
  };

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700 text-sm">📍 나의 독서 지도</h3>
        <span className="text-xs text-pink-500 font-bold bg-pink-100 px-2 py-0.5 rounded-full">
          {readCount}/{totalCells}
        </span>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: totalCells }).map((_, i) => {
          const state = getCellColor(i);
          const cellNum = i + 1;

          return (
            <motion.div
              key={i}
              initial={state === 'read' || state === 'milestone' ? { scale: 0 } : {}}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.002, type: 'spring', stiffness: 400 }}
              title={`${cellNum}번째 책`}
              className={`aspect-square rounded-sm flex items-center justify-center text-[8px] relative ${
                state === 'milestone'
                  ? 'bg-gradient-to-br from-yellow-300 to-orange-400 shadow-sm'
                  : state === 'read'
                  ? 'bg-gradient-to-br from-pink-300 to-rose-400'
                  : 'bg-pink-100/60'
              }`}
            >
              {state === 'milestone' && (
                <span className="text-[7px]">⭐</span>
              )}
              {state === 'read' && cellNum === readCount && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-sm bg-pink-400/30"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-pink-300 to-rose-400" />
          <span className="text-[10px] text-gray-400">읽은 책</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-[6px]">⭐</div>
          <span className="text-[10px] text-gray-400">마일스톤</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-pink-100" />
          <span className="text-[10px] text-gray-400">남은 책</span>
        </div>
      </div>
    </div>
  );
}
