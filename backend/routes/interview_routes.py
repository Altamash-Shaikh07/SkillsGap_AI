from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict
import logging
import uuid

from services.interview_engine import (
    generate_interview_questions,
    evaluate_answer,
    calculate_final_score
)

router = APIRouter()
logger = logging.getLogger(__name__)

_active_sessions: Dict[str, Dict] = {}


class StartInterviewRequest(BaseModel):
    job_role: str
    session_id: Optional[str] = None


class SubmitAnswerRequest(BaseModel):
    interview_session_id: str
    question_id: str
    answer: str


# ============================
# START INTERVIEW
# ============================
@router.post("/start-interview")
async def start_interview(request: StartInterviewRequest):

    if not request.job_role:
        raise HTTPException(status_code=400, detail="job_role is required")

    try:
        print("🔥 Generating questions for:", request.job_role)

        questions = await generate_interview_questions(request.job_role)

        print("✅ Questions generated:", questions)

        # Fallback if AI fails
        if not questions:
            questions = [
                {"id": "1", "question": "Explain REST API", "category": "technical"},
                {"id": "2", "question": "What is React?", "category": "technical"},
                {"id": "3", "question": "Tell me about yourself", "category": "hr"}
            ]

    except Exception as e:
        logger.error(f"Interview generation error: {e}")
        print("❌ ERROR:", e)

        # fallback questions instead of crashing
        questions = [
            {"id": "1", "question": "Explain REST API", "category": "technical"},
            {"id": "2", "question": "What is React?", "category": "technical"},
            {"id": "3", "question": "Tell me about yourself", "category": "hr"}
        ]

    interview_session_id = str(uuid.uuid4())

    _active_sessions[interview_session_id] = {
        "job_role": request.job_role,
        "questions": questions,
        "answers": [],
        "evaluations": [],
        "status": "active"
    }

    return JSONResponse({
        "interview_session_id": interview_session_id,
        "job_role": request.job_role,
        "total_questions": len(questions),
        "questions": questions
    })


# ============================
# SUBMIT ANSWER
# ============================
@router.post("/submit-answer")
async def submit_answer(request: SubmitAnswerRequest):

    session = _active_sessions.get(request.interview_session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    question_obj = next(
        (q for q in session["questions"] if q["id"] == request.question_id),
        None
    )

    if not question_obj:
        raise HTTPException(status_code=404, detail="Question not found")

    try:
        evaluation = await evaluate_answer(
            question=question_obj["question"],
            answer=request.answer,
            expected_keywords=[],
            category=question_obj.get("category", "technical")
        )

    except Exception as e:
        print("❌ Evaluation error:", e)

        evaluation = {
            "score": 5,
            "feedback": "Basic answer. Needs improvement."
        }

    session["answers"].append({
        "question_id": request.question_id,
        "answer": request.answer
    })

    session["evaluations"].append({
        "question_id": request.question_id,
        **evaluation
    })

    is_complete = len(session["answers"]) == len(session["questions"])

    result = {
        "evaluation": evaluation,
        "interview_complete": is_complete
    }

    if is_complete:
        final = calculate_final_score(session["evaluations"])
        result["final_result"] = final

    return JSONResponse(result)