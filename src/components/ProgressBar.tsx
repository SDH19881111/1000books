'use client';

import { motion } from 'framer-motion';
import { MILESTONES } from '@/store/useBookStore';

interface ProgressBarProps {
  readCount: number;
  nextMilestone: number | null;
}

export default function ProgressBar({ readCount, nextMilestone }: ProgressBarProps) {
  if (!nextMilestone) {
    return (
      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-2xl mb-1">🏆</p>
        <p className="font-bold text-pink-600">모든 마일스톤 달성!</p>
        <p className="text-sm text-gray-500">당신은 진정한 독서왕!</p>
      </div>
    );
  }

  // 이전 마일스톤 찾기
  const prevMilestone = MILESTONES.filter((m) => m <= readCount).pop() ?? 0;
  const total = nextMilestone - prevMilestone;
  const current = readCount - prevMilestone;
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const remaining = nextMilestone - readCount;

  return (
    <div className="glass-card rounded-2xl p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400 font-medium">다음 보상까지</p>
          <p className="text-sm font-bold text-pink-600">
            📚 {remaining}권 더 읽으면 돼요!
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">목표</p>
          <p className="text-lg font-black text-purple-500">{nextMilestone}권</p>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="relative h-5 bg-pink-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-pink-300 via-pink-400 to-purple-400 relative"
        >
          {/* 반짝이 효과 */}
          <motion.div
            animate={{ x: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
          />
        </motion.div>

        {/* 퍼센트 텍스트 */}
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* 카운터 */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-400">{prevMilestone}권</span>
        <motion.span
          key={readCount}
          initial={{ scale: 1.5, color: '#FF85A2' }}
          animate={{ scale: 1, color: '#9CA3AF' }}
          className="text-sm font-black text-gray-500"
        >
          현재 {readCount}권
        </motion.span>
        <span className="text-xs text-purple-400 font-bold">{nextMilestone}권 🎁</span>
      </div>
    </div>
  );
}
