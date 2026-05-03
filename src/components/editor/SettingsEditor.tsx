import React from 'react';
import { useResumeStore } from '../../store/resumeStore';
import type { TemplateId } from '../../types/resume';

const TEMPLATES: { id: TemplateId; name: string; desc: string; tag?: string }[] = [
  { id: 'modern',    name: '現代風',  desc: '漸層標題，彩色標籤' },
  { id: 'classic',   name: '經典風',  desc: '傳統排版，專業感強' },
  { id: 'minimal',   name: '簡約風',  desc: '雙欄側欄佈局' },
  { id: 'editorial', name: '編輯風',  desc: 'Medium 文字美學', tag: 'New' },
  { id: 'dev',       name: '開發者',  desc: 'GitHub 風格卡片',  tag: 'New' },
  { id: 'swiss',     name: '瑞士式',  desc: '嚴格格線極簡',    tag: 'New' },
];

// Preset palettes: each entry defines the full accent colour set
const COLOR_PRESETS = [
  { name: '海洋藍', primary: '#2563eb', secondary: '#1e40af', accent: '#dbeafe' },
  { name: '翠綠',   primary: '#059669', secondary: '#047857', accent: '#d1fae5' },
  { name: '典雅紫', primary: '#7c3aed', secondary: '#6d28d9', accent: '#ede9fe' },
  { name: '玫瑰紅', primary: '#e11d48', secondary: '#be123c', accent: '#fce7f3' },
  { name: '琥珀金', primary: '#d97706', secondary: '#b45309', accent: '#fef3c7' },
  { name: '石板灰', primary: '#475569', secondary: '#334155', accent: '#e2e8f0' },
];

export default function SettingsEditor() {
  const { settings, updateSettings, data, toggleSectionVisible } = useResumeStore();

  const sectionLabels: Record<string, string> = {
    personal: '個人資訊', experience: '經歷', education: '學歷',
    skills: '技能', projects: '專案', certifications: '證照',
    languages: '語言', custom: '自訂',
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    updateSettings({
      colors: {
        primary:    preset.primary,
        secondary:  preset.secondary,
        accent:     preset.accent,
        text:       '#1f2937',
        background: '#ffffff',
      },
    });
  };

  // Custom hex → derive a simple light accent automatically
  const applyCustomColor = (hex: string) => {
    updateSettings({
      colors: {
        primary:    hex,
        secondary:  hex,
        accent:     hex + '22',   // low-opacity tint as background accent
        text:       '#1f2937',
        background: '#ffffff',
      },
    });
  };

  const currentPrimary = settings.colors.primary;
  const isPreset = COLOR_PRESETS.some(p => p.primary === currentPrimary);

  return (
    <div className="editor-panel">

      {/* ── Template ── */}
      <div className="settings-group">
        <div className="settings-group-title">範本樣式</div>
        <div className="template-grid">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className={`template-card ${settings.template === t.id ? 'active' : ''}`}
              onClick={() => updateSettings({ template: t.id })}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="template-name">{t.name}</div>
                {t.tag && <span className="template-tag">{t.tag}</span>}
              </div>
              <div className="template-desc">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Accent colour ── */}
      <div className="settings-group">
        <div className="settings-group-title">主題顏色</div>

        {/* Preset swatches */}
        <div className="color-swatches">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.primary}
              className={`color-swatch-btn ${currentPrimary === preset.primary ? 'active' : ''}`}
              style={{ '--swatch': preset.primary } as React.CSSProperties}
              onClick={() => applyPreset(preset)}
              title={preset.name}
            />
          ))}

          {/* Custom colour picker */}
          <label
            className={`color-swatch-btn color-swatch-custom ${!isPreset ? 'active' : ''}`}
            title="自訂顏色"
          >
            <input
              type="color"
              value={currentPrimary}
              onChange={(e) => applyCustomColor(e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            />
            <span className="color-swatch-plus">＋</span>
          </label>
        </div>

        {/* Current colour preview */}
        <div className="color-current">
          <span
            className="color-current-dot"
            style={{ background: currentPrimary }}
          />
          <span className="color-current-hex">{currentPrimary.toUpperCase()}</span>
        </div>
      </div>

      {/* ── Typography ── */}
      <div className="settings-group">
        <div className="settings-group-title">字型設定</div>
        <div className="fields-grid-2">
          <div className="field-group">
            <label>字級：{settings.fontSize}px</label>
            <input
              type="range" min={11} max={18} value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
            />
          </div>
          <div className="field-group">
            <label>頁面邊距：{settings.pageMargin}px</label>
            <input
              type="range" min={20} max={70} value={settings.pageMargin}
              onChange={(e) => updateSettings({ pageMargin: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* ── Section visibility ── */}
      <div className="settings-group">
        <div className="settings-group-title">區塊顯示</div>
        <div className="section-list">
          {data.sections.map((sec) => (
            <div key={sec.id} className="section-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sec.visible}
                  onChange={() => toggleSectionVisible(sec.id)}
                />
                <span>{sectionLabels[sec.type] || sec.type}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
