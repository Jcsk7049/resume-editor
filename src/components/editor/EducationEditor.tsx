import React from 'react';
import { GripVertical } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { useDraggableList } from './useDraggableList';

export default function EducationEditor() {
  const { data, addEducation, updateEducation, removeEducation, reorderEducation } = useResumeStore();
  const { getCardProps, getHandleProps, isBeingDragged, getDropIndicator } = useDraggableList(
    data.education,
    reorderEducation,
  );

  return (
    <div className="editor-panel">
      <div className="panel-header">
        <div className="panel-title">學歷</div>
        <button className="btn-add" onClick={addEducation}>+ 新增</button>
      </div>

      {data.education.map((edu, idx) => {
        const indicator = getDropIndicator(edu.id);
        return (
          <div
            key={edu.id}
            className={[
              'card-item',
              isBeingDragged(edu.id) ? 'is-dragging' : '',
              indicator === 'top'    ? 'drop-top'    : '',
              indicator === 'bottom' ? 'drop-bottom'  : '',
            ].filter(Boolean).join(' ')}
            {...getCardProps(edu)}
          >
            <div className="card-item-header">
              <div className="card-item-left">
                <span className="card-drag-handle" title="拖曳以重新排序" {...getHandleProps(edu)}>
                  <GripVertical size={16} strokeWidth={1.75} />
                </span>
                <span className="card-number">#{idx + 1}</span>
              </div>
              <button className="btn-remove" onClick={() => removeEducation(edu.id)}>刪除</button>
            </div>
            <div className="fields-grid-2">
              <div className="field-group">
                <label>學校名稱</label>
                <input value={edu.school} placeholder="國立台灣大學" onChange={(e) => updateEducation(edu.id, { school: e.target.value })} />
              </div>
              <div className="field-group">
                <label>學位</label>
                <select value={edu.degree} onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}>
                  <option value="">請選擇</option>
                  <option>學士</option><option>碩士</option><option>博士</option>
                  <option>副學士</option><option>高中職</option>
                </select>
              </div>
              <div className="field-group">
                <label>科系 / 主修</label>
                <input value={edu.field} placeholder="資訊工程學系" onChange={(e) => updateEducation(edu.id, { field: e.target.value })} />
              </div>
              <div className="field-group">
                <label>GPA</label>
                <input value={edu.gpa} placeholder="3.8 / 4.0" onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })} />
              </div>
              <div className="field-group">
                <label>開始日期</label>
                <input type="month" value={edu.startDate} onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })} />
              </div>
              <div className="field-group">
                <label>結束日期</label>
                <input type="month" value={edu.endDate} onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })} />
              </div>
            </div>
            <div className="field-group">
              <label>附加說明</label>
              <textarea rows={2} value={edu.description} placeholder="榮譽、獎項、論文主題..." onChange={(e) => updateEducation(edu.id, { description: e.target.value })} />
            </div>
          </div>
        );
      })}

      {data.education.length === 0 && <div className="empty-state">點擊「新增」加入學歷</div>}
    </div>
  );
}
