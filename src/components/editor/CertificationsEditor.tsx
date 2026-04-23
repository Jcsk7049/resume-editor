import React from 'react';
import { GripVertical } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { useDraggableList } from './useDraggableList';

export default function CertificationsEditor() {
  const { data, addCertification, updateCertification, removeCertification, reorderCertifications } = useResumeStore();
  const { getCardProps, getHandleProps, isBeingDragged, getDropIndicator } = useDraggableList(
    data.certifications,
    reorderCertifications,
  );

  return (
    <div className="editor-panel">
      <div className="panel-header">
        <div className="panel-title">證照 / 認證</div>
        <button className="btn-add" onClick={addCertification}>+ 新增</button>
      </div>

      {data.certifications.map((cert, idx) => {
        const indicator = getDropIndicator(cert.id);
        return (
          <div
            key={cert.id}
            className={[
              'card-item',
              isBeingDragged(cert.id) ? 'is-dragging' : '',
              indicator === 'top'    ? 'drop-top'    : '',
              indicator === 'bottom' ? 'drop-bottom'  : '',
            ].filter(Boolean).join(' ')}
            {...getCardProps(cert)}
          >
            <div className="card-item-header">
              <div className="card-item-left">
                <span className="card-drag-handle" title="拖曳以重新排序" {...getHandleProps(cert)}>
                  <GripVertical size={16} strokeWidth={1.75} />
                </span>
                <span className="card-number">#{idx + 1}</span>
              </div>
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
        );
      })}

      {data.certifications.length === 0 && <div className="empty-state">點擊「新增」加入證照</div>}
    </div>
  );
}
