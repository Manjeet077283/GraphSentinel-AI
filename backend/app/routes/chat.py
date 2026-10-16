"""
GraphSentinel AI - Chat Route
AI-assisted and deterministic graph-grounded incident investigation endpoint.
"""

from fastapi import APIRouter, HTTPException
from backend.app.database import get_graph
from backend.app.schemas import ChatRequest, ChatResponse
from backend.app.investigation import extract_entities, gather_graph_facts
from backend.app.ai_service import generate_chat_response

router = APIRouter(prefix="/chat", tags=["Investigation Chat"])


@router.post("", response_model=ChatResponse)
def chat_investigation(req: ChatRequest):
    """
    Investigates user natural-language questions using FalkorDB graph facts.
    Uses Google Gemini when configured, or deterministic graph-grounded engine when offline.
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

        # 3. Generate structured response
        response = generate_chat_response(
            query=req.message,
            conversation_history=req.conversation_history,
            facts=facts
        )
        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Investigation chat failed to process request: {str(e)}"
        )
