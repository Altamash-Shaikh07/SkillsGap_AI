"""
Mock Interview Engine Service
- Generates DSA, technical, and HR questions based on job role
- Evaluates answers using LLM
- Scores responses 0-100
"""

import os
import json
import logging
import re
import uuid
from typing import List, Dict, Optional
from services.roadmap_generator import call_gemini

logger = logging.getLogger(__name__)

# Predefined question banks per role (used as fallback + augmented by LLM)
QUESTION_BANK = {
    "AI Engineer": {
        "dsa": [
            {"q": "Implement a function to find the k-th largest element in an unsorted array.", "keywords": ["heap", "quickselect", "sorting", "O(n log k)"]},
            {"q": "Design a data structure that supports insert, delete, and getRandom in O(1).", "keywords": ["hashmap", "array", "random", "O(1)"]},
            {"q": "Given a graph of model dependencies, detect if there's a circular dependency.", "keywords": ["DFS", "cycle detection", "topological sort", "visited"]},
        ],
        "technical": [
            {"q": "Explain the difference between gradient descent and stochastic gradient descent.", "keywords": ["batch", "convergence", "learning rate", "noise", "mini-batch"]},
            {"q": "What is the vanishing gradient problem and how do you solve it?", "keywords": ["LSTM", "ReLU", "batch norm", "residual", "gradient clipping"]},
            {"q": "How does attention mechanism work in transformers?", "keywords": ["query", "key", "value", "softmax", "self-attention", "multi-head"]},
            {"q": "Explain overfitting and the methods to prevent it.", "keywords": ["regularization", "dropout", "cross-validation", "early stopping", "L1 L2"]},
            {"q": "What is the difference between precision and recall?", "keywords": ["true positive", "false positive", "F1 score", "trade-off"]},
        ],
        "hr": [
            {"q": "Tell me about a challenging ML project you built and what you learned.", "keywords": ["project", "challenge", "solution", "learned", "outcome"]},
            {"q": "How do you stay updated with the latest AI research?", "keywords": ["papers", "arXiv", "conferences", "GitHub", "community"]},
            {"q": "Describe a time you had to explain a complex model to a non-technical stakeholder.", "keywords": ["communication", "simplify", "visual", "business impact"]},
        ]
    },
    "Data Scientist": {
        "dsa": [
            {"q": "Write a function to find the median of a data stream efficiently.", "keywords": ["heap", "two heaps", "median", "stream"]},
            {"q": "Implement K-Means clustering from scratch.", "keywords": ["centroid", "iteration", "convergence", "distance", "cluster"]},
        ],
        "technical": [
            {"q": "What is the difference between correlation and causation?", "keywords": ["correlation", "causation", "confounding", "experiment", "regression"]},
            {"q": "Explain the bias-variance trade-off.", "keywords": ["bias", "variance", "underfitting", "overfitting", "complexity"]},
            {"q": "How would you handle class imbalance in a classification problem?", "keywords": ["SMOTE", "oversampling", "undersampling", "class weight", "threshold"]},
            {"q": "What is cross-validation and why is it important?", "keywords": ["k-fold", "generalization", "overfitting", "train-test split"]},
        ],
        "hr": [
            {"q": "Describe an analysis you conducted that drove a significant business decision.", "keywords": ["data", "insight", "decision", "impact", "stakeholder"]},
            {"q": "How do you communicate findings to non-technical executives?", "keywords": ["visualization", "summary", "business terms", "dashboard"]},
        ]
    },
    "Full Stack Developer": {
        "dsa": [
            {"q": "Implement a LRU (Least Recently Used) cache.", "keywords": ["doubly linked list", "hashmap", "O(1)", "eviction"]},
            {"q": "Design a URL shortener (like bit.ly). What data structures would you use?", "keywords": ["hashmap", "base62", "database", "collision", "redirect"]},
            {"q": "How would you implement pagination for a large dataset?", "keywords": ["cursor", "offset", "limit", "index", "performance"]},
        ],
        "technical": [
            {"q": "Explain the difference between REST and GraphQL.", "keywords": ["REST", "GraphQL", "over-fetching", "schema", "resolver", "mutation"]},
            {"q": "What is the event loop in Node.js and how does it work?", "keywords": ["single-threaded", "callback queue", "microtask", "async", "non-blocking"]},
            {"q": "How does React's reconciliation algorithm (diffing) work?", "keywords": ["virtual DOM", "fiber", "key", "diff", "re-render"]},
            {"q": "What are the differences between SQL and NoSQL databases?", "keywords": ["schema", "ACID", "scalability", "document", "relational"]},
        ],
        "hr": [
            {"q": "Tell me about a time you improved the performance of a web application.", "keywords": ["optimization", "caching", "lazy loading", "profiling", "metrics"]},
            {"q": "How do you handle code reviews and giving/receiving feedback?", "keywords": ["constructive", "review", "PR", "standards", "learning"]},
        ]
    },
    "Cybersecurity Analyst": {
        "dsa": [
            {"q": "Implement a Bloom filter for fast membership testing in security logs.", "keywords": ["hash function", "false positive", "space-efficient", "probabilistic"]},
            {"q": "Design a rate limiter to prevent brute force attacks.", "keywords": ["sliding window", "token bucket", "Redis", "IP", "counter"]},
        ],
        "technical": [
            {"q": "Explain the difference between symmetric and asymmetric encryption.", "keywords": ["AES", "RSA", "key exchange", "public key", "private key", "TLS"]},
            {"q": "What is SQL injection and how do you prevent it?", "keywords": ["prepared statements", "parameterized", "input validation", "ORM", "sanitize"]},
            {"q": "Explain the OWASP Top 10 vulnerabilities.", "keywords": ["injection", "XSS", "CSRF", "authentication", "exposure"]},
            {"q": "How does a man-in-the-middle attack work?", "keywords": ["interception", "certificate", "SSL", "ARP spoofing", "HTTPS"]},
        ],
        "hr": [
            {"q": "Describe how you would respond to a security incident.", "keywords": ["incident response", "containment", "forensics", "reporting", "recovery"]},
            {"q": "How do you keep your threat intelligence up to date?", "keywords": ["CVE", "feeds", "community", "research", "patching"]},
        ]
    }
}


