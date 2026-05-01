import { useNavigate } from "react-router-dom";

export default function Result({ appState }) {
  const navigate = useNavigate();
  const { evaluation } = appState || {};

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p className="text-slate-400">No result found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Interview Result 🎯
        </h1>

        <div className="card p-6 whitespace-pre-wrap text-slate-300 leading-relaxed">
          {evaluation}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}