'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BOOK_STARS_PER_BOOK } from '@/lib/bookEconomy';
import { useBookStore } from '@/store/useBookStore';
import ConfettiEffect from './ConfettiEffect';

interface StampButtonProps {
  bookId: string;
  isRead: boolean;
  onMilestone?: (milestone: number) => void;
}

export default function StampButton({ bookId, isRead, onMilestone }: StampButtonProps) {
  const [showPraise, setShowPraise] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const stampBook = useBookStore((s) => s.stampBook);
  const unstampBook = useBookStore((s) => s.unstampBook);
  const lastPraiseMessage = useBookStore((s) => s.lastPraiseMessage);

  const handleStamp = useCallback(() => {
    if (isRead) return;

    const result = stampBook(bookId);
    setShowPraise(true);
    setConfettiTrigger(true);
    setShowUndo(true);

    setTimeout(() => setShowPraise(false), 2500);
    setTimeout(() => setConfettiTrigger(false), 100);

    if (result.isNewMilestone && result.milestone) {
      setTimeout(() => onMilestone?.(result.milestone!), 800);
    }

    if (undoTimer) clearTimeout(undoTimer);
    const timer = setTimeout(() => {
      setShowUndo(false);
    }, 5000);
    setUndoTimer(timer);
  }, [isRead, bookId, stampBook, onMilestone, undoTimer]);

  const handleUndo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (undoTimer) clearTimeout(undoTimer);
    unstampBook(bookId);
    setShowUndo(false);
    setShowPraise(false);
  }, [bookId, unstampBook, undoTimer]);

  return (
    <div className="relative flex flex-col items-center">
      <ConfettiEffect trigger={confettiTrigger} />

      {/* 도장 버튼 */}
      <motion.button
        whileTap={{ scale: isRead ? 1 : 0.85 }}
        whileHover={{ scale: isRead ? 1 : 1.1 }}
        onClick={handleStamp}
        disabled={isRead}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all duration-300 ${
          isRead
            ? 'bg-gradient-to-br from-pink-300 to-rose-400 shadow-pink-200 cursor-default'
            : 'bg-white border-3 border-dashed border-pink-300 hover:border-pink-400 hover:shadow-pink-200 cursor-pointer'
        }`}
      >
        <AnimatePresence mode="wait">
          {isRead ? (
            <motion.span
              key="stamped"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="text-3xl filter drop-shadow-sm"
            >
              ✅
            </motion.span>
          ) : (
            <motion.span
              key="empty"
              className="text-2xl opacity-50"
            >
              📖
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 칭찬 메시지 팝업 */}
      <AnimatePresence>
        {showPraise && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="absolute z-50 whitespace-nowrap bg-white rounded-2xl px-3 py-1.5 text-sm font-bold text-pink-600 shadow-lg shadow-pink-100 border border-pink-200"
          >
            <span className="block">{lastPraiseMessage}</span>
            <span className="block text-center text-xs text-amber-500">
              ★ +{BOOK_STARS_PER_BOOK}책별
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 실행 취소 버튼 */}
      <AnimatePresence>
        {showUndo && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleUndo}
            className="absolute -bottom-8 text-xs text-gray-400 underline hover:text-pink-500 transition-colors whitespace-nowrap z-50"
          >
            취소
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
