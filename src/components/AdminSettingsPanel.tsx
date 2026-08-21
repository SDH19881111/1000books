'use client';

import { useEffect, useState } from 'react';
import { BOOK_STAR_MILESTONES } from '@/lib/bookEconomy';
import {
  DEFAULT_REWARD_SETTINGS,
  RewardSettings,
  normalizeRewardSettings,
} from '@/lib/rewardSettings';
import {
  ADMIN_PIN_LENGTH,
  AdminSecurityRecord,
  clearAdminPinFailures,
  createAdminSecurityRecord,
  getAdminLockSeconds,
  isValidAdminPin,
  recordAdminPinFailure,
  verifyAdminPin,
} from '@/lib/adminSecurity';
import { GameCurrency, useGameStore } from '@/store/useGameStore';

interface AdminSettingsPanelProps {
  securityRecord: AdminSecurityRecord;
  onSecurityRecordChange: (record: AdminSecurityRecord) => void;
  onLock: () => void;
}

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  suffix: string;
  onChange: (value: number) => void;
}

function NumberField({ label, value, min = 0, max = 100_000, suffix, onChange }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-gray-600">{label}</span>
      <div className="flex items-center rounded-xl border border-purple-100 bg-white px-3">
        <input
          type="number"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm font-black text-gray-700 outline-none"
        />
        <span className="text-xs font-bold text-gray-400">{suffix}</span>
      </div>
    </label>
  );
}

