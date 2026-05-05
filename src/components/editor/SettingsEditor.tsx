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

interface Theme {
  id: string;
  name: string;
  desc: string;
  swatch: string[];   // 2-3 顏色作為預覽漸層
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
}

// 文字顏色固定：黑色 #1f2937，不隨主題改變
const TEXT_DARK = '#1f2937';
const BG_WHITE  = '#ffffff';

const THEMES: Theme[] = [
  {
    id: 'ocean',
    name: '海洋',
    desc: '深邃清澈',
    swatch: ['#0284c7', '#0ea5e9', '#e0f2fe'],
    colors: { primary: '#0284c7', secondary: '#0369a1', accent: '#e0f2fe', text: TEXT_DARK, background: BG_WHITE },
  },
  {
    id: 'space',
    name: '太空',
    desc: '神秘深邃',
    swatch: ['#6d28d9', '#8b5cf6', '#ede9fe'],
    colors: { primary: '#6d28d9', secondary: '#5b21b6', accent: '#ede9fe', text: TEXT_DARK, background: BG_WHITE },
  },
  {
    id: 'forest',
    name: '森林',
    desc: '自然清新',
    swatch: ['#15803d', '#22c55e', '#dcfce7'],
    colors: { primary: '#15803d', secondary: '#166534', accent: '#dcfce7', text: TEXT_DARK, background: BG_WHITE },
  },
  {
    id: 'sunset',
    name: '夕陽',
    desc: '溫暖活力',
    swatch: ['#ea580c', '#f97316', '#ffedd5'],
    colors: { primary: '#ea580c', secondary: '#c2410c', accent: '#ffedd5', text: TEXT_DARK, background: BG_WHITE },
  },
  {
    id: 'sakura',
    name: '櫻花',
    desc: '優雅柔美',
    swatch: ['#db2777', '#ec4899', '#fce7f3'],
    colors: { primary: '#db2777', secondary: '#be185d', accent: '#fce7f3', text: TEXT_DARK, background: BG_WHITE },
  },
  {
    id: 'glacier',
    name: '冰川',
    desc: '冷峻清冽',
    swatch: ['#0e7490', '#06b6d4', '#cffafe'],
    colors: { primary: '#0e7490', secondary: '#0c5a6c', accent: '#cffafe', text: TEXT_DARK, background: BG_WHITE },
  },
  {
    id: 'desert',
    name: '沙漠',
    desc: '沉穩大氣',
    swatch: ['#b45309', '#d97706', '#fef3c7'],
    colors: { primary: '#b45309', secondary: '#92400e', accent: '#fef3c7', text: TEXT_DARK, background: BG_WHITE },
  },
  {
    id: 'graphite',
    name: '石墨',
    desc: '低調專業',
    swatch: ['#374151', '#6b7280', '#f3f4f6'],
    colors: { primary: '#374151', secondary: '#1f2937', accent: '#f3f4f6', text: TEXT_DARK, background: BG_WHITE },
  },
];

export default function SettingsEditor() {
  const { settings, updateSettings, data, toggleSectionVisible } = useResumeStore();

  const sectionLabels: Record<string, string> = {
    personal: '個人資訊', experience: '經歷', education: '學歷',
    skills: '技能', projects: '專案', certifications: '證照',
    languages: '語言', custom: '自訂',
  };

  const currentTheme = THEMES.find(t => t.colors.primary === settings.colors.primary);

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

      {/* ── Theme ── */}
      <div className="settings-group">
        <div className="settings-group-title">配色風格</div>
        <div className="theme-grid">
          {THEMES.map((theme) => {
            const active = settings.colors.primary === theme.colors.primary;
            return (
              <button
                key={theme.id}
                className={`theme-card ${active ? 'active' : ''}`}
                onClick={() => updateSettings({ colors: theme.colors })}
                title={theme.desc}
              >
                {/* 漸層色條 */}
                <div
                  className="theme-swatch"
                  style={{
                    background: `linear-gradient(135deg, ${theme.swatch[0]} 0%, ${theme.swatch[1]} 60%, ${theme.swatch[2]} 100%)`,
                  }}
                />
                <div className="theme-info">
                  <div className="theme-name">{theme.name}</div>
                  <div className="theme-desc">{theme.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
        {currentTheme && (
          <div className="theme-active-label">
            目前：<strong>{currentTheme.name}</strong>
          </div>
        )}
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
