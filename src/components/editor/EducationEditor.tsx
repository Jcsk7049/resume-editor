import React from 'react';
import { useResumeStore } from '../../store/resumeStore';

export default function EducationEditor() {
  const { data, addEducation, updateEducation, removeEducation } = useResumeStore();

  return (
    <div className="editor-panel">
      <div className="panel-header">
        <div className="panel-title">學歷</div>
        <button className="btn-add" onClick={addEducation}>+ 新增</button>
      </div>

      {data.education.map((edu, idx) => (
        <div className="card-item" key={edu.id}>
          <div className="card-item-header">
            <span className="card-number">#{idx + 1}</span>
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
      ))}

      {data.education.length === 0 && <div className="empty-state">點擊「新增」加入學歷</div>}
    </div>
  );
}
