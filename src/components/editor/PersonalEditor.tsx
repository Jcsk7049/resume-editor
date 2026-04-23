import React from 'react';
import { useResumeStore } from '../../store/resumeStore';

export default function PersonalEditor() {
  const { data, updatePersonal } = useResumeStore();
  const p = data.personal;

  const field = (label: string, key: keyof typeof p, type = 'text', placeholder = '') => (
    <div className="field-group" key={key}>
      <label>{label}</label>
      <input
        type={type}
        value={p[key] as string}
        placeholder={placeholder}
        onChange={(e) => updatePersonal({ [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="editor-panel">
      <div className="panel-title">個人資訊</div>
      <div className="fields-grid-2">
        {field('姓名 *', 'name', 'text', '王小明')}
        {field('職稱 / 頭銜', 'title', 'text', '軟體工程師')}
        {field('電子郵件', 'email', 'email', 'your@email.com')}
        {field('電話', 'phone', 'tel', '+886 912 345 678')}
        {field('所在地', 'location', 'text', '台北市, 台灣')}
        {field('個人網站', 'website', 'url', 'https://...')}
        {field('LinkedIn', 'linkedin', 'text', 'linkedin.com/in/...')}
        {field('GitHub', 'github', 'text', 'github.com/...')}
      </div>
      <div className="field-group">
        <label>個人簡介</label>
        <textarea
          rows={4}
          value={p.summary}
          placeholder="簡短介紹你的專業背景、核心技能與職涯目標..."
          onChange={(e) => updatePersonal({ summary: e.target.value })}
        />
      </div>
      <div className="field-group">
        <label>大頭照 URL</label>
        <input
          type="url"
          value={p.avatar}
          placeholder="https://example.com/avatar.jpg"
          onChange={(e) => updatePersonal({ avatar: e.target.value })}
        />
        {p.avatar && (
          <img src={p.avatar} alt="preview" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginTop: 8 }} />
        )}
      </div>
    </div>
  );
}
