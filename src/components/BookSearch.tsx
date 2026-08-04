'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookStore } from '@/store/useBookStore';
import BookCategoryFields, { BookCategorySelection } from './BookCategoryFields';

interface BookSearchResult {
  title: string;
  author: string;
  image: string;
  isbn: string;
  description: string;
  publisher: string;
  pubdate: string;
  link: string;
}

interface BookSearchProps {
  onClose: () => void;
}

// 검색 API 제목에서 HTML 태그 제거
function cleanText(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

export default function BookSearch({ onClose }: BookSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [resultCategories, setResultCategories] = useState<Record<string, BookCategorySelection>>({});

  const addBook = useBookStore((s) => s.addBook);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '검색 중 오류가 발생했습니다.');
        return;
      }

      setResults(data.items || []);
      if ((data.items || []).length === 0) {
        setError('검색 결과가 없어요. 다른 제목으로 검색해 보세요!');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleAdd = useCallback((book: BookSearchResult, resultKey: string) => {
    const categories = resultCategories[resultKey] ?? { isProse: false, isEnglish: false };
    addBook({
      title: cleanText(book.title),
      author: cleanText(book.author),
      coverUrl: book.image || undefined,
      ...categories,
    });
    setAdded((prev) => new Set(prev).add(resultKey));
  }, [addBook, resultCategories]);

  // 수동 추가
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualCategories, setManualCategories] = useState<BookCategorySelection>({
    isProse: false,
    isEnglish: false,
  });

  const handleManualAdd = useCallback(() => {
    if (!manualTitle.trim()) return;
    addBook({
      title: manualTitle.trim(),
      author: manualAuthor.trim() || '작가 미상',
      ...manualCategories,
    });
    setManualTitle('');
    setManualAuthor('');
    setManualCategories({ isProse: false, isEnglish: false });
    onClose();
  }, [manualTitle, manualAuthor, manualCategories, addBook, onClose]);

  return (
    <div className="flex flex-col gap-4">
      {/* 검색 바 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="📚 책 제목을 검색해봐요!"
          className="flex-1 bg-pink-50 border-2 border-pink-200 rounded-2xl px-4 py-2.5 text-sm text-gray-700 placeholder-pink-300 focus:outline-none focus:border-pink-400 transition-colors"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={search}
          disabled={loading}
          className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-md disabled:opacity-50 flex-shrink-0"
        >
          {loading ? '⏳' : '🔍'}
        </motion.button>
      </div>

      {/* 에러 */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400 text-center bg-red-50 rounded-xl py-2 px-3"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-3xl"
          >
            📚
          </motion.div>
        </div>
      )}

      {/* 검색 결과 */}
      {results.length > 0 && (
        <div className="overflow-y-auto space-y-2 max-h-64">
          <p className="text-xs text-gray-400 text-center">
            📖 {results.length}개의 책을 찾았어요!
          </p>
          <AnimatePresence>
            {results.map((book, i) => {
              const resultKey = book.isbn || `${book.title}-${book.author}-${i}`;
              const categories = resultCategories[resultKey] ?? {
                isProse: false,
                isEnglish: false,
              };

              return (
              <motion.div
                key={resultKey}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="space-y-2 rounded-xl border border-pink-100 bg-white/70 p-2.5"
              >
                <div className="flex items-center gap-3">
                  {/* 표지 */}
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-pink-100 flex-shrink-0 flex items-center justify-center shadow-sm">
                    {book.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.image}
                        alt={cleanText(book.title)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">📖</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700 line-clamp-1">
                      {cleanText(book.title)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {cleanText(book.author)}
                    </p>
                    {book.publisher && (
                      <p className="text-[10px] text-gray-300 truncate">{book.publisher}</p>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAdd(book, resultKey)}
                    disabled={added.has(resultKey)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      added.has(resultKey)
                        ? 'bg-green-100 text-green-600 cursor-default'
                        : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                    }`}
                  >
                    {added.has(resultKey) ? '✓ 추가됨' : '+ 추가'}
                  </motion.button>
                </div>
                <BookCategoryFields
                  {...categories}
                  compact
                  onChange={(selection) =>
                    setResultCategories((current) => ({ ...current, [resultKey]: selection }))
                  }
                />
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 구분선 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-pink-100" />
        <span className="text-xs text-gray-400 font-medium">직접 입력하기</span>
        <div className="flex-1 h-px bg-pink-100" />
      </div>

      {/* 수동 입력 */}
      <div className="space-y-2">
        <input
          type="text"
          value={manualTitle}
          onChange={(e) => setManualTitle(e.target.value)}
          placeholder="📝 책 제목"
          className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-2xl px-4 py-2.5 text-sm text-gray-700 placeholder-yellow-400 focus:outline-none focus:border-yellow-400 transition-colors"
        />
        <input
          type="text"
          value={manualAuthor}
          onChange={(e) => setManualAuthor(e.target.value)}
          placeholder="✏️ 작가 이름 (선택)"
          className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-2xl px-4 py-2.5 text-sm text-gray-700 placeholder-yellow-400 focus:outline-none focus:border-yellow-400 transition-colors"
        />
        <BookCategoryFields {...manualCategories} onChange={setManualCategories} />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleManualAdd}
          disabled={!manualTitle.trim()}
          className="w-full bg-gradient-to-r from-yellow-300 to-orange-300 text-white font-bold py-2.5 rounded-2xl shadow-md disabled:opacity-50 text-sm"
        >
          📚 책 추가하기
        </motion.button>
      </div>
    </div>
  );
}
