import type { ResumeData, ResumeSettings } from '../types/resume';

// Editorial layout — black ink on white, clean typographic hierarchy.
// No decorative or serif fonts; hierarchy is expressed through size (1.2:1)
// and weight (bold titles, regular body) only.

interface Props {
  data: ResumeData;
  settings: ResumeSettings;
}

const PROFICIENCY: Record<string, string> = {
  Native: '母語', Fluent: '流利', Advanced: '進階', Intermediate: '中級', Basic: '基礎',
};

function fmt(d: string) {
  if (!d) return '';
  const [y, m] = d.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

function dateRange(start: string, end: string, current: boolean) {
  const s = fmt(start);
  const e = current ? 'Present' : fmt(end);
  if (!s && !e) return '';
  if (s && e) return `${s} — ${e}`;
  return s || e;
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

export default function EditorialTemplate({ data, settings }: Props) {
  const { personal, experience, education, skills, projects, certifications, languages, sections } = data;
  const vis = new Set(sections.filter(s => s.visible).map(s => s.type));
  const m = settings.pageMargin;
  const fs = settings.fontSize;
  const sz = scale(fs);
  const c = settings.colors;

  const ink    = '#111111';
  const meta   = '#5f5f5f';
  const rule   = '#d8d8d8';
  const accent = c.primary;   // 主題色

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: fs * 2.2 }}>
      <div style={{
        fontSize: sz.section,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: ink,
        marginBottom: fs * 0.8,
        paddingBottom: fs * 0.45,
        borderBottom: `2px solid ${accent}`,   // ← 段落標題底線套用主題色
      }}>
        {title}
      </div>
      {children}
    </div>
  );

  const MetaLine = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: sz.meta, color: meta, marginTop: 3 }}>
      {children}
    </div>
  );

  return (
    <div style={{
      fontFamily: FONT,
      fontSize: sz.body,
      fontWeight: 400,
      color: ink,
      background: '#ffffff',
      width: '210mm',
      minHeight: '297mm',
      padding: `${m * 1.4}px ${m * 1.5}px`,
      lineHeight: 1.6,
    }}>

      {/* ── Header ── */}
      <div data-section="personal" style={{ marginBottom: fs * 2.6, paddingBottom: fs * 1.4, borderBottom: `2px solid ${accent}` }}>
        <div style={{
          fontSize: sz.name,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          color: ink,
        }}>
          {personal.name || '你的名字'}
        </div>

        {personal.title && (
          <div style={{ fontSize: Math.round(fs * 1.08), color: meta, marginTop: fs * 0.35, fontWeight: 400 }}>
            {personal.title}
          </div>
        )}

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${fs * 0.3}px ${fs * 1.5}px`,
          marginTop: fs * 0.85,
          fontSize: sz.meta,
          color: meta,
        }}>
          {personal.email    && <span>{personal.email}</span>}
          {personal.phone    && <span>{personal.phone}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github   && <span>{personal.github}</span>}
          {personal.website  && <span>{personal.website}</span>}
        </div>

        {personal.summary && (
          <p style={{
            marginTop: fs * 1.1,
            fontSize: sz.body,
            lineHeight: 1.8,
            color: '#333',
            maxWidth: '72ch',
          }}>
            {personal.summary}
          </p>
        )}
      </div>

      {/* ── Experience ── */}
      {vis.has('experience') && experience.length > 0 && (
        <div data-section="experience"><Section title="Experience">
          {experience.map((exp, i) => (
            <div key={exp.id} style={{ marginBottom: i < experience.length - 1 ? fs * 1.7 : 0, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: sz.body }}>{exp.role}</span>
                  {exp.company && (
                    <span style={{ color: meta, marginLeft: 8, fontSize: sz.body }}>at {exp.company}</span>
                  )}
                </div>
                <span style={{ fontSize: sz.meta, color: meta, whiteSpace: 'nowrap' }}>
                  {dateRange(exp.startDate, exp.endDate, exp.current)}
                  {exp.location && ` · ${exp.location}`}
                </span>
              </div>
              {exp.description && (
                <div style={{
                  marginTop: fs * 0.45,
                  fontSize: sz.body,
                  lineHeight: 1.6,
                  color: '#2d2d2d',
                }}>
                  {exp.description.split('\n').map((line, i, arr) => (
                    <div key={i} style={{ marginBottom: i < arr.length - 1 ? 4 : 0 }}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Section></div>
      )}

      {/* ── Education ── */}
      {vis.has('education') && education.length > 0 && (
        <div data-section="education"><Section title="Education">
          {education.map((edu, i) => (
            <div key={edu.id} style={{ marginBottom: i < education.length - 1 ? fs * 1.3 : 0, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: sz.body }}>{edu.school}</span>
                  {(edu.degree || edu.field) && (
                    <span style={{ color: meta, marginLeft: 8, fontSize: sz.body }}>
                      {[edu.degree, edu.field].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: sz.meta, color: meta, whiteSpace: 'nowrap' }}>
                  {dateRange(edu.startDate, edu.endDate, false)}
                </span>
              </div>
              {edu.gpa && <MetaLine>GPA {edu.gpa}</MetaLine>}
              {edu.description && (
                <div style={{ marginTop: 4, fontSize: sz.body, color: '#444', lineHeight: 1.6 }}>{edu.description}</div>
              )}
            </div>
          ))}
        </Section></div>
      )}

      {/* ── Skills ── */}
      {vis.has('skills') && skills.length > 0 && (
        <div data-section="skills"><Section title="Skills">
          <div style={{ display: 'flex', flexDirection: 'column', gap: fs * 0.5 }}>
            {skills.map((cat) => (
              <div key={cat.id} style={{ display: 'flex', gap: fs * 1.1, alignItems: 'baseline' }}>
                <div style={{
                  width: 100,
                  flexShrink: 0,
                  fontSize: sz.meta,
                  color: meta,
                  paddingTop: 1,
                }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: sz.body, color: '#2d2d2d', lineHeight: 1.6 }}>
                  {cat.skills.join(',  ')}
                </div>
              </div>
            ))}
          </div>
        </Section></div>
      )}

      {/* ── Projects ── */}
      {vis.has('projects') && projects.length > 0 && (
        <div data-section="projects"><Section title="Projects">
          {projects.map((proj, i) => (
            <div key={proj.id} style={{ marginBottom: i < projects.length - 1 ? fs * 1.4 : 0, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: sz.body }}>{proj.name}</span>
                  {proj.url && (
                    <span style={{ fontSize: sz.meta, color: c.primary, marginLeft: 10 }}>{proj.url}</span>
                  )}
                </div>
                {(proj.startDate || proj.endDate) && (
                  <span style={{ fontSize: sz.meta, color: meta, whiteSpace: 'nowrap' }}>
                    {dateRange(proj.startDate, proj.endDate, false)}
                  </span>
                )}
              </div>
              {proj.description && (
                <div style={{ marginTop: 4, fontSize: sz.body, color: '#333', lineHeight: 1.6 }}>
                  {proj.description.split('\n').map((line, i, arr) => (
                    <div key={i} style={{ marginBottom: i < arr.length - 1 ? 4 : 0 }}>{line}</div>
                  ))}
                </div>
              )}
              {proj.technologies.length > 0 && (
                <MetaLine>{proj.technologies.join(' · ')}</MetaLine>
              )}
            </div>
          ))}
        </Section></div>
      )}

      {/* ── Two-column footer: Certifications + Languages ── */}
      {((vis.has('certifications') && certifications.length > 0) ||
        (vis.has('languages') && languages.length > 0)) && (
        <div style={{ display: 'flex', gap: fs * 2.2 }}>
          {vis.has('certifications') && certifications.length > 0 && (
            <div data-section="certifications" style={{ flex: 1 }}>
              <Section title="Certifications">
                {certifications.map((cert) => (
                  <div key={cert.id} style={{ marginBottom: fs * 0.65, fontSize: sz.body }}>
                    <span style={{ fontWeight: 700 }}>{cert.name}</span>
                    {cert.issuer && <MetaLine>{cert.issuer}{cert.date && ` · ${fmt(cert.date)}`}</MetaLine>}
                  </div>
                ))}
              </Section>
            </div>
          )}
          {vis.has('languages') && languages.length > 0 && (
            <div data-section="languages" style={{ flex: 1 }}>
              <Section title="Languages">
                {languages.map((lang) => (
                  <div key={lang.id} style={{ fontSize: sz.body, marginBottom: fs * 0.45 }}>
                    <span style={{ fontWeight: 700 }}>{lang.language}</span>
                    <span style={{ color: meta, marginLeft: 8, fontSize: sz.meta }}>— {PROFICIENCY[lang.proficiency]}</span>
                  </div>
                ))}
              </Section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
