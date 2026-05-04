import { useNavigate } from "react-router-dom";

export default function Result({ appState }) {
  const navigate = useNavigate();
  const { evaluation } = appState || {};

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
        <p className="text-slate-400">No result found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <h1 className="text-3xl font-bold mb-8 text-center">
          Interview Result 🎯
        </h1>

        {/* SCORE CARD */}
        <div className="bg-[#0B1220] border border-white/10 rounded-2xl p-6 mb-6 text-center">
          <p className="text-slate-400 mb-2">Your Score</p>
          <h2 className="text-4xl font-bold text-blue-500">
            {evaluation.total_score} / 100
          </h2>
          <p className="mt-2 text-slate-300">{evaluation.message}</p>
        </div>

        {/* BREAKDOWN */}
        <div className="bg-[#0B1220] border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Performance Breakdown
          </h3>

          <p className="text-slate-300">
            Total Questions: {evaluation.breakdown?.total_questions}
          </p>

          <p className="text-slate-300">
            Average Score: {evaluation.breakdown?.avg_score}
          </p>
        </div>

        {/* IMPROVEMENTS */}
        <div className="bg-[#0B1220] border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Improvement Areas
          </h3>

          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            {evaluation.improvement_areas?.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>

        {/* BUTTON */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}