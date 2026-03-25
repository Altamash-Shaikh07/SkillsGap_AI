# Sample Test Data for SkillGap AI

## Test Resume (Mock content — use to manually test the system)

---

**JOHN DOE**
john.doe@email.com | GitHub: github.com/johndoe | LinkedIn: linkedin.com/in/johndoe

### SKILLS
Python, JavaScript, React, Node.js, MongoDB, SQL, Git, Docker, REST API, HTML, CSS, TailwindCSS

### EXPERIENCE
**Junior Full Stack Developer** — TechCorp (2022–2024)
- Built React dashboards with Chart.js visualizations
- Developed Node.js/Express REST APIs
- Worked with MongoDB for data persistence
- Deployed apps using Docker

### PROJECTS
- **TaskFlow**: React + Node.js task management app with JWT auth
- **DataViz Dashboard**: Interactive charts using Chart.js and REST APIs
- **Portfolio Site**: Responsive website with TailwindCSS

### EDUCATION
B.E. Computer Science — Example University (2022)

---

## Expected Analysis Results

### Against "Full Stack Developer" role:
- **HAVE**: React, Node.js, JavaScript, MongoDB, SQL, Git, Docker, REST API, HTML, CSS, TailwindCSS
- **PARTIAL**: Testing (has experience but not listed), GraphQL (related to REST), Redis (related to MongoDB)
- **MISSING**: TypeScript, GraphQL, Redux, CI/CD, Next.js, JWT (in explicit skills list)
- **Expected Match**: ~65-75%
- **Recommendation**: roadmap

### Against "AI Engineer" role:
- **HAVE**: Python, Docker, REST API
- **MISSING**: Machine Learning, Deep Learning, TensorFlow, PyTorch, spaCy, NLP, etc.
- **Expected Match**: ~15-20%
- **Recommendation**: roadmap

---

## API Test Payloads

### 1. Upload Resume
```
POST /api/upload-resume
Content-Type: multipart/form-data
Body: file=<sample_resume.pdf>
```

### 2. Analyze Skills
```json
POST /api/analyze
{
  "session_id": "test-session-001",
  "resume_skills": ["Python", "React", "Node.js", "MongoDB", "Docker", "REST API", "SQL"],
  "job_role": "Full Stack Developer"
}
```

### 3. Generate Roadmap
```json
POST /api/generate-roadmap
{
  "session_id": "test-session-001",
  "job_role": "Full Stack Developer",
  "missing_skills": ["TypeScript", "GraphQL", "CI/CD", "Redis", "Next.js"],
  "have_skills": ["React", "Node.js", "MongoDB"]
}
```

### 4. Start Interview
```json
POST /api/start-interview
{
  "job_role": "Full Stack Developer"
}
```

### 5. Submit Answer
```json
POST /api/submit-answer
{
  "interview_session_id": "<from step 4>",
  "question_id": "technical_1",
  "answer": "REST is a stateless architecture that uses HTTP methods... GraphQL allows clients to request exactly the data they need..."
}
```

---

## Sample Answers for Testing

**Q: Explain the difference between REST and GraphQL**
> REST is a stateless HTTP-based architecture where each endpoint serves a specific resource. It can suffer from over-fetching (getting too much data) or under-fetching (needing multiple requests). GraphQL is a query language that lets clients specify exactly what data they need in a single request, using a schema with types, queries, mutations, and resolvers.

**Q: What is the event loop in Node.js?**
> Node.js is single-threaded but handles async operations via the event loop. When async operations (I/O, timers) complete, their callbacks are added to the callback queue. The event loop continuously checks if the call stack is empty, then pushes callbacks from the queue. Microtasks (Promise callbacks) have higher priority than macrotasks.
