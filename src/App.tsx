import React, { useState, useRef, useEffect } from 'react';
import {
  User, Briefcase, GraduationCap, Zap, FolderOpen,
  Award, Globe, Palette, FileText, Sparkles, Upload,
  Download, Pencil, X, Settings, Database, Eye, Loader2,
} from 'lucide-react';
import { useResumeStore } from './store/resumeStore';
import { optimizeLayout } from './store/optimizeLayout';
import ImportModal from './components/ImportModal';
import AuthBar from './components/AuthBar';
import FirebaseSetupModal from './components/FirebaseSetupModal';
import PersonalEditor from './components/editor/PersonalEditor';
import ExperienceEditor from './components/editor/ExperienceEditor';
import EducationEditor from './components/editor/EducationEditor';
import SkillsEditor from './components/editor/SkillsEditor';
import ProjectsEditor from './components/editor/ProjectsEditor';
import CertificationsEditor from './components/editor/CertificationsEditor';
import LanguagesEditor from './components/editor/LanguagesEditor';
import SettingsEditor from './components/editor/SettingsEditor';
import DataEditor from './components/editor/DataEditor';
import ResumePreview, { type ResumePreviewHandle } from './components/preview/ResumePreview';
import './App.css';
import type { LucideIcon } from 'lucide-react';
import type { ResumeData } from './types/resume';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  section: 'content' | 'design';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'personal',       label: '個人資訊', icon: User,           section: 'content' },
  { id: 'experience',     label: '經歷',     icon: Briefcase,      section: 'content' },
  { id: 'education',      label: '學歷',     icon: GraduationCap,  section: 'content' },
  { id: 'skills',         label: '技能',     icon: Zap,            section: 'content' },
  { id: 'projects',       label: '專案',     icon: FolderOpen,     section: 'content' },
  { id: 'certifications', label: '證照',     icon: Award,          section: 'content' },
  { id: 'languages',      label: '語言',     icon: Globe,          section: 'content' },
  { id: 'settings',       label: '外觀設定', icon: Palette,        section: 'design'  },
  { id: 'data',           label: '數據管理', icon: Database,       section: 'design'  },
];

const EDITORS: Record<string, React.ComponentType> = {
  personal: PersonalEditor,
  experience: ExperienceEditor,
  education: EducationEditor,
  skills: SkillsEditor,
  projects: ProjectsEditor,
  certifications: CertificationsEditor,
  languages: LanguagesEditor,
  settings: SettingsEditor,
  data: DataEditor,
};

function getNavCount(id: string, data: ResumeData): number | null {
  const map: Record<string, number> = {
    experience: data.experience.length,
    education: data.education.length,
    skills: data.skills.reduce((a: number, s: { skills: string[] }) => a + s.skills.length, 0),
    projects: data.projects.length,
    certifications: data.certifications.length,
    languages: data.languages.length,
  };
  return map[id] ?? null;
}

