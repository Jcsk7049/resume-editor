import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { useDraggableList } from './useDraggableList';

export default function ProjectsEditor() {
  const { data, addProject, updateProject, removeProject, reorderProjects } = useResumeStore();
  const [techInputMap, setTechInputMap] = useState<Record<string, string>>({});
  const { getCardProps, getHandleProps, isBeingDragged, getDropIndicator } = useDraggableList(
    data.projects,
    reorderProjects,
  );

  const addTech = (id: string) => {
    const val = (techInputMap[id] || '').trim();
    if (!val) return;
    const proj = data.projects.find((p) => p.id === id);
    if (proj) {
      updateProject(id, { technologies: [...proj.technologies, val] });
      setTechInputMap((m) => ({ ...m, [id]: '' }));
    }
  };

  return (
    <div className="editor-panel">
      <div className="panel-header">
        <div className="panel-title">專案經歷</div>
        <button className="btn-add" onClick={addProject}>+ 新增</button>
      </div>

      {data.projects.map((proj, idx) => {
        const indicator = getDropIndicator(proj.id);
        return (
          <div
            key={proj.id}
            className={[
              'card-item',
              isBeingDragged(proj.id) ? 'is-dragging' : '',
              indicator === 'top'    ? 'drop-top'    : '',
              indicator === 'bottom' ? 'drop-bottom'  : '',
            ].filter(Boolean).join(' ')}
            {...getCardProps(proj)}
          >
            <div className="card-item-header">
              <div className="card-item-left">
                <span className="card-drag-handle" title="拖曳以重新排序" {...getHandleProps(proj)}>
                  <GripVertical size={16} strokeWidth={1.75} />
                </span>
                <span className="card-number">#{idx + 1}</span>
              </div>
              <button className="btn-remove" onClick={() => removeProject(proj.id)}>刪除</button>
            </div>
            <div className="fields-grid-2">
              <div className="field-group">
                <label>專案名稱</label>
                <input value={proj.name} placeholder="任務管理系統" onChange={(e) => updateProject(proj.id, { name: e.target.value })} />
              </div>
              <div className="field-group">
                <label>擔任角色</label>
                <input value={proj.role} placeholder="主要開發者" onChange={(e) => updateProject(proj.id, { role: e.target.value })} />
              </div>
              <div className="field-group">
                <label>開始日期</label>
                <input type="month" value={proj.startDate} onChange={(e) => updateProject(proj.id, { startDate: e.target.value })} />
              </div>
              <div className="field-group">
                <label>結束日期</label>
                <input type="month" value={proj.endDate} onChange={(e) => updateProject(proj.id, { endDate: e.target.value })} />
              </div>
            </div>
            <div className="field-group">
              <label>專案連結</label>
              <input type="url" value={proj.url} placeholder="https://github.com/..." onChange={(e) => updateProject(proj.id, { url: e.target.value })} />
            </div>
            <div className="field-group">
              <label>專案描述</label>
              <textarea rows={3} value={proj.description} placeholder="描述專案功能、技術挑戰與成果..." onChange={(e) => updateProject(proj.id, { description: e.target.value })} />
            </div>
            <div className="field-group">
              <label>使用技術</label>
              <div className="skill-tags">
                {proj.technologies.map((t, i) => (
                  <span key={i} className="skill-tag">
                    {t}
                    <button onClick={() => updateProject(proj.id, { technologies: proj.technologies.filter((_, j) => j !== i) })}>×</button>
                  </span>
                ))}
              </div>
              <div className="skill-add-row">
                <input
                  value={techInputMap[proj.id] || ''}
                  placeholder="輸入技術後按 Enter"
                  onChange={(e) => setTechInputMap((m) => ({ ...m, [proj.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(proj.id); } }}
                />
                <button className="btn-add-small" onClick={() => addTech(proj.id)}>新增</button>
              </div>
            </div>
          </div>
        );
      })}

      {data.projects.length === 0 && <div className="empty-state">點擊「新增」加入專案</div>}
    </div>
  );
}
