import {
  doc, getDoc, setDoc, serverTimestamp, type Firestore,
} from 'firebase/firestore';
import type { ResumeData, ResumeSettings } from '../types/resume';

export interface CloudSavePayload {
  data: ResumeData;
  settings: ResumeSettings;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

export interface SyncMeta {
  savedAt: Date | null;
  syncing: boolean;
  error: string | null;
}

// ── Save to Firestore ──────────────────────────────────────
export async function saveToCloud(
  db: Firestore,
  uid: string,
  data: ResumeData,
  settings: ResumeSettings,
): Promise<void> {
  const ref = doc(db, 'resumes', uid);
  await setDoc(ref, {
    data: sanitize(data),
    settings,
    updatedAt: serverTimestamp(),
  });
}

// ── Load from Firestore ────────────────────────────────────
export async function loadFromCloud(
  db: Firestore,
  uid: string,
): Promise<{ data: ResumeData; settings: ResumeSettings } | null> {
  const ref = doc(db, 'resumes', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const payload = snap.data() as CloudSavePayload;
  return { data: payload.data, settings: payload.settings };
}

// ── Remove undefined fields Firestore doesn't accept ──────
function sanitize(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitize(v)]),
    );
  }
  return obj;
}