async def generate_interview_questions(job_role: str) -> List[Dict]:
    """
    Generate interview questions for a given role using LLM + question bank.
    Returns a list of question objects.
    """
    # Start with predefined questions
    base_questions = []
    role_bank = QUESTION_BANK.get(job_role, QUESTION_BANK.get("Full Stack Developer", {}))

    for category in ["dsa", "technical", "hr"]:
        questions = role_bank.get(category, [])
        for i, q_data in enumerate(questions[:3]):  # Max 3 per category
            base_questions.append({
                "id": f"{category}_{i+1}",
                "question": q_data["q"],
                "category": category,
                "difficulty": "Medium" if category != "hr" else "N/A",
                "expected_keywords": q_data.get("keywords", [])
            })

    # Try to augment with LLM-generated questions
    try:
        llm_questions = await _generate_llm_questions(job_role)
        base_questions.extend(llm_questions)
    except Exception as e:
        logger.warning(f"LLM question generation failed: {e}")

    # Shuffle and limit to ~9-12 questions
    import random
    random.shuffle(base_questions)
    return base_questions[:9]


async def _generate_llm_questions(job_role: str) -> List[Dict]:
    """Generate additional questions via LLM"""
    prompt = f"""Generate 3 technical interview questions for a {job_role} position.

Return ONLY valid JSON array (no markdown):
[
  {{
    "id": "llm_1",
    "question": "Question text here",
    "category": "technical",
    "difficulty": "Medium",
    "expected_keywords": ["keyword1", "keyword2", "keyword3"]
  }}
]

Make them challenging and role-specific. Return exactly 3 questions."""

    response = await call_gemini(prompt)
    
    try:
        clean = re.sub(r'```json\s*|\s*```', '', response).strip()
        questions = json.loads(clean)
        # Validate structure
        valid = []
        for q in questions:
            if isinstance(q, dict) and "question" in q:
                valid.append({
                    "id": q.get("id", f"llm_{uuid.uuid4().hex[:6]}"),
                    "question": q["question"],
                    "category": q.get("category", "technical"),
                    "difficulty": q.get("difficulty", "Medium"),
                    "expected_keywords": q.get("expected_keywords", [])
                })
        return valid
    except Exception:
        return []


