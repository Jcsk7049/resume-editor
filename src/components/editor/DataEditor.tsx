import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Download, Upload, CheckCircle, AlertCircle, Info, Trash2, X } from 'lucide-react';
import { useResumeStore, getStorageInfo, STORE_VERSION } from '../../store/resumeStore';
import type { ResumeData, ResumeSettings } from '../../types/resume';
import { validateImport } from '../../store/validateImport';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(n: number): string {
  if (n < 1024)       return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

type ImportState =
  | { phase: 'idle' }
  | { phase: 'validating' }
  | { phase: 'preview'; errors: string[]; name: string; counts: Record<string, number>; hasSettings: boolean; raw: ReturnType<typeof validateImport> }
  | { phase: 'success'; name: string }
  | { phase: 'error'; errors: string[] };

// ── component ─────────────────────────────────────────────────────────────────

export default function DataEditor() {
  const { data, settings, importData, resetData } = useResumeStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>({ phase: 'idle' });
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());

  // Refresh storage info whenever data/settings change
  useEffect(() => {
    const id = setTimeout(() => setStorageInfo(getStorageInfo()), 100);
    return () => clearTimeout(id);
  }, [data, settings]);

  // ── export ──────────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const snapshot: { data: ResumeData; settings: ResumeSettings; _version: number; _exported: string } = {
      data,
      settings,
      _version: STORE_VERSION,
      _exported: new Date().toISOString(),
    };
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const name = (data.personal.name || 'resume').replace(/\s+/g, '_');
    a.href     = url;
    a.download = `${name}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, settings]);

  // ── import: pick file ───────────────────────────────────────────────────────
  const handlePickFile = () => {
    setImportState({ phase: 'idle' });
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';           // allow re-selecting same file

    setImportState({ phase: 'validating' });

    const reader = new FileReader();
    reader.onload = (ev) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(ev.target?.result as string);
      } catch {
        setImportState({ phase: 'error', errors: ['JSON 解析失敗：檔案格式不正確，請確認是有效的 .json 文件'] });
        return;
      }

      const result = validateImport(parsed);

      if (!result.ok) {
        setImportState({ phase: 'error', errors: result.errors });
        return;
      }

      // Build preview counts
      const d = result.data!;
      const counts: Record<string, number> = {
        '工作經歷': d.experience.length,
        '學歷':     d.education.length,
        '技能類別': d.skills.length,
        '專案':     d.projects.length,
        '證照':     d.certifications.length,
        '語言':     d.languages.length,
      };

      setImportState({
        phase: 'preview',
        raw: result,
        name: d.personal.name || '（無姓名）',
        counts,
        hasSettings: !!result.settings,
        errors: result.errors,   // non-fatal warnings
      });
    };
    reader.onerror = () => setImportState({ phase: 'error', errors: ['讀取檔案時發生錯誤'] });
    reader.readAsText(file);
  };

  // ── import: confirm apply ───────────────────────────────────────────────────
  const handleApply = () => {
    if (importState.phase !== 'preview') return;
    const { raw } = importState;
    importData(raw.data!, raw.settings);
    setImportState({ phase: 'success', name: raw.data!.personal.name || '（無姓名）' });
  };

  const handleReset = () => {
    setImportState({ phase: 'idle' });
  };

  // ── reset all data ──────────────────────────────────────────────────────────
  const handleResetAll = () => {
    if (window.confirm('確定要清除所有資料並恢復預設範例嗎？此操作無法還原。')) {
      resetData();
      setImportState({ phase: 'idle' });
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="editor-panel">
      <div className="panel-title">數據管理</div>

      {/* ── Storage status ── */}
      <div className="settings-group">
        <div className="settings-group-title">本地儲存狀態</div>
        <div className="data-storage-card">
          <div className="data-storage-row">
            <span className="data-storage-label">儲存空間</span>
            <span className="data-storage-value">{fmtBytes(storageInfo.bytes)}</span>
          </div>
          <div className="data-storage-row">
            <span className="data-storage-label">結構版本</span>
            <span className="data-storage-value">v{STORE_VERSION}</span>
          </div>
          <div className="data-storage-row">
            <span className="data-storage-label">自動儲存</span>
            <span className="data-storage-value data-storage-ok">
              <CheckCircle size={11} /> 已啟用（即時同步）
            </span>
          </div>
        </div>
      </div>

      {/* ── Export ── */}
      <div className="settings-group">
        <div className="settings-group-title">匯出設定檔</div>
        <p className="data-help-text">
          將目前所有履歷資料與外觀設定下載為 JSON 檔案，可隨時匯入還原。
        </p>
        <button className="btn-data-action btn-data-export" onClick={handleExport}>
          <Download size={14} strokeWidth={2} />
          匯出 JSON 設定檔
        </button>
      </div>

      {/* ── Import ── */}
      <div className="settings-group">
        <div className="settings-group-title">匯入設定檔</div>
        <p className="data-help-text">
          上傳先前匯出的 JSON 檔案。系統會在套用前進行完整格式校驗。
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Idle / validating */}
        {(importState.phase === 'idle' || importState.phase === 'validating') && (
          <button
            className="btn-data-action btn-data-import"
            onClick={handlePickFile}
            disabled={importState.phase === 'validating'}
          >
            <Upload size={14} strokeWidth={2} />
            {importState.phase === 'validating' ? '校驗中…' : '選擇 JSON 檔案'}
          </button>
        )}

        {/* Preview — show summary + warnings before applying */}
        {importState.phase === 'preview' && (
          <div className="data-preview-card">
            <div className="data-preview-header">
              <CheckCircle size={14} className="data-preview-ok-icon" />
              <span>校驗通過 — 即將匯入</span>
            </div>
            <div className="data-preview-name">{importState.name}</div>
            <div className="data-preview-counts">
              {Object.entries(importState.counts).map(([k, v]) => (
                <span key={k} className="data-preview-badge">
                  {k} <strong>{v}</strong>
                </span>
              ))}
              {importState.hasSettings && (
                <span className="data-preview-badge data-preview-badge-settings">外觀設定</span>
              )}
            </div>
            {importState.errors.length > 0 && (
              <div className="data-warn-list">
                <div className="data-warn-title">
                  <Info size={11} /> {importState.errors.length} 個欄位已自動修正
                </div>
                {importState.errors.map((e, i) => <div key={i} className="data-warn-item">{e}</div>)}
              </div>
            )}
            <div className="data-preview-actions">
              <button className="btn-data-cancel" onClick={handleReset}>取消</button>
              <button className="btn-data-confirm" onClick={handleApply}>套用匯入</button>
            </div>
          </div>
        )}

        {/* Success */}
        {importState.phase === 'success' && (
          <div className="data-result-card data-result-ok">
            <CheckCircle size={14} />
            <span>已成功匯入「{importState.name}」的履歷資料</span>
            <button className="data-result-dismiss" onClick={handleReset}><X size={12} strokeWidth={2} /></button>
          </div>
        )}

        {/* Error */}
        {importState.phase === 'error' && (
          <div className="data-result-card data-result-error">
            <div className="data-result-error-header">
              <AlertCircle size={14} />
              <span>校驗失敗，無法匯入</span>
              <button className="data-result-dismiss" onClick={handleReset}><X size={12} strokeWidth={2} /></button>
            </div>
            <ul className="data-error-list">
              {importState.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
            <button className="btn-data-import" style={{ marginTop: 10 }} onClick={handlePickFile}>
              <Upload size={13} /> 重新選擇檔案
            </button>
          </div>
        )}
      </div>

      {/* ── Danger zone ── */}
      <div className="settings-group">
        <div className="settings-group-title">危險操作</div>
        <p className="data-help-text">
          清除所有資料並恢復為範例履歷。建議先匯出備份再執行。
        </p>
        <button className="btn-data-danger" onClick={handleResetAll}>
          <Trash2 size={14} strokeWidth={2} />
          重置全部資料
        </button>
      </div>
    </div>
  );
}
