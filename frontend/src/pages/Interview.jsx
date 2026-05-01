import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Interview({ appState, updateState }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ✅ FETCH QUESTIONS
  const fetchQuestions = async () => {
    const token = localStorage.getItem("token");
const res = await fetch("http://127.0.0.1:8000/api/generate-interview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        job_role: appState?.analysisData?.job_role || "Software Engineer",
        session_id: appState?.sessionId,
      }),
    });

    const data = await res.json();

    setSessionId(data.interview_session_id);
    setQuestions(data.questions);
  };

  // ✅ SUBMIT ANSWER + NEXT + FINAL EVALUATION
  const nextQuestion = async () => {
    const token = localStorage.getItem("token");
    const currentQuestion = questions[current];

    // 🔥 Submit each answer
    await fetch("http://127.0.0.1:8000/api/submit-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        interview_session_id: sessionId,
        question_id: currentQuestion.id,
        answer: input,
      }),
    });

    const updatedAnswers = [...answers, input];
    setAnswers(updatedAnswers);
    setInput("");

    // 👉 Next question
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      return;
    }

    // 🎯 FINAL STEP → EVALUATION
    const res = await fetch("http://127.0.0.1:8000/api/evaluate-interview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        questions: questions.map(q => q.question),
        answers: updatedAnswers,
      }),
    });

    const data = await res.json();

    // ✅ store result globally
    updateState({
      evaluation: data.evaluation,
    });

    // ✅ redirect to result page
    navigate("/result");
  };

  // ⏳ Loading UI
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p className="text-slate-400">Generating interview questions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
      <div className="card max-w-xl w-full p-6">

        <h2 className="text-xl mb-4">
          Question {current + 1} / {questions.length}
        </h2>

        <p className="mb-6 text-slate-300">
          {questions[current].question}
        </p>

        <textarea
          className="w-full p-3 rounded bg-white/5 border border-white/10 mb-4"
          placeholder="Type your answer..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button onClick={nextQuestion} className="btn-primary w-full">
          {current === questions.length - 1 ? "Finish Interview" : "Next"}
        </button>

      </div>
    </div>
  );
}