import React from 'react';
import { useResumeStore } from '../../store/resumeStore';
import type { LanguageItem } from '../../types/resume';

const proficiencies: LanguageItem['proficiency'][] = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];
const proficiencyLabel: Record<string, string> = {
  Native: '母語', Fluent: '流利', Advanced: '進階', Intermediate: '中級', Basic: '基礎',
};

export default function LanguagesEditor() {
  const { data, addLanguage, updateLanguage, removeLanguage } = useResumeStore();

  return (
    <div className="editor-panel">
      <div className="panel-header">
        <div className="panel-title">語言能力</div>
        <button className="btn-add" onClick={addLanguage}>+ 新增</button>
      </div>

      {data.languages.map((lang) => (
        <div className="card-item card-item-inline" key={lang.id}>
          <div className="field-group" style={{ flex: 1 }}>
            <label>語言</label>
            <input value={lang.language} placeholder="英文" onChange={(e) => updateLanguage(lang.id, { language: e.target.value })} />
          </div>
          <div className="field-group" style={{ flex: 1 }}>
            <label>程度</label>
            <select value={lang.proficiency} onChange={(e) => updateLanguage(lang.id, { proficiency: e.target.value as LanguageItem['proficiency'] })}>
              {proficiencies.map((p) => <option key={p} value={p}>{proficiencyLabel[p]}</option>)}
            </select>
          </div>
          <button className="btn-remove" style={{ marginTop: 22 }} onClick={() => removeLanguage(lang.id)}>刪除</button>
        </div>
      ))}

      {data.languages.length === 0 && <div className="empty-state">點擊「新增」加入語言</div>}
    </div>
  );
}
