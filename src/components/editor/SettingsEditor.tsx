import React from 'react';
import { useResumeStore } from '../../store/resumeStore';
import type { TemplateId } from '../../types/resume';

const TEMPLATES: { id: TemplateId; name: string; desc: string; tag?: string }[] = [
  { id: 'modern', name: '現代風', desc: '漸層標題，彩色標籤' },
  { id: 'classic', name: '經典風', desc: '傳統排版，專業感強' },
  { id: 'minimal', name: '簡約風', desc: '雙欄側欄佈局' },
  { id: 'editorial', name: '編輯風', desc: 'Medium 文字美學，清晰層次', tag: 'New' },
  { id: 'dev', name: '開發者', desc: 'GitHub 風格，專案卡片', tag: 'New' },
  { id: 'swiss', name: '瑞士式', desc: '嚴格格線，極簡排版', tag: 'New' },
];



export default function SettingsEditor() {
  const { settings, updateSettings, data, toggleSectionVisible } = useResumeStore();

  const sectionLabels: Record<string, string> = {
    personal: '個人資訊', experience: '工作經歷', education: '學歷',
    skills: '技能', projects: '專案', certifications: '證照', languages: '語言', custom: '自訂',
  };

  return (
    <div className="editor-panel">
      <div className="panel-title">外觀設定</div>

      {/* Template */}
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


      {/* Font & size */}
      <div className="settings-group">
        <div className="settings-group-title">字型設定</div>
        <div className="fields-grid-2">
          <div className="field-group">
            <label>字級：{settings.fontSize}px</label>
            <input type="range" min={11} max={18} value={settings.fontSize} onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })} />
          </div>
          <div className="field-group">
            <label>頁面邊距：{settings.pageMargin}px</label>
            <input type="range" min={20} max={70} value={settings.pageMargin} onChange={(e) => updateSettings({ pageMargin: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      {/* Section order */}
      <div className="settings-group">
        <div className="settings-group-title">區塊顯示 / 排序</div>
        <div className="section-list">
          {data.sections.map((sec) => (
            <div key={sec.id} className="section-row">
              <label className="checkbox-label">
                <input type="checkbox" checked={sec.visible} onChange={() => toggleSectionVisible(sec.id)} />
                <span>{sectionLabels[sec.type] || sec.type}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
