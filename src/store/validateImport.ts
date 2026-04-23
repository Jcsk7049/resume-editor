/**
 * validateImport.ts
 * ─────────────────
 * Validates a raw parsed JSON object before it is loaded into the store.
 * Strategy: be permissive about optional / extra fields, but reject anything
 * that would cause a runtime crash (wrong types on required keys, bad enums).
 *
 * Returns a typed result so the caller can present errors without try/catch.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ResumeData, ResumeSettings, PersonalInfo,
  ExperienceItem, EducationItem, SkillCategory,
  ProjectItem, CertificationItem, LanguageItem,
  ResumeSection, SectionType, ThemeColor,
} from '../types/resume';

export interface ValidationResult {
  ok: boolean;
  errors: string[];        // human-readable, shown in UI
  data?: ResumeData;       // sanitised — present only when ok === true
  settings?: ResumeSettings;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isStr(v: unknown): v is string { return typeof v === 'string'; }
function isBool(v: unknown): v is boolean { return typeof v === 'boolean'; }
function isNum(v: unknown): v is number { return typeof v === 'number' && isFinite(v); }
function isArr(v: unknown): v is unknown[] { return Array.isArray(v); }

const PROFICIENCIES = new Set(['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic']);
const TEMPLATES     = new Set(['modern', 'classic', 'minimal', 'editorial', 'dev', 'swiss']);
const SECTION_TYPES = new Set<string>(['personal','experience','education','skills','projects','certifications','languages','custom']);

// ── personal ──────────────────────────────────────────────────────────────────

function sanitisePersonal(raw: unknown, errors: string[]): PersonalInfo {
  const defaults: PersonalInfo = {
    name: '', title: '', email: '', phone: '',
    location: '', website: '', linkedin: '', github: '',
    summary: '', avatar: '',
  };
  if (!isObj(raw)) {
    errors.push('data.personal 必須是物件');
    return defaults;
  }
  const str = (key: keyof PersonalInfo, fallback = '') =>
    isStr(raw[key]) ? (raw[key] as string) : fallback;

  return {
    name:     str('name'),
    title:    str('title'),
    email:    str('email'),
    phone:    str('phone'),
    location: str('location'),
    website:  str('website'),
    linkedin: str('linkedin'),
    github:   str('github'),
    summary:  str('summary'),
    avatar:   str('avatar'),
  };
}

// ── experience ────────────────────────────────────────────────────────────────

function sanitiseExperience(raw: unknown, errors: string[]): ExperienceItem[] {
  if (!isArr(raw)) { errors.push('data.experience 必須是陣列'); return []; }
  return raw.map((item, i): ExperienceItem => {
    if (!isObj(item)) {
      errors.push(`data.experience[${i}] 必須是物件，已略過`);
      return { id: uuidv4(), company: '', role: '', startDate: '', endDate: '', current: false, location: '', description: '' };
    }
    return {
      id:          isStr(item.id)   ? item.id   : uuidv4(),
      company:     isStr(item.company)     ? item.company     : '',
      role:        isStr(item.role)        ? item.role        : '',
      startDate:   isStr(item.startDate)   ? item.startDate   : '',
      endDate:     isStr(item.endDate)     ? item.endDate     : '',
      current:     isBool(item.current)    ? item.current     : false,
      location:    isStr(item.location)    ? item.location    : '',
      description: isStr(item.description) ? item.description : '',
    };
  });
}

// ── education ─────────────────────────────────────────────────────────────────

function sanitiseEducation(raw: unknown, errors: string[]): EducationItem[] {
  if (!isArr(raw)) { errors.push('data.education 必須是陣列'); return []; }
  return raw.map((item, i): EducationItem => {
    if (!isObj(item)) {
      errors.push(`data.education[${i}] 必須是物件，已略過`);
      return { id: uuidv4(), school: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', description: '' };
    }
    return {
      id:          isStr(item.id)    ? item.id    : uuidv4(),
      school:      isStr(item.school)      ? item.school      : '',
      degree:      isStr(item.degree)      ? item.degree      : '',
      field:       isStr(item.field)       ? item.field       : '',
      startDate:   isStr(item.startDate)   ? item.startDate   : '',
      endDate:     isStr(item.endDate)     ? item.endDate     : '',
      gpa:         isStr(item.gpa)         ? item.gpa         : '',
      description: isStr(item.description) ? item.description : '',
    };
  });
}

// ── skills ────────────────────────────────────────────────────────────────────

function sanitiseSkills(raw: unknown, errors: string[]): SkillCategory[] {
  if (!isArr(raw)) { errors.push('data.skills 必須是陣列'); return []; }
  return raw.map((item, i): SkillCategory => {
    if (!isObj(item)) {
      errors.push(`data.skills[${i}] 必須是物件，已略過`);
      return { id: uuidv4(), name: '', skills: [] };
    }
    const skills = isArr(item.skills)
      ? (item.skills as unknown[]).filter(isStr) as string[]
      : [];
    return {
      id:     isStr(item.id)   ? item.id   : uuidv4(),
      name:   isStr(item.name) ? item.name : '',
      skills,
    };
  });
}

// ── projects ──────────────────────────────────────────────────────────────────

function sanitiseProjects(raw: unknown, errors: string[]): ProjectItem[] {
  if (!isArr(raw)) { errors.push('data.projects 必須是陣列'); return []; }
  return raw.map((item, i): ProjectItem => {
    if (!isObj(item)) {
      errors.push(`data.projects[${i}] 必須是物件，已略過`);
      return { id: uuidv4(), name: '', role: '', startDate: '', endDate: '', url: '', description: '', technologies: [] };
    }
    const technologies = isArr(item.technologies)
      ? (item.technologies as unknown[]).filter(isStr) as string[]
      : [];
    return {
      id:           isStr(item.id)          ? item.id          : uuidv4(),
      name:         isStr(item.name)         ? item.name         : '',
      role:         isStr(item.role)         ? item.role         : '',
      startDate:    isStr(item.startDate)    ? item.startDate    : '',
      endDate:      isStr(item.endDate)      ? item.endDate      : '',
      url:          isStr(item.url)          ? item.url          : '',
      description:  isStr(item.description)  ? item.description  : '',
      technologies,
    };
  });
}

// ── certifications ────────────────────────────────────────────────────────────

function sanitiseCertifications(raw: unknown, errors: string[]): CertificationItem[] {
  if (!isArr(raw)) { errors.push('data.certifications 必須是陣列'); return []; }
  return raw.map((item, i): CertificationItem => {
    if (!isObj(item)) {
      errors.push(`data.certifications[${i}] 必須是物件，已略過`);
      return { id: uuidv4(), name: '', issuer: '', date: '', url: '' };
    }
    return {
      id:     isStr(item.id)     ? item.id     : uuidv4(),
      name:   isStr(item.name)   ? item.name   : '',
      issuer: isStr(item.issuer) ? item.issuer : '',
      date:   isStr(item.date)   ? item.date   : '',
      url:    isStr(item.url)    ? item.url    : '',
    };
  });
}

// ── languages ─────────────────────────────────────────────────────────────────

function sanitiseLanguages(raw: unknown, errors: string[]): LanguageItem[] {
  if (!isArr(raw)) { errors.push('data.languages 必須是陣列'); return []; }
  return raw.map((item, i): LanguageItem => {
    if (!isObj(item)) {
      errors.push(`data.languages[${i}] 必須是物件，已略過`);
      return { id: uuidv4(), language: '', proficiency: 'Intermediate' };
    }
    const proficiency = PROFICIENCIES.has(item.proficiency as string)
      ? (item.proficiency as LanguageItem['proficiency'])
      : 'Intermediate';
    if (!PROFICIENCIES.has(item.proficiency as string)) {
      errors.push(`data.languages[${i}].proficiency 值無效，已重設為 Intermediate`);
    }
    return {
      id:          isStr(item.id)       ? item.id       : uuidv4(),
      language:    isStr(item.language) ? item.language : '',
      proficiency,
    };
  });
}

// ── sections ──────────────────────────────────────────────────────────────────

const DEFAULT_SECTIONS: ResumeSection[] = [
  { id: 'personal',       type: 'personal',       visible: true },
  { id: 'experience',     type: 'experience',     visible: true },
  { id: 'education',      type: 'education',      visible: true },
  { id: 'skills',         type: 'skills',         visible: true },
  { id: 'projects',       type: 'projects',       visible: true },
  { id: 'certifications', type: 'certifications', visible: true },
  { id: 'languages',      type: 'languages',      visible: true },
];

function sanitiseSections(raw: unknown, errors: string[]): ResumeSection[] {
  if (!isArr(raw)) {
    errors.push('data.sections 不是陣列，已使用預設區塊順序');
    return DEFAULT_SECTIONS;
  }
  const out: ResumeSection[] = [];
  for (const item of raw) {
    if (!isObj(item)) continue;
    if (!SECTION_TYPES.has(item.type as string)) continue;
    out.push({
      id:      isStr(item.id)  ? item.id  : uuidv4(),
      type:    item.type as SectionType,
      visible: isBool(item.visible) ? item.visible : true,
    });
  }
  // Ensure all default types are present (add missing ones at end)
  for (const def of DEFAULT_SECTIONS) {
    if (!out.some(s => s.type === def.type)) {
      out.push({ ...def });
    }
  }
  return out;
}

// ── settings ──────────────────────────────────────────────────────────────────

const DEFAULT_COLORS: ThemeColor = {
  primary: '#2563eb', secondary: '#1e40af',
  accent: '#dbeafe', text: '#1f2937', background: '#ffffff',
};

function sanitiseSettings(raw: unknown, errors: string[]): ResumeSettings | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!isObj(raw)) {
    errors.push('settings 不是物件，已忽略');
    return undefined;
  }
  const template = TEMPLATES.has(raw.template as string)
    ? (raw.template as ResumeSettings['template'])
    : 'modern';

  let colors = DEFAULT_COLORS;
  if (isObj(raw.colors)) {
    colors = {
      primary:    isStr(raw.colors.primary)    ? raw.colors.primary    : DEFAULT_COLORS.primary,
      secondary:  isStr(raw.colors.secondary)  ? raw.colors.secondary  : DEFAULT_COLORS.secondary,
      accent:     isStr(raw.colors.accent)      ? raw.colors.accent     : DEFAULT_COLORS.accent,
      text:       isStr(raw.colors.text)        ? raw.colors.text       : DEFAULT_COLORS.text,
      background: isStr(raw.colors.background)  ? raw.colors.background : DEFAULT_COLORS.background,
    };
  }

  return {
    template,
    fontSize:   isNum(raw.fontSize)   ? Math.min(24, Math.max(10, raw.fontSize))   : 14,
    fontFamily: isStr(raw.fontFamily) ? raw.fontFamily : 'Microsoft JhengHei',
    colorTheme: isStr(raw.colorTheme) ? raw.colorTheme : 'blue',
    colors,
    pageMargin: isNum(raw.pageMargin) ? Math.min(80, Math.max(16, raw.pageMargin)) : 40,
  };
}

// ── main export ───────────────────────────────────────────────────────────────

export function validateImport(raw: unknown): ValidationResult {
  const errors: string[] = [];

  // Must be a plain object
  if (!isObj(raw)) {
    return { ok: false, errors: ['JSON 格式不正確：頂層必須是物件 {}'] };
  }

  // Must have a `data` field
  if (!isObj(raw.data)) {
    return { ok: false, errors: ['JSON 缺少必要欄位 "data"，或 data 不是物件'] };
  }

  const d = raw.data;

  // personal is required to have at least an object
  if (!isObj(d.personal)) {
    return { ok: false, errors: ['data.personal 缺失或格式錯誤，無法載入此檔案'] };
  }

  // Sanitise all sections — fills missing fields, accumulates non-fatal errors
  const data: ResumeData = {
    personal:       sanitisePersonal(d.personal, errors),
    experience:     sanitiseExperience(d.experience, errors),
    education:      sanitiseEducation(d.education, errors),
    skills:         sanitiseSkills(d.skills, errors),
    projects:       sanitiseProjects(d.projects, errors),
    certifications: sanitiseCertifications(d.certifications, errors),
    languages:      sanitiseLanguages(d.languages, errors),
    customSections: [],   // intentionally blank — custom sections are exotic
    sections:       sanitiseSections(d.sections, errors),
  };

  const settings = sanitiseSettings(raw.settings, errors);

  return { ok: true, errors, data, settings };
}
