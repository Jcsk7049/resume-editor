import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  ResumeData, ResumeSettings, ExperienceItem, EducationItem,
  SkillCategory, ProjectItem, CertificationItem, LanguageItem,
  CustomSection, PersonalInfo, ResumeSection
} from '../types/resume';

const defaultSections: ResumeSection[] = [
  { id: 'personal', type: 'personal', visible: true },
  { id: 'experience', type: 'experience', visible: true },
  { id: 'education', type: 'education', visible: true },
  { id: 'skills', type: 'skills', visible: true },
  { id: 'projects', type: 'projects', visible: true },
  { id: 'certifications', type: 'certifications', visible: true },
  { id: 'languages', type: 'languages', visible: true },
];

const defaultData: ResumeData = {
  personal: {
    name: '王小明',
    title: '全端工程師',
    email: 'wang.xiaoming@email.com',
    phone: '+886 912 345 678',
    location: '台北市, 台灣',
    website: 'https://portfolio.example.com',
    linkedin: 'linkedin.com/in/wangxiaoming',
    github: 'github.com/wangxiaoming',
    summary: '擁有 5 年以上全端開發經驗，熟悉 React、Node.js、TypeScript 等現代技術棧。善於解決複雜問題，具備良好的團隊溝通能力，致力於打造高品質的使用者體驗。',
    avatar: '',
  },
  experience: [
    {
      id: uuidv4(),
      company: '科技股份有限公司',
      role: '資深全端工程師',
      startDate: '2022-03',
      endDate: '',
      current: true,
      location: '台北市',
      description: '• 主導前端架構設計，使用 React + TypeScript 重構舊有系統，效能提升 40%\n• 帶領 3 人團隊開發核心功能模組，準時交付所有里程碑\n• 建立 CI/CD 流程，部署頻率從每月一次提升至每週多次',
    },
    {
      id: uuidv4(),
      company: '新創網路公司',
      role: '前端工程師',
      startDate: '2019-07',
      endDate: '2022-02',
      current: false,
      location: '台北市',
      description: '• 使用 Vue.js 開發 SaaS 產品前端，服務超過 10,000 名用戶\n• 優化頁面載入速度，LCP 從 4.2s 降至 1.8s\n• 撰寫完整單元測試，程式覆蓋率達 85%',
    },
  ],
  education: [
    {
      id: uuidv4(),
      school: '國立台灣大學',
      degree: '學士',
      field: '資訊工程學系',
      startDate: '2015-09',
      endDate: '2019-06',
      gpa: '3.8',
      description: '資訊安全研究室成員，畢業專題榮獲系所優秀獎',
    },
  ],
  skills: [
    { id: uuidv4(), name: '前端技術', skills: ['React', 'TypeScript', 'Vue.js', 'Next.js', 'Tailwind CSS'] },
    { id: uuidv4(), name: '後端技術', skills: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker'] },
    { id: uuidv4(), name: '工具與方法', skills: ['Git', 'CI/CD', 'Agile', 'AWS', 'Figma'] },
  ],
  projects: [
    {
      id: uuidv4(),
      name: '開源任務管理系統',
      role: '主要開發者',
      startDate: '2023-01',
      endDate: '2023-06',
      url: 'https://github.com/example/taskmanager',
      description: '全端任務管理應用，支援即時協作、看板視圖、時間追蹤功能',
      technologies: ['React', 'Node.js', 'Socket.io', 'PostgreSQL'],
    },
  ],
  certifications: [
    {
      id: uuidv4(),
      name: 'AWS Certified Developer – Associate',
      issuer: 'Amazon Web Services',
      date: '2023-05',
      url: '',
    },
  ],
  languages: [
    { id: uuidv4(), language: '中文', proficiency: 'Native' },
    { id: uuidv4(), language: '英文', proficiency: 'Fluent' },
  ],
  customSections: [],
  sections: defaultSections,
};

const defaultSettings: ResumeSettings = {
  template: 'modern',
  fontSize: 14,
  fontFamily: 'Noto Sans TC',
  colorTheme: 'blue',
  colors: {
    primary: '#0284c7',   // 海洋藍（對應 THEMES[0]，確保預設有 active 狀態）
    secondary: '#0369a1',
    accent: '#e0f2fe',
    text: '#1f2937',
    background: '#ffffff',
  },
  pageMargin: 40,
};

export const STORE_VERSION = 2; // bump when data shape changes for migration

export interface StorageInfo {
  bytes: number;
  lastSaved: string; // ISO timestamp
}

export function getStorageInfo(): StorageInfo {
  try {
    const raw = localStorage.getItem('resume-editor-data') ?? '';
    return {
      bytes: new Blob([raw]).size,
      lastSaved: raw ? new Date().toISOString() : '',
    };
  } catch {
    return { bytes: 0, lastSaved: '' };
  }
}

interface ResumeStore {
  data: ResumeData;
  settings: ResumeSettings;
  activeSection: string;
  setActiveSection: (id: string) => void;
  /** Validated bulk import — replaces data (and optionally settings) atomically */
  importData: (data: ResumeData, settings?: ResumeSettings) => void;
  updatePersonal: (personal: Partial<PersonalInfo>) => void;
  addExperience: () => void;
  updateExperience: (id: string, item: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  addEducation: () => void;
  updateEducation: (id: string, item: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;
  addSkillCategory: () => void;
  updateSkillCategory: (id: string, item: Partial<SkillCategory>) => void;
  removeSkillCategory: (id: string) => void;
  addProject: () => void;
  updateProject: (id: string, item: Partial<ProjectItem>) => void;
  removeProject: (id: string) => void;
  addCertification: () => void;
  updateCertification: (id: string, item: Partial<CertificationItem>) => void;
  removeCertification: (id: string) => void;
  addLanguage: () => void;
  updateLanguage: (id: string, item: Partial<LanguageItem>) => void;
  removeLanguage: (id: string) => void;
  addCustomSection: () => void;
  updateCustomSection: (id: string, item: Partial<CustomSection>) => void;
  removeCustomSection: (id: string) => void;
  reorderSections: (sections: ResumeSection[]) => void;
  toggleSectionVisible: (id: string) => void;
  updateSettings: (settings: Partial<ResumeSettings>) => void;
  resetData: () => void;
  loadSampleData: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      data: defaultData,
      settings: defaultSettings,
      activeSection: 'personal',

      setActiveSection: (id) => set({ activeSection: id }),

      importData: (data, settings) =>
        set((s) => ({ data, settings: settings ?? s.settings })),

      updatePersonal: (personal) =>
        set((s) => ({ data: { ...s.data, personal: { ...s.data.personal, ...personal } } })),

      addExperience: () =>
        set((s) => ({
          data: {
            ...s.data,
            experience: [
              ...s.data.experience,
              { id: uuidv4(), company: '', role: '', startDate: '', endDate: '', current: false, location: '', description: '' },
            ],
          },
        })),
      updateExperience: (id, item) =>
        set((s) => ({ data: { ...s.data, experience: s.data.experience.map((e) => (e.id === id ? { ...e, ...item } : e)) } })),
      removeExperience: (id) =>
        set((s) => ({ data: { ...s.data, experience: s.data.experience.filter((e) => e.id !== id) } })),


      addEducation: () =>
        set((s) => ({
          data: {
            ...s.data,
            education: [
              ...s.data.education,
              { id: uuidv4(), school: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', description: '' },
            ],
          },
        })),
      updateEducation: (id, item) =>
        set((s) => ({ data: { ...s.data, education: s.data.education.map((e) => (e.id === id ? { ...e, ...item } : e)) } })),
      removeEducation: (id) =>
        set((s) => ({ data: { ...s.data, education: s.data.education.filter((e) => e.id !== id) } })),


      addSkillCategory: () =>
        set((s) => ({
          data: { ...s.data, skills: [...s.data.skills, { id: uuidv4(), name: '新技能類別', skills: [] }] },
        })),
      updateSkillCategory: (id, item) =>
        set((s) => ({ data: { ...s.data, skills: s.data.skills.map((e) => (e.id === id ? { ...e, ...item } : e)) } })),
      removeSkillCategory: (id) =>
        set((s) => ({ data: { ...s.data, skills: s.data.skills.filter((e) => e.id !== id) } })),

      addProject: () =>
        set((s) => ({
          data: {
            ...s.data,
            projects: [
              ...s.data.projects,
              { id: uuidv4(), name: '', role: '', startDate: '', endDate: '', url: '', description: '', technologies: [] },
            ],
          },
        })),
      updateProject: (id, item) =>
        set((s) => ({ data: { ...s.data, projects: s.data.projects.map((e) => (e.id === id ? { ...e, ...item } : e)) } })),
      removeProject: (id) =>
        set((s) => ({ data: { ...s.data, projects: s.data.projects.filter((e) => e.id !== id) } })),


      addCertification: () =>
        set((s) => ({
          data: {
            ...s.data,
            certifications: [...s.data.certifications, { id: uuidv4(), name: '', issuer: '', date: '', url: '' }],
          },
        })),
      updateCertification: (id, item) =>
        set((s) => ({ data: { ...s.data, certifications: s.data.certifications.map((e) => (e.id === id ? { ...e, ...item } : e)) } })),
      removeCertification: (id) =>
        set((s) => ({ data: { ...s.data, certifications: s.data.certifications.filter((e) => e.id !== id) } })),


      addLanguage: () =>
        set((s) => ({
          data: { ...s.data, languages: [...s.data.languages, { id: uuidv4(), language: '', proficiency: 'Intermediate' }] },
        })),
      updateLanguage: (id, item) =>
        set((s) => ({ data: { ...s.data, languages: s.data.languages.map((e) => (e.id === id ? { ...e, ...item } : e)) } })),
      removeLanguage: (id) =>
        set((s) => ({ data: { ...s.data, languages: s.data.languages.filter((e) => e.id !== id) } })),

      addCustomSection: () =>
        set((s) => ({
          data: {
            ...s.data,
            customSections: [...s.data.customSections, { id: uuidv4(), title: '自訂區塊', content: '' }],
            sections: [...s.data.sections, { id: uuidv4(), type: 'custom', visible: true }],
          },
        })),
      updateCustomSection: (id, item) =>
        set((s) => ({ data: { ...s.data, customSections: s.data.customSections.map((e) => (e.id === id ? { ...e, ...item } : e)) } })),
      removeCustomSection: (id) =>
        set((s) => ({ data: { ...s.data, customSections: s.data.customSections.filter((e) => e.id !== id) } })),

      reorderSections: (sections) =>
        set((s) => ({ data: { ...s.data, sections } })),
      toggleSectionVisible: (id) =>
        set((s) => ({
          data: {
            ...s.data,
            sections: s.data.sections.map((sec) => (sec.id === id ? { ...sec, visible: !sec.visible } : sec)),
          },
        })),

      updateSettings: (settings) =>
        set((s) => ({ settings: { ...s.settings, ...settings } })),

      resetData: () => set({ data: { ...defaultData, sections: defaultSections }, settings: defaultSettings }),
      loadSampleData: () => set({ data: defaultData, settings: defaultSettings }),
    }),
    {
      name: 'resume-editor-data',
      version: STORE_VERSION,
      // Migrate persisted state when STORE_VERSION is bumped
      migrate(persisted: unknown, fromVersion: number) {
        // v1 → v2: no structural change; just return as-is
        void fromVersion;
        return persisted as ResumeStore;
      },
    }
  )
);
