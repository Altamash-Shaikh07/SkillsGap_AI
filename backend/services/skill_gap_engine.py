"""
Skill Gap Analysis Service
- Loads job role requirements from JSON
- Compares resume skills vs job requirements
- Uses vector engine for semantic matching
- Returns categorized skill gap results
"""

import json
import os
import logging
from typing import Dict, List, Optional
from services.vector_engine import categorize_skills

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# Load job roles dataset
with open(os.path.join(DATA_DIR, "job_roles.json"), "r") as f:
    JOB_ROLES = json.load(f)

AVAILABLE_ROLES = list(JOB_ROLES.keys())
INTERVIEW_THRESHOLD = 85.0  # % match needed to skip to interview


def get_available_roles() -> List[str]:
    """Return list of available job roles"""
    return AVAILABLE_ROLES


def get_role_skills(role: str) -> List[str]:
    """Get required skills for a job role"""
    if role not in JOB_ROLES:
        raise ValueError(f"Unknown role: {role}. Available: {AVAILABLE_ROLES}")
    return JOB_ROLES[role]["required_skills"]


def parse_jd_skills(jd_text: str) -> List[str]:
    """
    Extract skills from a Job Description text.
    Uses keyword matching against the skills dataset.
    """
    from services.resume_parser import extract_skills_from_text
    extraction = extract_skills_from_text(jd_text)
    
    # Combine all extracted skill types
    all_skills = list(set(
        extraction["skills"] +
        extraction["technologies"] +
        extraction["frameworks"]
    ))
    return all_skills


def analyze_skill_gap(
    resume_skills: List[str],
    job_role: Optional[str] = None,
    jd_text: Optional[str] = None
) -> Dict:
    """
    Main skill gap analysis function.
    
    Args:
        resume_skills: Skills extracted from resume
        job_role: Target job role (from dropdown)
        jd_text: Raw job description text (alternative to job_role)
    
    Returns:
        Complete skill gap analysis result
    """
    # ── Determine target skills ──────────────────────────────────────────
    if jd_text and len(jd_text.strip()) > 50:
        logger.info("Analyzing skill gap against JD text")
        target_skills = parse_jd_skills(jd_text)
        role_name = job_role or "Custom JD"
        
        # If JD skills are too few, supplement with role-based if role provided
        if len(target_skills) < 5 and job_role and job_role in JOB_ROLES:
            target_skills = list(set(target_skills + get_role_skills(job_role)))
    elif job_role and job_role in JOB_ROLES:
        logger.info(f"Analyzing skill gap for role: {job_role}")
        target_skills = get_role_skills(job_role)
        role_name = job_role
    else:
        raise ValueError("Either job_role or jd_text must be provided")

    if not target_skills:
        raise ValueError("Could not determine target skills from the provided inputs")

    # ── Run vector-based skill categorization ────────────────────────────
    categorization = categorize_skills(resume_skills, target_skills)

    match_pct = categorization["match_percentage"]
    recommendation = "interview" if match_pct >= INTERVIEW_THRESHOLD else "roadmap"

    logger.info(
        f"Skill gap analysis complete: {match_pct}% match → {recommendation}"
    )

    return {
        "job_role": role_name,
        "match_percentage": match_pct,
        "have_skills": categorization["have"],
        "partial_skills": categorization["partial"],
        "missing_skills": categorization["missing"],
        "recommendation": recommendation,
        "target_skills_count": len(target_skills),
        "resume_skills_count": len(resume_skills)
    }


def get_missing_skill_names(analysis_result: Dict) -> List[str]:
    """Extract just the names of missing skills from analysis result"""
    return [s["skill"] for s in analysis_result.get("missing_skills", [])]
