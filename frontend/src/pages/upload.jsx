import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload as UploadIcon, FileText, Sparkles } from 'lucide-react'

export default function Upload({ appState, updateState }) {
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [roles] = useState(["Frontend Developer", "Backend Developer", "Full Stack Developer"])
  const [selectedRole, setRole] = useState('')
  const [jdText, setJdText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) {
      setFile(accepted[0])
      setError('')
    }
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  })

  const handleSubmit = async () => {
    if (loading) return // 🔥 prevent double click

    setError("")

    if (!file) return setError("Please upload resume")
    if (!selectedRole && !jdText.trim()) return setError("Select role or paste JD")

    const token = localStorage.getItem("token")

    try {
      setLoading(true)

      // 🔥 RESET OLD STATE (VERY IMPORTANT)
      updateState({
        sessionId: null,
        analysisData: null,
      })

      // 🔹 STEP 1: Upload Resume
      const formData = new FormData()
      formData.append("file", file)

      const res1 = await fetch("http://127.0.0.1:8000/api/upload-resume", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const resumeData = await res1.json()
      console.log("RESUME DATA:", resumeData)

      // 🔥 Ensure skills exist
      let resumeSkills = [
        ...(resumeData.skills || []),
        ...(resumeData.technologies || []),
        ...(resumeData.frameworks || [])
      ]

      if (resumeSkills.length === 0) {
        console.warn("⚠️ No skills extracted → using fallback")
        resumeSkills = ["JavaScript", "React", "Node.js"]
      }

      // 🔹 STEP 2: Analyze
   const res2 = await fetch("http://127.0.0.1:8000/api/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    session_id: resumeData.session_id,

    resume_skills: [
      ...(resumeData.skills || []),
      ...(resumeData.technologies || []),
      ...(resumeData.frameworks || [])
    ],

    // ✅ ALWAYS send role if selected
    job_role: selectedRole || undefined,

    // ✅ ONLY send JD if user typed something meaningful
    jd_text: jdText.trim().length > 20 ? jdText.trim() : undefined
  })
})

      // 🔹 STEP 3: Store
      updateState({
        sessionId: resumeData.session_id,
        analysisData,
        selectedRole: selectedRole || "Custom JD"
      })

      // 🔹 STEP 4: Navigate
      navigate('/dashboard')

    } catch (err) {
      console.error(err)
      setError("Upload or analysis failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      {/* HEADER */}
      <header className="w-full border-b border-white/10">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              ⚡
            </div>
            <h1 className="text-white font-semibold text-lg">
              SkillGap <span className="text-blue-500">AI</span>
            </h1>
          </div>

          <div className="flex gap-6 text-sm text-slate-300">
            <button className="px-3 py-1.5 bg-white/10 rounded-md text-white">Upload</button>
            <button onClick={() => navigate("/dashboard")} className="hover:text-white">Analysis</button>
            <button onClick={() => navigate("/roadmap")} className="hover:text-white">Roadmap</button>
            <button onClick={() => navigate("/interview")} className="hover:text-white">Interview</button>
          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="flex flex-col items-center px-6 py-16">

        <div className="text-center mb-14 w-full max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-xs text-blue-400 mb-6">
            <Sparkles size={12} /> AI-Powered Career Intelligence
          </div>

          <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
            Find Your <span className="text-blue-500">Skill Gap</span>,<br />
            Build Your Career
          </h1>

          <p className="text-slate-400 text-lg">
            Upload your resume and target role. We'll analyze your gaps and guide you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">

          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FileText size={16} /> Resume *
            </h2>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${
                file ? "border-green-500 bg-green-500/5" : "border-white/10 hover:border-white/20"
              }`}
            >
              <input {...getInputProps()} />

              {file ? (
                <p className="text-green-400">{file.name}</p>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <UploadIcon size={20} />
                  <p>Drag & drop or click to upload PDF</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Sparkles size={16} /> Target Role *
            </h2>

            <select
              value={selectedRole}
              onChange={(e) => {
                setRole(e.target.value)
                setJdText('')
              }}
              className="w-full p-3 mb-4 rounded bg-slate-800 text-white border border-white/20"
            >
              <option value="">Select role</option>
              {roles.map(r => <option key={r}>{r}</option>)}
            </select>

            <textarea
              placeholder="Or paste Job Description"
              value={jdText}
              onChange={(e) => {
                setJdText(e.target.value)
                setRole('')
              }}
              className="w-full p-3 rounded bg-slate-800 text-white border border-white/20"
            />
          </div>
        </div>

        {error && <p className="text-red-400 mt-4">{error}</p>}

        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 px-8 py-3 rounded-lg text-white hover:bg-blue-700"
          >
            {loading ? "Processing..." : "Analyze My Skills"}
          </button>
        </div>

      </main>
    </div>
  )
}