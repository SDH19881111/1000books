'use client';

import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Book } from '@/store/useBookStore';
import BookCategoryFields, { BookCategorySelection } from './BookCategoryFields';

interface BookEditFormProps {
  book: Book;
  onSave: (updates: Pick<Book, 'title' | 'author' | 'isProse' | 'isEnglish'>) => void;
  onCancel: () => void;
}

export default function BookEditForm({ book, onSave, onCancel }: BookEditFormProps) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [categories, setCategories] = useState<BookCategorySelection>({
    isProse: book.isProse,
    isEnglish: book.isEnglish,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      author: author.trim() || '작가 미상',
      ...categories,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500" htmlFor={`book-title-${book.id}`}>
          책 제목
        </label>
        <input
          id={`book-title-${book.id}`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50 px-4 py-2.5 text-sm text-gray-700 focus:border-pink-300 focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500" htmlFor={`book-author-${book.id}`}>
          작가
        </label>
        <input
          id={`book-author-${book.id}`}
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          className="w-full rounded-2xl border-2 border-purple-100 bg-purple-50 px-4 py-2.5 text-sm text-gray-700 focus:border-purple-300 focus:outline-none"
        />
      </div>

      <BookCategoryFields {...categories} onChange={setCategories} />

      <p className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-400">
        완독 후 분류를 추가하면 해당 분류 누적에 한 번 반영됩니다. 분류를 다시 바꿔도 같은 책의 보상은 중복 지급되지 않아요.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl bg-gray-100 py-2.5 text-sm font-bold text-gray-500"
        >
          취소
        </button>
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          disabled={!title.trim()}
          className="rounded-2xl bg-gradient-to-r from-pink-400 to-purple-400 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50"
        >
          저장하기
        </motion.button>
      </div>
    </form>
  );
}
