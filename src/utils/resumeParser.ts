import { v4 as uuidv4 } from 'uuid';
import type {
  ResumeData, PersonalInfo, ExperienceItem, EducationItem,
  SkillCategory, ProjectItem, CertificationItem, LanguageItem,
} from '../types/resume';

// ─────────────────────────────────────────────────────────
//  Section detection patterns (Chinese + English)
// ─────────────────────────────────────────────────────────
const SECTION_PATTERNS: Record<string, RegExp> = {
  experience: /^(工作經歷|工作经历|work\s*experience|professional\s*experience|employment|experience|career|職歷|職業經歷)/i,
  education:  /^(學歷|学历|education|academic|學業|教育背景)/i,
  skills:     /^(技能|技術|专业技能|skills?|technical\s*skills?|expertise|abilities|能力)/i,
  projects:   /^(專案|项目|projects?|portfolio|作品|side\s*projects?)/i,
  certifications: /^(證照|证书|certifications?|certificates?|licenses?|認證)/i,
  languages:  /^(語言|语言|languages?|語言能力)/i,
  summary:    /^(個人簡介|摘要|summary|profile|objective|about\s*me|自我介紹|簡介)/i,
};

// ─────────────────────────────────────────────────────────
//  Contact-info patterns
// ─────────────────────────────────────────────────────────
const EMAIL_RE    = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const PHONE_RE    = /(\+?[\d\s\-().]{9,16})/;
const LINKEDIN_RE = /linkedin\.com\/in\/[\w-]+/i;
const GITHUB_RE   = /github\.com\/[\w-]+/i;
const URL_RE      = /https?:\/\/[^\s,;)]+/i;

// Date: 2024-03, 2024/03, Mar 2024, 2024.03, 2024年3月
const DATE_RE = /(\d{4})[./-](\d{1,2})|([A-Za-z]{3}\.?\s+\d{4})|\d{4}年\d{1,2}月/g;

