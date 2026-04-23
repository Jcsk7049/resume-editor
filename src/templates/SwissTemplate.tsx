import type { ResumeData, ResumeSettings } from '../types/resume';

// Swiss International Typographic Style:
// — Strict left-column label / right-column content grid
// — Section numbers (01, 02 …) as the only decoration
// — No shadows, no cards, no gradients — pure typography
// — Hierarchy expressed through size (1.2:1) and weight, not colour

interface Props {
  data: ResumeData;
  settings: ResumeSettings;
}

const PROFICIENCY: Record<string, string> = {
  Native: '母語', Fluent: '流利', Advanced: '進階', Intermediate: '中級', Basic: '基礎',
};

function fmtShort(d: string) {
  if (!d) return '';
  const [y, m] = d.split('-');
  return `${y}.${m.padStart(2, '0')}`;
}
function dateRange(start: string, end: string, current: boolean) {
  const s = fmtShort(start);
  const e = current ? 'present' : fmtShort(end);
  if (!s && !e) return '';
  if (s && e) return `${s} – ${e}`;
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

export default function SwissTemplate({ data, settings }: Props) {
  const { personal, experience, education, skills, projects, certifications, languages, sections } = data;
  const vis = new Set(sections.filter(s => s.visible).map(s => s.type));
  const m = settings.pageMargin;
  const fs = settings.fontSize;
  const sz = scale(fs);
  const accent = settings.colors.primary;

  const LABEL_W = 116;
  const GAP     = 22;

  const Row = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: GAP }}>{children}</div>
  );

  const Label = ({ children }: { children?: React.ReactNode }) => (
    <div style={{
      width: LABEL_W,
      flexShrink: 0,
      fontSize: sz.meta,
      color: '#9ca3af',
      paddingTop: 2,
      textAlign: 'right',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {children}
    </div>
  );

  const Content = ({ children }: { children: React.ReactNode }) => (
    <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
  );

  let sectionIndex = 0;
  const Section = ({ title, children, sectionId }: { title: string; children: React.ReactNode; sectionId?: string }) => {
    sectionIndex++;
    const idx = String(sectionIndex).padStart(2, '0');
    return (
      <div data-section={sectionId} style={{ marginBottom: fs * 2.2 }}>
        <Row>
          <Label>
            <span style={{ color: accent, fontWeight: 700, fontVariantNumeric: 'normal' }}>{idx}</span>
          </Label>
          <Content>
            <div style={{
              fontSize: sz.section,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#111827',
              marginBottom: fs * 1.0,
              paddingBottom: fs * 0.4,
              borderBottom: '1px solid #e5e7eb',
            }}>
              {title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: fs * 1.3 }}>
              {children}
            </div>
          </Content>
        </Row>
      </div>
    );
  };

  return (
    <div style={{
      fontFamily: FONT,
      fontSize: sz.body,
      fontWeight: 400,
      color: '#111827',
      background: '#ffffff',
      width: '210mm',
      minHeight: '297mm',
      padding: `${m * 1.3}px ${m * 1.4}px ${m}px`,
      lineHeight: 1.6,
    }}>

      {/* ── Name block ── */}
      <div data-section="personal" style={{ marginBottom: fs * 2.8, paddingBottom: fs * 1.4, borderBottom: `2px solid #111827` }}>
        <Row>
          <Label />
          <Content>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18 }}>
              <div>
                <div style={{
                  fontSize: sz.name,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                  color: '#111827',
                }}>
                  {personal.name || '姓名'}
                </div>
                {personal.title && (
                  <div style={{
                    fontSize: sz.body,
                    color: '#6b7280',
                    marginTop: 5,
                    fontWeight: 400,
                  }}>
                    {personal.title}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: sz.meta,
                color: '#9ca3af',
                textAlign: 'right',
                lineHeight: 1.9,
                flexShrink: 0,
              }}>
                {personal.email    && <div>{personal.email}</div>}
                {personal.phone    && <div>{personal.phone}</div>}
                {personal.location && <div>{personal.location}</div>}
                {personal.linkedin && <div>{personal.linkedin}</div>}
                {personal.github   && <div>{personal.github}</div>}
                {personal.website  && <div style={{ color: accent }}>{personal.website}</div>}
              </div>
            </div>
            {personal.summary && (
              <p style={{
                marginTop: fs * 1.1,
                fontSize: sz.body,
                lineHeight: 1.8,
                color: '#374151',
                maxWidth: '64ch',
              }}>
                {personal.summary}
              </p>
            )}
          </Content>
        </Row>
      </div>

      {/* ── Experience ── */}
      {vis.has('experience') && experience.length > 0 && (
        <Section title="Experience" sectionId="experience">
          {experience.map((exp) => (
            <div key={exp.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <Row>
                <Label>{dateRange(exp.startDate, exp.endDate, exp.current)}</Label>
                <Content>
                  <div style={{ fontWeight: 700, fontSize: sz.body }}>{exp.role}</div>
                  <div style={{ fontSize: sz.meta, color: '#6b7280', marginTop: 1 }}>
                    {exp.company}{exp.location && ` — ${exp.location}`}
                  </div>
                  {exp.description && (
                    <div style={{ marginTop: fs * 0.45, fontSize: sz.body, lineHeight: 1.6, color: '#374151' }}>
                      {exp.description.split('\n').map((line, i, arr) => (
                        <div key={i} style={{ marginBottom: i < arr.length - 1 ? 4 : 0 }}>{line}</div>
                      ))}
                    </div>
                  )}
                </Content>
              </Row>
            </div>
          ))}
        </Section>
      )}

      {/* ── Education ── */}
      {vis.has('education') && education.length > 0 && (
        <Section title="Education" sectionId="education">
          {education.map((edu) => (
            <div key={edu.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}><Row>
              <Label>{dateRange(edu.startDate, edu.endDate, false)}</Label>
              <Content>
                <div style={{ fontWeight: 700, fontSize: sz.body }}>{edu.school}</div>
                <div style={{ fontSize: sz.meta, color: '#6b7280', marginTop: 1 }}>
                  {[edu.degree, edu.field].filter(Boolean).join(', ')}
                  {edu.gpa && ` · GPA ${edu.gpa}`}
                </div>
                {edu.description && (
                  <div style={{ marginTop: 4, fontSize: sz.meta, color: '#6b7280' }}>{edu.description}</div>
                )}
              </Content>
            </Row></div>
          ))}
        </Section>
      )}

      {/* ── Skills ── */}
      {vis.has('skills') && skills.length > 0 && (
        <Section title="Skills" sectionId="skills">
          {skills.map((cat) => (
            <Row key={cat.id}>
              <Label>{cat.name}</Label>
              <Content>
                <div style={{ fontSize: sz.body, color: '#1f2937', lineHeight: 1.6 }}>
                  {cat.skills.map((s, i) => (
                    <span key={i}>
                      {s}
                      {i < cat.skills.length - 1 && (
                        <span style={{ color: '#d1d5db', margin: '0 6px' }}>·</span>
                      )}
                    </span>
                  ))}
                </div>
              </Content>
            </Row>
          ))}
        </Section>
      )}

      {/* ── Projects ── */}
      {vis.has('projects') && projects.length > 0 && (
        <Section title="Projects" sectionId="projects">
          {projects.map((proj) => (
            <div key={proj.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}><Row>
              <Label>{dateRange(proj.startDate, proj.endDate, false)}</Label>
              <Content>
                <div style={{ fontWeight: 700, fontSize: sz.body }}>
                  {proj.name}
                  {proj.url && (
                    <span style={{ fontWeight: 400, fontSize: sz.meta, color: accent, marginLeft: 10 }}>
                      {proj.url}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <div style={{ marginTop: 4, fontSize: sz.body, color: '#374151', lineHeight: 1.6 }}>
                    {proj.description.split('\n').map((line, i, arr) => (
                      <div key={i} style={{ marginBottom: i < arr.length - 1 ? 4 : 0 }}>{line}</div>
                    ))}
                  </div>
                )}
                {proj.technologies.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: sz.meta, color: '#9ca3af' }}>
                    {proj.technologies.join('  ·  ')}
                  </div>
                )}
              </Content>
            </Row></div>
          ))}
        </Section>
      )}

      {/* ── Certifications ── */}
      {vis.has('certifications') && certifications.length > 0 && (
        <Section title="Certifications" sectionId="certifications">
          {certifications.map((cert) => (
            <Row key={cert.id}>
              <Label>{fmtShort(cert.date)}</Label>
              <Content>
                <span style={{ fontWeight: 700, fontSize: sz.body }}>{cert.name}</span>
                {cert.issuer && (
                  <span style={{ fontSize: sz.meta, color: '#9ca3af', marginLeft: 10 }}>{cert.issuer}</span>
                )}
              </Content>
            </Row>
          ))}
        </Section>
      )}

      {/* ── Languages ── */}
      {vis.has('languages') && languages.length > 0 && (
        <Section title="Languages" sectionId="languages">
          <Row>
            <Label />
            <Content>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <span style={{ fontWeight: 700, fontSize: sz.body }}>{lang.language}</span>
                    <span style={{ color: '#9ca3af', marginLeft: 6, fontSize: sz.meta }}>
                      {PROFICIENCY[lang.proficiency]}
                    </span>
                  </div>
                ))}
              </div>
            </Content>
          </Row>
        </Section>
      )}
    </div>
  );
}
