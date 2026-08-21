export const ADMIN_SECURITY_STORAGE_KEY = '1000books-admin-security';
export const ADMIN_SESSION_STORAGE_KEY = '1000books-admin-session';
export const ADMIN_PIN_LENGTH = 6;
export const ADMIN_SECURITY_VERSION = 1;

const PBKDF2_ITERATIONS = 210_000;
const MAX_LOCK_DURATION_MS = 15 * 60 * 1000;

export interface AdminSecurityRecord {
  version: number;
  pinHash: string;
  pinSalt: string;
  iterations: number;
  failedAttempts: number;
  lockedUntil?: string;
  pinUpdatedAt: string;
}

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string) {
  const decoded = atob(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function isSecurityRecord(value: unknown): value is AdminSecurityRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<AdminSecurityRecord>;
  return (
    record.version === ADMIN_SECURITY_VERSION &&
    typeof record.pinHash === 'string' &&
    typeof record.pinSalt === 'string' &&
    typeof record.iterations === 'number' &&
    Number.isInteger(record.iterations) &&
    record.iterations > 0 &&
    typeof record.failedAttempts === 'number' &&
    Number.isInteger(record.failedAttempts) &&
    record.failedAttempts >= 0 &&
    (record.lockedUntil === undefined || typeof record.lockedUntil === 'string') &&
    typeof record.pinUpdatedAt === 'string'
  );
}

async function derivePinHash(pin: string, salt: Uint8Array, iterations: number) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt as BufferSource,
      iterations,
    },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

export function isValidAdminPin(pin: string) {
  return new RegExp(`^\\d{${ADMIN_PIN_LENGTH}}$`).test(pin);
}

export async function createAdminSecurityRecord(pin: string): Promise<AdminSecurityRecord> {
  if (!isValidAdminPin(pin)) {
    throw new Error(`${ADMIN_PIN_LENGTH}자리 숫자 PIN이 필요합니다.`);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePinHash(pin, salt, PBKDF2_ITERATIONS);
  return {
    version: ADMIN_SECURITY_VERSION,
    pinHash: bytesToBase64(hash),
    pinSalt: bytesToBase64(salt),
    iterations: PBKDF2_ITERATIONS,
    failedAttempts: 0,
    pinUpdatedAt: new Date().toISOString(),
  };
}

export async function verifyAdminPin(pin: string, record: AdminSecurityRecord) {
  if (!isValidAdminPin(pin)) return false;

  try {
    const expected = base64ToBytes(record.pinHash);
    const actual = await derivePinHash(pin, base64ToBytes(record.pinSalt), record.iterations);
    if (expected.length !== actual.length) return false;

    let difference = 0;
    for (let index = 0; index < expected.length; index += 1) {
      difference |= expected[index] ^ actual[index];
    }
    return difference === 0;
  } catch {
    return false;
  }
}

export function getAdminLockSeconds(record: AdminSecurityRecord, now = Date.now()) {
  if (!record.lockedUntil) return 0;
  return Math.max(0, Math.ceil((new Date(record.lockedUntil).getTime() - now) / 1000));
}

export function recordAdminPinFailure(record: AdminSecurityRecord, now = Date.now()) {
  const failedAttempts = record.failedAttempts + 1;
  const lockDuration = failedAttempts >= 5
    ? Math.min(60_000 * (2 ** (failedAttempts - 5)), MAX_LOCK_DURATION_MS)
    : 0;

  return {
    ...record,
    failedAttempts,
    lockedUntil: lockDuration > 0
      ? new Date(now + lockDuration).toISOString()
      : undefined,
  };
}

export function clearAdminPinFailures(record: AdminSecurityRecord) {
  return {
    ...record,
    failedAttempts: 0,
    lockedUntil: undefined,
  };
}

export function loadAdminSecurityRecord() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ADMIN_SECURITY_STORAGE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isSecurityRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAdminSecurityRecord(record: AdminSecurityRecord) {
  localStorage.setItem(ADMIN_SECURITY_STORAGE_KEY, JSON.stringify(record));
}

export function hasActiveAdminSession(record: AdminSecurityRecord) {
  return sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === record.pinUpdatedAt;
}

export function markAdminSession(record: AdminSecurityRecord) {
  sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, record.pinUpdatedAt);
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}
