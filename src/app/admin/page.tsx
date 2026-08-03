'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookStore, Book } from '@/store/useBookStore';
import Navbar from '@/components/Navbar';
import BookSearch from '@/components/BookSearch';
import DataBackup from '@/components/DataBackup';

const ADMIN_PIN = '1234';

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [activeSection, setActiveSection] = useState<'books' | 'add'>('books');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showAddSearch, setShowAddSearch] = useState(false);

  const books = useBookStore((s) => s.books);
  const removeBook = useBookStore((s) => s.removeBook);
  const stampBook = useBookStore((s) => s.stampBook);
  const unstampBook = useBookStore((s) => s.unstampBook);
  const updateBook = useBookStore((s) => s.updateBook);
  const getReadCount = useBookStore((s) => s.getReadCount);

  const readCount = getReadCount();

  const handlePinSubmit = () => {
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
      setTimeout(() => setPinError(false), 2000);
    }
  };

  // PIN 입력 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pb-28 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-6xl mb-4"
            >
              👩‍💼
            </motion.div>
            <h1 className="font-pen text-3xl text-pink-600 mb-1">관리자 페이지</h1>
            <p className="text-gray-400 text-sm">부모님 전용 페이지입니다</p>
          </div>

          {/* PIN 입력 */}
          <div className={`glass-card rounded-3xl p-6 border-2 transition-all duration-300 ${
            pinError ? 'border-red-300 bg-red-50/50' : 'border-pink-200'
          }`}>
            <p className="text-sm font-bold text-gray-600 text-center mb-4">
              🔐 PIN 번호를 입력해주세요
            </p>

            {/* PIN 표시 */}
            <div className="flex justify-center gap-3 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={pinError ? { x: [-5, 5, -5, 5, 0] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                    pin.length > i
                      ? 'bg-pink-400 border-pink-500 text-white'
                      : 'bg-pink-50 border-pink-200 text-transparent'
                  }`}
                >
                  {pin.length > i ? '●' : '○'}
                </motion.div>
              ))}
            </div>

            {/* 에러 메시지 */}
            <AnimatePresence>
              {pinError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 text-sm text-center mb-3"
                >
                  ❌ PIN이 틀렸어요!
                </motion.p>
              )}
            </AnimatePresence>

            {/* 숫자 키패드 */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <motion.button
                  key={n}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (pin.length < 4) {
                      const newPin = pin + n;
                      setPin(newPin);
                      if (newPin.length === 4) {
                        setTimeout(() => {
                          if (newPin === ADMIN_PIN) {
                            setIsAuthenticated(true);
                          } else {
                            setPinError(true);
                            setPin('');
                            setTimeout(() => setPinError(false), 2000);
                          }
                        }, 200);
                      }
                    }
                  }}
                  className="h-14 bg-white border-2 border-pink-100 rounded-2xl text-xl font-bold text-gray-700 hover:bg-pink-50 hover:border-pink-300 transition-colors shadow-sm"
                >
                  {n}
                </motion.button>
              ))}
              <div />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (pin.length < 4) {
                    const newPin = pin + '0';
                    setPin(newPin);
                    if (newPin.length === 4) {
                      setTimeout(() => {
                        if (newPin === ADMIN_PIN) {
                          setIsAuthenticated(true);
                        } else {
                          setPinError(true);
                          setPin('');
                          setTimeout(() => setPinError(false), 2000);
                        }
                      }, 200);
                    }
                  }
                }}
                className="h-14 bg-white border-2 border-pink-100 rounded-2xl text-xl font-bold text-gray-700 hover:bg-pink-50 hover:border-pink-300 transition-colors shadow-sm"
              >
                0
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setPin((p) => p.slice(0, -1))}
                className="h-14 bg-red-50 border-2 border-red-100 rounded-2xl text-xl font-bold text-red-400 hover:bg-red-100 transition-colors shadow-sm"
              >
                ⌫
              </motion.button>
            </div>

            <p className="text-center text-xs text-gray-300 mt-4">기본 PIN: 1234</p>
          </div>
        </motion.div>

        <Navbar />
      </div>
    );
  }

  // 관리자 대시보드
  return (
    <div className="min-h-screen pb-28">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-indigo-400 via-purple-300 to-pink-300 pt-12 pb-6 px-5 relative overflow-hidden">
        <div className="absolute top-4 right-6 text-4xl opacity-20">⚙️</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-pen text-3xl text-white drop-shadow">관리자</h1>
            <p className="text-purple-100 text-sm mt-1">부모님 관리 페이지</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAuthenticated(false)}
            className="bg-white/20 text-white text-sm px-3 py-1.5 rounded-xl backdrop-blur-sm"
          >
            🔒 잠금
          </motion.button>
        </div>

        {/* 요약 통계 */}
        <div className="flex gap-4 mt-4">
          <div className="bg-white/20 rounded-2xl px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-white font-black text-2xl">{readCount}</p>
            <p className="text-purple-100 text-xs">읽은 책</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-white font-black text-2xl">{books.length}</p>
            <p className="text-purple-100 text-xs">전체 등록</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-white font-black text-2xl">{books.length - readCount}</p>
            <p className="text-purple-100 text-xs">읽을 책</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <DataBackup />

        {/* 섹션 탭 */}
        <div className="flex bg-pink-100/60 rounded-2xl p-1">
          {(['books', 'add'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                activeSection === s ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'
              }`}
            >
              {s === 'books' ? '📚 도서 관리' : '➕ 책 추가'}
            </button>
          ))}
        </div>

        {/* 도서 목록 관리 */}
        {activeSection === 'books' && (
          <div className="space-y-2">
            {books.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-sm">등록된 책이 없어요</p>
              </div>
            ) : (
              books.map((book) => (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="glass-card rounded-2xl p-3 flex items-center gap-3 border border-purple-100"
                >
                  {/* 책 정보 */}
                  <div className="w-10 h-12 rounded-xl overflow-hidden bg-purple-100 flex items-center justify-center flex-shrink-0 text-xl">
                    {book.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      '📖'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700 line-clamp-1">{book.title}</p>
                    <p className="text-xs text-gray-400">{book.author}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      book.status === 'read'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {book.status === 'read' ? '✅ 읽음' : '📖 미읽음'}
                    </span>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {/* 도장 토글 */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (book.status === 'read') unstampBook(book.id);
                        else stampBook(book.id);
                      }}
                      className={`text-xs px-2 py-1 rounded-lg font-bold ${
                        book.status === 'read'
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {book.status === 'read' ? '↩ 취소' : '✅ 찍기'}
                    </motion.button>

                    {/* 삭제 */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeBook(book.id)}
                      className="text-xs px-2 py-1 rounded-lg font-bold bg-red-100 text-red-500 hover:bg-red-200"
                    >
                      🗑 삭제
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* 책 추가 */}
        {activeSection === 'add' && (
          <div className="glass-card rounded-2xl p-4 border border-purple-100">
            <BookSearch onClose={() => setActiveSection('books')} />
          </div>
        )}

      </div>

      <Navbar />
    </div>
  );
}
