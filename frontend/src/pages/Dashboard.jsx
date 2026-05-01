import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Map
} from 'lucide-react'
import SkillGapChart from '../components/SkillGapChart'

const CATEGORY_TABS = ['All', 'Have', 'Partial', 'Missing']

export default function Dashboard({ appState, updateState }) {
  const navigate = useNavigate()
  const { analysisData } = appState

  const [tab, setTab] = useState('All')

  // ✅ moved console.log inside component
  console.log("DASHBOARD DATA:", analysisData)

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/")
  }, [])

  if (!analysisData || !analysisData.have_skills) {
    return (
      <div className="text-white text-center mt-20">
        No analysis data. Go back and upload resume.
      </div>
    )
  }

  const {
    have_skills,
    partial_skills,
    missing_skills,
    match_percentage,
    job_role
  } = analysisData

  const allSkills = [
    ...have_skills.map(s => ({ ...s, status: 'have' })),
    ...partial_skills.map(s => ({ ...s, status: 'partial' })),
    ...missing_skills.map(s => ({ ...s, status: 'missing' })),
  ]

  const filtered =
    tab === 'All' ? allSkills :
    tab === 'Have' ? have_skills.map(s => ({ ...s, status: 'have' })) :
    tab === 'Partial' ? partial_skills.map(s => ({ ...s, status: 'partial' })) :
    missing_skills.map(s => ({ ...s, status: 'missing' }))

  const handleRoadmap = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/generate-roadmap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ skill: job_role }),
    })

    const data = await res.json()
    updateState({ roadmapData: data.roadmap })
    navigate("/roadmap")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              ⚡
            </div>
            <h1 className="text-white font-semibold text-lg">
              SkillGap <span className="text-blue-500">AI</span>
            </h1>
          </div>

          <div className="flex gap-6 text-sm text-slate-300">
            <button onClick={() => navigate("/upload")}>Upload</button>
            <button className="bg-white/10 px-3 py-1 rounded">Analysis</button>
            <button onClick={() => navigate("/roadmap")}>Roadmap</button>
            <button onClick={() => navigate("/interview")}>Interview</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        <div className="grid lg:grid-cols-2 gap-6 mb-8">

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-300 mb-4">Skill Breakdown</h3>
            <div className="flex justify-center">
              <SkillGapChart
                have={have_skills.length}
                partial={partial_skills.length}
                missing={missing_skills.length}
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">

            <div className="flex gap-2 mb-4">
              {CATEGORY_TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 text-xs rounded ${
                    tab === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {filtered.map((s, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 text-xs rounded-full ${
                    s.status === 'have'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : s.status === 'partial'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {s.skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-white/10 rounded-xl p-10 text-center">

          <Map size={32} className="mx-auto text-blue-400 mb-4" />

          <h2 className="text-xl font-bold mb-2">
            Build Your Roadmap
          </h2>

          <p className="text-slate-400 mb-6">
            You have {match_percentage}% match.
          </p>

          <button
            onClick={handleRoadmap}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
          >
            Generate Roadmap <ArrowRight size={16} className="inline ml-1" />
          </button>

        </div>

      </main>
    </div>
  )
}