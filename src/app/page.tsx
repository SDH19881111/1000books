'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookStore } from '@/store/useBookStore';
import Navbar from '@/components/Navbar';
import ProgressBar from '@/components/ProgressBar';
import StampMap from '@/components/StampMap';
import MilestoneModal from '@/components/MilestoneModal';

const TIPS = [
  '📖 오늘도 책 한 권 어때요?',
  '🌟 독서는 상상력을 키워줘요!',
  '✨ 매일 조금씩, 천권의 꿈으로!',
  '🦋 책 속에 나비가 날아다녀요!',
  '🏰 책은 마음속 성을 만들어요!',
];

export default function HomePage() {
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);
  const books = useBookStore((s) => s.books);
  const getReadCount = useBookStore((s) => s.getReadCount);
  const getNextMilestone = useBookStore((s) => s.getNextMilestone);

  const readCount = getReadCount();
  const nextMilestone = getNextMilestone();
  const totalBooks = books.length;
  const tip = TIPS[readCount % TIPS.length];

  return (
    <div className="min-h-screen pb-28">
      {/* 헤더 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pink-300 via-pink-200 to-purple-200 pt-12 pb-8 px-5">
        {/* 배경 장식 */}
        <div className="absolute top-3 right-5 text-5xl opacity-20 rotate-12">📚</div>
        <div className="absolute bottom-3 left-3 text-3xl opacity-20 -rotate-12">⭐</div>
        <div className="absolute top-8 left-1/2 text-2xl opacity-20">🌸</div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-pink-100 text-sm font-medium mb-1">안녕하세요! 🌸</p>
          <h1 className="font-pen text-4xl text-white drop-shadow mb-1">
            천권 읽기 프로젝트
          </h1>
          <p className="text-pink-100 text-xs">{tip}</p>
        </motion.div>

        {/* 읽은 책 수 큰 표시 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="mt-5 flex items-end gap-1"
        >
          <motion.span
            key={readCount}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-black text-white drop-shadow"
            style={{ fontSize: '4rem', lineHeight: 1 }}
          >
            {readCount}
          </motion.span>
          <span className="text-pink-100 text-lg mb-2">/ 1000권</span>
        </motion.div>
      </div>

      {/* 컨텐츠 */}
      <div className="px-4 -mt-4 space-y-4">
        {/* 메인 카드들 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ProgressBar readCount={readCount} nextMilestone={nextMilestone} />
        </motion.div>

        {/* 통계 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: '읽은 책', value: readCount, emoji: '✅', color: 'from-pink-100 to-rose-100 border-pink-200' },
            { label: '등록된 책', value: totalBooks, emoji: '📚', color: 'from-purple-100 to-indigo-100 border-purple-200' },
            { label: '읽을 책', value: totalBooks - readCount, emoji: '📖', color: 'from-yellow-100 to-orange-100 border-yellow-200' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`glass-card bg-gradient-to-br ${stat.color} border rounded-2xl p-3 text-center`}
            >
              <p className="text-2xl mb-1">{stat.emoji}</p>
              <motion.p
                key={stat.value}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="text-2xl font-black text-gray-700"
              >
                {stat.value}
              </motion.p>
              <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* 스탬프 지도 미니 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StampMap readCount={readCount} totalCells={100} />
        </motion.div>

        {/* 빠른 액션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          <a href="/books">
            <motion.div
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="glass-card bg-gradient-to-br from-pink-200 to-rose-200 border border-pink-300 rounded-2xl p-4 text-center shadow-sm cursor-pointer"
            >
              <p className="text-3xl mb-2">📖</p>
              <p className="text-sm font-bold text-pink-700">책 읽기 기록</p>
              <p className="text-xs text-pink-500 mt-0.5">도장 찍으러 가기</p>
            </motion.div>
          </a>
          <a href="/rewards">
            <motion.div
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="glass-card bg-gradient-to-br from-purple-200 to-indigo-200 border border-purple-300 rounded-2xl p-4 text-center shadow-sm cursor-pointer"
            >
              <p className="text-3xl mb-2">🎁</p>
              <p className="text-sm font-bold text-purple-700">보상 갤러리</p>
              <p className="text-xs text-purple-500 mt-0.5">내 보상 보기</p>
            </motion.div>
          </a>
        </motion.div>

        {/* 다음 목표 알림 */}
        {nextMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-2xl p-4 flex items-center gap-3"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-3xl"
            >
              🔔
            </motion.span>
            <div>
              <p className="text-sm font-bold text-orange-700">다음 목표</p>
              <p className="text-xs text-orange-600">
                {nextMilestone}권 달성하면 특별한 보상이 기다려요!
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* 마일스톤 모달 */}
      <MilestoneModal
        milestone={activeMilestone}
        onClose={() => setActiveMilestone(null)}
      />

      <Navbar />
    </div>
  );
}
