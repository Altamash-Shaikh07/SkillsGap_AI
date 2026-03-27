import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Map, MessageSquare, RefreshCw } from 'lucide-react'
import { generateRoadmap } from '../utils/api'
import SkillGapChart from '../components/SkillGapChart'

const CATEGORY_TABS = ['All', 'Have', 'Partial', 'Missing']

export default function DashboardPage({ appState, updateState }) {
  const navigate  = useNavigate()
  const { analysisData, resumeData, sessionId } = appState
  const [tab, setTab]       = useState('All')
  const [loading, setLoading] = useState(false)

  if (!analysisData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-slate-500 mb-4">No analysis data yet.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Upload Resume
        </button>
      </div>
    )
  }

  const { have_skills, partial_skills, missing_skills, match_percentage, job_role, recommendation } = analysisData
  const allSkills = [
    ...have_skills.map(s => ({ ...s, status: 'have' })),
    ...partial_skills.map(s => ({ ...s, status: 'partial' })),
    ...missing_skills.map(s => ({ ...s, status: 'missing' })),
  ]

  const filtered = tab === 'All' ? allSkills
    : tab === 'Have'    ? have_skills.map(s => ({ ...s, status: 'have' }))
    : tab === 'Partial' ? partial_skills.map(s => ({ ...s, status: 'partial' }))
    : missing_skills.map(s => ({ ...s, status: 'missing' }))

  const matchColor = match_percentage >= 85 ? 'text-emerald-400'
    : match_percentage >= 60 ? 'text-amber-400' : 'text-red-400'

  const handleRoadmap = async () => {
    setLoading(true)
    try {
      const { data } = await generateRoadmap({
        session_id: sessionId,
        job_role,
        missing_skills: missing_skills.map(s => s.skill),
        have_skills: have_skills.map(s => s.skill),
      })
      updateState({ roadmapData: data })
      navigate('/roadmap')
    } catch {
      alert('Roadmap generation failed. Check backend.')
    } finally {
      setLoading(false)
    }
  }

  const handleInterview = () => navigate('/interview')

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <p className="text-sm text-slate-500 mb-1">Analysis for</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{job_role}</h1>
        </div>
        <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> New Analysis
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-up-2">
        {[
          { label: 'Match Score',     value: `${match_percentage}%`, color: matchColor },
          { label: 'Skills You Have', value: have_skills.length,     color: 'text-emerald-400' },
          { label: 'Partial Match',   value: partial_skills.length,  color: 'text-amber-400' },
          { label: 'Skills Missing',  value: missing_skills.length,  color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 animate-fade-up-3">
        {/* Chart */}
        <div className="card flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 self-start">Skill Breakdown</h3>
          <div className="w-52">
            <SkillGapChart
              have={have_skills.length}
              partial={partial_skills.length}
              missing={missing_skills.length}
            />
          </div>
        </div>

        {/* Skills list */}
        <div className="card lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-white/5 p-1 rounded-xl w-fit">
            {CATEGORY_TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === t
                    ? 'bg-primary-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
                <span className="ml-1.5 opacity-60">
                  ({t === 'All' ? allSkills.length
                    : t === 'Have' ? have_skills.length
                    : t === 'Partial' ? partial_skills.length
                    : missing_skills.length})
                </span>
              </button>
            ))}
          </div>

          {/* Skill badges */}
          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <p className="text-sm text-slate-600">No skills in this category.</p>
            )}
            {filtered.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {s.status === 'have'    && <span className="skill-have flex items-center gap-1"><CheckCircle2 size={10} />{s.skill}</span>}
                {s.status === 'partial' && <span className="skill-partial flex items-center gap-1"><AlertTriangle size={10} />{s.skill}</span>}
                {s.status === 'missing' && <span className="skill-missing flex items-center gap-1"><XCircle size={10} />{s.skill}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-8 animate-fade-up-3">
        {recommendation === 'interview' ? (
          <div className="card border-emerald-500/20 bg-emerald-500/5 text-center py-10">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">You're Ready!</h2>
            <p className="text-slate-400 mb-6">
              {match_percentage}% skill match — you meet the threshold for this role. Time to ace the interview!
            </p>
            <button onClick={handleInterview} className="btn-primary flex items-center gap-2 mx-auto">
              <MessageSquare size={16} /> Start Mock Interview <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="card border-primary-500/20 bg-primary-500/5 text-center py-10">
            <div className="w-14 h-14 rounded-full bg-primary-500/15 flex items-center justify-center mx-auto mb-4">
              <Map size={28} className="text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-200 mb-2">Build Your Roadmap</h2>
            <p className="text-slate-400 mb-6">
              You have {match_percentage}% match. Let AI generate a personalized week-by-week learning plan for the {missing_skills.length} missing skills.
            </p>
            <button
              onClick={handleRoadmap}
              disabled={loading}
              className="btn-primary flex items-center gap-2 mx-auto disabled:opacity-60"
            >
              {loading ? 'Generating…' : (<><Map size={16} /> Generate Roadmap <ArrowRight size={16} /></>)}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
