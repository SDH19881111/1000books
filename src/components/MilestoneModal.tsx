'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { getConfiguredMilestoneBookStars } from '@/lib/rewardSettings';
import { MILESTONE_REWARDS } from '@/store/useBookStore';
import { useGameStore } from '@/store/useGameStore';
import ConfettiEffect from './ConfettiEffect';

interface MilestoneModalProps {
  milestone: number | null;
  onClose: () => void;
}

export default function MilestoneModal({ milestone, onClose }: MilestoneModalProps) {
  const isOpen = milestone !== null;
  const reward = milestone ? MILESTONE_REWARDS[milestone] : null;
  const rewardSettings = useGameStore((state) => state.rewardSettings);
  const bookStarReward = milestone
    ? getConfiguredMilestoneBookStars(rewardSettings, milestone)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && reward && (
        <>
          <ConfettiEffect trigger={isOpen} />
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-6"
          >
            <div className="pointer-events-auto bg-white rounded-3xl p-8 shadow-2xl shadow-pink-200/50 max-w-sm w-full text-center border-2 border-pink-200">
              {/* 상단 배지 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className="inline-flex items-center gap-1 bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-4"
              >
                🎉 마일스톤 달성!
              </motion.div>

              {/* 이모지 */}
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-8xl mb-4 inline-block"
              >
                {reward.emoji}
              </motion.div>

              {/* 타이틀 */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-pen text-4xl text-pink-600 mb-2"
              >
                {reward.title} 달성!
              </motion.h2>

              {/* 권수 배지 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white text-2xl font-black px-6 py-2 rounded-full mb-4 shadow-lg"
              >
                📚 {milestone}권 완독!
              </motion.div>

              {/* 설명 */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-gray-600 text-sm mb-6"
              >
                {reward.description}
              </motion.p>

              <div className="mb-5 rounded-2xl bg-yellow-50 px-4 py-3 text-sm font-black text-amber-600">
                ★ 마일스톤 보너스 +{bookStarReward}책별
              </div>

              {/* 별 장식 */}
              <div className="flex justify-center gap-2 mb-6">
                {['⭐', '🌟', '✨', '🌟', '⭐'].map((star, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="text-xl"
                  >
                    {star}
                  </motion.span>
                ))}
              </div>

              {/* 닫기 버튼 */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-lg"
              >
                야호! 계속 읽을게요! 📖
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