export default function AdminSettingsPanel({
  securityRecord,
  onSecurityRecordChange,
  onLock,
}: AdminSettingsPanelProps) {
  const rewardSettings = useGameStore((state) => state.rewardSettings);
  const updateRewardSettings = useGameStore((state) => state.updateRewardSettings);
  const resetRewardSettings = useGameStore((state) => state.resetRewardSettings);
  const bookStars = useGameStore((state) => state.bookStars);
  const bookStarDebt = useGameStore((state) => state.bookStarDebt);
  const hearts = useGameStore((state) => state.hearts);
  const adjustCurrency = useGameStore((state) => state.adjustCurrency);
  const currencyAdjustments = useGameStore((state) => state.currencyAdjustments);

  const [draft, setDraft] = useState<RewardSettings>(() => normalizeRewardSettings(rewardSettings));
  const [settingsFeedback, setSettingsFeedback] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [currency, setCurrency] = useState<GameCurrency>('bookStars');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentPin, setAdjustmentPin] = useState('');
  const [adjustmentFeedback, setAdjustmentFeedback] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [securityFeedback, setSecurityFeedback] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setDraft(normalizeRewardSettings(rewardSettings));
  }, [rewardSettings]);

  const updateDraft = <Key extends keyof RewardSettings>(
    key: Key,
    value: RewardSettings[Key]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSettingsFeedback('');
  };

  const verifySensitiveAction = async (pin: string) => {
    if (getAdminLockSeconds(securityRecord) > 0) {
      setAdjustmentFeedback('PIN 입력이 잠겨 있어요. 관리자 화면을 다시 열어주세요.');
      onLock();
      return false;
    }

    const verified = await verifyAdminPin(pin, securityRecord);
    if (verified) {
      if (securityRecord.failedAttempts > 0 || securityRecord.lockedUntil) {
        onSecurityRecordChange(clearAdminPinFailures(securityRecord));
      }
      return true;
    }

    const failedRecord = recordAdminPinFailure(securityRecord);
    onSecurityRecordChange(failedRecord);
    if (getAdminLockSeconds(failedRecord) > 0) onLock();
    return false;
  };

  const handleSaveSettings = () => {
    const normalized = normalizeRewardSettings(draft);
    updateRewardSettings(normalized);
    setDraft(normalized);
    setSettingsFeedback('저장했습니다. 다음 신규 보상부터 바로 적용됩니다.');
  };

  const handleResetSettings = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setSettingsFeedback('한 번 더 누르면 기본 지급 기준으로 복원됩니다.');
      return;
    }
    resetRewardSettings();
    setDraft(normalizeRewardSettings(DEFAULT_REWARD_SETTINGS));
    setConfirmReset(false);
    setSettingsFeedback('기본 지급 기준으로 복원했습니다.');
  };

  const handleAdjustment = async (direction: 1 | -1) => {
    setAdjustmentFeedback('');
    const amount = Number(adjustmentAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setAdjustmentFeedback('1 이상의 정수 금액을 입력해주세요.');
      return;
    }
    if (!adjustmentReason.trim()) {
      setAdjustmentFeedback('조정 사유를 입력해주세요.');
      return;
    }
    if (!isValidAdminPin(adjustmentPin)) {
      setAdjustmentFeedback(`${ADMIN_PIN_LENGTH}자리 관리자 PIN을 입력해주세요.`);
      return;
    }

    setWorking(true);
    try {
      if (!await verifySensitiveAction(adjustmentPin)) {
        setAdjustmentFeedback('관리자 PIN이 맞지 않습니다.');
        setAdjustmentPin('');
        return;
      }

      const result = adjustCurrency(currency, amount * direction, adjustmentReason);
      if (result === 'insufficient-balance') {
        setAdjustmentFeedback('현재 잔액보다 많이 차감할 수 없습니다.');
        return;
      }
      if (result !== 'adjusted') {
        setAdjustmentFeedback('금액과 사유를 다시 확인해주세요.');
        return;
      }

      setAdjustmentFeedback(
        `${currency === 'bookStars' ? '책별' : '하트'} ${amount}${currency === 'bookStars' ? '개' : '개'}를 ${direction > 0 ? '추가' : '차감'}했습니다.`
      );
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setAdjustmentPin('');
    } finally {
      setWorking(false);
    }
  };

  const handlePinChange = async () => {
    setSecurityFeedback('');
    if (!isValidAdminPin(currentPin)) {
      setSecurityFeedback('현재 관리자 PIN을 입력해주세요.');
      return;
    }
    if (!isValidAdminPin(newPin)) {
      setSecurityFeedback(`새 PIN은 ${ADMIN_PIN_LENGTH}자리 숫자여야 합니다.`);
      return;
    }
    if (newPin !== confirmPin) {
      setSecurityFeedback('새 PIN 확인이 일치하지 않습니다.');
      return;
    }
    if (newPin === currentPin) {
      setSecurityFeedback('현재 PIN과 다른 PIN을 사용해주세요.');
      return;
    }

    setWorking(true);
    try {
      if (!await verifySensitiveAction(currentPin)) {
        setSecurityFeedback('현재 관리자 PIN이 맞지 않습니다.');
        setCurrentPin('');
        return;
      }
      const nextRecord = await createAdminSecurityRecord(newPin);
      onSecurityRecordChange(nextRecord);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setSecurityFeedback('관리자 PIN을 변경했습니다.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="glass-card rounded-2xl border border-purple-100 p-4">
        <div className="mb-4">
          <h2 className="text-sm font-black text-gray-700">🎁 보상 지급 기준</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
            저장 후 새로 지급되는 보상부터 적용됩니다. 이미 받은 보상과 구매 내역은 유지됩니다.
          </p>
        </div>

        <div className="space-y-4">
          <NumberField
            label="책 한 권당 책별"
            value={draft.bookStarsPerBook}
            max={10_000}
            suffix="책별"
            onChange={(value) => updateDraft('bookStarsPerBook', value)}
          />

          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-amber-50 p-3">
            <NumberField
              label="줄글책 기준"
              value={draft.proseBooksPerHeart}
              min={1}
              max={1_000}
              suffix="권마다"
              onChange={(value) => updateDraft('proseBooksPerHeart', value)}
            />
            <NumberField
              label="줄글책 하트"
              value={draft.proseHeartsPerReward}
              max={100}
              suffix="하트"
              onChange={(value) => updateDraft('proseHeartsPerReward', value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-sky-50 p-3">
            <NumberField
              label="영어책 기준"
              value={draft.englishBooksPerHeart}
              min={1}
              max={1_000}
              suffix="권마다"
              onChange={(value) => updateDraft('englishBooksPerHeart', value)}
            />
            <NumberField
              label="영어책 하트"
              value={draft.englishHeartsPerReward}
              max={100}
              suffix="하트"
              onChange={(value) => updateDraft('englishHeartsPerReward', value)}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-gray-600">마일스톤 책별 보너스</p>
            <div className="grid grid-cols-2 gap-2">
              {BOOK_STAR_MILESTONES.map((milestone) => (
                <NumberField
                  key={milestone}
                  label={`${milestone}권 달성`}
                  value={draft.milestoneBookStars[milestone] ?? 0}
                  max={100_000}
                  suffix="책별"
                  onChange={(value) => updateDraft('milestoneBookStars', {
                    ...draft.milestoneBookStars,
                    [milestone]: value,
                  })}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleResetSettings}
            className={`rounded-xl py-2.5 text-xs font-bold ${confirmReset ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}
          >
            {confirmReset ? '기본값 복원 확인' : '기본값 복원'}
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 py-2.5 text-xs font-black text-white"
          >
            지급 기준 저장
          </button>
        </div>
        {settingsFeedback && (
          <p role="status" className="mt-3 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-600">
            {settingsFeedback}
          </p>
        )}
      </section>

      <section className="glass-card rounded-2xl border border-amber-100 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-gray-700">💰 잔액 직접 조정</h2>
            <p className="mt-1 text-[11px] text-gray-400">조정 직전에 관리자 PIN을 다시 확인합니다.</p>
          </div>
          <div className="text-right text-xs font-black">
            <p className="text-amber-600">★ {bookStars}</p>
            <p className="text-pink-500">♥ {hearts}</p>
          </div>
        </div>
        {bookStarDebt > 0 && (
          <p className="mb-3 rounded-xl bg-orange-50 px-3 py-2 text-[11px] font-bold text-orange-600">
            도장 취소 부채 {bookStarDebt}책별은 독서 보상에서만 별도로 정산됩니다.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCurrency('bookStars')}
            className={`rounded-xl py-2 text-xs font-bold ${currency === 'bookStars' ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-400'}`}
          >
            ★ 책별
          </button>
          <button
            type="button"
            onClick={() => setCurrency('hearts')}
            className={`rounded-xl py-2 text-xs font-bold ${currency === 'hearts' ? 'bg-pink-200 text-pink-700' : 'bg-gray-100 text-gray-400'}`}
          >
            ♥ 하트
          </button>
        </div>
        <div className="mt-3 space-y-2">
          <input
            type="number"
            min="1"
            step="1"
            value={adjustmentAmount}
            onChange={(event) => setAdjustmentAmount(event.target.value)}
            placeholder="조정할 수량"
            className="w-full rounded-xl border border-amber-100 bg-white px-3 py-2.5 text-sm outline-none"
          />
          <input
            type="text"
            value={adjustmentReason}
            onChange={(event) => setAdjustmentReason(event.target.value)}
            placeholder="조정 사유"
            maxLength={80}
            className="w-full rounded-xl border border-amber-100 bg-white px-3 py-2.5 text-sm outline-none"
          />
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={adjustmentPin}
            onChange={(event) => setAdjustmentPin(event.target.value.replace(/\D/g, '').slice(0, ADMIN_PIN_LENGTH))}
            placeholder={`${ADMIN_PIN_LENGTH}자리 관리자 PIN`}
            className="w-full rounded-xl border border-amber-100 bg-white px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={working}
            onClick={() => handleAdjustment(-1)}
            className="rounded-xl bg-red-100 py-2.5 text-xs font-black text-red-600 disabled:opacity-50"
          >
            차감
          </button>
          <button
            type="button"
            disabled={working}
            onClick={() => handleAdjustment(1)}
            className="rounded-xl bg-green-100 py-2.5 text-xs font-black text-green-700 disabled:opacity-50"
          >
            추가
          </button>
        </div>
        {adjustmentFeedback && (
          <p role="status" className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600">
            {adjustmentFeedback}
          </p>
        )}

        {currencyAdjustments.length > 0 && (
          <div className="mt-4 border-t border-amber-100 pt-3">
            <p className="mb-2 text-xs font-black text-gray-600">최근 조정 내역</p>
            <div className="space-y-2">
              {[...currencyAdjustments].reverse().slice(0, 10).map((adjustment) => (
                <div key={adjustment.id} className="rounded-xl bg-white/80 px-3 py-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2 font-bold">
                    <span>{adjustment.currency === 'bookStars' ? '★ 책별' : '♥ 하트'}</span>
                    <span className={adjustment.amount > 0 ? 'text-green-600' : 'text-red-500'}>
                      {adjustment.amount > 0 ? '+' : ''}{adjustment.amount} · 잔액 {adjustment.balanceAfter}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-500">{adjustment.reason}</p>
                  <p className="mt-0.5 text-[10px] text-gray-300">
                    {new Date(adjustment.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="glass-card rounded-2xl border border-blue-100 p-4">
        <h2 className="text-sm font-black text-gray-700">🔐 관리자 PIN 변경</h2>
        <p className="mt-1 text-[11px] text-gray-400">PIN 원문은 저장하지 않으며 새 salt와 해시로 교체합니다.</p>
        <div className="mt-3 space-y-2">
          {[
            { value: currentPin, setter: setCurrentPin, placeholder: '현재 PIN', autoComplete: 'current-password' },
            { value: newPin, setter: setNewPin, placeholder: '새 6자리 PIN', autoComplete: 'new-password' },
            { value: confirmPin, setter: setConfirmPin, placeholder: '새 PIN 확인', autoComplete: 'new-password' },
          ].map((field) => (
            <input
              key={field.placeholder}
              type="password"
              inputMode="numeric"
              autoComplete={field.autoComplete}
              value={field.value}
              onChange={(event) => field.setter(event.target.value.replace(/\D/g, '').slice(0, ADMIN_PIN_LENGTH))}
              placeholder={field.placeholder}
              className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm outline-none"
            />
          ))}
        </div>
        <button
          type="button"
          disabled={working}
          onClick={handlePinChange}
          className="mt-3 w-full rounded-xl bg-blue-100 py-2.5 text-xs font-black text-blue-700 disabled:opacity-50"
        >
          PIN 변경
        </button>
        {securityFeedback && (
          <p role="status" className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">
            {securityFeedback}
          </p>
        )}
      </section>
    </div>
  );
}
