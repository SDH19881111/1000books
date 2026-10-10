'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { IScannerControls } from '@zxing/browser';
import { parseIsbn } from '@/lib/isbn';

interface BarcodeScannerProps {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return '카메라 사용을 허용해 주세요. (주소창 옆 🔒 아이콘에서 카메라 권한을 켤 수 있어요)';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return '사용할 수 있는 카메라를 찾지 못했어요.';
  }
  if (name === 'NotReadableError') {
    return '다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해 주세요.';
  }
  return '카메라를 켜지 못했어요.';
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let controls: IScannerControls | null = null;
    let cancelled = false;
    let done = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('이 브라우저에서는 카메라를 쓸 수 없어요. (https 주소로 접속했는지 확인해 주세요)');
        return;
      }

      // 바코드 라이브러리는 스캔할 때만 불러온다
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import('@zxing/browser'),
        import('@zxing/library'),
      ]);
      if (cancelled || !videoRef.current) return;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });

      try {
        const started = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result) => {
            if (!result || done) return;
            const isbn = parseIsbn(result.getText());
            if (!isbn) {
              setHint('책 바코드가 아니에요. 978 또는 979로 시작하는 바코드를 비춰 주세요.');
              return;
            }
            done = true;
            controls?.stop();
            navigator.vibrate?.(80);
            onDetectedRef.current(isbn);
          }
        );
        if (cancelled || done) {
          started.stop();
        } else {
          controls = started;
        }
      } catch (err) {
        if (!cancelled) setError(cameraErrorMessage(err));
      }
    }

    start().catch((err) => {
      if (!cancelled) setError(cameraErrorMessage(err));
    });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, []);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 px-4"
    >
      <div className="w-full max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">📷 바코드 찍기</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl bg-white p-5 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-2xl bg-pink-100 px-4 py-2 text-sm font-bold text-pink-600"
            >
              돌아가서 제목으로 찾기
            </button>
          </div>
        ) : (
          <>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                playsInline
                autoPlay
              />
              {/* 바코드를 맞출 가이드 상자 */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-1/3 w-4/5 rounded-xl border-4 border-pink-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                  <motion.div
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-2 right-2 h-0.5 bg-red-400"
                  />
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-sm text-white">
              책 뒷면의 바코드를 분홍 상자 안에 맞춰 주세요
            </p>
            {hint && <p className="mt-1 text-center text-xs text-yellow-300">{hint}</p>}
          </>
        )}
      </div>
    </motion.div>,
    document.body
  );
}
