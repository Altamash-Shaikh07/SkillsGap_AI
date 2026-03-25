"""
ChromaDB vector database initialization and configuration
"""

import chromadb
from chromadb.config import Settings
import logging
import os

logger = logging.getLogger(__name__)

# Global ChromaDB client and collection
chroma_client = None
skills_collection = None

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")


def init_chroma():
    """Initialize ChromaDB with persistent storage"""
    global chroma_client, skills_collection
    try:
        chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        skills_collection = chroma_client.get_or_create_collection(
            name="skills_embeddings",
            metadata={"hnsw:space": "cosine"}  # cosine similarity
        )
        logger.info(f"ChromaDB initialized. Collection: skills_embeddings")
    except Exception as e:
        logger.error(f"ChromaDB init failed: {e}")
        # Use in-memory fallback
        chroma_client = chromadb.Client()
        skills_collection = chroma_client.get_or_create_collection(
            name="skills_embeddings",
            metadata={"hnsw:space": "cosine"}
        )
        logger.warning("Using in-memory ChromaDB (no persistence)")


def get_chroma_collection():
    """Get the skills collection"""
    global skills_collection
    if skills_collection is None:
        init_chroma()
    return skills_collection


def get_chroma_client():
    """Get the ChromaDB client"""
    global chroma_client
    return chroma_client
