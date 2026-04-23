import React, { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';

export default function SkillsEditor() {
  const { data, addSkillCategory, updateSkillCategory, removeSkillCategory } = useResumeStore();
  const [inputMap, setInputMap] = useState<Record<string, string>>({});

  const addSkill = (id: string) => {
    const val = (inputMap[id] || '').trim();
    if (!val) return;
    const cat = data.skills.find((s) => s.id === id);
    if (cat) {
      updateSkillCategory(id, { skills: [...cat.skills, val] });
      setInputMap((m) => ({ ...m, [id]: '' }));
    }
  };

  const removeSkill = (catId: string, idx: number) => {
    const cat = data.skills.find((s) => s.id === catId);
    if (cat) updateSkillCategory(catId, { skills: cat.skills.filter((_, i) => i !== idx) });
  };

  return (
    <div className="editor-panel">
      <div className="panel-header">
        <div className="panel-title">技能</div>
        <button className="btn-add" onClick={addSkillCategory}>+ 新增類別</button>
      </div>

      {data.skills.map((cat) => (
        <div className="card-item" key={cat.id}>
          <div className="card-item-header">
            <input
              className="inline-title-input"
              value={cat.name}
              placeholder="類別名稱（如：前端技術）"
              onChange={(e) => updateSkillCategory(cat.id, { name: e.target.value })}
            />
            <button className="btn-remove" onClick={() => removeSkillCategory(cat.id)}>刪除</button>
          </div>

          <div className="skill-tags">
            {cat.skills.map((skill, i) => (
              <span key={i} className="skill-tag">
                {skill}
                <button onClick={() => removeSkill(cat.id, i)}>×</button>
              </span>
            ))}
          </div>

          <div className="skill-add-row">
            <input
              value={inputMap[cat.id] || ''}
              placeholder="輸入技能後按 Enter"
              onChange={(e) => setInputMap((m) => ({ ...m, [cat.id]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(cat.id); } }}
            />
            <button className="btn-add-small" onClick={() => addSkill(cat.id)}>新增</button>
          </div>
        </div>
      ))}

      {data.skills.length === 0 && <div className="empty-state">點擊「新增類別」建立技能分組</div>}
    </div>
  );
}
