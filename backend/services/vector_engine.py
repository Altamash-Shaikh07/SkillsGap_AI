"""
Vector Similarity Engine
- Uses HuggingFace sentence-transformers (all-MiniLM-L6-v2)
- Stores skill embeddings in ChromaDB
- Detects semantically related skills (e.g., React ≈ Frontend Development)
"""

import logging
import json
import os
from typing import List, Tuple, Optional
from sentence_transformers import SentenceTransformer
from config.chroma import get_chroma_collection

logger = logging.getLogger(__name__)

# Load embedding model once (cached after first load)
MODEL_NAME = "all-MiniLM-L6-v2"
_model: Optional[SentenceTransformer] = None

# Similarity thresholds
EXACT_MATCH_THRESHOLD = 0.95
PARTIAL_MATCH_THRESHOLD = 0.65


def get_model() -> SentenceTransformer:
    """Lazy-load the sentence transformer model"""
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {MODEL_NAME}")
        _model = SentenceTransformer(MODEL_NAME)
        logger.info("Embedding model loaded successfully")
    return _model


def embed_text(text: str) -> List[float]:
    """Generate embedding for a single text"""
    model = get_model()
    embedding = model.encode(text, convert_to_tensor=False)
    return embedding.tolist()


def embed_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a batch of texts"""
    model = get_model()
    embeddings = model.encode(texts, convert_to_tensor=False, batch_size=32)
    return [e.tolist() for e in embeddings]


def index_skills_if_empty(skills: List[str]):
    """
    Index job role skills into ChromaDB if not already done.
    Called once during analysis.
    """
    collection = get_chroma_collection()
    if collection is None:
        return

    # Check if already indexed
    existing = collection.count()
    if existing > 0:
        return

    logger.info(f"Indexing {len(skills)} skills into ChromaDB...")
    embeddings = embed_batch(skills)

    collection.add(
        ids=[f"skill_{i}" for i in range(len(skills))],
        embeddings=embeddings,
        documents=skills,
        metadatas=[{"skill": s} for s in skills]
    )
    logger.info("Skills indexed in ChromaDB")


def find_similar_skill(
    resume_skill: str,
    job_skills: List[str],
    threshold: float = PARTIAL_MATCH_THRESHOLD
) -> Tuple[Optional[str], float]:
    """
    Find the most similar job skill to a resume skill using vector similarity.
    Returns (matched_skill_name, similarity_score) or (None, 0.0)
    """
    collection = get_chroma_collection()

    if collection is None or collection.count() == 0:
        # Fallback: simple lowercase string matching
        resume_lower = resume_skill.lower()
        for js in job_skills:
            if resume_lower in js.lower() or js.lower() in resume_lower:
                return js, 0.75
        return None, 0.0

    try:
        query_embedding = embed_text(resume_skill)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(3, len(job_skills)),
            include=["documents", "distances"]
        )

        if not results["documents"] or not results["documents"][0]:
            return None, 0.0

        # ChromaDB returns cosine distances (0=identical, 2=opposite)
        # Convert to similarity score (1 - distance/2)
        best_match = results["documents"][0][0]
        best_distance = results["distances"][0][0]
        similarity = 1.0 - (best_distance / 2.0)

        # Only return if the matched skill is in our job_skills list
        if best_match in job_skills and similarity >= threshold:
            return best_match, round(similarity, 3)

        # Also do direct embedding comparison against job_skills
        return _direct_similarity(resume_skill, job_skills, threshold)

    except Exception as e:
        logger.error(f"ChromaDB query error: {e}")
        return _direct_similarity(resume_skill, job_skills, threshold)


def _direct_similarity(
    resume_skill: str,
    job_skills: List[str],
    threshold: float
) -> Tuple[Optional[str], float]:
    """Direct cosine similarity computation as fallback"""
    import numpy as np

    try:
        all_texts = [resume_skill] + job_skills
        embeddings = embed_batch(all_texts)
        resume_emb = np.array(embeddings[0])
        job_embs = np.array(embeddings[1:])

        # Cosine similarity
        resume_norm = resume_emb / (np.linalg.norm(resume_emb) + 1e-8)
        job_norms = job_embs / (np.linalg.norm(job_embs, axis=1, keepdims=True) + 1e-8)
        similarities = np.dot(job_norms, resume_norm)

        best_idx = int(np.argmax(similarities))
        best_score = float(similarities[best_idx])

        if best_score >= threshold:
            return job_skills[best_idx], round(best_score, 3)
        return None, 0.0

    except Exception as e:
        logger.error(f"Direct similarity error: {e}")
        return None, 0.0


def categorize_skills(
    resume_skills: List[str],
    job_skills: List[str]
) -> dict:
    """
    Categorize resume skills vs job skills into HAVE / PARTIAL / MISSING.
    
    Returns:
        {
          "have": [...],
          "partial": [...],
          "missing": [...],
          "match_percentage": float
        }
    """
    # Index job skills in ChromaDB
    index_skills_if_empty(job_skills)

    resume_lower = {s.lower(): s for s in resume_skills}
    job_lower = {s.lower(): s for s in job_skills}

    have = []
    partial = []
    missing = []
    covered_job_skills = set()

    for job_skill_lower, job_skill in job_lower.items():
        # ── EXACT MATCH ────────────────────────────────────────────────
        if job_skill_lower in resume_lower:
            have.append({
                "skill": job_skill,
                "status": "have",
                "match_score": 1.0,
                "matched_with": resume_lower[job_skill_lower]
            })
            covered_job_skills.add(job_skill_lower)
            continue

        # ── SEMANTIC PARTIAL MATCH ─────────────────────────────────────
        matched, score = find_similar_skill(
            job_skill,
            list(resume_lower.values()),
            threshold=PARTIAL_MATCH_THRESHOLD
        )

        if matched and score >= PARTIAL_MATCH_THRESHOLD:
            if score >= EXACT_MATCH_THRESHOLD:
                have.append({
                    "skill": job_skill,
                    "status": "have",
                    "match_score": score,
                    "matched_with": matched
                })
            else:
                partial.append({
                    "skill": job_skill,
                    "status": "partial",
                    "match_score": score,
                    "matched_with": matched
                })
            covered_job_skills.add(job_skill_lower)
        else:
            # ── MISSING ──────────────────────────────────────────────
            missing.append({
                "skill": job_skill,
                "status": "missing",
                "match_score": 0.0,
                "matched_with": None
            })

    # Calculate match percentage
    # have = full point, partial = half point
    total = len(job_skills)
    score_points = len(have) + (len(partial) * 0.5)
    match_pct = round((score_points / total * 100) if total > 0 else 0, 1)

    return {
        "have": have,
        "partial": partial,
        "missing": missing,
        "match_percentage": match_pct
    }
