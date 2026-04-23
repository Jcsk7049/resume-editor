import React from 'react';
import type { ResumeData, ResumeSettings } from '../types/resume';

interface Props {
  data: ResumeData;
  settings: ResumeSettings;
}

const proficiencyLabel: Record<string, string> = {
  Native: '母語', Fluent: '流利', Advanced: '進階', Intermediate: '中級', Basic: '基礎',
};
const proficiencyWidth: Record<string, string> = {
  Native: '100%', Fluent: '85%', Advanced: '70%', Intermediate: '55%', Basic: '35%',
};

function formatDate(d: string) {
  if (!d) return '';
  const [y, m] = d.split('-');
  return `${y}/${m}`;
}

// ── Shared typography scale ────────────────────────────────────────────────
// Section title : body = strict 1.2 : 1
// Item title uses body size + bold weight only (no extra px bump)
// Meta uses 0.88× body size
function scale(fs: number) {
  return {
    name:    Math.round(fs * 2.2),   // resume owner's name
    section: Math.round(fs * 1.2),   // section headings (工作經歷 etc.)
    body:    fs,                      // descriptions, paragraphs
    meta:    Math.round(fs * 0.88),  // dates, locations, secondary labels
  };
}

const FONT = `'Inter', 'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;

export default function ModernTemplate({ data, settings }: Props) {
  const { personal, experience, education, skills, projects, certifications, languages, sections } = data;
  const { colors, fontSize, } = settings;
  const sz = scale(fontSize);

  const visibleSections = sections.filter((s) => s.visible);

  const headerStyle: React.CSSProperties = {
    background: colors.primary,
    color: '#fff',
    padding: '28px 36px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: colors.primary,
    borderBottom: `1.5px solid ${colors.primary}`,
    paddingBottom: '5px',
    marginBottom: '12px',
    fontSize: sz.section,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  const tagStyle: React.CSSProperties = {
    background: colors.accent,
    color: colors.primary,
    borderRadius: '3px',
    padding: '2px 8px',
    fontSize: sz.meta,
    fontWeight: 600,
    display: 'inline-block',
    margin: '2px 3px',
  };

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: sz.body,
        fontWeight: 400,
        lineHeight: 1.6,
        color: colors.text,
        background: colors.background,
        minHeight: '297mm',
        width: '210mm',
      }}
    >
      {/* Header */}
      <div data-section="personal" style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          {personal.avatar && (
            <img
              src={personal.avatar}
              alt="avatar"
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: sz.name, fontWeight: 700, lineHeight: 1.15 }}>{personal.name || '姓名'}</div>
            <div style={{ fontSize: Math.round(fontSize * 1.08), opacity: 0.9, marginTop: 4, fontWeight: 400 }}>{personal.title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 16px', marginTop: 10, fontSize: sz.meta, opacity: 0.85 }}>
              {personal.email    && <span>{personal.email}</span>}
              {personal.phone    && <span>{personal.phone}</span>}
              {personal.location && <span>{personal.location}</span>}
              {personal.linkedin && <span>{personal.linkedin}</span>}
              {personal.github   && <span>{personal.github}</span>}
              {personal.website  && <span>{personal.website}</span>}
            </div>
          </div>
        </div>
        {personal.summary && (
          <div style={{ marginTop: 14, fontSize: sz.body, lineHeight: 1.7, opacity: 0.9, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 12 }}>
            {personal.summary}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: `22px ${settings.pageMargin}px` }}>
        {visibleSections.map((sec) => {
          if (sec.type === 'personal') return null;

          if (sec.type === 'experience' && experience.length > 0) return (
            <div key="experience" data-section="experience" style={{ marginBottom: 22 }}>
              <div style={sectionTitleStyle}>工作經歷</div>
              {experience.map((exp) => (
                <div key={exp.id} style={{ marginBottom: 16, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: sz.body }}>{exp.role || '職稱'}</span>
                      <span style={{ color: colors.primary, fontWeight: 600, marginLeft: 10, fontSize: sz.body }}>{exp.company}</span>
                    </div>
                    <span style={{ fontSize: sz.meta, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {formatDate(exp.startDate)} – {exp.current ? '至今' : formatDate(exp.endDate)}
                      {exp.location && ` | ${exp.location}`}
                    </span>
                  </div>
                  {exp.description && (
                    <div style={{ marginTop: 5, fontSize: sz.body, lineHeight: 1.6, color: '#374151' }}>
                      {exp.description.split('\n').map((line, i, arr) => (
                        <div key={i} style={{ marginBottom: i < arr.length - 1 ? 4 : 0 }}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );

          if (sec.type === 'education' && education.length > 0) return (
            <div key="education" data-section="education" style={{ marginBottom: 22 }}>
              <div style={sectionTitleStyle}>學歷</div>
              {education.map((edu) => (
                <div key={edu.id} style={{ marginBottom: 12, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: sz.body }}>{edu.school}</span>
                      <span style={{ color: '#6b7280', marginLeft: 10, fontSize: sz.body }}>
                        {edu.degree} {edu.field}
                      </span>
                    </div>
                    <span style={{ fontSize: sz.meta, color: '#6b7280' }}>
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                    </span>
                  </div>
                  {edu.gpa && <div style={{ fontSize: sz.meta, color: '#6b7280', marginTop: 2 }}>GPA: {edu.gpa}</div>}
                  {edu.description && <div style={{ fontSize: sz.body, color: '#374151', marginTop: 4 }}>{edu.description}</div>}
                </div>
              ))}
            </div>
          );

          if (sec.type === 'skills' && skills.length > 0) return (
            <div key="skills" data-section="skills" style={{ marginBottom: 22 }}>
              <div style={sectionTitleStyle}>技能</div>
              {skills.map((cat) => (
                <div key={cat.id} style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: sz.body, color: '#374151', marginRight: 8 }}>{cat.name}：</span>
                  {cat.skills.map((skill, i) => (
                    <span key={i} style={tagStyle}>{skill}</span>
                  ))}
                </div>
              ))}
            </div>
          );

          if (sec.type === 'projects' && projects.length > 0) return (
            <div key="projects" data-section="projects" style={{ marginBottom: 22 }}>
              <div style={sectionTitleStyle}>專案經歷</div>
              {projects.map((proj) => (
                <div key={proj.id} style={{ marginBottom: 14, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: sz.body }}>{proj.name}</span>
                      {proj.role && <span style={{ color: '#6b7280', marginLeft: 8, fontSize: sz.meta }}>| {proj.role}</span>}
                    </div>
                    {(proj.startDate || proj.endDate) && (
                      <span style={{ fontSize: sz.meta, color: '#6b7280' }}>
                        {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                      </span>
                    )}
                  </div>
                  {proj.url && <div style={{ fontSize: sz.meta, color: colors.primary, marginTop: 2 }}>{proj.url}</div>}
                  {proj.description && (
                    <div style={{ fontSize: sz.body, color: '#374151', marginTop: 4, lineHeight: 1.6 }}>
                      {proj.description.split('\n').map((line, i, arr) => (
                        <div key={i} style={{ marginBottom: i < arr.length - 1 ? 4 : 0 }}>{line}</div>
                      ))}
                    </div>
                  )}
                  {proj.technologies.length > 0 && (
                    <div style={{ marginTop: 5 }}>
                      {proj.technologies.map((t, i) => <span key={i} style={tagStyle}>{t}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );

          if (sec.type === 'certifications' && certifications.length > 0) return (
            <div key="certifications" data-section="certifications" style={{ marginBottom: 22 }}>
              <div style={sectionTitleStyle}>證照 / 認證</div>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: sz.body }}>{cert.name}</span>
                    {cert.issuer && <span style={{ color: '#6b7280', marginLeft: 8, fontSize: sz.meta }}>— {cert.issuer}</span>}
                  </div>
                  {cert.date && <span style={{ fontSize: sz.meta, color: '#6b7280' }}>{formatDate(cert.date)}</span>}
                </div>
              ))}
            </div>
          );

          if (sec.type === 'languages' && languages.length > 0) return (
            <div key="languages" data-section="languages" style={{ marginBottom: 22 }}>
              <div style={sectionTitleStyle}>語言能力</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ minWidth: 130 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: sz.body, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>{lang.language}</span>
                      <span style={{ color: '#6b7280', fontSize: sz.meta }}>{proficiencyLabel[lang.proficiency]}</span>
                    </div>
                    <div style={{ height: 5, background: '#e5e7eb', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: proficiencyWidth[lang.proficiency], background: colors.primary, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

          return null;
        })}
      </div>
    </div>
  );
}
