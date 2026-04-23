import React, { useState, useRef, useCallback } from 'react';
import { FileText, Image, AlignLeft, Database, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { extractTextFromPDF, extractTextFromImage } from '../utils/pdfExtract';
import { parseResumeText } from '../utils/resumeParser';
import { useResumeStore } from '../store/resumeStore';
import type { ResumeData, ResumeSettings } from '../types/resume';

type Tab = 'pdf' | 'image' | 'text' | 'json';
type Stage = 'idle' | 'extracting' | 'parsing' | 'preview' | 'preview-json' | 'done' | 'error';

interface Props {
  onClose: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  personal: '個人資訊',
  experience: '工作經歷',
  education: '學歷',
  skills: '技能',
  projects: '專案',
  certifications: '證照',
  languages: '語言',
};

function countParsed(parsed: Partial<ResumeData>): Array<{ key: string; count: number }> {
  const result: Array<{ key: string; count: number }> = [];
  if (parsed.personal?.name) result.push({ key: 'personal', count: 1 });
  if (parsed.experience?.length) result.push({ key: 'experience', count: parsed.experience.length });
  if (parsed.education?.length) result.push({ key: 'education', count: parsed.education.length });
  if (parsed.skills?.length) result.push({ key: 'skills', count: parsed.skills.reduce((a, s) => a + s.skills.length, 0) });
  if (parsed.projects?.length) result.push({ key: 'projects', count: parsed.projects.length });
  if (parsed.certifications?.length) result.push({ key: 'certifications', count: parsed.certifications.length });
  if (parsed.languages?.length) result.push({ key: 'languages', count: parsed.languages.length });
  return result;
}

export default function ImportModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('pdf');
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<Partial<ResumeData> | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [jsonData, setJsonData] = useState<{ data: ResumeData; settings?: ResumeSettings } | null>(null);
  const [jsonFileName, setJsonFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const { data: currentData, updatePersonal, addExperience, updateExperience,
          addEducation, updateEducation, addSkillCategory, updateSkillCategory,
          addProject, updateProject, addCertification, updateCertification,
          addLanguage, updateLanguage } = useResumeStore();

  const runParse = useCallback(async (text: string) => {
    setStage('parsing');
    setStatusMsg('解析履歷結構…');
    await new Promise(r => setTimeout(r, 100)); // allow UI update
    try {
      const parsed = parseResumeText(text);
      setParsedData(parsed);
      setRawText(text);
      setStage('preview');
    } catch (e) {
      setErrorMsg('解析失敗，請嘗試「貼上文字」模式。');
      setStage('error');
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setStage('extracting');
    setProgress(0);
    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setStatusMsg('讀取 PDF 文字層…');
        text = await extractTextFromPDF(file);
        if (!text.trim()) {
          setStatusMsg('PDF 無文字層，改用 OCR 掃描…');
          text = await extractTextFromImage(file, setProgress);
        }
      } else if (file.type.startsWith('image/')) {
        setStatusMsg('OCR 辨識中，請稍候（可能需要 30~60 秒）…');
        text = await extractTextFromImage(file, setProgress);
      } else {
        throw new Error('不支援的檔案格式');
      }
      await runParse(text);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : '處理失敗，請換用其他方式。');
      setStage('error');
    }
  }, [runParse]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleTextParse = () => {
    if (!rawText.trim()) return;
    runParse(rawText);
  };

  const handleJsonFile = useCallback((file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setErrorMsg('請選擇 .json 格式的檔案。');
      setStage('error');
      return;
    }
    setJsonFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        // Support both { data, settings } wrapper and raw ResumeData
        const resumeData: ResumeData = parsed.data ?? parsed;
        if (!resumeData.personal || typeof resumeData.personal !== 'object') {
          throw new Error('JSON 結構不符：缺少 personal 欄位，請確認是由本程式匯出的履歷 JSON。');
        }
        setJsonData({ data: resumeData, settings: parsed.settings });
        setStage('preview-json');
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : '無效的 JSON 檔案，請確認格式正確。');
        setStage('error');
      }
    };
    reader.onerror = () => {
      setErrorMsg('讀取檔案失敗，請重試。');
      setStage('error');
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  const handleJsonDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleJsonFile(file);
  }, [handleJsonFile]);

  const handleApplyJson = () => {
    if (!jsonData) return;
    useResumeStore.setState(s => ({
      data: { ...s.data, ...jsonData.data },
      ...(jsonData.settings ? { settings: jsonData.settings } : {}),
    }));
    setStage('done');
    setTimeout(onClose, 1200);
  };

  const handleApply = () => {
    if (!parsedData) return;
    const store = useResumeStore.getState();

    // Merge personal
    if (parsedData.personal) {
      const p = parsedData.personal;
      store.updatePersonal({
        ...(p.name && { name: p.name }),
        ...(p.title && { title: p.title }),
        ...(p.email && { email: p.email }),
        ...(p.phone && { phone: p.phone }),
        ...(p.location && { location: p.location }),
        ...(p.linkedin && { linkedin: p.linkedin }),
        ...(p.github && { github: p.github }),
        ...(p.website && { website: p.website }),
        ...(p.summary && { summary: p.summary }),
      });
    }

    // Replace experience
    if (parsedData.experience?.length) {
      // Clear existing then add
      useResumeStore.setState(s => ({
        data: { ...s.data, experience: parsedData.experience! },
      }));
    }

    // Replace education
    if (parsedData.education?.length) {
      useResumeStore.setState(s => ({
        data: { ...s.data, education: parsedData.education! },
      }));
    }

    // Replace skills
    if (parsedData.skills?.length) {
      useResumeStore.setState(s => ({
        data: { ...s.data, skills: parsedData.skills! },
      }));
    }

    // Replace projects
    if (parsedData.projects?.length) {
      useResumeStore.setState(s => ({
        data: { ...s.data, projects: parsedData.projects! },
      }));
    }

    // Replace certifications
    if (parsedData.certifications?.length) {
      useResumeStore.setState(s => ({
        data: { ...s.data, certifications: parsedData.certifications! },
      }));
    }

    // Replace languages
    if (parsedData.languages?.length) {
      useResumeStore.setState(s => ({
        data: { ...s.data, languages: parsedData.languages! },
      }));
    }

    setStage('done');
    setTimeout(onClose, 1200);
  };

  const parsed = countParsed(parsedData ?? {});

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="import-modal">
        {/* Header */}
        <div className="import-modal-header">
          <div>
            <div className="import-modal-title">掃描 / 匯入現有履歷</div>
            <div className="import-modal-sub">支援 PDF、圖片掃描、貼上文字、JSON 備份還原</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={14} strokeWidth={2} /></button>
        </div>

        {stage === 'done' ? (
          <div className="import-success">
            <div className="import-success-icon"><CheckCircle size={22} strokeWidth={2} /></div>
            <div className="import-success-text">匯入成功！資料已填入編輯器。</div>
          </div>
        ) : stage === 'error' ? (
          <div className="import-error-wrap">
            <div className="import-error-icon"><AlertCircle size={22} strokeWidth={2} /></div>
            <div className="import-error-text">{errorMsg}</div>
            <button className="btn-add" onClick={() => { setStage('idle'); setErrorMsg(''); }}>
              重試
            </button>
          </div>
        ) : stage === 'preview-json' && jsonData ? (
          <div className="import-preview">
            <div className="import-preview-title">JSON 檔案預覽</div>
            <div className="import-preview-row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <span className="import-preview-key">檔案名稱</span>
              <span className="import-preview-count" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{jsonFileName}</span>
            </div>
            <div className="import-preview-summary">
              {countParsed(jsonData.data).map(({ key, count }) => (
                <div key={key} className="import-preview-row">
                  <span className="import-preview-key">{SECTION_LABELS[key] ?? key}</span>
                  <span className="import-preview-count">{count} 項</span>
                </div>
              ))}
              {jsonData.settings && (
                <div className="import-preview-row">
                  <span className="import-preview-key">外觀設定</span>
                  <span className="import-preview-count">含模板 · 字型 · 配色</span>
                </div>
              )}
            </div>
            {jsonData.data.personal?.name && (
              <div className="import-preview-name">
                姓名：<strong>{jsonData.data.personal.name}</strong>
                {jsonData.data.personal.title && <span className="text-muted"> · {jsonData.data.personal.title}</span>}
              </div>
            )}
            <div className="import-preview-note">
              套用後將完整取代目前的履歷資料{jsonData.settings ? '與外觀設定' : ''}，此操作不可復原。
            </div>
            <div className="import-modal-actions">
              <button className="optimize-cancel" onClick={() => { setStage('idle'); setJsonData(null); setJsonFileName(''); }}>返回</button>
              <button className="optimize-confirm" onClick={handleApplyJson}>套用至編輯器</button>
            </div>
          </div>
        ) : stage === 'preview' && parsedData ? (
          <div className="import-preview">
            <div className="import-preview-title">解析結果預覽</div>
            <div className="import-preview-summary">
              {parsed.length === 0 ? (
                <div className="import-preview-empty">未偵測到結構化內容，請檢查原始文字或手動調整。</div>
              ) : parsed.map(({ key, count }) => (
                <div key={key} className="import-preview-row">
                  <span className="import-preview-key">{SECTION_LABELS[key] ?? key}</span>
                  <span className="import-preview-count">{count} 項</span>
                </div>
              ))}
            </div>

            {parsedData.personal?.name && (
              <div className="import-preview-name">
                偵測到姓名：<strong>{parsedData.personal.name}</strong>
                {parsedData.personal.title && <span className="text-muted"> · {parsedData.personal.title}</span>}
              </div>
            )}

            <div className="import-preview-note">
              套用後將覆蓋對應欄位的現有資料。個人資訊若已有值則合併不覆蓋。
            </div>

            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                查看原始擷取文字
              </summary>
              <textarea
                readOnly
                value={rawText}
                style={{ marginTop: 8, fontSize: 11, height: 120, width: '100%',
                         background: '#f8fafc', borderColor: 'var(--border)', resize: 'vertical' }}
              />
            </details>

            <div className="import-modal-actions">
              <button className="optimize-cancel" onClick={() => setStage('idle')}>返回</button>
              <button className="optimize-confirm" onClick={handleApply}>套用至編輯器</button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="import-tabs">
              {([
                ['pdf',   <FileText size={13} strokeWidth={2} />, 'PDF'],
                ['image', <Image    size={13} strokeWidth={2} />, '圖片'],
                ['text',  <AlignLeft size={13} strokeWidth={2} />, '文字'],
                ['json',  <Database  size={13} strokeWidth={2} />, 'JSON'],
              ] as [Tab, React.ReactNode, string][]).map(([id, icon, label]) => (
                <button
                  key={id}
                  className={`import-tab ${tab === id ? 'active' : ''}`}
                  onClick={() => setTab(id)}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            <div className="import-tab-content">
              {/* PDF / Image drop zone */}
              {(tab === 'pdf' || tab === 'image') && (
                <>
                  <div
                    className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {stage === 'extracting' ? (
                      <div className="drop-zone-loading">
                        <div className="spinner" />
                        <div className="drop-zone-status">{statusMsg}</div>
                        {progress > 0 && (
                          <div className="progress-bar-wrap">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                          </div>
                        )}
                        <div className="drop-zone-hint" style={{ marginTop: 4 }}>
                          {tab === 'image' ? '首次使用需下載 OCR 語言模型（約 30MB），請耐心等候' : ''}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="drop-zone-icon">
                          {tab === 'pdf'
                            ? <FileText size={36} strokeWidth={1.5} color="var(--text-faint)" />
                            : <Image    size={36} strokeWidth={1.5} color="var(--text-faint)" />
                          }
                        </div>
                        <div className="drop-zone-title">
                          {tab === 'pdf' ? '點擊或拖曳 PDF 履歷至此' : '點擊或拖曳圖片 / 掃描件至此'}
                        </div>
                        <div className="drop-zone-hint">
                          {tab === 'pdf'
                            ? '支援一般 PDF（含文字層）及掃描 PDF（自動 OCR）'
                            : '支援 JPG, PNG, WEBP — 首次 OCR 需下載語言模型'}
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={tab === 'pdf' ? '.pdf,application/pdf,image/*' : 'image/*'}
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </>
              )}

              {/* Paste text */}
              {tab === 'text' && (
                <div className="paste-zone">
                  <div className="paste-zone-label">將履歷文字貼入下方（支援中英文混排）</div>
                  <textarea
                    className="paste-textarea"
                    placeholder={'王小明\n全端工程師\nwang@example.com | +886 912 345 678 | 台北市\n\n工作經歷\n\n科技股份有限公司\n資深工程師 | 2022-03 - 至今\n• 主導前端重構\n• 效能提升 40%\n\n學歷\n\n國立台灣大學\n學士 資訊工程 | 2015-2019\n\n技能\n前端：React, TypeScript, Vue\n後端：Node.js, PostgreSQL'}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                  />
                  <button
                    className="btn-add"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={!rawText.trim() || stage === 'parsing'}
                    onClick={handleTextParse}
                  >
                    {stage === 'parsing' ? '解析中…' : '解析並預覽'}
                  </button>
                </div>
              )}

              {/* JSON import */}
              {tab === 'json' && (
                <>
                  <div
                    className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleJsonDrop}
                    onClick={() => jsonInputRef.current?.click()}
                  >
                    <div className="drop-zone-icon">
                      <Database size={36} strokeWidth={1.5} color="var(--text-faint)" />
                    </div>
                    <div className="drop-zone-title">點擊或拖曳 JSON 履歷檔案至此</div>
                    <div className="drop-zone-hint">
                      支援由本程式「匯出 JSON」所產生的 .json 檔，完整還原所有欄位與外觀設定
                    </div>
                  </div>
                  <input
                    ref={jsonInputRef}
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleJsonFile(f); }}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
