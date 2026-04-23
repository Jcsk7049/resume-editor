import type { ResumeData, ResumeSettings } from '../types/resume';

// Developer portfolio layout — GitHub-inspired structure.
// Monospace used only for code/date metadata (functional, not decorative).
// Typography: Microsoft JhengHei → Inter for all prose.

interface Props {
  data: ResumeData;
  settings: ResumeSettings;
}

const PROFICIENCY: Record<string, string> = {
  Native: '母語', Fluent: '流利', Advanced: '進階', Intermediate: '中級', Basic: '基礎',
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Go: '#00ADD8', Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d',
  React: '#61dafb', Vue: '#41b883', 'Node.js': '#339933',
  Docker: '#2496ed', AWS: '#ff9900', CSS: '#563d7c', HTML: '#e34c26',
};
function getLangColor(name: string) {
  return LANG_COLORS[name] || '#8b949e';
}

function fmtISO(d: string) {
  if (!d) return '';
  const [y, m] = d.split('-');
  return `${y}-${m}`;
}
function dateRange(start: string, end: string, current: boolean) {
  const s = fmtISO(start);
  const e = current ? 'now' : fmtISO(end);
  if (!s) return '';
  return e ? `${s}..${e}` : s;
}

function scale(fs: number) {
  return {
    name:    Math.round(fs * 2.2),
    section: Math.round(fs * 1.2),
    body:    fs,
    meta:    Math.round(fs * 0.88),
  };
}

