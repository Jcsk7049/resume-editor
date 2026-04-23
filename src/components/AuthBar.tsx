import React, { useEffect, useRef, useState } from 'react';
import { Cloud, CloudUpload, CloudDownload } from 'lucide-react';
import {
  signInWithPopup, signOut, onAuthStateChanged, type User,
} from 'firebase/auth';
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { saveToCloud, loadFromCloud, type SyncMeta } from '../lib/cloudSync';
import { useResumeStore } from '../store/resumeStore';

const AUTOSAVE_DELAY = 4000; // ms after last edit

interface Props {
  onShowSetup: () => void;
}

export default function AuthBar({ onShowSetup }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [meta, setMeta] = useState<SyncMeta>({ savedAt: null, syncing: false, error: null });
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadConfirm, setLoadConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data, settings, loadSampleData } = useResumeStore();

  // Auth state listener
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      // Auto-load from cloud on first sign-in if cloud has data
      if (u && db) {
        setMeta(m => ({ ...m, syncing: true, error: null }));
        try {
          const cloud = await loadFromCloud(db, u.uid);
          if (cloud) {
            useResumeStore.setState({ data: cloud.data, settings: cloud.settings });
            setMeta({ savedAt: new Date(), syncing: false, error: null });
          } else {
            // No cloud data yet — push local data up
            await saveToCloud(db, u.uid, data, settings);
            setMeta({ savedAt: new Date(), syncing: false, error: null });
          }
        } catch (e) {
          setMeta({ savedAt: null, syncing: false, error: '同步失敗，請檢查網路連線。' });
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save on data/settings change (debounced)
  useEffect(() => {
    if (!user || !db) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setMeta(m => ({ ...m, syncing: true, error: null }));
      try {
        await saveToCloud(db!, user.uid, data, settings);
        setMeta({ savedAt: new Date(), syncing: false, error: null });
      } catch {
        setMeta(m => ({ ...m, syncing: false, error: '自動儲存失敗' }));
      }
    }, AUTOSAVE_DELAY);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [data, settings, user]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignIn = async () => {
    if (!auth || !googleProvider) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (!msg.includes('popup-closed')) {
        setMeta(m => ({ ...m, error: '登入失敗，請再試一次。' }));
      }
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setMeta({ savedAt: null, syncing: false, error: null });
    setMenuOpen(false);
  };

  const handleManualSave = async () => {
    if (!user || !db) return;
    setMeta(m => ({ ...m, syncing: true, error: null }));
    try {
      await saveToCloud(db, user.uid, data, settings);
      setMeta({ savedAt: new Date(), syncing: false, error: null });
    } catch {
      setMeta(m => ({ ...m, syncing: false, error: '儲存失敗' }));
    }
  };

  const handleLoadCloud = async () => {
    if (!user || !db) return;
    setLoadConfirm(false);
    setMeta(m => ({ ...m, syncing: true }));
    try {
      const cloud = await loadFromCloud(db, user.uid);
      if (cloud) {
        useResumeStore.setState({ data: cloud.data, settings: cloud.settings });
        setMeta({ savedAt: new Date(), syncing: false, error: null });
      } else {
        setMeta({ savedAt: null, syncing: false, error: '雲端尚無儲存資料' });
      }
    } catch {
      setMeta(m => ({ ...m, syncing: false, error: '讀取失敗' }));
    }
    setMenuOpen(false);
  };

  const fmtTime = (d: Date) => {
    const diff = Math.round((Date.now() - d.getTime()) / 1000);
    if (diff < 5) return '剛才';
    if (diff < 60) return `${diff} 秒前`;
    if (diff < 3600) return `${Math.round(diff / 60)} 分鐘前`;
    return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  };

  // ── Not configured ──────────────────────────────────────
  if (!isFirebaseConfigured) {
    return (
      <button className="auth-setup-btn" onClick={onShowSetup} title="設定 Firebase 以啟用雲端儲存">
        <Cloud size={13} strokeWidth={1.75} /> 啟用雲端儲存
      </button>
    );
  }

  // ── Not signed in ────────────────────────────────────────
  if (!user) {
    return (
      <button className="auth-google-btn" onClick={handleSignIn}>
        <GoogleIcon />
        使用 Google 登入
      </button>
    );
  }

  // ── Signed in ─────────────────────────────────────────────
  return (
    <div className="auth-bar" ref={menuRef}>
      {/* Sync status pill */}
      <div className="sync-status">
        {meta.syncing ? (
          <><span className="sync-dot syncing" />同步中…</>
        ) : meta.error ? (
          <><span className="sync-dot error" /><span className="sync-error">{meta.error}</span></>
        ) : meta.savedAt ? (
          <><span className="sync-dot saved" />已儲存 {fmtTime(meta.savedAt)}</>
        ) : (
          <><span className="sync-dot" />雲端同步</>
        )}
      </div>

      {/* Avatar button */}
      <button className="auth-avatar-btn" onClick={() => setMenuOpen(o => !o)} title={user.displayName ?? ''}>
        {user.photoURL
          ? <img src={user.photoURL} alt="avatar" className="auth-avatar-img" referrerPolicy="no-referrer" />
          : <span className="auth-avatar-fallback">{(user.displayName ?? user.email ?? '?')[0].toUpperCase()}</span>
        }
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="auth-menu">
          <div className="auth-menu-user">
            <div className="auth-menu-name">{user.displayName}</div>
            <div className="auth-menu-email">{user.email}</div>
          </div>
          <div className="auth-menu-divider" />
          <button className="auth-menu-item" onClick={handleManualSave}>
            <CloudUpload size={13} strokeWidth={1.75} style={{ marginRight: 6, flexShrink: 0 }} /> 立即儲存至雲端
          </button>
          {loadConfirm ? (
            <div className="auth-menu-confirm">
              <span>覆蓋本機資料？</span>
              <button className="auth-menu-confirm-yes" onClick={handleLoadCloud}>確認</button>
              <button className="auth-menu-confirm-no" onClick={() => setLoadConfirm(false)}>取消</button>
            </div>
          ) : (
            <button className="auth-menu-item" onClick={() => setLoadConfirm(true)}>
              <CloudDownload size={13} strokeWidth={1.75} style={{ marginRight: 6, flexShrink: 0 }} /> 從雲端還原資料
            </button>
          )}
          <div className="auth-menu-divider" />
          <button className="auth-menu-item auth-menu-danger" onClick={handleSignOut}>
            登出
          </button>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