interface OptimizeToastProps {
  reasons: string[];
  onConfirm: () => void;
  onCancel: () => void;
}
function OptimizeToast({ reasons, onConfirm, onCancel }: OptimizeToastProps) {
  return (
    <div className="optimize-toast-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="optimize-toast">
        <div className="optimize-toast-icon">
          <Sparkles size={20} />
        </div>
        <div className="optimize-toast-title">一鍵最佳化建議</div>
        <ul className="optimize-toast-list">
          {reasons.map((r, i) => (
            <li key={i} className="optimize-toast-item">{r}</li>
          ))}
        </ul>
        <div className="optimize-toast-actions">
          <button className="optimize-cancel" onClick={onCancel}>取消</button>
          <button className="optimize-confirm" onClick={onConfirm}>套用變更</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('personal');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<ReturnType<typeof optimizeLayout> | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFirebaseSetup, setShowFirebaseSetup] = useState(false);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const previewRef = useRef<ResumePreviewHandle>(null);

  // On mobile, ensure drawer is open so active nav item highlights correctly
  useEffect(() => {
    if (mobileView === 'edit' && window.innerWidth <= 1024) {
      setDrawerOpen(true);
    }
  }, [mobileView]);

  const { data, settings, updateSettings } = useResumeStore();
  const ActiveEditor = EDITORS[activeTab];
  const activeNav = NAV_ITEMS.find(n => n.id === activeTab);

  const handleOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      const result = optimizeLayout(data, settings);
      setOptimizeResult(result);
      setOptimizing(false);
    }, 320);
  };

  const handleOptimizeConfirm = () => {
    if (optimizeResult) updateSettings(optimizeResult.settings);
    setOptimizeResult(null);
  };

  const handleNavClick = (id: string) => {
    if (activeTab === id && drawerOpen) {
      setDrawerOpen(false);
    } else {
      setActiveTab(id);
      setDrawerOpen(true);
      setFabOpen(false);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.preview-toolbar')) return;
    if (mobileView === 'preview') return;
    if (!drawerOpen) setDrawerOpen(true);
  };

  const handleMobileViewChange = (view: 'edit' | 'preview') => {
    setMobileView(view);
    setFabOpen(false);
    if (view === 'preview') {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
    }
  };

  const handleEditSection = (sectionId: string) => {
    setActiveTab(sectionId);
    setDrawerOpen(true);
    setFabOpen(false);
  };

  const contentItems = NAV_ITEMS.filter(n => n.section === 'content');
  const designItems  = NAV_ITEMS.filter(n => n.section === 'design');

  return (
    <div className="app">
      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-logo">
            <FileText size={15} color="#ffffff" strokeWidth={2} />
          </div>
          <span className="brand-name">履歷設計器</span>
          <span className="brand-tag">BETA</span>
        </div>
        <div className="topbar-divider" />
        <span className="topbar-resume-name">{data.personal.name || '未命名履歷'}</span>
        <div className="topbar-actions">
          <AuthBar onShowSetup={() => setShowFirebaseSetup(true)} />
          <button className="topbar-btn" onClick={() => setShowImport(true)}>
            <Upload size={14} strokeWidth={2} /> 掃描匯入
          </button>
          <button
            className={`btn-optimize ${optimizing ? 'loading' : ''}`}
            onClick={handleOptimize}
            disabled={optimizing}
          >
            {optimizing
              ? <Loader2 size={14} strokeWidth={2} className="icon-spin" />
              : <Sparkles size={14} strokeWidth={2} />
            }
            {optimizing ? '分析中…' : '一鍵最佳化'}
          </button>
        </div>
      </header>

      {/* ── Workspace ── */}
      <div className={`workspace ${mobileView === 'preview' ? 'mobile-preview' : 'mobile-edit'}`}>
        {/* Floating left navigation */}
        <nav className="floating-nav">
          <div className="fnav-section">
            {contentItems.map(item => {
              const count = getNavCount(item.id, data);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`fnav-item ${activeTab === item.id && drawerOpen ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {count !== null && count > 0 && <span className="fnav-dot" />}
                </button>
              );
            })}
          </div>
          <div className="fnav-spacer" />
          <div className="fnav-section fnav-section-bottom">
            {designItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`fnav-item ${activeTab === item.id && drawerOpen ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        </nav>

        {/* Editor drawer — slides in as overlay */}
        <div className={`editor-drawer ${drawerOpen ? 'open' : ''}`}>
          <div className="drawer-header">
            <div className="drawer-title">
              {activeNav && <activeNav.icon size={16} strokeWidth={1.75} />}
              <span>{activeNav?.label}</span>
            </div>
            <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
              <X size={14} strokeWidth={2} />
            </button>
          </div>
          <div className="drawer-body">
            {ActiveEditor && <ActiveEditor />}
          </div>
        </div>

        {/* Scrim — closes drawer on click */}
        {drawerOpen && (
          <div className="drawer-scrim" onClick={() => setDrawerOpen(false)} />
        )}

        {/* Preview workspace — centered A4 canvas */}
        <div className={`preview-workspace ${drawerOpen ? 'dimmed' : ''}`}>
          <div className="preview-edit-hint">
            <Pencil size={12} strokeWidth={2} /> 點擊右側按鈕編輯區塊，拖曳 ⠿ 調整順序
          </div>
          <div className="preview-canvas-wrap" onClick={handlePreviewClick}>
            <ResumePreview ref={previewRef} onEditSection={handleEditSection} />
          </div>
        </div>
      </div>

      {/* FAB — desktop only floating actions */}
      <div className="fab-wrap">
        {fabOpen && (
          <div className="fab-popup">
            <div className="fab-popup-header">
              <span>外觀設定</span>
              <button className="drawer-close" onClick={() => setFabOpen(false)}>
                <X size={14} strokeWidth={2} />
              </button>
            </div>
            <div className="fab-popup-body">
              <SettingsEditor />
            </div>
          </div>
        )}
        <div className="fab-row">
          <button
            className="fab-btn fab-pdf"
            onClick={() => previewRef.current?.print()}
            title="下載 PDF"
          >
            <Download size={18} strokeWidth={1.75} />
          </button>
          <button
            className={`fab-btn ${fabOpen ? 'open' : ''}`}
            onClick={() => { setFabOpen(o => !o); setDrawerOpen(false); }}
            title="外觀設定"
          >
            {fabOpen
              ? <X size={18} strokeWidth={2} />
              : <Settings size={18} strokeWidth={1.75} />
            }
          </button>
        </div>
      </div>

      {/* Mobile bottom nav — Edit / Preview toggle (hidden on desktop) */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mbn-tab ${mobileView === 'edit' ? 'active' : ''}`}
          onClick={() => handleMobileViewChange('edit')}
        >
          <Pencil size={20} strokeWidth={1.75} />
          <span className="mbn-tab-label">編輯</span>
        </button>
        <button
          className={`mbn-tab ${mobileView === 'preview' ? 'active' : ''}`}
          onClick={() => handleMobileViewChange('preview')}
        >
          <Eye size={20} strokeWidth={1.75} />
          <span className="mbn-tab-label">預覽</span>
        </button>
      </nav>

      {/* Modals */}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showFirebaseSetup && <FirebaseSetupModal onClose={() => setShowFirebaseSetup(false)} />}

      {optimizeResult && (
        <OptimizeToast
          reasons={optimizeResult.reasons}
          onConfirm={handleOptimizeConfirm}
          onCancel={() => setOptimizeResult(null)}
        />
      )}
    </div>
  );
}