function extractDate(text: string): string {
  const m = text.match(/(\d{4})[./-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}`;
  const m2 = text.match(/([A-Za-z]{3})\.?\s+(\d{4})/);
  if (m2) {
    const months: Record<string, string> = {
      jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
      jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
    };
    const mo = months[m2[1].toLowerCase()];
    if (mo) return `${m2[2]}-${mo}`;
  }
  const m3 = text.match(/(\d{4})年(\d{1,2})月/);
  if (m3) return `${m3[1]}-${m3[2].padStart(2, '0')}`;
  return '';
}

function extractDateRange(text: string): { start: string; end: string; current: boolean } {
  const current = /至今|present|now|current|ongoing/i.test(text);
  const dates: string[] = [];
  const re = /(\d{4})[./-](\d{1,2})|([A-Za-z]{3}\.?\s+\d{4})|\d{4}年\d{1,2}月/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const d = extractDate(m[0]);
    if (d) dates.push(d);
  }
  return { start: dates[0] ?? '', end: current ? '' : (dates[1] ?? ''), current };
}

// ─────────────────────────────────────────────────────────
//  Classify which section a header line belongs to
// ─────────────────────────────────────────────────────────
function classifyLine(line: string): string | null {
  const clean = line.replace(/[:：\-–—#*•▪\s]+$/, '').trim();
  for (const [key, re] of Object.entries(SECTION_PATTERNS)) {
    if (re.test(clean)) return key;
  }
  return null;
}

// ─────────────────────────────────────────────────────────
//  Main parser
// ─────────────────────────────────────────────────────────
export function parseResumeText(rawText: string): Partial<ResumeData> {
  const lines = rawText.split(/\r?\n/).map(l => l.trimEnd());

  // ── Extract personal info from first ~15 lines ──────
  const personal: Partial<PersonalInfo> = {
    name: '', title: '', email: '', phone: '', location: '',
    website: '', linkedin: '', github: '', summary: '', avatar: '',
  };

  const headerLines = lines.slice(0, 20);
  for (const line of headerLines) {
    if (!personal.email) { const m = line.match(EMAIL_RE); if (m) personal.email = m[0]; }
    if (!personal.phone) {
      const m = line.match(PHONE_RE);
      if (m && !/^\d{4}$/.test(m[1].trim())) personal.phone = m[1].trim();
    }
    if (!personal.linkedin) { const m = line.match(LINKEDIN_RE); if (m) personal.linkedin = m[0]; }
    if (!personal.github) { const m = line.match(GITHUB_RE); if (m) personal.github = m[0]; }
    if (!personal.website) {
      const m = line.match(URL_RE);
      if (m && !LINKEDIN_RE.test(m[0]) && !GITHUB_RE.test(m[0])) personal.website = m[0];
    }
    if (/(台北|台中|高雄|新竹|台灣|Taipei|Hsinchu|Taiwan|City|省|市)/i.test(line) && !personal.location) {
      personal.location = line.trim().replace(/[,，;；]/g, '').trim();
    }
  }

  // First non-empty line likely to be the name
  const firstMeaningful = lines.find(l => l.trim().length > 0 && l.trim().length < 40 &&
    !EMAIL_RE.test(l) && !PHONE_RE.test(l) && !URL_RE.test(l));
  if (firstMeaningful) personal.name = firstMeaningful.trim();

  // Second short non-contact line likely the title
  const titleCandidates = lines.filter(l => {
    const t = l.trim();
    return t.length > 0 && t.length < 60 && t !== personal.name &&
      !EMAIL_RE.test(t) && !URL_RE.test(t) && !LINKEDIN_RE.test(t) && !GITHUB_RE.test(t);
  });
  if (titleCandidates.length > 1) personal.title = titleCandidates[1].trim();

  // ── Split text into named sections ──────────────────
  const sections: Array<{ type: string; lines: string[] }> = [];
  let currentSection: { type: string; lines: string[] } | null = { type: 'header', lines: [] };

  for (const line of lines) {
    const classified = classifyLine(line);
    if (classified) {
      if (currentSection) sections.push(currentSection);
      currentSection = { type: classified, lines: [] };
    } else {
      currentSection?.lines.push(line);
    }
  }
  if (currentSection) sections.push(currentSection);

  // ── Parse summary ────────────────────────────────────
  const summarySection = sections.find(s => s.type === 'summary');
  if (summarySection) {
    personal.summary = summarySection.lines.filter(l => l.trim()).join('\n').trim();
  }

  // ── Parse experience ─────────────────────────────────
  const experience: ExperienceItem[] = [];
  const expSection = sections.find(s => s.type === 'experience');
  if (expSection) {
    const blocks = splitIntoBlocks(expSection.lines);
    for (const block of blocks) {
      if (block.length === 0) continue;
      const titleLine = block[0];
      const dateLine = block.find(l => DATE_RE.test(l)) ?? '';
      const { start, end, current } = extractDateRange(dateLine || titleLine);

      // Try to extract company / role from first 2 lines
      let role = '', company = '';
      const firstTwo = block.slice(0, 3).filter(l => l.trim());
      if (firstTwo.length >= 2) {
        // Line with a separator (|, ·, @, ，, at) → split
        const sep = /[|·@,，，]|(?:\bat\b)/;
        const combined = firstTwo.slice(0, 2).join(' ');
        if (sep.test(combined)) {
          const parts = combined.split(sep).map(s => s.trim()).filter(Boolean);
          role = parts[0] ?? '';
          company = parts[1] ?? '';
        } else {
          role = firstTwo[0].replace(DATE_RE, '').trim();
          company = firstTwo[1].replace(DATE_RE, '').trim();
        }
      } else {
        role = titleLine.replace(DATE_RE, '').trim();
      }

      const descLines = block.slice(2).filter(l => l.trim() && !DATE_RE.test(l));
      experience.push({
        id: uuidv4(), company, role, startDate: start, endDate: end,
        current, location: '', description: descLines.join('\n').trim(),
      });
    }
  }

  // ── Parse education ──────────────────────────────────
  const education: EducationItem[] = [];
  const eduSection = sections.find(s => s.type === 'education');
  if (eduSection) {
    const blocks = splitIntoBlocks(eduSection.lines);
    for (const block of blocks) {
      if (block.length === 0) continue;
      const dateLine = block.find(l => DATE_RE.test(l)) ?? '';
      const { start, end } = extractDateRange(dateLine);
      const school = block[0]?.replace(DATE_RE, '').trim() ?? '';
      const degreeField = block[1]?.replace(DATE_RE, '').trim() ?? '';
      const [degree, field] = degreeField.split(/[,，\s]+/) ?? ['', degreeField];
      education.push({
        id: uuidv4(), school, degree: degree ?? '', field: field ?? degreeField,
        startDate: start, endDate: end, gpa: '', description: '',
      });
    }
  }

  // ── Parse skills ─────────────────────────────────────
  const skills: SkillCategory[] = [];
  const skillsSection = sections.find(s => s.type === 'skills');
  if (skillsSection) {
    const allSkillLines = skillsSection.lines.filter(l => l.trim());
    // Try to find category: items pattern
    let currentCat: SkillCategory | null = null;
    for (const line of allSkillLines) {
      const colonIdx = Math.max(line.indexOf(':'), line.indexOf('：'));
      if (colonIdx > 0 && colonIdx < 25) {
        const catName = line.slice(0, colonIdx).trim();
        const items = line.slice(colonIdx + 1)
          .split(/[,，、/·\s]+/).map(s => s.trim()).filter(s => s.length > 0);
        if (items.length > 0) {
          currentCat = { id: uuidv4(), name: catName, skills: items };
          skills.push(currentCat);
          continue;
        }
      }
      // Comma-separated line → generic category
      const items = line.split(/[,，、/·•]+/).map(s => s.trim()).filter(s => s.length >= 1 && s.length <= 30);
      if (items.length >= 2) {
        if (currentCat) {
          currentCat.skills.push(...items);
        } else {
          currentCat = { id: uuidv4(), name: '技術技能', skills: items };
          skills.push(currentCat);
        }
      }
    }
    // Deduplicate
    for (const cat of skills) {
      cat.skills = [...new Set(cat.skills)];
    }
  }

  // ── Parse projects ───────────────────────────────────
  const projects: ProjectItem[] = [];
  const projSection = sections.find(s => s.type === 'projects');
  if (projSection) {
    const blocks = splitIntoBlocks(projSection.lines);
    for (const block of blocks) {
      if (!block.length) continue;
      const dateLine = block.find(l => DATE_RE.test(l)) ?? '';
      const { start, end } = extractDateRange(dateLine);
      const urlMatch = block.join(' ').match(URL_RE);
      const name = block[0].replace(DATE_RE, '').trim();
      const descLines = block.slice(1).filter(l => l.trim() && !DATE_RE.test(l) && !URL_RE.test(l));
      // Detect tech stack from last line if it's comma-separated short words
      const lastLine = descLines[descLines.length - 1] ?? '';
      const techItems = lastLine.split(/[,，、·]+/).map(s => s.trim()).filter(s => s.length > 0 && s.length <= 20);
      const technologies = techItems.length >= 2 ? techItems : [];
      const description = (technologies.length ? descLines.slice(0, -1) : descLines).join('\n').trim();
      projects.push({
        id: uuidv4(), name, role: '', startDate: start, endDate: end,
        url: urlMatch?.[0] ?? '', description, technologies,
      });
    }
  }

  // ── Parse certifications ─────────────────────────────
  const certifications: CertificationItem[] = [];
  const certSection = sections.find(s => s.type === 'certifications');
  if (certSection) {
    for (const line of certSection.lines.filter(l => l.trim())) {
      const date = extractDate(line);
      const name = line.replace(DATE_RE, '').replace(/[,，;：:]/g, ' ').trim();
      if (name) certifications.push({ id: uuidv4(), name, issuer: '', date, url: '' });
    }
  }

  // ── Parse languages ──────────────────────────────────
  const languages: LanguageItem[] = [];
  const langSection = sections.find(s => s.type === 'languages');
  if (langSection) {
    for (const line of langSection.lines.filter(l => l.trim())) {
      const PROFICIENCY_MAP: Record<string, LanguageItem['proficiency']> = {
        '母語': 'Native', 'native': 'Native', '流利': 'Fluent', 'fluent': 'Fluent',
        '進階': 'Advanced', 'advanced': 'Advanced', '中級': 'Intermediate',
        'intermediate': 'Intermediate', '基礎': 'Basic', 'basic': 'Basic',
      };
      let proficiency: LanguageItem['proficiency'] = 'Intermediate';
      for (const [k, v] of Object.entries(PROFICIENCY_MAP)) {
        if (line.toLowerCase().includes(k.toLowerCase())) { proficiency = v; break; }
      }
      const langName = line
        .replace(new RegExp(Object.keys(PROFICIENCY_MAP).join('|'), 'gi'), '')
        .replace(/[()（）:：\-–]/g, ' ').trim();
      if (langName) languages.push({ id: uuidv4(), language: langName, proficiency });
    }
  }

  return {
    personal: personal as PersonalInfo,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages,
  };
}

// ─────────────────────────────────────────────────────────
//  Split content into blocks separated by blank lines
// ─────────────────────────────────────────────────────────
function splitIntoBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.trim() === '') {
      if (current.length > 0) { blocks.push(current); current = []; }
    } else {
      current.push(line.trim());
    }
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}
