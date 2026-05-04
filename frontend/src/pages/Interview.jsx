import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Interview({ appState, updateState }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ✅ FETCH QUESTIONS
  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem("token");

      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("http://127.0.0.1:8000/api/start-interview", {
        method: "POST",
        headers,
        body: JSON.stringify({
          job_role:
            appState?.analysisData?.job_role || "Full Stack Developer",
          session_id: appState?.sessionId,
        }),
      });

      const data = await res.json();

      console.log("INTERVIEW API:", data);

      setSessionId(data.interview_session_id);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEXT QUESTION
  const nextQuestion = async () => {
    if (!input.trim()) {
      alert("Answer cannot be empty");
      return;
    }

    const token = localStorage.getItem("token");
    const currentQuestion = questions[current];

    const res = await fetch("http://127.0.0.1:8000/api/submit-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        interview_session_id: sessionId,
        question_id: currentQuestion.id,
        answer: input,
      }),
    });

    const data = await res.json();

    const updatedAnswers = [...answers, input];
    setAnswers(updatedAnswers);
    setInput("");

    // 👉 Next question
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      return;
    }
    console.log("FINAL DATA:", data)
    // 🎯 FINAL RESULT
   updateState({
  evaluation: data.final_result || data.evaluation,
})

    navigate("/result");
  };

  // ⏳ LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
        Generating interview...
      </div>
    );
  }

  // ❌ FAILED
  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Failed to load interview
      </div>
    );
  }

  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#020617] text-white">

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
            <button onClick={() => navigate("/dashboard")}>Analysis</button>
            <button onClick={() => navigate("/roadmap")}>Roadmap</button>
            <button className="bg-white/10 px-3 py-1 rounded text-white">
              Interview
            </button>
          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* PROGRESS BAR */}
        <div className="mb-6">
          <div className="w-full bg-white/10 h-2 rounded-full">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* CARD */}
        <div className="bg-[#0B1220] border border-white/10 rounded-2xl p-8">

          <p className="text-sm text-slate-400 mb-2">
            Question {current + 1} / {questions.length}
          </p>

          <h2 className="text-xl font-semibold text-white mb-6 leading-relaxed tracking-wide">
  {questions[current].question}
</h2>

          <textarea
            className="w-full p-4 rounded-lg bg-white/5 border border-white/10 mb-6 outline-none focus:border-blue-500"
            placeholder="Type your answer..."
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            onClick={nextQuestion}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg w-full"
          >
            {current === questions.length - 1
              ? "Finish Interview"
              : "Next Question"}
          </button>

        </div>

      </main>
    </div>
  );
}