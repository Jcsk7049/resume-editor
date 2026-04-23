import React, { useState } from 'react';
import { Cloud, X, Check, Info } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const STEPS = [
  {
    title: '建立 Firebase 專案',
    content: (
      <>
        <p>前往 <strong>console.firebase.google.com</strong>，點擊「新增專案」。</p>
        <p>輸入專案名稱，取消勾選 Google Analytics（可選），點擊「建立專案」。</p>
      </>
    ),
    link: 'https://console.firebase.google.com',
    linkLabel: '開啟 Firebase Console',
  },
  {
    title: '新增 Web 應用程式',
    content: (
      <>
        <p>在專案頁點擊 <strong>&lt;/&gt;</strong> 圖示（Web），輸入應用程式暱稱後點擊「註冊應用程式」。</p>
        <p>複製 <code>firebaseConfig</code> 物件內的所有設定值，等一下會用到。</p>
      </>
    ),
  },
  {
    title: '啟用 Google 登入',
    content: (
      <>
        <p>左側選單 → <strong>Authentication</strong> → 「開始使用」。</p>
        <p>Sign-in method → Google → 啟用 → 填入專案支援電子郵件 → 儲存。</p>
      </>
    ),
  },
  {
    title: '建立 Firestore 資料庫',
    content: (
      <>
        <p>左側選單 → <strong>Firestore Database</strong> → 「建立資料庫」。</p>
        <p>選擇地區（asia-east1 = 台灣最近），規則選「<strong>以測試模式啟動</strong>」即可開始。</p>
      </>
    ),
  },
  {
    title: '填入設定並重啟',
    content: null, // rendered separately
  },
];

export default function FirebaseSetupModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    apiKey: '', authDomain: '', projectId: '',
    storageBucket: '', messagingSenderId: '', appId: '',
  });
  const [copied, setCopied] = useState(false);

  const envContent = Object.entries(config)
    .map(([k, v]) => {
      const envKey = 'VITE_FIREBASE_' + k.replace(/[A-Z]/g, m => `_${m}`).toUpperCase();
      return `${envKey}=${v}`;
    })
    .join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(envContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const allFilled = Object.values(config).every(v => v.trim().length > 0);
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="import-modal" style={{ maxWidth: 540 }}>
        <div className="import-modal-header">
          <div>
            <div className="import-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cloud size={16} strokeWidth={1.75} /> 設定 Google 雲端儲存
            </div>
            <div className="import-modal-sub">步驟 {step + 1} / {STEPS.length} — {STEPS[step].title}</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={14} strokeWidth={2} /></button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--border)' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / STEPS.length) * 100}%`,
            background: 'var(--accent)',
            transition: 'width 0.3s',
          }} />
        </div>

        <div style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Step icon */}
          <div className="setup-step-num">0{step + 1}</div>

          {/* Step content */}
          {!isLastStep ? (
            <div className="setup-step-body">
              {STEPS[step].content}
              {STEPS[step].link && (
                <a href={STEPS[step].link} target="_blank" rel="noreferrer" className="setup-link">
                  {STEPS[step].linkLabel} ↗
                </a>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="setup-step-body">
                <p>將從 Firebase Console 複製的設定值填入下方，然後複製產生的 <code>.env</code> 內容。</p>
                <p>在 <strong>resume-editor</strong> 資料夾建立 <code>.env</code> 檔，貼上內容後重新啟動 <code>npm run dev</code>。</p>
              </div>

              <div className="fields-grid-2" style={{ gap: 10 }}>
                {(Object.keys(config) as Array<keyof typeof config>).map(key => (
                  <div className="field-group" key={key}>
                    <label>{key}</label>
                    <input
                      value={config[key]}
                      placeholder={`貼上 ${key}`}
                      onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    .env 內容
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{ fontSize: 11, color: copied ? 'var(--accent)' : 'var(--text-muted)',
                             background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {copied ? <><Check size={11} strokeWidth={2.5} /> 已複製</> : '複製'}
                  </button>
                </div>
                <pre style={{ fontSize: 11, lineHeight: 1.7, color: 'var(--text-2)', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {envContent || '（請填入上方設定值）'}
                </pre>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
                <Info size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>提醒：</strong>填完後需重新執行 <code>npm run dev</code> 才會套用，重啟後頁面將出現「使用 Google 登入」按鈕。</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <button
              className="optimize-cancel"
              onClick={() => { if (step === 0) onClose(); else setStep(s => s - 1); }}
            >
              {step === 0 ? '取消' : '← 上一步'}
            </button>
            {isLastStep ? (
              <button className="optimize-confirm" disabled={!allFilled} onClick={onClose}>
                完成設定
              </button>
            ) : (
              <button className="optimize-confirm" onClick={() => setStep(s => s + 1)}>
                下一步 →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
