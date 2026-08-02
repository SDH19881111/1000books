'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BOOK_STORAGE_KEY, Book, Reward } from '@/store/useBookStore';

interface BackupState {
  books: Book[];
  rewards: Reward[];
  lastPraiseMessage: string;
  pendingUndo: string | null;
}

interface BackupEnvelope {
  state: BackupState;
  version?: number;
}

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBook(value: unknown): value is Book {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.author === 'string' &&
    (value.coverUrl === undefined || typeof value.coverUrl === 'string') &&
    (value.status === 'unread' || value.status === 'read') &&
    (value.stampedAt === undefined || typeof value.stampedAt === 'string') &&
    typeof value.addedAt === 'string'
  );
}

function isReward(value: unknown): value is Reward {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.milestone === 'number' &&
    typeof value.imageUrl === 'string' &&
    typeof value.title === 'string' &&
    typeof value.unlockedAt === 'string'
  );
}

function isValidBackup(value: unknown): value is BackupEnvelope {
  if (!isRecord(value) || !isRecord(value.state)) return false;

  const { state } = value;
  return (
    Array.isArray(state.books) &&
    state.books.every(isBook) &&
    Array.isArray(state.rewards) &&
    state.rewards.every(isReward) &&
    typeof state.lastPraiseMessage === 'string' &&
    (state.pendingUndo === null || typeof state.pendingUndo === 'string') &&
    (value.version === undefined || typeof value.version === 'number')
  );
}

function getBackupFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `1000books-backup-${year}-${month}-${day}.json`;
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DataBackup() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState<'backup' | 'restore' | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleBackup = async () => {
    setWorking('backup');
    setFeedback(null);

    try {
      const storedData = localStorage.getItem(BOOK_STORAGE_KEY);
      if (!storedData) {
        throw new Error('백업할 독서 기록이 없습니다.');
      }

      const parsedData: unknown = JSON.parse(storedData);
      if (!isValidBackup(parsedData)) {
        throw new Error('저장된 데이터 형식을 확인할 수 없습니다.');
      }

      const file = new File(
        [JSON.stringify(parsedData, null, 2)],
        getBackupFilename(),
        { type: 'application/json' }
      );

      const canShareFile =
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

      if (canShareFile) {
        try {
          await navigator.share({
            files: [file],
            title: '1000books 백업',
            text: '독서 기록 백업 파일입니다.',
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          throw error;
        }
      } else {
        downloadFile(file);
      }

      setFeedback({
        type: 'success',
        message: '백업 파일이 준비되었습니다. 파일 앱이나 iCloud Drive에 보관해주세요.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : '백업 중 오류가 발생했습니다.',
      });
    } finally {
      setWorking(null);
    }
  };

  const handleRestoreFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setWorking('restore');
    setFeedback(null);

    try {
      const fileContents = await file.text();
      const parsedData: unknown = JSON.parse(fileContents);

      if (!isValidBackup(parsedData)) {
        throw new Error('1000books에서 만든 올바른 백업 파일이 아닙니다.');
      }

      const shouldRestore = window.confirm(
        `백업 파일의 책 ${parsedData.state.books.length}권으로 현재 데이터를 교체할까요?\n\n` +
        '아직 현재 데이터를 백업하지 않았다면 취소를 눌러주세요.'
      );

      if (!shouldRestore) return;

      localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify(parsedData));
      setFeedback({
        type: 'success',
        message: '복원이 완료되었습니다. 화면을 새로 불러옵니다.',
      });
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : '복원 중 오류가 발생했습니다.',
      });
    } finally {
      setWorking(null);
    }
  };

  return (
    <section className="glass-card rounded-2xl p-4 border border-blue-100 space-y-3">
      <div>
        <h2 className="text-sm font-black text-gray-700">💾 데이터 백업·복원</h2>
        <p className="text-xs text-gray-400 mt-1">
          독서 기록을 파일 앱이나 iCloud Drive에 안전하게 보관할 수 있어요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleBackup}
          disabled={working !== null}
          className="rounded-xl bg-blue-100 text-blue-700 py-2.5 px-3 text-sm font-bold disabled:opacity-50"
        >
          {working === 'backup' ? '준비 중…' : '⬇️ 백업 파일 저장'}
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={working !== null}
          className="rounded-xl bg-purple-100 text-purple-700 py-2.5 px-3 text-sm font-bold disabled:opacity-50"
        >
          {working === 'restore' ? '확인 중…' : '⬆️ 백업 파일 복원'}
        </motion.button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleRestoreFile}
        className="hidden"
      />

      <p className="text-[11px] leading-relaxed text-gray-400">
        백업은 현재 데이터를 변경하지 않습니다. 복원은 파일 확인과 동의 후에만 현재 데이터를 교체합니다.
      </p>

      {feedback && (
        <p
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl px-3 py-2 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {feedback.message}
        </p>
      )}
    </section>
  );
}
