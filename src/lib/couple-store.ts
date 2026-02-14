// Simple local session store for couple context (no auth needed)
const STORAGE_KEY = 'togethermiles_session';

export interface CoupleSession {
  coupleId: string;
  username: string;
  nickname: string;
  role: 'partner1' | 'partner2';
  partnerNickname?: string;
}

export function getSession(): CoupleSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(session: CoupleSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
