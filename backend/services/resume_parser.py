"""
Resume Parser Service
- Extracts text from PDF using pdfplumber
- Uses spaCy NLP + keyword matching to extract skills, technologies, frameworks, projects
"""

import pdfplumber
import spacy
import re
import json
import os
import logging
from typing import Dict, List
from io import BytesIO

logger = logging.getLogger(__name__)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("spaCy model loaded: en_core_web_sm")
except OSError:
    logger.warning("spaCy model not found. Run: python -m spacy download en_core_web_sm")
    nlp = None

# Load skills dataset
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
with open(os.path.join(DATA_DIR, "skills_dataset.json"), "r") as f:
    SKILLS_DATASET = json.load(f)

TECH_SKILLS = [s.lower() for s in SKILLS_DATASET["tech_skills"]]
SKILL_ALIASES = {k.lower(): v for k, v in SKILLS_DATASET["skill_aliases"].items()}


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text from PDF bytes using pdfplumber"""
    text = ""
    try:
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        logger.info(f"Extracted {len(text)} characters from PDF")
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise ValueError(f"Could not parse PDF: {str(e)}")
    return text


def normalize_skill(skill: str) -> str:
    """Normalize skill name using aliases"""
    lower = skill.lower().strip()
    return SKILL_ALIASES.get(lower, skill.strip())


def extract_skills_from_text(text: str) -> Dict[str, List[str]]:
    """
    Extract skills, technologies, frameworks, and projects from resume text.
    Uses keyword matching + spaCy NER for organization/product names.
    """
    text_lower = text.lower()
    
    extracted_skills = set()
    extracted_technologies = set()
    extracted_frameworks = set()
    extracted_projects = set()

    # ── 1. Keyword matching against known tech skills ──────────────────────
    for skill in SKILLS_DATASET["tech_skills"]:
        # Match whole word, case-insensitive
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            normalized = normalize_skill(skill)
            extracted_skills.add(normalized)

    # Also check aliases
    for alias, canonical in SKILL_ALIASES.items():
        pattern = r'\b' + re.escape(alias.lower()) + r'\b'
        if re.search(pattern, text_lower):
            extracted_skills.add(canonical)

    # ── 2. Categorize by semantic groups ──────────────────────────────────
    groups = SKILLS_DATASET["semantic_groups"]
    for skill in list(extracted_skills):
        if skill in groups.get("frontend", []) + groups.get("backend", []):
            extracted_frameworks.add(skill)
        elif skill in groups.get("ml_frameworks", []):
            extracted_frameworks.add(skill)
        elif skill in groups.get("databases", []) + groups.get("devops", []):
            extracted_technologies.add(skill)

    # ── 3. spaCy NER for project names ────────────────────────────────────
    if nlp:
        doc = nlp(text[:5000])  # Limit for performance
        for ent in doc.ents:
            # ORG and PRODUCT entities often indicate project names or tech stacks
            if ent.label_ in ["ORG", "PRODUCT", "WORK_OF_ART"]:
                if len(ent.text) > 2 and ent.text[0].isupper():
                    extracted_projects.add(ent.text.strip())

    # ── 4. Extract project section manually ───────────────────────────────
    project_section = _extract_projects_section(text)
    extracted_projects.update(project_section)

    return {
        "skills": sorted(list(extracted_skills)),
        "technologies": sorted(list(extracted_technologies)),
        "frameworks": sorted(list(extracted_frameworks)),
        "projects": sorted(list(extracted_projects))[:10]  # Cap at 10
    }


def _extract_projects_section(text: str) -> List[str]:
    """
    Heuristically extract project names from resume's Projects section.
    """
    projects = []
    lines = text.split("\n")
    in_projects = False

    for i, line in enumerate(lines):
        line_stripped = line.strip()
        line_lower = line_stripped.lower()

        # Detect start of Projects section
        if re.match(r'^(projects?|personal projects?|academic projects?|side projects?)\s*$', line_lower):
            in_projects = True
            continue

        # Detect end of Projects section (next major section)
        if in_projects and re.match(r'^(experience|education|skills|certifications?|awards?|publications?)\s*$', line_lower):
            in_projects = False
            continue

        # Extract project titles (usually capitalized, short lines after bullet)
        if in_projects and line_stripped:
            # Lines starting with bullet or bold-like patterns
            if re.match(r'^[•\-\*►▸◆]?\s*[A-Z]', line_stripped):
                title = re.sub(r'^[•\-\*►▸◆]\s*', '', line_stripped)
                # Skip if it's a full sentence (likely a description)
                if len(title.split()) <= 6:
                    projects.append(title)

    return projects


def parse_resume(file_bytes: bytes) -> Dict:
    """
    Main resume parsing function.
    Returns extracted skills and metadata.
    """
    # Step 1: Extract text
    raw_text = extract_text_from_pdf(file_bytes)
    if not raw_text.strip():
        raise ValueError("No text could be extracted from the PDF. Is it a scanned image?")

    # Step 2: Extract skills
    extraction = extract_skills_from_text(raw_text)

    return {
        "raw_text_preview": raw_text[:500],  # First 500 chars as preview
        "raw_text_length": len(raw_text),
        **extraction
    }
