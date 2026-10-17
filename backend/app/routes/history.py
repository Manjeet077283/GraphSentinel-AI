"""
GraphSentinel AI - Investigation History Routes
Endpoints for browsing, reopening, and managing user-isolated AI investigation sessions.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends
from backend.app.schemas import (
    ConversationSummary,
    ConversationDetail,
    CreateConversationRequest
)
from backend.app.routes.auth import get_current_user
from backend.app.persistence import (
    create_conversation,
    list_conversations,
    get_conversation,
    get_conversation_messages,
    delete_conversation
)

router = APIRouter(prefix="/history", tags=["Investigation History"])


@router.get("", response_model=List[ConversationSummary])
def get_user_conversations(current_user: dict = Depends(get_current_user)):
    """Lists saved investigation conversations for the authenticated user."""
    return list_conversations(current_user["id"])


@router.post("", response_model=ConversationSummary)
def start_conversation(
    req: CreateConversationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Creates a new dedicated investigation conversation session."""
    title = req.title or "New Incident Investigation"
    return create_conversation(
        user_id=current_user["id"],
        title=title,
        focused_incident_id=req.focused_incident_id,
        focused_service_id=req.focused_service_id,
        language=req.language or "en"
    )


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation_session(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieves full conversation transcript and metadata."""
    conv = get_conversation(conversation_id, current_user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found or access denied.")

    messages = get_conversation_messages(conversation_id, current_user["id"])
    return {
        **conv,
        "message_count": len(messages),
        "messages": messages
    }


@router.get("/{conversation_id}/messages")
def get_conversation_messages_only(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieves list of messages for a conversation session."""
    conv = get_conversation(conversation_id, current_user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found or access denied.")
    return get_conversation_messages(conversation_id, current_user["id"])


@router.delete("/{conversation_id}")
def remove_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deletes an investigation conversation and its message transcript."""
    success = delete_conversation(conversation_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Conversation session not found or could not be deleted.")
    return {"status": "success", "message": "Investigation history deleted successfully."}
