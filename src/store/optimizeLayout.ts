import type { ResumeData, ResumeSettings, TemplateId } from '../types/resume';

export interface OptimizeResult {
  settings: Partial<ResumeSettings>;
  reasons: string[];
}

const CODE_SKILLS = new Set([
  'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust',
  'Java', 'C++', 'C#', 'Swift', 'Kotlin', 'Node.js', 'Docker', 'AWS', 'GCP',
  'Azure', 'Kubernetes', 'Next.js', 'Nuxt', 'GraphQL', 'PostgreSQL', 'MongoDB',
]);

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function calcContentDensity(data: ResumeData): number {
  let score = 0;
  score += data.experience.length * 3;
  score += data.experience.reduce((a, e) => a + countWords(e.description) / 20, 0);
  score += data.education.length * 1.5;
  score += data.projects.length * 2;
  score += data.skills.reduce((a, s) => a + s.skills.length * 0.4, 0);
  score += data.certifications.length * 0.8;
  score += data.languages.length * 0.4;
  if (countWords(data.personal.summary) > 50) score += 2;
  return score;
}

function detectProfileType(data: ResumeData): 'engineer' | 'designer' | 'manager' | 'academic' | 'general' {
  const allText = [
    data.personal.title,
    data.personal.summary,
    ...data.skills.flatMap(s => s.skills),
    ...data.experience.map(e => `${e.role} ${e.description}`),
  ].join(' ').toLowerCase();

  const codeCount = data.skills.flatMap(s => s.skills).filter(s => CODE_SKILLS.has(s)).length;
  if (codeCount >= 4) return 'engineer';
  if (/(design|ui|ux|figma|sketch|creative|brand|motion|visual)/.test(allText)) return 'designer';
  if (/(manager|director|lead|head|vp|chief|策略|管理|總監|主任|負責人)/.test(allText)) return 'manager';
  if (/(research|professor|phd|博士|學術|論文|研究)/.test(allText)) return 'academic';
  return 'general';
}

function recommendTemplate(profile: ReturnType<typeof detectProfileType>, density: number): TemplateId {
  if (profile === 'engineer') return 'dev';
  if (profile === 'academic') return 'editorial';
  if (profile === 'designer') return 'minimal';
  if (density > 18) return 'swiss';
  if (density < 8) return 'editorial';
  return 'modern';
}

export function optimizeLayout(data: ResumeData, settings: ResumeSettings): OptimizeResult {
  const density = calcContentDensity(data);
  const profile = detectProfileType(data);
  const reasons: string[] = [];

  // ── Font size ────────────────────────────────────
  let fontSize = settings.fontSize;
  const targetFontSize =
    density > 24 ? 11 :
    density > 18 ? 12 :
    density > 12 ? 13 :
    density > 7  ? 14 : 15;

  if (targetFontSize !== fontSize) {
    fontSize = targetFontSize;
    reasons.push(`字級調整為 ${fontSize}px（內容密度 ${density.toFixed(1)}）`);
  }

  // ── Page margin ───────────────────────────────────
  let pageMargin = settings.pageMargin;
  const targetMargin = density > 20 ? 32 : density > 14 ? 36 : 44;
  if (Math.abs(targetMargin - pageMargin) >= 4) {
    pageMargin = targetMargin;
    reasons.push(`頁面邊距縮減至 ${pageMargin}px 以容納更多內容`);
  }

  // ── Template ──────────────────────────────────────
  const recommendedTemplate = recommendTemplate(profile, density);
  let template = settings.template;
  if (recommendedTemplate !== template) {
    template = recommendedTemplate;
    const profileLabels: Record<string, string> = {
      engineer: '工程師背景', designer: '設計師背景', manager: '管理職背景',
      academic: '學術背景', general: '通用型',
    };
    const templateLabels: Record<string, string> = {
      dev: '開發者', editorial: '編輯風', minimal: '簡約', swiss: '瑞士式', modern: '現代風', classic: '經典',
    };
    reasons.push(`根據${profileLabels[profile]}，切換為「${templateLabels[template]}」範本`);
  }

  // ── Section visibility ────────────────────────────
  const newSections = data.sections.map(sec => {
    const updated = { ...sec };
    if (sec.type === 'certifications' && data.certifications.length === 0) updated.visible = false;
    if (sec.type === 'languages' && data.languages.length === 0) updated.visible = false;
    if (sec.type === 'projects' && data.projects.length === 0) updated.visible = false;
    return updated;
  });
  const hiddenCount = newSections.filter((s, i) => !s.visible && data.sections[i].visible).length;
  if (hiddenCount > 0) reasons.push(`隱藏 ${hiddenCount} 個空白區塊`);

  if (reasons.length === 0) reasons.push('版面配置已是最佳狀態 ✓');

  return {
    settings: { fontSize, pageMargin, template },
    reasons,
  };
}