async def evaluate_answer(
    question: str,
    answer: str,
    expected_keywords: List[str],
    category: str
) -> Dict:
    """
    Evaluate a user's answer using LLM.
    Returns score (0-100), feedback, and improvement tips.
    """
    if not answer or len(answer.strip()) < 10:
        return {
            "score": 0,
            "feedback": "No answer provided.",
            "keywords_matched": [],
            "improvement_tips": ["Please provide a detailed answer.", "Try to explain your thought process."]
        }

    # Quick keyword check (always done regardless of LLM)
    answer_lower = answer.lower()
    matched_keywords = [kw for kw in expected_keywords if kw.lower() in answer_lower]
    keyword_score = (len(matched_keywords) / max(len(expected_keywords), 1)) * 40

    prompt = f"""You are an expert technical interviewer evaluating a candidate's answer.

Question: {question}
Category: {category}
Candidate's Answer: {answer}
Expected Keywords/Concepts: {', '.join(expected_keywords)}

Evaluate the answer and return ONLY valid JSON (no markdown):
{{
  "score": <integer 0-100>,
  "feedback": "<2-3 sentences of specific feedback>",
  "improvement_tips": ["<specific tip 1>", "<specific tip 2>", "<specific tip 3>"]
}}

Scoring guide:
- 90-100: Excellent, covers all key concepts with depth
- 70-89: Good, covers most concepts
- 50-69: Partial, missing some important concepts
- 30-49: Basic understanding but lacks depth
- 0-29: Incorrect or very incomplete"""

    try:
        response = await call_gemini(prompt)
        clean = re.sub(r'```json\s*|\s*```', '', response).strip()
        eval_data = json.loads(clean)
        
        # Blend LLM score with keyword score
        llm_score = float(eval_data.get("score", 50))
        final_score = round((llm_score * 0.7) + (keyword_score * 0.3), 1)
        
        return {
            "score": min(100, final_score),
            "feedback": eval_data.get("feedback", "Good attempt."),
            "keywords_matched": matched_keywords,
            "improvement_tips": eval_data.get("improvement_tips", [])
        }

    except Exception as e:
        logger.warning(f"LLM evaluation failed: {e}, using keyword-based scoring")
        # Fallback: pure keyword scoring
        fallback_score = min(100, keyword_score * 2.5)
        return {
            "score": round(fallback_score, 1),
            "feedback": f"You mentioned {len(matched_keywords)}/{len(expected_keywords)} key concepts.",
            "keywords_matched": matched_keywords,
            "improvement_tips": [
                f"Make sure to cover: {', '.join(set(expected_keywords) - set(matched_keywords))}" if expected_keywords else "Elaborate more on your answer.",
                "Structure your answer clearly with examples.",
                "Demonstrate practical experience where possible."
            ]
        }


def calculate_final_score(evaluations: List[Dict]) -> Dict:
    """
    Calculate final interview score from all evaluations.
    Returns overall score and recommendation.
    """
    if not evaluations:
        return {"total_score": 0, "recommendation": "incomplete", "areas_to_improve": []}

    scores = [e.get("score", 0) for e in evaluations]
    avg_score = round(sum(scores) / len(scores), 1)

    # Categorize by performance
    if avg_score >= 85:
        recommendation = "job_ready"
        message = "Congratulations! You are ready for the job market."
    elif avg_score >= 70:
        recommendation = "almost_ready"
        message = "Good performance! A bit more practice and you'll be ready."
    elif avg_score >= 50:
        recommendation = "needs_practice"
        message = "Keep practicing. Focus on the areas highlighted below."
    else:
        recommendation = "needs_improvement"
        message = "You need significant improvement. Review the fundamentals."

    # Collect improvement areas
    all_tips = []
    for e in evaluations:
        all_tips.extend(e.get("improvement_tips", []))

    return {
        "total_score": avg_score,
        "recommendation": recommendation,
        "message": message,
        "breakdown": {
            "total_questions": len(evaluations),
            "avg_score": avg_score,
            "scores": scores
        },
        "improvement_areas": list(set(all_tips))[:5]  # Top 5 unique tips
    }
