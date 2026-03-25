import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import RoadmapPage from './pages/RoadmapPage'
import InterviewPage from './pages/InterviewPage'
import Navbar from './components/Navbar'

export default function App() {
  // Global app state shared across pages
  const [appState, setAppState] = useState({
    sessionId: null,
    resumeData: null,      // { skills, technologies, frameworks, projects }
    analysisData: null,    // skill gap result
    roadmapData: null,     // generated roadmap
    selectedRole: null,
  })

  const updateState = (patch) => setAppState(prev => ({ ...prev, ...patch }))

  return (
    <div className="min-h-screen bg-mesh">
      <Navbar appState={appState} />
      <Routes>
        <Route path="/"          element={<UploadPage   appState={appState} updateState={updateState} />} />
        <Route path="/dashboard" element={<DashboardPage appState={appState} updateState={updateState} />} />
        <Route path="/roadmap"   element={<RoadmapPage  appState={appState} updateState={updateState} />} />
        <Route path="/interview" element={<InterviewPage appState={appState} updateState={updateState} />} />
        <Route path="*"          element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}
