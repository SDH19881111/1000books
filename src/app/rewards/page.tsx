'use client';

import { motion } from 'framer-motion';
import { useBookStore, MILESTONES, MILESTONE_REWARDS } from '@/store/useBookStore';
import Navbar from '@/components/Navbar';

export default function RewardsPage() {
  const rewards = useBookStore((s) => s.rewards);
  const getReadCount = useBookStore((s) => s.getReadCount);
  const readCount = getReadCount();

  const unlockedSet = new Set(rewards.map((r) => r.milestone));

  return (
    <div className="min-h-screen pb-28">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-yellow-300 via-orange-200 to-pink-300 pt-12 pb-8 px-5 relative overflow-hidden">
        <div className="absolute top-4 right-6 text-5xl opacity-20">🎁</div>
        <div className="absolute bottom-2 left-4 text-3xl opacity-20">✨</div>
        <h1 className="font-pen text-3xl text-white drop-shadow">나만의 보상 방</h1>
        <p className="text-orange-100 text-sm mt-1">
          {rewards.length}개의 보상을 획득했어요!
        </p>
      </div>

      {/* 보상 그리드 */}
      <div className="px-4 py-5 space-y-4">
        <p className="text-xs text-gray-400 text-center font-medium">
          📖 마일스톤을 달성하면 보상이 잠금 해제돼요!
        </p>

        <div className="grid grid-cols-2 gap-4">
          {MILESTONES.map((milestone, i) => {
            const isUnlocked = unlockedSet.has(milestone);
            const reward = MILESTONE_REWARDS[milestone];
            const progress = Math.min((readCount / milestone) * 100, 100);

            return (
              <motion.div
                key={milestone}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 300 }}
                className={`rounded-2xl overflow-hidden border-2 shadow-md transition-all duration-300 ${
                  isUnlocked
                    ? 'border-yellow-300 shadow-yellow-100'
                    : 'border-gray-200 opacity-70'
                }`}
              >
                {/* 카드 상단 */}
                <div
                  className={`p-5 text-center relative ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-100'
                      : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }`}
                >
                  {/* 잠금/해제 아이콘 */}
                  <div className="absolute top-2 right-2 text-lg">
                    {isUnlocked ? '🔓' : '🔒'}
                  </div>

                  {/* 이모지 */}
                  <motion.div
                    animate={isUnlocked ? {
                      rotate: [0, -5, 5, 0],
                      scale: [1, 1.05, 1],
                    } : {}}
                    transition={{ repeat: Infinity, duration: 3, delay: i * 0.5 }}
                    className={`text-5xl mb-2 inline-block ${!isUnlocked ? 'grayscale opacity-40' : ''}`}
                  >
                    {reward.emoji}
                  </motion.div>

                  <p className={`text-xs font-bold ${isUnlocked ? 'text-orange-600' : 'text-gray-400'}`}>
                    {milestone}권 달성
                  </p>
                </div>

                {/* 카드 하단 */}
                <div className={`px-3 py-2.5 ${isUnlocked ? 'bg-white' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-bold truncate ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                    {reward.title}
                  </p>
                  {isUnlocked ? (
                    <p className="text-[10px] text-green-500 mt-0.5">✅ 획득 완료!</p>
                  ) : (
                    <div className="mt-1.5">
                      {/* 미니 진행바 */}
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full bg-gradient-to-r from-pink-300 to-purple-300 rounded-full"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {readCount}/{milestone}권 ({Math.round(progress)}%)
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 완전 잠금 메시지 */}
        {rewards.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 glass-card rounded-2xl border border-pink-100"
          >
            <p className="text-5xl mb-3">🔒</p>
            <p className="text-gray-500 font-medium text-sm">
              10권을 읽으면 첫 보상이 열려요!
            </p>
            <p className="text-gray-400 text-xs mt-1">
              현재 {readCount}권 / 10권 목표
            </p>
          </motion.div>
        )}
      </div>

      <Navbar />
    </div>
  );
}
