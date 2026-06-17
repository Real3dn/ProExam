import os
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

def get_genai_client():
    # If GEMINI_API_KEY is not set in environment, check fallback options
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)

def get_embedding(text_or_list):
    """
    Get embeddings using text-embedding-004.
    Supports a single string or a list of strings.
    """
    is_list = isinstance(text_or_list, list)
    contents = text_or_list if is_list else [text_or_list]
    
    try:
        client = get_genai_client()
        model = "text-embedding-004"
        response = client.models.embed_content(
            model=model,
            contents=contents
        )
        embeddings = [e.values for e in response.embeddings]
        return embeddings if is_list else embeddings[0]
    except Exception as e:
        logger.error(f"Error fetching embeddings from Gemini API: {e}")
        # Return dummy list of floats for development/testing if API key is missing
        dummy_dim = 768
        if is_list:
            return [[0.0] * dummy_dim for _ in contents]
        return [0.0] * dummy_dim

def generate_chat_response(system_instruction, chat_history, user_message):
    """
    Generate response using gemini-2.5-flash.
    chat_history format: [{'role': 'user'|'model', 'text': str}]
    """
    contents = []
    for msg in chat_history:
        contents.append(
            types.Content(
                role=msg['role'],
                parts=[types.Part.from_text(text=msg['text'])]
            )
        )
    
    # Add current user message
    contents.append(
        types.Content(
            role='user',
            parts=[types.Part.from_text(text=user_message)]
        )
    )
    
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.2,  # Low temperature for precise, factual grounding
    )
    
    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=config
        )
        return response.text
    except Exception as e:
        logger.error(f"Error generating content from Gemini API: {e}")
        return f"Sorry, I encountered an error communicating with the AI service: {str(e)}"

import math

def cosine_similarity(v1, v2):
    if not v1 or not v2:
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)


from pydantic import BaseModel, Field
from typing import List
import json

class MCQQuestion(BaseModel):
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str = Field(description="Must be one of: A, B, C, D")
    explanation_correct: str
    explanation_wrong: str

class MCQQuiz(BaseModel):
    questions: List[MCQQuestion]

def generate_quiz_questions(document, count, difficulty):
    """
    Generate multiple choice questions based on document chunks using Gemini JSON mode.
    """
    # 1. Sample chunks across the document
    chunks = list(document.chunks.order_by('chunk_index'))
    if not chunks:
        context = document.extracted_text
    else:
        max_chunks = 15
        if len(chunks) <= max_chunks:
            sampled_chunks = chunks
        else:
            step = len(chunks) / max_chunks
            sampled_chunks = [chunks[int(i * step)] for i in range(max_chunks)]
        context = "\n\n".join([c.content for c in sampled_chunks])

    if not context or not context.strip():
        context = f"Document Title: {document.title}"

    # 2. Set up prompt
    system_instruction = (
        "You are an expert educational assessment creator. Your task is to generate multiple choice "
        "questions based STRICTLY on the provided document context. Do not use any outside knowledge."
    )

    user_prompt = f"""Given the following document content, generate exactly {count} multiple choice questions at {difficulty} difficulty.

Difficulty definitions:
- easy: Direct recall of facts stated in the document.
- medium: Requires understanding of relationships and reasoning within the document.
- hard: Requires synthesis of multiple parts of the document and critical thinking.

Rules:
1. All questions and answers must be grounded EXCLUSIVELY in the document text below.
2. Each question must have exactly 4 options labeled A, B, C, D.
3. All 4 options must be plausible; avoid obviously wrong distractors.
4. No two questions should test the same fact or concept.
5. Cover a spread of topics/sections across the document, not just the beginning.

DOCUMENT CONTEXT:
=================
{context}
=================
"""

    # 3. Request from Gemini API
    try:
        if not os.environ.get("GEMINI_API_KEY"):
            raise ValueError("GEMINI_API_KEY environment variable is not set.")

        client = get_genai_client()
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
            response_mime_type="application/json",
            response_schema=MCQQuiz,
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=config
        )

        data = json.loads(response.text)
        questions = data.get("questions", [])
        
        final_questions = []
        for q in questions[:count]:
            final_questions.append({
                "question": q.get("question", ""),
                "option_a": q.get("option_a", ""),
                "option_b": q.get("option_b", ""),
                "option_c": q.get("option_c", ""),
                "option_d": q.get("option_d", ""),
                "correct_option": q.get("correct_option", "A").upper(),
                "explanation_correct": q.get("explanation_correct", ""),
                "explanation_wrong": q.get("explanation_wrong", "")
            })
        
        if len(final_questions) < count:
            logger.warning(f"Gemini returned only {len(final_questions)} questions instead of {count}. Generating fallback questions.")
            diff = count - len(final_questions)
            final_questions.extend(generate_mock_questions(diff))

        return final_questions

    except Exception as e:
        logger.error(f"Error generating quiz questions from Gemini API: {e}")
        return generate_mock_questions(count)

def generate_mock_questions(count):
    mock_questions = []
    for i in range(count):
        mock_questions.append({
            "question": f"Mock Question {i+1}: What is the purpose of this mock quiz question?",
            "option_a": f"To simulate a multiple choice option A for question {i+1}.",
            "option_b": f"To simulate the correct multiple choice option B for question {i+1}.",
            "option_c": f"To simulate a multiple choice option C for question {i+1}.",
            "option_d": f"To simulate a multiple choice option D for question {i+1}.",
            "correct_option": "B",
            "explanation_correct": f"This is the correct explanation for mock question {i+1}.",
            "explanation_wrong": f"This is the wrong explanation for mock question {i+1}."
        })
    return mock_questions



