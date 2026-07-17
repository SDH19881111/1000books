'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookStore } from '@/store/useBookStore';
import Navbar from '@/components/Navbar';
import BookCard from '@/components/BookCard';
import BookSearch from '@/components/BookSearch';
import MilestoneModal from '@/components/MilestoneModal';

type Tab = 'unread' | 'read';

export default function BooksPage() {
  const [tab, setTab] = useState<Tab>('unread');
  const [showSearch, setShowSearch] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);

  const books = useBookStore((s) => s.books);
  const removeBook = useBookStore((s) => s.removeBook);

  const unreadBooks = books.filter((b) => b.status === 'unread');
  const readBooks = books.filter((b) => b.status === 'read');
  const displayBooks = tab === 'unread' ? unreadBooks : readBooks;

  return (
    <div className="min-h-screen pb-28">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-purple-300 via-pink-200 to-pink-300 pt-12 pb-6 px-5 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-4xl opacity-20 rotate-12">📚</div>
        <div className="absolute bottom-2 left-4 text-2xl opacity-20 -rotate-6">📖</div>
        <h1 className="font-pen text-3xl text-white drop-shadow">내 책장</h1>
        <p className="text-purple-100 text-sm mt-1">
          읽을 책 {unreadBooks.length}권 · 읽은 책 {readBooks.length}권
        </p>
      </div>

      {/* 탭 + 추가 버튼 */}
      <div className="px-4 py-4 flex items-center gap-3">
        <div className="flex-1 flex bg-pink-100/60 rounded-2xl p-1">
          {(['unread', 'read'] as Tab[]).map((t) => (
            <motion.button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                tab === t
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              {t === 'unread' ? `📖 읽을 책 ${unreadBooks.length}` : `✅ 읽은 책 ${readBooks.length}`}
            </motion.button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSearch(true)}
          className="bg-gradient-to-br from-pink-400 to-purple-400 text-white w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-lg flex-shrink-0"
        >
          +
        </motion.button>
      </div>

      {/* 책 목록 */}
      <div className="px-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {displayBooks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-6xl mb-4">{tab === 'unread' ? '📚' : '📖'}</p>
              <p className="text-gray-400 font-medium">
                {tab === 'unread'
                  ? '읽을 책을 추가해봐요!'
                  : '아직 읽은 책이 없어요.\n도장을 찍어봐요!'}
              </p>
              {tab === 'unread' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSearch(true)}
                  className="mt-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md"
                >
                  📚 책 추가하기
                </motion.button>
              )}
            </motion.div>
          ) : (
            displayBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onMilestone={(m) => setActiveMilestone(m)}
                onRemove={removeBook}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 책 검색 모달 */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 shadow-2xl flex flex-col"
              style={{ maxHeight: 'calc(90vh - 72px)' }}
            >
              {/* 핸들 + 헤더 (고정) */}
              <div className="px-5 pt-4 pb-3 flex-shrink-0">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-800 text-lg">📚 책 추가하기</h2>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {/* 스크롤 가능한 콘텐츠 영역 */}
              <div className="overflow-y-auto flex-1 px-5 pb-6">
                <BookSearch onClose={() => setShowSearch(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MilestoneModal
        milestone={activeMilestone}
        onClose={() => setActiveMilestone(null)}
      />
      <Navbar />
    </div>
  );
}
