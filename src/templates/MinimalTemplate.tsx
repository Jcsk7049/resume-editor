import React from 'react';
import type { ResumeData, ResumeSettings } from '../types/resume';

interface Props {
  data: ResumeData;
  settings: ResumeSettings;
}

const proficiencyLabel: Record<string, string> = {
  Native: '母語', Fluent: '流利', Advanced: '進階', Intermediate: '中級', Basic: '基礎',
};

function formatDate(d: string) {
  if (!d) return '';
  const [y, m] = d.split('-');
  return `${y}.${m}`;
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

export default function MinimalTemplate({ data, settings }: Props) {
  const { personal, experience, education, skills, projects, certifications, languages, sections } = data;
  const { colors, fontSize } = settings;
  const sz = scale(fontSize);

  const visibleSections = sections.filter((s) => s.visible);

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
        display: 'flex',
      }}
    >
      {/* Left sidebar */}
      <div style={{ width: 195, background: '#f9fafb', padding: '28px 18px', flexShrink: 0 }}>
        {personal.avatar && (
          <img
            src={personal.avatar}
            alt="avatar"
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: 14, display: 'block', margin: '0 auto 14px' }}
          />
        )}
        <div style={{ fontSize: sz.name, fontWeight: 700, lineHeight: 1.15, color: colors.primary }}>
          {personal.name || '姓名'}
        </div>
        {personal.title && (
          <div style={{ fontSize: sz.body, color: '#4b5563', marginTop: 5, lineHeight: 1.4, fontWeight: 400 }}>{personal.title}</div>
        )}

        <div style={{ marginTop: 20, fontSize: sz.meta, color: '#374151', lineHeight: 2 }}>
          {personal.email    && <div>{personal.email}</div>}
          {personal.phone    && <div>{personal.phone}</div>}
          {personal.location && <div>{personal.location}</div>}
          {personal.linkedin && <div style={{ wordBreak: 'break-all' }}>{personal.linkedin}</div>}
          {personal.github   && <div style={{ wordBreak: 'break-all' }}>{personal.github}</div>}
          {personal.website  && <div style={{ wordBreak: 'break-all' }}>{personal.website}</div>}
        </div>

        {skills.length > 0 && visibleSections.some(s => s.type === 'skills') && (
          <div data-section="skills" style={{ marginTop: 24 }}>
            <div style={{ fontSize: sz.section, fontWeight: 700, color: colors.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>技能</div>
            {skills.map((cat) => (
              <div key={cat.id} style={{ marginBottom: 9 }}>
                <div style={{ fontSize: sz.meta, fontWeight: 700, color: '#4b5563', marginBottom: 3 }}>{cat.name}</div>
                {cat.skills.map((skill, i) => (
                  <div key={i} style={{ fontSize: sz.meta, padding: '1px 0', color: '#374151' }}>· {skill}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {languages.length > 0 && visibleSections.some(s => s.type === 'languages') && (
          <div data-section="languages" style={{ marginTop: 20 }}>
            <div style={{ fontSize: sz.section, fontWeight: 700, color: colors.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>語言</div>
            {languages.map((lang) => (
              <div key={lang.id} style={{ fontSize: sz.meta, padding: '2px 0', color: '#374151' }}>
                <strong>{lang.language}</strong> — {proficiencyLabel[lang.proficiency]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right content */}
      <div style={{ flex: 1, padding: `28px ${settings.pageMargin}px 28px 24px` }}>
        {personal.summary && (
          <div style={{ marginBottom: 22, fontSize: sz.body, lineHeight: 1.8, color: '#374151', borderLeft: `2px solid ${colors.primary}`, paddingLeft: 12 }}>
            {personal.summary}
          </div>
        )}

        {visibleSections.map((sec) => {
          if (sec.type === 'personal' || sec.type === 'skills' || sec.type === 'languages') return null;

          const sectionTitle = (title: string) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 3, height: sz.section, background: colors.primary }} />
              <div style={{ fontSize: sz.section, fontWeight: 700, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
            </div>
          );

          if (sec.type === 'experience' && experience.length > 0) return (
            <div key="experience" data-section="experience" style={{ marginBottom: 22 }}>
              {sectionTitle('工作經歷')}
              {experience.map((exp) => (
                <div key={exp.id} style={{ marginBottom: 14, paddingLeft: 11, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: sz.body }}>{exp.role}</span>
                    <span style={{ fontSize: sz.meta, color: '#9ca3af' }}>
                      {formatDate(exp.startDate)} — {exp.current ? '現在' : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <div style={{ fontSize: sz.body, color: colors.primary, marginTop: 2 }}>{exp.company}{exp.location && ` · ${exp.location}`}</div>
                  {exp.description && (
                    <div style={{ marginTop: 5, fontSize: sz.body, lineHeight: 1.6, color: '#4b5563' }}>
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
              {sectionTitle('學歷')}
              {education.map((edu) => (
                <div key={edu.id} style={{ marginBottom: 10, paddingLeft: 11, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: sz.body }}>{edu.school}</span>
                    <span style={{ fontSize: sz.meta, color: '#9ca3af' }}>
                      {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                    </span>
                  </div>
                  <div style={{ fontSize: sz.body, color: colors.primary, marginTop: 2 }}>
                    {edu.degree} {edu.field}{edu.gpa && ` · GPA ${edu.gpa}`}
                  </div>
                  {edu.description && <div style={{ fontSize: sz.body, marginTop: 4, color: '#4b5563' }}>{edu.description}</div>}
                </div>
              ))}
            </div>
          );

          if (sec.type === 'projects' && projects.length > 0) return (
            <div key="projects" data-section="projects" style={{ marginBottom: 22 }}>
              {sectionTitle('專案')}
              {projects.map((proj) => (
                <div key={proj.id} style={{ marginBottom: 12, paddingLeft: 11, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ fontWeight: 700, fontSize: sz.body }}>{proj.name}</div>
                  {proj.technologies.length > 0 && (
                    <div style={{ fontSize: sz.meta, color: colors.primary, marginTop: 2 }}>{proj.technologies.join(' · ')}</div>
                  )}
                  {proj.description && (
                    <div style={{ fontSize: sz.body, marginTop: 4, color: '#4b5563', lineHeight: 1.6 }}>
                      {proj.description.split('\n').map((line, i, arr) => (
                        <div key={i} style={{ marginBottom: i < arr.length - 1 ? 4 : 0 }}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );

          if (sec.type === 'certifications' && certifications.length > 0) return (
            <div key="certifications" data-section="certifications" style={{ marginBottom: 22 }}>
              {sectionTitle('證照')}
              {certifications.map((cert) => (
                <div key={cert.id} style={{ paddingLeft: 11, marginBottom: 7, fontSize: sz.body }}>
                  <span style={{ fontWeight: 700 }}>{cert.name}</span>
                  {cert.issuer && <span style={{ color: '#6b7280', fontSize: sz.meta }}> · {cert.issuer}</span>}
                  {cert.date && <span style={{ color: '#9ca3af', fontSize: sz.meta }}> · {formatDate(cert.date)}</span>}
                </div>
              ))}
            </div>
          );

          return null;
        })}
      </div>
    </div>
  );
}
