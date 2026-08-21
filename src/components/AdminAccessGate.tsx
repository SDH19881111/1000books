'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import {
  ADMIN_PIN_LENGTH,
  AdminSecurityRecord,
  clearAdminPinFailures,
  clearAdminSession,
  createAdminSecurityRecord,
  getAdminLockSeconds,
  hasActiveAdminSession,
  loadAdminSecurityRecord,
  markAdminSession,
  recordAdminPinFailure,
  saveAdminSecurityRecord,
  verifyAdminPin,
} from '@/lib/adminSecurity';

export interface AdminAccessControls {
  securityRecord: AdminSecurityRecord;
  updateSecurityRecord: (record: AdminSecurityRecord) => void;
  lockAdmin: () => void;
}

interface AdminAccessGateProps {
  children: (controls: AdminAccessControls) => ReactNode;
}

interface PinPadProps {
  value: string;
  disabled?: boolean;
  actionLabel: string;
  onChange: (value: string) => void;
  onComplete: () => void;
}

function PinPad({ value, disabled, actionLabel, onChange, onComplete }: PinPadProps) {
  const appendDigit = (digit: number) => {
    if (disabled || value.length >= ADMIN_PIN_LENGTH) return;
    onChange(`${value}${digit}`);
  };

  return (
    <>
      <div className="mb-6 flex justify-center gap-2">
        {Array.from({ length: ADMIN_PIN_LENGTH }).map((_, index) => (
          <div
            key={index}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-lg font-bold transition-all ${
              value.length > index
                ? 'border-pink-500 bg-pink-400 text-white'
                : 'border-pink-200 bg-pink-50 text-pink-200'
            }`}
          >
            {value.length > index ? '●' : '○'}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <motion.button
            key={digit}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => appendDigit(digit)}
            disabled={disabled}
            className="h-12 rounded-2xl border-2 border-pink-100 bg-white text-lg font-bold text-gray-700 shadow-sm disabled:opacity-40"
          >
            {digit}
          </motion.button>
        ))}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => onChange(value.slice(0, -1))}
          disabled={disabled || value.length === 0}
          className="h-12 rounded-2xl border-2 border-red-100 bg-red-50 text-lg font-bold text-red-400 disabled:opacity-40"
        >
          ⌫
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => appendDigit(0)}
          disabled={disabled}
          className="h-12 rounded-2xl border-2 border-pink-100 bg-white text-lg font-bold text-gray-700 shadow-sm disabled:opacity-40"
        >
          0
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={onComplete}
          disabled={disabled || value.length !== ADMIN_PIN_LENGTH}
          className="h-12 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-400 text-sm font-black text-white shadow-sm disabled:opacity-40"
        >
          {actionLabel}
        </motion.button>
      </div>
    </>
  );
}

export default function AdminAccessGate({ children }: AdminAccessGateProps) {
  const [securityRecord, setSecurityRecord] = useState<AdminSecurityRecord | null | undefined>();
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [setupPin, setSetupPin] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [working, setWorking] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const initializeSecurity = useCallback(() => {
    const storedRecord = loadAdminSecurityRecord();
    setSecurityRecord(storedRecord);
    if (storedRecord && hasActiveAdminSession(storedRecord)) {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    initializeSecurity();
  }, [initializeSecurity]);

  const lockSeconds = securityRecord ? getAdminLockSeconds(securityRecord, now) : 0;

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lockSeconds]);

  const updateSecurityRecord = (record: AdminSecurityRecord) => {
    saveAdminSecurityRecord(record);
    setSecurityRecord(record);
    if (authenticated) markAdminSession(record);
  };

  const lockAdmin = () => {
    clearAdminSession();
    setAuthenticated(false);
    setPin('');
    setFeedback('');
  };

  const handleSetup = async () => {
    if (pin.length !== ADMIN_PIN_LENGTH || working) return;
    if (!setupPin) {
      setSetupPin(pin);
      setPin('');
      setFeedback('같은 PIN을 한 번 더 입력해주세요.');
      return;
    }
    if (pin !== setupPin) {
      setSetupPin(null);
      setPin('');
      setFeedback('PIN이 일치하지 않아요. 처음부터 다시 입력해주세요.');
      return;
    }

    setWorking(true);
    try {
      const record = await createAdminSecurityRecord(pin);
      saveAdminSecurityRecord(record);
      markAdminSession(record);
      setSecurityRecord(record);
      setAuthenticated(true);
      setPin('');
      setFeedback('');
    } finally {
      setWorking(false);
    }
  };

  const handleUnlock = async () => {
    if (!securityRecord || pin.length !== ADMIN_PIN_LENGTH || working || lockSeconds > 0) return;
    setWorking(true);
    try {
      const verified = await verifyAdminPin(pin, securityRecord);
      if (verified) {
        const clearedRecord = clearAdminPinFailures(securityRecord);
        saveAdminSecurityRecord(clearedRecord);
        markAdminSession(clearedRecord);
        setSecurityRecord(clearedRecord);
        setAuthenticated(true);
        setPin('');
        setFeedback('');
        return;
      }

      const failedRecord = recordAdminPinFailure(securityRecord);
      saveAdminSecurityRecord(failedRecord);
      setSecurityRecord(failedRecord);
      setNow(Date.now());
      setPin('');
      const nextLockSeconds = getAdminLockSeconds(failedRecord);
      setFeedback(nextLockSeconds > 0
        ? `PIN을 여러 번 틀렸어요. ${nextLockSeconds}초 후 다시 시도해주세요.`
        : `PIN이 맞지 않아요. ${Math.max(0, 5 - failedRecord.failedAttempts)}번 더 시도할 수 있어요.`);
    } finally {
      setWorking(false);
    }
  };

  if (securityRecord === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 pb-28">
        <span className="text-4xl">🔐</span>
        <button
          type="button"
          onClick={initializeSecurity}
          className="rounded-xl bg-pink-100 px-4 py-2 text-xs font-bold text-pink-600"
        >
          관리자 화면 열기
        </button>
        <Navbar />
      </div>
    );
  }

  if (!securityRecord || !authenticated) {
    const isSetup = !securityRecord;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-6 text-center">
            <div className="mb-3 text-6xl">{isSetup ? '🛡️' : '👩‍💼'}</div>
            <h1 className="font-pen text-3xl text-pink-600">
              {isSetup ? '부모님 PIN 만들기' : '관리자 페이지'}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {isSetup
                ? setupPin
                  ? '확인을 위해 PIN을 다시 입력해주세요.'
                  : `${ADMIN_PIN_LENGTH}자리 숫자로 관리자 PIN을 설정해주세요.`
                : '부모님 PIN을 입력해주세요.'}
            </p>
          </div>

          <div className="glass-card rounded-3xl border-2 border-pink-200 p-5">
            {lockSeconds > 0 ? (
              <div className="py-8 text-center">
                <p className="text-5xl">⏳</p>
                <p className="mt-3 font-bold text-red-500">{lockSeconds}초 동안 잠겼어요.</p>
                <p className="mt-1 text-xs text-gray-400">잠시 후 다시 시도해주세요.</p>
              </div>
            ) : (
              <PinPad
                value={pin}
                disabled={working}
                actionLabel={working ? '확인 중' : isSetup ? '설정' : '확인'}
                onChange={(value) => {
                  setPin(value);
                  setFeedback('');
                }}
                onComplete={isSetup ? handleSetup : handleUnlock}
              />
            )}
            {feedback && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-500">
                {feedback}
              </p>
            )}
          </div>
          {isSetup && (
            <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-400">
              PIN 원문은 저장하지 않고 암호화 해시로 보호합니다. PIN을 잊으면 이 브라우저에서 관리자 설정을 초기화해야 합니다.
            </p>
          )}
        </motion.div>
        <Navbar />
      </div>
    );
  }

  return children({ securityRecord, updateSecurityRecord, lockAdmin });
}
