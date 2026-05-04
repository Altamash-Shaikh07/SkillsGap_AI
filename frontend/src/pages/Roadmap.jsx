import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { ArrowRight } from "lucide-react"

export default function Roadmap({ appState }) {
  const navigate = useNavigate()
  const roadmap = appState?.roadmapData

  const [openWeek, setOpenWeek] = useState(1)

  if (!roadmap || !roadmap.weeks) {
    return (
      <div className="text-white text-center mt-20">
        No roadmap available. Generate from dashboard.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      {/* HEADER FIXED */}
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
            <button onClick={() => navigate("/dashboard")}>Analysis</button>
            <button className="bg-white/10 px-3 py-1 rounded text-white">Roadmap</button>
            <button onClick={() => navigate("/interview")}>Interview</button>
          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* TITLE FIXED */}
        <div className="mb-12">
          <p className="text-blue-400 text-sm mb-2 font-medium">
            Personalized Roadmap
          </p>

          <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
            {roadmap.job_role} Learning Path
          </h1>

          <p className="text-slate-400">
            {roadmap.total_duration_weeks}-week plan to master key skills
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {roadmap.weeks.map((week) => (
              <div
                key={week.week}
                className="bg-[#0B1220] border border-white/10 rounded-2xl p-6"
              >

                {/* HEADER FIXED (INLINE) */}
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() =>
                    setOpenWeek(openWeek === week.week ? null : week.week)
                  }
                >
                  <div className="flex items-center gap-4">

                    {/* W1 WHITE */}
                    <span className="text-white font-semibold">
                      W{week.week}
                    </span>

                    {/* TITLE INLINE */}
                    <h2 className="text-lg font-semibold text-white">
                      {week.topic}
                    </h2>

                  </div>

                  <span className="text-slate-400 text-xl">
                    {openWeek === week.week ? "−" : "+"}
                  </span>
                </div>

                {/* CONTENT */}
                {openWeek === week.week && (
                  <div className="mt-6 space-y-5 text-left">

                    {/* TASKS LEFT */}
                    <div>
                      <p className="text-slate-400 text-sm mb-2 text-left">
                        Tasks
                      </p>

                      <ul className="list-disc ml-6 text-slate-300 space-y-2 text-left">
                        {week.tasks.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    {/* RESOURCES */}
                    <div>
                      <p className="text-slate-400 text-sm mb-2">
                        Resources
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {week.resources.map((r, i) => (
                          <a
                            key={i}
                            href={r}
                            target="_blank"
                            className="text-xs px-3 py-1 bg-white/10 rounded-md hover:bg-white/20 transition"
                          >
                            {r.replace("https://", "").slice(0, 25)}
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* PROJECT */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-left">
                      <span className="text-blue-400 font-medium">
                        Weekly Project:
                      </span>{" "}
                      {week.project}
                    </div>

                  </div>
                )}

              </div>
            ))}

          </div>

          {/* RIGHT */}
          <div className="space-y-6">

            <h3 className="text-lg font-semibold text-white">
              Project Ideas
            </h3>

            {roadmap.project_suggestions?.map((p, i) => (
              <div
                key={i}
                className="bg-[#0B1220] border border-white/10 rounded-2xl p-5"
              >

                <h4 className="font-semibold text-white mb-2">
                  {p.title}
                </h4>

                <p className="text-slate-400 text-sm mb-3">
                  {p.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {p.skills_covered.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-white/10 rounded-md"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-500">
                  {p.estimated_time}
                </p>

              </div>
            ))}

          </div>

        </div>

        {/* FLOAT BUTTON */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => navigate("/interview")}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2"
          >
            Go to Interview <ArrowRight size={16} />
          </button>
        </div>

      </main>
    </div>
  )
}