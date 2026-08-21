'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BOOK_STORAGE_KEY, Book, Reward } from '@/store/useBookStore';
import {
  GAME_STORAGE_KEY,
  BookRewardRecord,
  CurrencyAdjustment,
  ItemTransform,
} from '@/store/useGameStore';
import { RewardSettings } from '@/lib/rewardSettings';

interface BackupBook extends Omit<Book, 'isProse' | 'isEnglish'> {
  isProse?: boolean;
  isEnglish?: boolean;
}

interface BackupState {
  books: BackupBook[];
  rewards: Reward[];
  lastPraiseMessage: string;
  pendingUndo: string | null;
}

interface BackupEnvelope {
  state: BackupState;
  version?: number;
}

interface GameBackupState {
  bookStars: number;
  bookStarDebt?: number;
  hearts: number;
  bookRewardLedger: Record<string, BookRewardRecord>;
  claimedHeartMilestones: string[];
  claimedBookStarMilestones?: number[];
  claimedBookStarRewards?: Record<number, number>;
  rabbitAdopted: boolean;
  ownedItemIds: string[];
  equippedBearItems: string[];
  equippedRabbitItems: string[];
  itemTransforms: Record<string, ItemTransform>;
  rewardSettings?: RewardSettings;
  currencyAdjustments?: CurrencyAdjustment[];
}

interface GameBackupEnvelope {
  state: GameBackupState;
  version?: number;
}

interface CombinedBackup {
  format: '1000books-combined-backup';
  createdAt: string;
  bookStorage: BackupEnvelope;
  gameStorage?: GameBackupEnvelope;
}

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBook(value: unknown): value is BackupBook {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.author === 'string' &&
    (value.coverUrl === undefined || typeof value.coverUrl === 'string') &&
    (value.isProse === undefined || typeof value.isProse === 'boolean') &&
    (value.isEnglish === undefined || typeof value.isEnglish === 'boolean') &&
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number');
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

function isBookRewardRecord(value: unknown): value is BookRewardRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.bookRewardedAt === 'string' &&
    (value.bookStarActive === undefined || typeof value.bookStarActive === 'boolean') &&
    (value.bookStarsGranted === undefined || typeof value.bookStarsGranted === 'number') &&
    (value.bookStarRevokedAt === undefined || typeof value.bookStarRevokedAt === 'string') &&
    (value.proseCreditedAt === undefined || typeof value.proseCreditedAt === 'string') &&
    (value.proseHeartsGranted === undefined || typeof value.proseHeartsGranted === 'number') &&
    (value.englishCreditedAt === undefined || typeof value.englishCreditedAt === 'string') &&
    (value.englishHeartsGranted === undefined || typeof value.englishHeartsGranted === 'number') &&
    (value.discoveryRolledAt === undefined || typeof value.discoveryRolledAt === 'string') &&
    (value.discoveredItemId === undefined || typeof value.discoveredItemId === 'string')
  );
}

function isItemTransform(value: unknown): value is ItemTransform {
  if (!isRecord(value)) return false;
  return (
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.scale === 'number'
  );
}

function isRecordOf<T>(
  value: unknown,
  validator: (entry: unknown) => entry is T
): value is Record<string, T> {
  return isRecord(value) && Object.values(value).every(validator);
}

function isRewardSettings(value: unknown): value is RewardSettings {
  if (!isRecord(value) || !isRecord(value.milestoneBookStars)) return false;
  return (
    typeof value.bookStarsPerBook === 'number' &&
    typeof value.proseBooksPerHeart === 'number' &&
    typeof value.proseHeartsPerReward === 'number' &&
    typeof value.englishBooksPerHeart === 'number' &&
    typeof value.englishHeartsPerReward === 'number' &&
    Object.values(value.milestoneBookStars).every((reward) => typeof reward === 'number')
  );
}

