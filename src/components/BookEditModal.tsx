'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Book } from '@/store/useBookStore';
import BookEditForm from './BookEditForm';

interface BookEditModalProps {
  book: Book | null;
  onSave: (updates: Pick<Book, 'title' | 'author' | 'isProse' | 'isEnglish'>) => void;
  onClose: () => void;
}

export default function BookEditModal({ book, onSave, onClose }: BookEditModalProps) {
  return (
    <AnimatePresence>
      {book && (
        <>
          <motion.button
            type="button"
            aria-label="책 수정 닫기"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-edit-title"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-[72px] left-1/2 z-[70] w-full max-w-md -translate-x-1/2 rounded-t-3xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="book-edit-title" className="text-lg font-black text-gray-800">
                ✏️ 책 정보 수정
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400"
              >
                ✕
              </button>
            </div>
            <BookEditForm key={book.id} book={book} onSave={onSave} onCancel={onClose} />
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
