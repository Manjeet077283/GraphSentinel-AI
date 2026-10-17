"""
GraphSentinel AI - Chat Route
AI-assisted and deterministic graph-grounded incident investigation endpoint.
Supports multilingual responses (English, Hindi, Hinglish), persistent conversation history,
and on-demand message translation.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Depends
from backend.app.database import get_graph
from backend.app.schemas import (
    ChatRequest,
    ChatResponse,
    TranslateMessageRequest
)
from backend.app.investigation import extract_entities, gather_graph_facts
from backend.app.ai_service import generate_chat_response, translate_text
from backend.app.persistence import (
    get_user_by_token,
    create_conversation,
    save_conversation_message,
    get_conversation
)

router = APIRouter(prefix="/chat", tags=["Investigation Chat"])


def get_optional_user(
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None)
) -> Optional[dict]:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif x_session_token:
        token = x_session_token.strip()
    return get_user_by_token(token) if token else None


@router.post("", response_model=ChatResponse)
def chat_investigation(
    req: ChatRequest,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Investigates user natural-language questions using FalkorDB graph facts.
    Uses Google Gemini when configured, or deterministic graph-grounded engine when offline.
    Supports English, Hindi, and Hinglish. Automatically persists session history if authenticated.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        graph = get_graph()
        # 1. Identify entities and intent
        entities = extract_entities(
            req.message,
            focused_incident_id=req.focused_incident_id,
            focused_service_id=req.focused_service_id
        )

        # 2. Gather factual graph nodes and relationships
        facts = gather_graph_facts(graph, entities)

        # Determine effective language preference
        effective_lang = req.language or (current_user.get("preferred_language") if current_user else "en") or "en"

        # 3. Generate structured response
        response = generate_chat_response(
            query=req.message,
            conversation_history=req.conversation_history,
            facts=facts,
            language=effective_lang
        )

        # 4. If user is authenticated, persist conversation & messages
        if current_user:
            user_id = current_user["id"]
            conv_id = req.conversation_id
            if conv_id:
                # verify conversation belongs to user
                conv = get_conversation(conv_id, user_id)
                if not conv:
                    conv_id = None

            if not conv_id:
                # Create conversation
                title = req.message[:50] + ("..." if len(req.message) > 50 else "")
                new_conv = create_conversation(
                    user_id=user_id,
                    title=title,
                    focused_incident_id=req.focused_incident_id,
                    focused_service_id=req.focused_service_id,
                    language=effective_lang
                )
                conv_id = new_conv["id"]

            # Save user message
            save_conversation_message(
                conversation_id=conv_id,
                user_id=user_id,
                role="user",
                content=req.message,
                mode=response.mode
            )

            # Save assistant response
            save_conversation_message(
                conversation_id=conv_id,
                user_id=user_id,
                role="assistant",
                content=response.answer,
                mode=response.mode,
                structured_data=response.model_dump()
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Investigation chat failed to process request: {str(e)}"
        )


@router.post("/translate")
def translate_message(req: TranslateMessageRequest):
    """Translates an investigation explanation to English, Hindi, or Hinglish while preserving code and identifiers."""
    if not req.text.strip():
        return {"original_text": "", "target_language": req.target_language, "translated_text": ""}
    return translate_text(req.text, req.target_language)
