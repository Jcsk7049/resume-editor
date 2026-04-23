export type SectionType =
  | 'personal'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'custom';

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  avatar: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  description: string;
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  url: string;
  description: string;
  technologies: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: 'Native' | 'Fluent' | 'Advanced' | 'Intermediate' | 'Basic';
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  visible: boolean;
}

export interface ResumeData {
  personal: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  customSections: CustomSection[];
  sections: ResumeSection[];
}

export type TemplateId = 'modern' | 'classic' | 'minimal' | 'editorial' | 'dev' | 'swiss';

export interface ThemeColor {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface ResumeSettings {
  template: TemplateId;
  fontSize: number;
  fontFamily: string;
  colorTheme: string;
  colors: ThemeColor;
  pageMargin: number;
}
