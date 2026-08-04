'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Book } from '@/store/useBookStore';
import StampButton from './StampButton';

interface BookCardProps {
  book: Book;
  onMilestone?: (milestone: number) => void;
  onRemove?: (id: string) => void;
  onEdit?: (book: Book) => void;
}

const DEFAULT_COVERS = ['📗', '📘', '📙', '📕', '📒', '📓'];

export default function BookCard({ book, onMilestone, onRemove, onEdit }: BookCardProps) {
  const coverEmoji = DEFAULT_COVERS[Math.abs(book.id.charCodeAt(5) || 0) % DEFAULT_COVERS.length];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`glass-card rounded-2xl p-3 flex items-center gap-3 shadow-sm transition-all duration-300 ${
        book.status === 'read'
          ? 'border border-pink-200 bg-pink-50/80'
          : 'border border-white/80'
      }`}
    >
      {/* 책 표지 */}
      <div className="relative flex-shrink-0">
        <div className={`w-16 h-20 rounded-xl overflow-hidden flex items-center justify-center shadow-md ${
          book.status === 'read' ? 'ring-2 ring-pink-300' : ''
        }`}>
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              width={64}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-3xl">
              {coverEmoji}
            </div>
          )}
        </div>
        {book.status === 'read' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-pink-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
          >
            ✓
          </motion.div>
        )}
      </div>

      {/* 책 정보 */}
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-bold leading-tight line-clamp-2 ${
          book.status === 'read' ? 'text-gray-500 line-through decoration-pink-300' : 'text-gray-800'
        }`}>
          {book.title}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{book.author || '작가 미상'}</p>
        {(book.isProse || book.isEnglish) && (
          <div className="mt-1 flex flex-wrap gap-1">
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
        )}
        {book.stampedAt && (
          <p className="text-[10px] text-pink-400 mt-1">
            ✅ {new Date(book.stampedAt).toLocaleDateString('ko-KR')} 완독
          </p>
        )}
      </div>

      {/* 도장 버튼 영역 */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <StampButton
          bookId={book.id}
          isRead={book.status === 'read'}
          onMilestone={onMilestone}
        />
        {onRemove && (
          <button
            onClick={() => onRemove(book.id)}
            className="text-[10px] text-gray-300 hover:text-red-400 transition-colors"
          >
            삭제
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(book)}
            className="text-[10px] text-purple-400 transition-colors hover:text-purple-600"
          >
            수정
          </button>
        )}
      </div>
    </motion.div>
  );
}
