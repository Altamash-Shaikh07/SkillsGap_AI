import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Code2, ExternalLink, ChevronDown, ChevronRight, Layers, Star, MessageSquare } from 'lucide-react'

export default function RoadmapPage({ appState, updateState }) {
  const navigate = useNavigate()
  const { roadmapData, analysisData } = appState
  const [openWeek, setOpenWeek] = useState(0)

  if (!roadmapData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-slate-500 mb-4">No roadmap generated yet.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Back to Dashboard</button>
      </div>
    )
  }

  const { weeks = [], project_suggestions = [], course_recommendations = [], job_role, missing_skills = [] } = roadmapData

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <p className="text-sm text-slate-500 mb-1">Personalized Roadmap</p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">{job_role} Learning Path</h1>
        <p className="text-slate-400 text-sm">
          {weeks.length}-week plan to master: {missing_skills.slice(0, 5).join(', ')}{missing_skills.length > 5 ? ` +${missing_skills.length - 5} more` : ''}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Weekly plan */}
        <div className="lg:col-span-2 space-y-3 animate-fade-up-2">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Weekly Schedule</h2>
          {weeks.map((week, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpenWeek(openWeek === i ? -1 : i)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center text-xs font-bold text-primary-400 shrink-0">
                    W{week.week}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{week.topic}</p>
                    <p className="text-xs text-slate-500">{week.tasks?.length || 0} tasks</p>
                  </div>
                </div>
                {openWeek === i
                  ? <ChevronDown size={16} className="text-slate-400 shrink-0" />
                  : <ChevronRight size={16} className="text-slate-500 shrink-0" />
                }
              </button>

              {openWeek === i && (
                <div className="mt-4 space-y-4 border-t border-white/8 pt-4">
                  {/* Tasks */}
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Tasks</p>
                    <ul className="space-y-1.5">
                      {(week.tasks || []).map((task, ti) => (
                        <li key={ti} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Resources */}
                  {week.resources?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Resources</p>
                      <div className="flex flex-wrap gap-2">
                        {week.resources.map((url, ri) => (
                          <a
                            key={ri}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 bg-primary-500/8 px-2.5 py-1 rounded-lg border border-primary-500/15 transition-colors"
                          >
                            <ExternalLink size={10} />
                            {new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace('www.', '')}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project */}
                  {week.project && (
                    <div className="bg-primary-500/8 border border-primary-500/15 rounded-xl px-4 py-3">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Code2 size={10} /> Weekly Project
                      </p>
                      <p className="text-sm text-slate-300">{week.project}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 animate-fade-up-3">
          {/* Projects */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers size={13} /> Project Ideas
            </h2>
            <div className="space-y-3">
              {project_suggestions.map((p, i) => (
                <div key={i} className="card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-200">{p.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      p.difficulty === 'Beginner' ? 'bg-emerald-500/15 text-emerald-400'
                      : p.difficulty === 'Intermediate' ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-red-500/15 text-red-400'
                    }`}>{p.difficulty}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {(p.skills_covered || []).map((s, si) => (
                      <span key={si} className="skill-badge bg-white/5 text-slate-400 border border-white/8">{s}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 mt-2">⏱ {p.estimated_time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen size={13} /> Courses
            </h2>
            <div className="space-y-3">
              {course_recommendations.map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer"
                  className="card block hover:border-primary-500/30 transition-colors group">
                  <div className="flex items-start gap-2 mb-1">
                    <Star size={12} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{c.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span>{c.platform}</span>
                    <span>·</span>
                    <span>{c.duration}</span>
                    <span>·</span>
                    <span className="text-emerald-500">{c.price}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Interview CTA */}
          <button
            onClick={() => navigate('/interview')}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <MessageSquare size={16} />
            Start Mock Interview
          </button>
        </div>
      </div>
    </main>
  )
}
