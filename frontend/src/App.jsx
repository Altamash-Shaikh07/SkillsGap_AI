import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Auth from "./pages/Auth";
import Upload from "./pages/upload";
import Dashboard from "./pages/Dashboard";
import Roadmap from "./pages/Roadmap";
import Interview from "./pages/Interview";
import Result from "./pages/Result";

function App() {
  const [appState, setAppState] = useState({});

  // ✅ FIXED: proper state merge
  const updateState = (data) => {
    setAppState((prev) => ({ ...prev, ...data }));
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* 🔐 Auth (Landing Page) */}
        <Route path="/" element={<Auth />} />

        {/* 📄 Upload */}
        <Route
          path="/upload"
          element={<Upload appState={appState} updateState={updateState} />}
        />

        {/* 📊 Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard appState={appState} updateState={updateState} />}
        />

        {/* 🧠 Roadmap */}
        <Route
          path="/roadmap"
          element={<Roadmap appState={appState} />}
        />

        {/* 🎤 Interview */}
        <Route
          path="/interview"
          element={<Interview appState={appState} updateState={updateState} />}
        />

        {/* 🎯 Result */}
        <Route
          path="/result"
          element={<Result appState={appState} />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;