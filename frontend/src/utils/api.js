import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s for LLM calls
})

// ── Resume ────────────────────────────────────────────────────────────────
export const uploadResume = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload-resume', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ── Roles ─────────────────────────────────────────────────────────────────
export const getRoles = () => api.get('/roles')

// ── Analysis ─────────────────────────────────────────────────────────────
export const analyzeSkills = (payload) => api.post('/analyze', payload)

// ── Roadmap ───────────────────────────────────────────────────────────────
export const generateRoadmap = (payload) => api.post('/generate-roadmap', payload)

// ── Interview ─────────────────────────────────────────────────────────────
export const startInterview = (payload) => api.post('/start-interview', payload)
export const submitAnswer   = (payload) => api.post('/submit-answer', payload)

export default api
