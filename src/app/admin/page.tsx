'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookStore, Book } from '@/store/useBookStore';
import Navbar from '@/components/Navbar';
import BookSearch from '@/components/BookSearch';
import DataBackup from '@/components/DataBackup';
import BookEditModal from '@/components/BookEditModal';
import AdminAccessGate, { AdminAccessControls } from '@/components/AdminAccessGate';
import AdminSettingsPanel from '@/components/AdminSettingsPanel';

export default function AdminPage() {
  return (
    <AdminAccessGate>
      {(controls) => <AdminDashboard {...controls} />}
    </AdminAccessGate>
  );
}

function AdminDashboard({
  securityRecord,
  updateSecurityRecord,
  lockAdmin,
}: AdminAccessControls) {
  const [activeSection, setActiveSection] = useState<'books' | 'add' | 'settings'>('books');
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const books = useBookStore((state) => state.books);
  const removeBook = useBookStore((state) => state.removeBook);
  const stampBook = useBookStore((state) => state.stampBook);
  const unstampBook = useBookStore((state) => state.unstampBook);
  const updateBook = useBookStore((state) => state.updateBook);
  const getReadCount = useBookStore((state) => state.getReadCount);
  const readCount = getReadCount();

  return (
    <div className="min-h-screen pb-28">
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-400 via-purple-300 to-pink-300 px-5 pb-6 pt-12">
        <div className="absolute right-6 top-4 text-4xl opacity-20">⚙️</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-pen text-3xl text-white drop-shadow">관리자</h1>
            <p className="mt-1 text-sm text-purple-100">부모님 관리 페이지</p>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={lockAdmin}
            className="rounded-xl bg-white/20 px-3 py-1.5 text-sm text-white backdrop-blur-sm"
          >
            🔒 잠금
          </motion.button>
        </div>

        <div className="mt-4 flex gap-4">
          <div className="rounded-2xl bg-white/20 px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-2xl font-black text-white">{readCount}</p>
            <p className="text-xs text-purple-100">읽은 책</p>
          </div>
          <div className="rounded-2xl bg-white/20 px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-2xl font-black text-white">{books.length}</p>
            <p className="text-xs text-purple-100">전체 등록</p>
          </div>
          <div className="rounded-2xl bg-white/20 px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-2xl font-black text-white">{books.length - readCount}</p>
            <p className="text-xs text-purple-100">읽을 책</p>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <DataBackup />

        <div className="flex rounded-2xl bg-pink-100/60 p-1">
          {([
            ['books', '📚 도서 관리'],
            ['add', '➕ 책 추가'],
            ['settings', '⚙️ 설정'],
          ] as const).map(([section, label]) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors ${
                activeSection === section ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeSection === 'books' && (
          <div className="space-y-2">
            {books.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="mb-2 text-4xl">📭</p>
                <p className="text-sm">등록된 책이 없어요</p>
              </div>
            ) : (
              books.map((book) => (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card flex items-center gap-3 rounded-2xl border border-purple-100 p-3"
                >
                  <div className="flex h-12 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-purple-100 text-xl">
                    {book.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                      '📖'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold text-gray-700">{book.title}</p>
                    <p className="text-xs text-gray-400">{book.author}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        book.status === 'read'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {book.status === 'read' ? '✅ 읽음' : '📖 미읽음'}
                      </span>
                      {book.isProse && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          📖 줄글
                        </span>
                      )}
                      {book.isEnglish && (
                        <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                          🔤 영어
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 flex-col gap-1">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setEditingBook(book)}
                      className="rounded-lg bg-purple-100 px-2 py-1 text-xs font-bold text-purple-600 hover:bg-purple-200"
                    >
                      ✏️ 수정
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (book.status === 'read') unstampBook(book.id);
                        else stampBook(book.id);
                      }}
                      className={`rounded-lg px-2 py-1 text-xs font-bold ${
                        book.status === 'read'
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {book.status === 'read' ? '↩ 취소' : '✅ 찍기'}
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeBook(book.id)}
                      className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-200"
                    >
                      🗑 삭제
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeSection === 'add' && (
          <div className="glass-card rounded-2xl border border-purple-100 p-4">
            <BookSearch onClose={() => setActiveSection('books')} />
          </div>
        )}

        {activeSection === 'settings' && (
          <AdminSettingsPanel
            securityRecord={securityRecord}
            onSecurityRecordChange={updateSecurityRecord}
            onLock={lockAdmin}
          />
        )}
      </div>

      <BookEditModal
        book={editingBook}
        onClose={() => setEditingBook(null)}
        onSave={(updates) => {
          if (!editingBook) return;
          updateBook(editingBook.id, updates);
          setEditingBook(null);
        }}
      />
      <Navbar />
    </div>
  );
}
