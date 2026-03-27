"""
Interview Routes
- /api/start-interview
- /api/submit-answer
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import uuid
from config.database import get_collection
from services.interview_engine import (
    generate_interview_questions,
    evaluate_answer,
    calculate_final_score
)

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory session store (replace with Redis in production)
_active_sessions: Dict[str, Dict] = {}


class StartInterviewRequest(BaseModel):
    job_role: str
    session_id: Optional[str] = None


class SubmitAnswerRequest(BaseModel):
    interview_session_id: str
    question_id: str
    answer: str


@router.post("/start-interview")
async def start_interview(request: StartInterviewRequest):
    """
    Start a mock interview session.
    Returns a list of questions.
    """
    if not request.job_role:
        raise HTTPException(status_code=400, detail="job_role is required")

    try:
        questions = await generate_interview_questions(request.job_role)
    except Exception as e:
        logger.error(f"Interview generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate questions")

    interview_session_id = str(uuid.uuid4())

    # Store session in memory
    _active_sessions[interview_session_id] = {
        "job_role": request.job_role,
        "questions": questions,
        "answers": [],
        "evaluations": [],
        "status": "active"
    }

    logger.info(f"Interview started: {interview_session_id}, role={request.job_role}, questions={len(questions)}")

    return JSONResponse({
        "interview_session_id": interview_session_id,
        "job_role": request.job_role,
        "total_questions": len(questions),
        "questions": [
            {
                "id": q["id"],
                "question": q["question"],
                "category": q["category"],
                "difficulty": q.get("difficulty", "Medium")
                # Note: expected_keywords NOT sent to frontend
            }
            for q in questions
        ]
    })


@router.post("/submit-answer")
async def submit_answer(request: SubmitAnswerRequest):
    """
    Submit an answer to an interview question and get evaluation.
    """
    session = _active_sessions.get(request.interview_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    if session["status"] == "completed":
        raise HTTPException(status_code=400, detail="Interview already completed")

    # Find the question
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
            expected_keywords=question_obj.get("expected_keywords", []),
            category=question_obj.get("category", "technical")
        )
    except Exception as e:
        logger.error(f"Answer evaluation error: {e}")
        raise HTTPException(status_code=500, detail="Evaluation failed")

    # Store the answer and evaluation
    session["answers"].append({
        "question_id": request.question_id,
        "answer": request.answer
    })
    session["evaluations"].append({
        "question_id": request.question_id,
        **evaluation
    })

    # Check if all questions answered
    answered_ids = {a["question_id"] for a in session["answers"]}
    all_ids = {q["id"] for q in session["questions"]}
    is_complete = answered_ids >= all_ids

    result = {
        "question_id": request.question_id,
        "evaluation": evaluation,
        "questions_answered": len(session["answers"]),
        "total_questions": len(session["questions"]),
        "interview_complete": is_complete
    }

    if is_complete:
        session["status"] = "completed"
        final = calculate_final_score(session["evaluations"])
        session["final_result"] = final
        result["final_result"] = final

        # Persist to MongoDB
        collection = get_collection("interview_results")
        if collection is not None:
            try:
                await collection.insert_one({
                    "interview_session_id": request.interview_session_id,
                    "job_role": session["job_role"],
                    "evaluations": session["evaluations"],
                    **final
                })
            except Exception as e:
                logger.warning(f"MongoDB insert failed: {e}")

        logger.info(
            f"Interview completed: {request.interview_session_id}, "
            f"score={final['total_score']}"
        )

    return JSONResponse(result)


@router.get("/interview-result/{interview_session_id}")
async def get_interview_result(interview_session_id: str):
    """Get the result of a completed interview"""
    session = _active_sessions.get(interview_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    if session["status"] != "completed":
        raise HTTPException(status_code=400, detail="Interview not yet completed")

    return JSONResponse(session.get("final_result", {}))
