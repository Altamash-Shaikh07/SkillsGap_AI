"""
Skill Gap Analysis Service
"""

import json
import os
import logging
from typing import Dict, List, Optional
from services.vector_engine import categorize_skills

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

with open(os.path.join(DATA_DIR, "job_roles.json"), "r") as f:
    JOB_ROLES = json.load(f)

AVAILABLE_ROLES = list(JOB_ROLES.keys())
INTERVIEW_THRESHOLD = 85.0


def get_available_roles() -> List[str]:
    return AVAILABLE_ROLES


def get_role_skills(role: str) -> List[str]:
    if role not in JOB_ROLES:
        raise ValueError(f"Unknown role: {role}. Available: {AVAILABLE_ROLES}")
    return JOB_ROLES[role]["required_skills"]


def parse_jd_skills(jd_text: str) -> List[str]:
    from services.resume_parser import extract_skills_from_text

    extraction = extract_skills_from_text(jd_text)

    return list(set(
        extraction["skills"] +
        extraction["technologies"] +
        extraction["frameworks"]
    ))


def analyze_skill_gap(
    resume_skills: List[str],
    job_role: Optional[str] = None,
    jd_text: Optional[str] = None
) -> Dict:

    # ── STEP 1: Determine target skills ─────────────────────────

    if jd_text and len(jd_text.strip()) > 50:
        logger.info("Using JD text for analysis")

        target_skills = parse_jd_skills(jd_text)
        role_name = job_role or "Custom JD"

        if len(target_skills) < 5 and job_role and job_role in JOB_ROLES:
            target_skills = list(set(target_skills + get_role_skills(job_role)))

    elif job_role:
        logger.info(f"Received role: {job_role}")

        # ✅ Direct match
        if job_role in JOB_ROLES:
            target_skills = get_role_skills(job_role)
            role_name = job_role

        # 🔥 FALLBACK (FIXED)
        else:
            logger.warning(f"Unknown role: {job_role} → applying fallback")

            role_lower = job_role.lower()

            # You can expand this mapping anytime
            if "frontend" in role_lower:
                mapped_role = "Full Stack Developer"
            elif "backend" in role_lower:
                mapped_role = "Full Stack Developer"
            elif "data" in role_lower:
                mapped_role = "Full Stack Developer"
            else:
                mapped_role = "Full Stack Developer"

            target_skills = get_role_skills(mapped_role)
            role_name = f"{job_role} (mapped to {mapped_role})"

    else:
        raise ValueError("Either job_role or jd_text must be provided")

    if not target_skills:
        raise ValueError("No target skills found")

    # ── STEP 2: Categorization ─────────────────────────

    categorization = categorize_skills(resume_skills, target_skills)

    match_pct = categorization["match_percentage"]
    recommendation = "interview" if match_pct >= INTERVIEW_THRESHOLD else "roadmap"

    logger.info(f"Match: {match_pct}% → {recommendation}")

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
    return [s["skill"] for s in analysis_result.get("missing_skills", [])]