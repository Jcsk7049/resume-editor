import React from 'react';
import { useResumeStore } from '../../store/resumeStore';

export default function CertificationsEditor() {
  const { data, addCertification, updateCertification, removeCertification } = useResumeStore();

  return (
    <div className="editor-panel">
      <div className="panel-header">
        <div className="panel-title">證照 / 認證</div>
        <button className="btn-add" onClick={addCertification}>+ 新增</button>
      </div>

      {data.certifications.map((cert, idx) => (
        <div className="card-item" key={cert.id}>
          <div className="card-item-header">
            <span className="card-number">#{idx + 1}</span>
            <button className="btn-remove" onClick={() => removeCertification(cert.id)}>刪除</button>
          </div>
          <div className="fields-grid-2">
            <div className="field-group" style={{ gridColumn: 'span 2' }}>
              <label>證照名稱</label>
              <input value={cert.name} placeholder="AWS Certified Developer" onChange={(e) => updateCertification(cert.id, { name: e.target.value })} />
            </div>
            <div className="field-group">
              <label>發行機構</label>
              <input value={cert.issuer} placeholder="Amazon Web Services" onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })} />
            </div>
            <div className="field-group">
              <label>取得日期</label>
              <input type="month" value={cert.date} onChange={(e) => updateCertification(cert.id, { date: e.target.value })} />
            </div>
            <div className="field-group" style={{ gridColumn: 'span 2' }}>
              <label>驗證連結</label>
              <input type="url" value={cert.url} placeholder="https://..." onChange={(e) => updateCertification(cert.id, { url: e.target.value })} />
            </div>
          </div>
        </div>
      ))}

      {data.certifications.length === 0 && <div className="empty-state">點擊「新增」加入證照</div>}
    </div>
  );
}
