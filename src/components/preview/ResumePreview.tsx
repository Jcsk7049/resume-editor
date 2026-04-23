import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Scissors, Upload, Download, ChevronDown, Printer, FileText, Database, GripVertical, Pencil } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import ModernTemplate from '../../templates/ModernTemplate';
import ClassicTemplate from '../../templates/ClassicTemplate';
import MinimalTemplate from '../../templates/MinimalTemplate';
import EditorialTemplate from '../../templates/EditorialTemplate';
import DevTemplate from '../../templates/DevTemplate';
import SwissTemplate from '../../templates/SwissTemplate';

const TEMPLATE_LABELS: Record<string, string> = {
  modern: '現代風', classic: '經典風', minimal: '簡約風',
  editorial: '編輯風', dev: '開發者', swiss: '瑞士式',
};

const SECTION_LABELS: Record<string, string> = {
  personal: '個人資訊', experience: '經歷', education: '學歷',
  skills: '技能', projects: '專案', certifications: '證照', languages: '語言',
};

const TEMPLATE_MAP = {
  modern: ModernTemplate, classic: ClassicTemplate, minimal: MinimalTemplate,
  editorial: EditorialTemplate, dev: DevTemplate, swiss: SwissTemplate,
} as const;

const A4_MM = 297;
const A4_PX = 794; // 210mm at 96dpi
const MAX_PAGES = 5;

function PageBreakOverlay({ pageCount }: { pageCount: number }) {
  return (
    <div className="page-break-overlay" aria-hidden="true">
      {Array.from({ length: pageCount - 1 }, (_, i) => {
        const page = i + 1;
        return (
          <div key={page} className="page-break-line" style={{ top: `${page * A4_MM}mm` }}>
            <div className="page-break-rule" />
            <div className="page-break-labels">
              <span className="page-break-tag page-break-tag-above">第 {page} 頁</span>
              <span className="page-break-divider">｜</span>
              <span className="page-break-tag page-break-tag-below">第 {page + 1} 頁</span>
            </div>
            <div className="page-break-rule" />
          </div>
        );
      })}
    </div>
  );
}

interface SectionTop {
  id: string;
  top: number; // unscaled px from printRef top
  label: string;
}

export interface ResumePreviewProps {
  onEditSection?: (sectionId: string) => void;
}

export interface ResumePreviewHandle {
  print: () => void;
}

