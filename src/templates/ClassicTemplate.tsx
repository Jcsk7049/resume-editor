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
  return `${y}/${m}`;
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

export default function ClassicTemplate({ data, settings }: Props) {
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
        padding: `${settings.pageMargin}px`,
      }}
    >
      {/* Header */}
      <div data-section="personal" style={{ textAlign: 'center', borderBottom: `2px solid ${colors.primary}`, paddingBottom: 18, marginBottom: 18 }}>
        <div style={{ fontSize: sz.name, fontWeight: 700, letterSpacing: '0.04em', color: colors.primary }}>
          {personal.name || '姓名'}
        </div>
        {personal.title && (
          <div style={{ fontSize: Math.round(fontSize * 1.08), color: '#4b5563', marginTop: 4, fontWeight: 400 }}>{personal.title}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '4px 18px', marginTop: 10, fontSize: sz.meta, color: '#6b7280' }}>
          {personal.email    && <span>{personal.email}</span>}
          {personal.phone    && <span>{personal.phone}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github   && <span>{personal.github}</span>}
          {personal.website  && <span>{personal.website}</span>}
        </div>
      </div>

      {personal.summary && (
        <div style={{ marginBottom: 16, fontSize: sz.body, lineHeight: 1.8, color: '#374151', textAlign: 'justify' }}>
          {personal.summary}
        </div>
      )}

      {visibleSections.map((sec) => {
        if (sec.type === 'personal') return null;

        const sectionTitle = (title: string) => (
          <div style={{
            fontSize: sz.section,
            fontWeight: 700,
            color: colors.primary,
            borderBottom: `1px solid ${colors.primary}`,
            paddingBottom: 4,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}>
            {title}
          </div>
        );

        if (sec.type === 'experience' && experience.length > 0) return (
          <div key="experience" data-section="experience" style={{ marginBottom: 20 }}>
            {sectionTitle('工作經歷')}
            {experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: 14, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: sz.body }}>{exp.company}</span>
                  <span style={{ fontSize: sz.meta, color: '#6b7280' }}>{exp.location}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ color: '#4b5563', fontSize: sz.body }}>{exp.role}</span>
                  <span style={{ fontSize: sz.meta, color: '#6b7280' }}>
                    {formatDate(exp.startDate)} – {exp.current ? '至今' : formatDate(exp.endDate)}
                  </span>
                </div>
                {exp.description && (
                  <div style={{ marginTop: 5, fontSize: sz.body, lineHeight: 1.6 }}>
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
          <div key="education" data-section="education" style={{ marginBottom: 20 }}>
            {sectionTitle('學歷')}
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: 10, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: sz.body }}>{edu.school}</span>
                  <span style={{ fontSize: sz.meta, color: '#6b7280' }}>
                    {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                  </span>
                </div>
                <div style={{ color: '#4b5563', marginTop: 2, fontSize: sz.body }}>
                  {edu.degree} {edu.field} {edu.gpa && `— GPA: ${edu.gpa}`}
                </div>
                {edu.description && <div style={{ fontSize: sz.body, marginTop: 4 }}>{edu.description}</div>}
              </div>
            ))}
          </div>
        );

        if (sec.type === 'skills' && skills.length > 0) return (
          <div key="skills" data-section="skills" style={{ marginBottom: 20 }}>
            {sectionTitle('技能')}
            {skills.map((cat) => (
              <div key={cat.id} style={{ display: 'flex', gap: 12, marginBottom: 7, alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, minWidth: 90, fontSize: sz.body, paddingTop: 1 }}>{cat.name}</div>
                <div style={{ flex: 1, fontSize: sz.body, color: '#374151' }}>{cat.skills.join(' · ')}</div>
              </div>
            ))}
          </div>
        );

        if (sec.type === 'projects' && projects.length > 0) return (
          <div key="projects" data-section="projects" style={{ marginBottom: 20 }}>
            {sectionTitle('專案經歷')}
            {projects.map((proj) => (
              <div key={proj.id} style={{ marginBottom: 12, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: sz.body }}>{proj.name}</span>
                  {(proj.startDate || proj.endDate) && (
                    <span style={{ fontSize: sz.meta, color: '#6b7280' }}>
                      {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <div style={{ fontSize: sz.body, lineHeight: 1.6, marginTop: 4 }}>
                    {proj.description.split('\n').map((line, i, arr) => (
                      <div key={i} style={{ marginBottom: i < arr.length - 1 ? 4 : 0 }}>{line}</div>
                    ))}
                  </div>
                )}
                {proj.technologies.length > 0 && (
                  <div style={{ fontSize: sz.meta, color: '#6b7280', marginTop: 4 }}>
                    技術：{proj.technologies.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

        if (sec.type === 'certifications' && certifications.length > 0) return (
          <div key="certifications" data-section="certifications" style={{ marginBottom: 20 }}>
            {sectionTitle('證照 / 認證')}
            {certifications.map((cert) => (
              <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: sz.body }}>
                <span>
                  <strong>{cert.name}</strong>
                  {cert.issuer && <span style={{ color: '#6b7280' }}> — {cert.issuer}</span>}
                </span>
                {cert.date && <span style={{ fontSize: sz.meta, color: '#6b7280' }}>{formatDate(cert.date)}</span>}
              </div>
            ))}
          </div>
        );

        if (sec.type === 'languages' && languages.length > 0) return (
          <div key="languages" data-section="languages" style={{ marginBottom: 20 }}>
            {sectionTitle('語言能力')}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: sz.body }}>
              {languages.map((lang) => (
                <span key={lang.id}>
                  <strong>{lang.language}</strong>
                  <span style={{ fontSize: sz.meta, color: '#6b7280' }}>（{proficiencyLabel[lang.proficiency]}）</span>
                </span>
              ))}
            </div>
          </div>
        );

        return null;
      })}
    </div>
  );
}
