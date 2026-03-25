"""
Roadmap Generator Service
- Uses Gemini 1.5 Flash API (or mock LLM) to generate personalized learning roadmaps
- Generates weekly plans, course recommendations, and project suggestions
"""

import os
import json
import logging
import re
from typing import List, Dict, Optional
import httpx

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


async def call_gemini(prompt: str) -> str:
    """
    Call Gemini 1.5 Flash API and return text response.
    Falls back to mock if API key not set.
    """
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set - using mock LLM")
        return _mock_llm_response(prompt)

    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                headers=headers,
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return text
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return _mock_llm_response(prompt)


def _mock_llm_response(prompt: str) -> str:
    """
    Mock LLM response for development/testing when API key is not available.
    Returns a structured JSON roadmap.
    """
    # Extract role and skills from prompt for realistic mock
    role_match = re.search(r'Target Role: (.+?)\n', prompt)
    skills_match = re.search(r'Missing Skills: (.+?)\n', prompt)
    role = role_match.group(1) if role_match else "Software Developer"
    skills_str = skills_match.group(1) if skills_match else "Python, Machine Learning, Docker"
    skills = [s.strip() for s in skills_str.split(",")][:5]

    weeks = []
    for i, skill in enumerate(skills[:8]):
        weeks.append({
            "week": i + 1,
            "topic": f"Mastering {skill}",
            "tasks": [
                f"Complete introductory {skill} tutorial",
                f"Build a small project using {skill}",
                f"Practice {skill} exercises daily for 1 hour",
                f"Read documentation for {skill} best practices"
            ],
            "resources": [
                f"https://www.udemy.com/course/{skill.lower().replace(' ', '-')}-bootcamp",
                f"https://docs.{skill.lower().replace(' ', '')}.com",
                f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial"
            ],
            "project": f"Build a {skill} demo project"
        })

    # Fill remaining weeks with consolidation
    if len(weeks) < 8:
        weeks.append({
            "week": len(weeks) + 1,
            "topic": "Portfolio & Projects",
            "tasks": [
                "Build a capstone project integrating all learned skills",
                "Document your projects on GitHub",
                "Write blog posts / LinkedIn posts about your learnings",
                "Prepare for technical interviews"
            ],
            "resources": [
                "https://github.com",
                "https://leetcode.com",
                "https://medium.com"
            ],
            "project": f"Full-stack {role} portfolio project"
        })

    return json.dumps({
        "weeks": weeks,
        "project_suggestions": [
            {
                "title": f"Beginner {role} Starter",
                "description": f"Build a simple app using basic {skills[0] if skills else 'core'} concepts",
                "skills_covered": skills[:2],
                "difficulty": "Beginner",
                "estimated_time": "1-2 weeks"
            },
            {
                "title": f"Intermediate {role} Project",
                "description": "Create a full-featured application with database integration",
                "skills_covered": skills[1:4],
                "difficulty": "Intermediate",
                "estimated_time": "2-3 weeks"
            },
            {
                "title": f"Advanced {role} Capstone",
                "description": "Build a production-ready system demonstrating all key skills",
                "skills_covered": skills,
                "difficulty": "Advanced",
                "estimated_time": "3-4 weeks"
            }
        ],
        "course_recommendations": [
            {
                "title": f"{role} Complete Bootcamp 2024",
                "platform": "Udemy",
                "url": f"https://www.udemy.com/courses/search/?q={role.replace(' ', '+')}",
                "duration": "40-60 hours",
                "price": "Free with coupon / ~$15"
            },
            {
                "title": f"{role} Specialization",
                "platform": "Coursera",
                "url": f"https://www.coursera.org/search?query={role.replace(' ', '+')}",
                "duration": "3-6 months",
                "price": "Free to audit"
            },
            {
                "title": "YouTube Free Resources",
                "platform": "YouTube",
                "url": f"https://www.youtube.com/results?search_query={role.replace(' ', '+')}+full+course",
                "duration": "Self-paced",
                "price": "Free"
            }
        ]
    })


async def generate_roadmap(
    job_role: str,
    missing_skills: List[str],
    have_skills: List[str]
) -> Dict:
    """
    Generate a personalized learning roadmap using LLM.
    
    Args:
        job_role: Target job role
        missing_skills: Skills the user needs to learn
        have_skills: Skills the user already has
    
    Returns:
        Structured roadmap with weekly plan, projects, and courses
    """
    missing_str = ", ".join(missing_skills[:10])
    have_str = ", ".join(have_skills[:10])
    
    num_weeks = min(max(len(missing_skills), 4), 12)  # 4-12 weeks

    prompt = f"""You are a senior career coach and curriculum designer.

Generate a personalized learning roadmap for:
Target Role: {job_role}
Missing Skills: {missing_str}
Existing Skills: {have_str}
Duration: {num_weeks} weeks

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{{
  "weeks": [
    {{
      "week": 1,
      "topic": "Topic Name",
      "tasks": ["task1", "task2", "task3", "task4"],
      "resources": ["url1", "url2", "url3"],
      "project": "Small project to build this week"
    }}
  ],
  "project_suggestions": [
    {{
      "title": "Project Title",
      "description": "What to build",
      "skills_covered": ["skill1", "skill2"],
      "difficulty": "Beginner/Intermediate/Advanced",
      "estimated_time": "X weeks"
    }}
  ],
  "course_recommendations": [
    {{
      "title": "Course Title",
      "platform": "Platform Name",
      "url": "https://...",
      "duration": "X hours",
      "price": "Free/$15/etc"
    }}
  ]
}}

Make it practical, specific, and achievable. Reference real platforms (Udemy, Coursera, freeCodeCamp, YouTube).
Generate exactly {num_weeks} weeks."""

    logger.info(f"Generating roadmap for {job_role} with {len(missing_skills)} missing skills")
    raw_response = await call_gemini(prompt)

    # Parse JSON from response
    try:
        # Remove markdown code blocks if present
        clean = re.sub(r'```json\s*|\s*```', '', raw_response).strip()
        roadmap_data = json.loads(clean)
    except json.JSONDecodeError:
        logger.warning("LLM returned invalid JSON, using mock response")
        clean = _mock_llm_response(prompt)
        roadmap_data = json.loads(clean)

    return {
        "job_role": job_role,
        "missing_skills": missing_skills,
        "weeks": roadmap_data.get("weeks", []),
        "total_duration_weeks": len(roadmap_data.get("weeks", [])),
        "project_suggestions": roadmap_data.get("project_suggestions", []),
        "course_recommendations": roadmap_data.get("course_recommendations", [])
    }