const ResumePreview = forwardRef<ResumePreviewHandle, ResumePreviewProps>(
function ResumePreview({ onEditSection }, ref) {
  const { data, settings, reorderSections } = useResumeStore();
  const printRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [showBreaks, setShowBreaks] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const [scale, setScale] = useState(1);
  const [renderedHeight, setRenderedHeight] = useState(0);
  const [sectionTops, setSectionTops] = useState<SectionTop[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTargetTop, setDropTargetTop] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // ── Responsive scale: fit A4 page within container width ──
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(() => {
      const w = containerRef.current?.clientWidth ?? 0;
      if (w === 0) return;
      setScale(Math.min(1, Math.max(0.3, (w - 32) / A4_PX)));
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ── Close export menu on outside click ──
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  // ── Page content height → pageCount + height compensation ──
  useEffect(() => {
    if (!printRef.current) return;
    const obs = new ResizeObserver(() => {
      if (!printRef.current) return;
      const h = printRef.current.scrollHeight;
      setRenderedHeight(h);
      const mm = h * (25.4 / 96);
      setPageCount(Math.max(1, Math.min(MAX_PAGES, Math.ceil(mm / A4_MM))));
    });
    obs.observe(printRef.current);
    return () => obs.disconnect();
  }, [data, settings]);

  // ── Measure all [data-section] positions once after render ──
  // rect.top - pageRect.top is scroll-independent (both shift equally on scroll)
  const measureSections = useCallback(() => {
    if (!printRef.current) return;
    const pageEl = printRef.current;
    const pageRect = pageEl.getBoundingClientRect();
    const els = pageEl.querySelectorAll('[data-section]');
    const tops: SectionTop[] = Array.from(els).map(el => {
      const rect = el.getBoundingClientRect();
      const id = el.getAttribute('data-section')!;
      return {
        id,
        top: (rect.top - pageRect.top) / scale,
        label: SECTION_LABELS[id] || id,
      };
    });
    setSectionTops(tops);
  }, [scale]);

  useEffect(() => {
    // Delay slightly so React finishes painting before we measure
    const t = setTimeout(measureSections, 60);
    return () => clearTimeout(t);
  }, [data, settings, scale, measureSections]);

  // ── DnD: drag start from section handle ──
  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId);
    setDragging(sectionId);
  };

  // ── DnD: drag over the page ──
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!printRef.current || !dragging) return;
    const pageRect = printRef.current.getBoundingClientRect();
    const sections = printRef.current.querySelectorAll('[data-section]');
    for (const el of Array.from(sections)) {
      const rect = el.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const id = el.getAttribute('data-section')!;
        if (id !== dragging) {
          setDropTargetTop((rect.top - pageRect.top) / scale);
          return;
        }
      }
    }
    setDropTargetTop(null);
  }, [dragging, scale]);

  // ── DnD: drop → reorder data.sections ──
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData('text/plain');
    if (!printRef.current || !fromId) { reset(); return; }
    const sections = printRef.current.querySelectorAll('[data-section]');
    let toId: string | null = null;
    for (const el of Array.from(sections)) {
      const rect = el.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const id = el.getAttribute('data-section')!;
        if (id !== fromId) { toId = id; break; }
      }
    }
    if (toId) {
      const arr = [...data.sections];
      const fi = arr.findIndex(s => s.type === fromId);
      const ti = arr.findIndex(s => s.type === toId);
      if (fi !== -1 && ti !== -1) {
        const [moved] = arr.splice(fi, 1);
        arr.splice(ti, 0, moved);
        reorderSections(arr);
      }
    }
    reset();
    function reset() { setDragging(null); setDropTargetTop(null); }
  }, [data.sections, reorderSections]);

  // ── Print / export handlers ──
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try { return Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); }
        catch { return ''; }
      })
      .join('\n');
    const clone = content.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-no-print]').forEach(el => el.remove());
    printWindow.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8">
  <title>${data.personal.name || '履歷'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: 'Inter', 'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif;
    }
    @page { size: A4; margin: 0; }
    @media print {
      html, body { width: 210mm; height: 297mm; overflow: hidden; }
      h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }
      [style*="page-break-inside: avoid"],
      [style*="breakInside"] { page-break-inside: avoid; break-inside: avoid; }
      [data-section] { page-break-inside: avoid; break-inside: avoid; }
      [data-no-print] { display: none !important; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    ${styles}
  </style>
</head><body>${clone.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.document.fonts.ready.then(() => {
      printWindow.print();
      printWindow.close();
    });
  };

  useImperativeHandle(ref, () => ({ print: handlePrint }));

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ data, settings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.personal.name || 'resume'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (parsed.data) useResumeStore.setState({ data: parsed.data });
          if (parsed.settings) useResumeStore.setState({ settings: parsed.settings });
        } catch { alert('無效的 JSON 檔案，請確認格式正確。'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportWord = () => {
    const content = printRef.current;
    if (!content) return;
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try { return Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); }
        catch { return ''; }
      })
      .join('\n');
    const clone = content.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-no-print]').forEach(el => el.remove());
    const wordHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <title>${data.personal.name || '履歷'}</title>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <style>
    @page WordSection1 { size: 21cm 29.7cm; margin: 2cm 2.5cm 2cm 2.5cm; }
    div.WordSection1 { page: WordSection1; }
    body { font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', 'Inter', Arial, sans-serif; font-size: 10.5pt; color: #1f2937; line-height: 1.5; }
    * { box-sizing: border-box; }
    ${styles}
  </style>
</head>
<body><div class="WordSection1">${clone.innerHTML}</div></body></html>`;
    const blob = new Blob([wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.personal.name || 'resume'}_${new Date().toISOString().slice(0, 10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const TemplateComponent = TEMPLATE_MAP[settings.template as keyof typeof TEMPLATE_MAP] ?? ModernTemplate;
  const templateLabel = TEMPLATE_LABELS[settings.template] ?? settings.template;
  const heightComp = renderedHeight > 0 ? `${(scale - 1) * renderedHeight}px` : '0px';

  return (
    <div className="preview-container" ref={containerRef}>
      {/* Toolbar */}
      <div className="preview-toolbar">
        <div className="preview-toolbar-left">
          <span className="preview-label">預覽</span>
          <span className="preview-template-badge">{templateLabel}</span>
          {pageCount > 1 && <span className="preview-page-count">{pageCount} 頁</span>}
          {scale < 0.99 && (
            <span className="preview-scale-badge">{Math.round(scale * 100)}%</span>
          )}
        </div>
        <div className="preview-actions">
          <button
            className={`btn-toolbar btn-toolbar-toggle ${showBreaks ? 'active' : ''}`}
            onClick={() => setShowBreaks(v => !v)}
            title={showBreaks ? '隱藏分界線' : '顯示 A4 分界線'}
          >
            <Scissors size={13} strokeWidth={2} /> 分頁線
          </button>
          <button className="btn-toolbar" onClick={handleImportJSON} title="從 JSON 檔案還原資料">
            <Upload size={13} strokeWidth={2} /> 匯入
          </button>

          {/* Export dropdown */}
          <div className="export-menu-wrap" ref={exportMenuRef}>
            <button
              className={`btn-toolbar export-toggle ${exportOpen ? 'active' : ''}`}
              onClick={() => setExportOpen(v => !v)}
              title="選擇匯出格式"
            >
              <Download size={13} strokeWidth={2} /> 匯出 <ChevronDown size={11} strokeWidth={2} />
            </button>
            {exportOpen && (
              <div className="export-dropdown">
                <div className="export-dropdown-title">選擇匯出格式</div>
                <button className="export-option" onClick={() => { handlePrint(); setExportOpen(false); }}>
                  <span className="export-option-icon"><Printer size={16} strokeWidth={1.75} /></span>
                  <div className="export-option-body">
                    <div className="export-option-name">PDF</div>
                    <div className="export-option-desc">高品質列印，適合投遞履歷</div>
                  </div>
                </button>
                <button className="export-option" onClick={handleExportWord}>
                  <span className="export-option-icon"><FileText size={16} strokeWidth={1.75} /></span>
                  <div className="export-option-body">
                    <div className="export-option-name">Word 文件 (.doc)</div>
                    <div className="export-option-desc">可在 Microsoft Word 中繼續編輯</div>
                  </div>
                </button>
                <button className="export-option" onClick={() => { handleExportJSON(); setExportOpen(false); }}>
                  <span className="export-option-icon"><Database size={16} strokeWidth={1.75} /></span>
                  <div className="export-option-body">
                    <div className="export-option-name">JSON 備份</div>
                    <div className="export-option-desc">完整資料備份，可隨時還原</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable preview area */}
      <div className="preview-scroll">
        <div
          className="preview-page-wrapper"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={() => { setDragging(null); setDropTargetTop(null); }}
        >
          <div
            className="page-scale-wrap"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              marginBottom: heightComp,
            }}
          >
            {showBreaks && (
              <div className="page-ruler" data-no-print="true">
                {Array.from({ length: pageCount }, (_, i) => (
                  <div key={i} className="page-ruler-item" style={{ height: `${A4_MM}mm` }}>
                    <span className="page-ruler-label">P{i + 1}</span>
                  </div>
                ))}
              </div>
            )}

            {/* A4 page */}
            <div
              className="preview-page"
              ref={printRef}
              style={{ position: 'relative' }}
            >
              <TemplateComponent data={data} settings={settings} />
              {showBreaks && pageCount > 1 && <PageBreakOverlay pageCount={pageCount} />}

              {/* Always-visible section edit + drag handles */}
              {sectionTops
                .filter(s => s.id !== dragging)
                .map(section => (
                  <div
                    key={section.id}
                    data-no-print="true"
                    className="section-float"
                    style={{ top: section.top }}
                  >
                    <div
                      className="section-float-handle"
                      draggable
                      onDragStart={(e) => handleDragStart(e, section.id)}
                      title="拖曳以調整順序"
                    >
                      <GripVertical size={14} strokeWidth={2} />
                    </div>
                    <button
                      className="section-float-edit"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); onEditSection?.(section.id); }}
                    >
                      <Pencil size={12} strokeWidth={2} /> {section.label}
                    </button>
                  </div>
                ))}

              {/* Drop target indicator line */}
              {dragging && dropTargetTop !== null && (
                <div
                  data-no-print="true"
                  className="section-drop-line"
                  style={{ top: dropTargetTop }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ResumePreview;