const FONT = `'Inter', 'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
const MONO = `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`;

export default function DevTemplate({ data, settings }: Props) {
  const { personal, experience, education, skills, projects, certifications, languages, sections } = data;
  const vis = new Set(sections.filter(s => s.visible).map(s => s.type));
  const m = settings.pageMargin;
  const fs = settings.fontSize;
  const sz = scale(fs);

  const gh = {
    bg: '#ffffff',
    canvas: '#f6f8fa',
    border: '#d0d7de',
    borderMuted: '#e4e8ec',
    text: '#1f2328',
    meta: '#636c76',
    accent: '#0969da',
    success: '#1a7f37',
  };

  const Badge = ({ label, color }: { label: string; color?: string }) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: color ? `${color}18` : '#ddf4ff',
      color: color ? shadeColor(color, -30) : gh.accent,
      border: `1px solid ${color ? `${color}40` : '#b6e3ff'}`,
      borderRadius: 20,
      padding: '2px 9px',
      fontSize: sz.meta,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: getLangColor(label), flexShrink: 0 }} />
      {label}
    </span>
  );

  return (
    <div style={{
      fontFamily: FONT,
      fontSize: sz.body,
      fontWeight: 400,
      color: gh.text,
      background: gh.bg,
      width: '210mm',
      minHeight: '297mm',
      padding: `${m}px`,
      lineHeight: 1.6,
    }}>

      {/* ── Profile header ── */}
      <div data-section="personal" style={{
        display: 'flex',
        gap: 20,
        paddingBottom: m * 0.8,
        marginBottom: m * 0.8,
        borderBottom: `1px solid ${gh.border}`,
        alignItems: 'flex-start',
      }}>
        {personal.avatar && (
          <img src={personal.avatar} alt="avatar" style={{
            width: 68, height: 68, borderRadius: '50%',
            border: `1px solid ${gh.border}`, flexShrink: 0,
          }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: sz.name, fontWeight: 700, lineHeight: 1.15 }}>
              {personal.name || 'Your Name'}
            </span>
            {personal.title && (
              <span style={{ fontSize: sz.body, color: gh.meta, fontWeight: 400 }}>{personal.title}</span>
            )}
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: `4px 16px`,
            marginTop: 7, fontSize: sz.meta, color: gh.meta,
            fontFamily: MONO,
          }}>
            {personal.location && <span>{personal.location}</span>}
            {personal.email    && <span>{personal.email}</span>}
            {personal.phone    && <span>{personal.phone}</span>}
            {personal.linkedin && <span>{personal.linkedin}</span>}
            {personal.github   && <span>{personal.github}</span>}
            {personal.website  && <span>{personal.website}</span>}
          </div>
          {personal.summary && (
            <div style={{ marginTop: 9, fontSize: sz.body, color: gh.text, lineHeight: 1.7, maxWidth: '68ch' }}>
              {personal.summary}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 195px', gap: 22 }}>
        {/* ── Left column ── */}
        <div>
          {/* Experience */}
          {vis.has('experience') && experience.length > 0 && (
            <div data-section="experience" style={{ marginBottom: 22 }}>
              <SectionHead label="Work Experience" mono={MONO} border={gh.border} accent={gh.accent} sz={sz} />
              {experience.map((exp, i) => (
                <div key={exp.id} style={{
                  display: 'flex', gap: 12,
                  paddingBottom: i < experience.length - 1 ? 16 : 0,
                  marginBottom: i < experience.length - 1 ? 16 : 0,
                  borderBottom: i < experience.length - 1 ? `1px solid ${gh.borderMuted}` : 'none',
                  pageBreakInside: 'avoid', breakInside: 'avoid',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: exp.current ? gh.success : gh.border, border: `2px solid ${exp.current ? gh.success : gh.meta}`, flexShrink: 0 }} />
                    {i < experience.length - 1 && <div style={{ width: 1, flex: 1, background: gh.borderMuted, marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: sz.body }}>{exp.role}</span>
                        {exp.company && <span style={{ color: gh.accent, marginLeft: 8, fontWeight: 600, fontSize: sz.body }}>{exp.company}</span>}
                      </div>
                      <code style={{
                        fontSize: sz.meta, color: gh.meta, background: gh.canvas,
                        border: `1px solid ${gh.border}`, borderRadius: 4,
                        padding: '1px 6px', whiteSpace: 'nowrap', fontFamily: MONO,
                      }}>
                        {dateRange(exp.startDate, exp.endDate, exp.current)}
                        {exp.location && ` · ${exp.location}`}
                      </code>
                    </div>
                    {exp.description && (
                      <div style={{ marginTop: 5, fontSize: sz.body, lineHeight: 1.6, color: '#2d2d2d' }}>
                        {exp.description.split('\n').map((line, i, arr) => (
                          <div key={i} style={{ marginBottom: i < arr.length - 1 ? 4 : 0 }}>{line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {vis.has('projects') && projects.length > 0 && (
            <div data-section="projects" style={{ marginBottom: 22 }}>
              <SectionHead label="Pinned Projects" mono={MONO} border={gh.border} accent={gh.accent} sz={sz} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {projects.map((proj) => (
                  <div key={proj.id} style={{
                    border: `1px solid ${gh.border}`,
                    borderRadius: 6,
                    padding: '12px 14px',
                    background: gh.bg,
                    display: 'flex', flexDirection: 'column', gap: 7,
                    pageBreakInside: 'avoid', breakInside: 'avoid',
                  }}>
                    <div style={{ fontWeight: 700, color: gh.accent, fontSize: sz.body }}>{proj.name}</div>
                    {proj.description && (
                      <div style={{ fontSize: sz.meta, color: gh.text, lineHeight: 1.55, flex: 1 }}>
                        {proj.description}
                      </div>
                    )}
                    {proj.technologies.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
                        {proj.technologies.map((t, i) => <Badge key={i} label={t} color={getLangColor(t)} />)}
                      </div>
                    )}
                    {proj.url && (
                      <div style={{ fontSize: sz.meta, color: gh.meta, fontFamily: MONO }}>{proj.url}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {vis.has('education') && education.length > 0 && (
            <div data-section="education" style={{ marginBottom: 22 }}>
              <SectionHead label="Education" mono={MONO} border={gh.border} accent={gh.accent} sz={sz} />
              {education.map((edu) => (
                <div key={edu.id} style={{ marginBottom: 10, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: sz.body }}>{edu.school}</span>
                    <code style={{ fontSize: sz.meta, color: gh.meta, background: gh.canvas, border: `1px solid ${gh.border}`, borderRadius: 4, padding: '1px 6px', fontFamily: MONO }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </code>
                  </div>
                  <div style={{ fontSize: sz.meta, color: gh.meta }}>
                    {[edu.degree, edu.field].filter(Boolean).join(' · ')}
                    {edu.gpa && ` · GPA ${edu.gpa}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {vis.has('skills') && skills.length > 0 && (
            <div data-section="skills">
              <SectionHead label="Stack" mono={MONO} border={gh.border} accent={gh.accent} sz={sz} />
              {skills.map((cat) => (
                <div key={cat.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: sz.meta, fontWeight: 700, color: gh.meta, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                    {cat.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {cat.skills.map((s, i) => <Badge key={i} label={s} color={getLangColor(s)} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {vis.has('certifications') && certifications.length > 0 && (
            <div data-section="certifications">
              <SectionHead label="Certs" mono={MONO} border={gh.border} accent={gh.accent} sz={sz} />
              {certifications.map((cert) => (
                <div key={cert.id} style={{ marginBottom: 7, padding: '7px 10px', background: gh.canvas, border: `1px solid ${gh.border}`, borderRadius: 5 }}>
                  <div style={{ fontWeight: 700, fontSize: sz.body }}>{cert.name}</div>
                  {cert.issuer && <div style={{ fontSize: sz.meta, color: gh.meta, fontFamily: MONO, marginTop: 2 }}>{cert.issuer}</div>}
                  {cert.date && <div style={{ fontSize: sz.meta, color: gh.meta, fontFamily: MONO, marginTop: 1 }}>{fmtISO(cert.date)}</div>}
                </div>
              ))}
            </div>
          )}

          {vis.has('languages') && languages.length > 0 && (
            <div data-section="languages">
              <SectionHead label="Languages" mono={MONO} border={gh.border} accent={gh.accent} sz={sz} />
              {languages.map((lang) => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: sz.body, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>{lang.language}</span>
                  <span style={{ color: gh.meta, fontFamily: MONO, fontSize: sz.meta }}>{PROFICIENCY[lang.proficiency]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHead({ label, mono, border, accent, sz }: {
  label: string; mono: string; border: string; accent: string;
  sz: { section: number; meta: number };
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
      paddingBottom: 6,
      borderBottom: `1px solid ${border}`,
    }}>
      <span style={{ fontSize: sz.section, fontWeight: 700, color: accent, fontFamily: mono, letterSpacing: '0.03em' }}>
        {label}
      </span>
    </div>
  );
}

function shadeColor(hex: string, percent: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (n & 0xff) + percent));
  return `rgb(${r},${g},${b})`;
}