function isCurrencyAdjustment(value: unknown): value is CurrencyAdjustment {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    (value.currency === 'bookStars' || value.currency === 'hearts') &&
    typeof value.amount === 'number' &&
    typeof value.reason === 'string' &&
    typeof value.balanceAfter === 'number' &&
    typeof value.createdAt === 'string'
  );
}

function isValidGameBackup(value: unknown): value is GameBackupEnvelope {
  if (!isRecord(value) || !isRecord(value.state)) return false;
  const { state } = value;

  return (
    typeof state.bookStars === 'number' &&
    (state.bookStarDebt === undefined || typeof state.bookStarDebt === 'number') &&
    typeof state.hearts === 'number' &&
    isRecordOf(state.bookRewardLedger, isBookRewardRecord) &&
    isStringArray(state.claimedHeartMilestones) &&
    (state.claimedBookStarMilestones === undefined || isNumberArray(state.claimedBookStarMilestones)) &&
    (state.claimedBookStarRewards === undefined || (
      isRecord(state.claimedBookStarRewards) &&
      Object.values(state.claimedBookStarRewards).every((reward) => typeof reward === 'number')
    )) &&
    typeof state.rabbitAdopted === 'boolean' &&
    isStringArray(state.ownedItemIds) &&
    isStringArray(state.equippedBearItems) &&
    isStringArray(state.equippedRabbitItems) &&
    isRecordOf(state.itemTransforms, isItemTransform) &&
    (state.rewardSettings === undefined || isRewardSettings(state.rewardSettings)) &&
    (state.currencyAdjustments === undefined || (
      Array.isArray(state.currencyAdjustments) &&
      state.currencyAdjustments.every(isCurrencyAdjustment)
    )) &&
    (value.version === undefined || typeof value.version === 'number')
  );
}

function isCombinedBackup(value: unknown): value is CombinedBackup {
  if (!isRecord(value)) return false;
  return (
    value.format === '1000books-combined-backup' &&
    typeof value.createdAt === 'string' &&
    isValidBackup(value.bookStorage) &&
    (value.gameStorage === undefined || isValidGameBackup(value.gameStorage))
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

      const storedGameData = localStorage.getItem(GAME_STORAGE_KEY);
      let gameStorage: GameBackupEnvelope | undefined;
      if (storedGameData) {
        const parsedGameData: unknown = JSON.parse(storedGameData);
        if (!isValidGameBackup(parsedGameData)) {
          throw new Error('저장된 게임 보상 데이터 형식을 확인할 수 없습니다.');
        }
        gameStorage = parsedGameData;
      }

      const backupDocument: CombinedBackup = {
        format: '1000books-combined-backup',
        createdAt: new Date().toISOString(),
        bookStorage: parsedData,
        gameStorage,
      };

      const file = new File(
        [JSON.stringify(backupDocument, null, 2)],
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
      const combinedBackup = isCombinedBackup(parsedData) ? parsedData : null;
      const legacyBackup = !combinedBackup && isValidBackup(parsedData) ? parsedData : null;

      if (!combinedBackup && !legacyBackup) {
        throw new Error('1000books에서 만든 올바른 백업 파일이 아닙니다.');
      }

      const bookBackup = combinedBackup?.bookStorage ?? legacyBackup!;

      const shouldRestore = window.confirm(
        `백업 파일의 책 ${bookBackup.state.books.length}권으로 현재 데이터를 교체할까요?\n\n` +
        '아직 현재 데이터를 백업하지 않았다면 취소를 눌러주세요.'
      );

      if (!shouldRestore) return;

      localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify(bookBackup));
      if (combinedBackup?.gameStorage) {
        localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(combinedBackup.gameStorage));
      } else {
        localStorage.removeItem(GAME_STORAGE_KEY);
      }
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
          독서 기록과 게임 보상을 파일 앱이나 iCloud Drive에 안전하게 보관할 수 있어요.
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
        예전 백업 파일도 복원할 수 있습니다. 백업은 현재 데이터를 변경하지 않으며, 복원은 파일 확인과 동의 후에만 진행됩니다.
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
