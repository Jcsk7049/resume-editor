import React from 'react';
import { useResumeStore } from '../../store/resumeStore';

export default function ExperienceEditor() {
  const { data, addExperience, updateExperience, removeExperience } = useResumeStore();

  return (
    <div className="editor-panel">
      <div className="panel-header">
        <div className="panel-title">經歷</div>
        <button className="btn-add" onClick={addExperience}>+ 新增</button>
      </div>

      {data.experience.map((exp, idx) => (
        <div className="card-item" key={exp.id}>
          <div className="card-item-header">
            <span className="card-number">#{idx + 1}</span>
            <button className="btn-remove" onClick={() => removeExperience(exp.id)}>刪除</button>
          </div>
          <div className="fields-grid-2">
            <Field label="公司名稱" value={exp.company} onChange={(v) => updateExperience(exp.id, { company: v })} placeholder="科技股份有限公司" />
            <Field label="職稱" value={exp.role} onChange={(v) => updateExperience(exp.id, { role: v })} placeholder="資深工程師" />
            <Field label="開始日期" value={exp.startDate} onChange={(v) => updateExperience(exp.id, { startDate: v })} placeholder="2022-03" type="month" />
            <div className="field-group">
              <label>結束日期</label>
              <input
                type="month"
                value={exp.endDate}
                disabled={exp.current}
                onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
              />
              <label className="checkbox-label" style={{ marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => updateExperience(exp.id, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })}
                />
                目前在職
              </label>
            </div>
            <Field label="地點" value={exp.location} onChange={(v) => updateExperience(exp.id, { location: v })} placeholder="台北市" />
          </div>
          <div className="field-group">
            <label>工作描述（支援 • 項目符號）</label>
            <textarea
              rows={5}
              value={exp.description}
              placeholder="• 主要職責與成就&#10;• 量化成果（例如：效能提升 30%）"
              onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
            />
          </div>
        </div>
      ))}

      {data.experience.length === 0 && (
        <div className="empty-state">點擊「新增」加入工作經歷</div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="field-group">
      <label>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
