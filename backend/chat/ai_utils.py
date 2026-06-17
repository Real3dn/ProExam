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


