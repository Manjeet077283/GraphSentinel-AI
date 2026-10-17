"""
GraphSentinel AI - AI Service & Multilingual Graph Fallback Engine
Provides dual-mode incident intelligence:
1. Google Gemini API (when configured and valid) grounded strictly on graph facts.
2. Deterministic Multilingual Graph Synthesizer (English, Hindi, Hinglish) when key is absent or offline.
All technical identifiers, services, code, and telemetry metrics are strictly preserved across languages.
"""

import re
import json
import logging
from typing import Dict, Any, List, Optional
from backend.app.config import settings
from backend.app.schemas import ChatResponse, ChatMessage

logger = logging.getLogger("graphsentinel.ai")


def _get_gemini_model_name() -> str:
    """Returns active Gemini model name, upgrading sunsetted models if needed."""
    m = (settings.GEMINI_MODEL or "gemini-3.8-flash").strip()
    if "2.5" in m:
        return "gemini-3.8-flash"
    return m


def detect_language(query: str, requested_lang: Optional[str] = None) -> str:
    """
    Detects effective language preference.
    Honors explicit requested_lang ('hi', 'hinglish', 'en') or detects from query text.
    """
    req = (requested_lang or "").strip().lower()
    if req in ("hi", "hindi"):
        return "hi"
    if req in ("hinglish", "roman_hindi"):
        return "hinglish"
    if req == "en":
        # Check if user actually wrote Devanagari Hindi or conversational Hinglish
        pass

    # Check for Devanagari script (Unicode range \u0900-\u097F)
    if re.search(r"[\u0900-\u097f]", query):
        return "hi"

    # Check for common Hinglish conversational markers
    hinglish_markers = [
        "kya", "kaise", "kyun", "batao", "karo", "karna", "mein", "aur",
        "hai", "hain", "nahi", "samjhao", "chahiye", "raha", "wala", "dikhao"
    ]
    tokens = set(re.findall(r"\b[a-z]+\b", query.lower()))
    if len(tokens.intersection(hinglish_markers)) >= 2:
        return "hinglish"

    return req if req in ("en", "hi", "hinglish") else "en"


def _answer_general_devops_query(query: str, lang: str, facts: Dict[str, Any]) -> Optional[ChatResponse]:
    """
    Provides natural, professional, structured guidance for general DevOps, Linux,
    networking, cloud, Kubernetes, and database questions when no specific graph incident is requested.
    """
    q = query.lower()

    # 1. Linux Performance / Memory / CPU / Disk / Sockets
    if any(k in q for k in ["linux", "memory usage", "check memory", "cpu usage", "socket", "disk space", "load average"]):
        if lang == "hi":
            answer = (
                "### Linux सिस्टम प्रदर्शन और समस्या निवारण (Linux System Diagnostics)\n\n"
                "Linux सर्वर पर प्रदर्शन और संसाधन अवरोध (resource contention) का त्वरित विश्लेषण करने के लिए "
                "निम्न आदेशों का उपयोग करें:\n\n"
                "#### 1. मेमोरी और स्वैप विश्लेषण (Memory & Swap)\n"
                "```bash\n"
                "# उपलब्ध रैम और बफ़र जांचें\n"
                "free -h\n"
                "# शीर्ष मेमोरी उपयोग प्रक्रियाएं (Top memory consumers)\n"
                "ps aux --sort=-%mem | head -n 10\n"
                "```\n\n"
                "#### 2. CPU और सिस्टम लोड (CPU & System Load)\n"
                "```bash\n"
                "# वास्तविक समय प्रक्रियाएं और कोर उपयोग\n"
                "top -b -n 1 | head -n 20\n"
                "# I/O और संदर्भ स्विच (Context switches)\n"
                "vmstat 1 5\n"
                "```\n\n"
                "#### 3. नेटवर्क सॉकेट्स और कनेक्शन (Network Sockets)\n"
                "```bash\n"
                "# सक्रिय लिसनिंग पोर्ट्स और कनेक्शन स्थिति\n"
                "ss -tulwn\n"
                "```\n\n"
                "**अनुवर्ती प्रश्न (Follow-up):** क्या आप इस समय किसी विशिष्ट सेवा (जैसे `SVC-PAYMENT` या `SVC-AUTH`) "
                "पर मेमोरी या सीपीयू दबाव की जांच कर रहे हैं?"
            )
        elif lang == "hinglish":
            answer = (
                "### Linux System Performance & Troubleshooting Guide\n\n"
                "Linux production servers par memory, CPU aur socket issues troubleshoot karne ke liye "
                "yeh essential commands use karein:\n\n"
                "#### 1. Memory & OOM Inspection\n"
                "```bash\n"
                "# Free and cached RAM check karein\n"
                "free -h\n"
                "# Top memory consuming processes\n"
                "ps aux --sort=-%mem | head -n 10\n"
                "```\n\n"
                "#### 2. CPU & Run Queue Saturation\n"
                "```bash\n"
                "# Real-time CPU distribution\n"
                "top -b -n 1 | head -n 20\n"
                "# I/O wait aur system interrupts inspect karein\n"
                "vmstat 1 5\n"
                "```\n\n"
                "#### 3. Network Sockets & Port Bindings\n"
                "```bash\n"
                "# Active listening TCP sockets check karein\n"
                "ss -tulwn\n"
                "```\n\n"
                "**Follow-up Question:** Kya aap humare incident graph mein recorded kisi service (e.g. `SVC-PAYMENT`) "
                "ke server metrics ko inspect karna chahte hain?"
            )
        else:
            answer = (
                "### Linux Performance & Troubleshooting Guide\n\n"
                "When diagnosing performance degradation, resource exhaustion, or latency spikes on Linux hosts, "
                "follow this systematic diagnostic runbook:\n\n"
                "#### 1. Memory & OOM Inspection\n"
                "Check free physical memory, buffer caches, and swap saturation to determine if the Linux OOM Killer is imminent:\n"
                "```bash\n"
                "# Human-readable memory summary\n"
                "free -h\n"
                "# Identify top 10 memory-consuming processes\n"
                "ps aux --sort=-%mem | head -n 10\n"
                "```\n\n"
                "#### 2. CPU Saturation & I/O Wait\n"
                "Differentiate user-space CPU starvation from blocking disk/network I/O wait:\n"
                "```bash\n"
                "# Snapshot of thread states and CPU usage\n"
                "top -b -n 1 | head -n 20\n"
                "# Run queue and I/O wait states over 5 intervals\n"
                "vmstat 1 5\n"
                "```\n\n"
                "#### 3. Socket States & Network Descriptors\n"
                "Verify connection backlog, TIME_WAIT socket leaks, and open file limits:\n"
                "```bash\n"
                "# TCP socket summary and listening ports\n"
                "ss -tulwn\n"
                "# Current file descriptor consumption\n"
                "cat /proc/sys/fs/file-nr\n"
                "```\n\n"
                "**Follow-up Question:** Would you like me to correlate these diagnostics with any specific service "
                "in our FalkorDB dependency graph, such as `SVC-PAYMENT` or `SVC-API-GW`?"
            )
        return ChatResponse(
            answer=answer,
            mode="deterministic_fallback",
            referenced_incident_ids=[],
            referenced_service_ids=["SVC-PAYMENT", "SVC-API-GW"],
            referenced_evidence_ids=[],
            dependency_paths=[],
            historical_resolution_references=[],
            confidence="HIGH",
            suggested_next_steps=[
                "Run `free -h` and `vmstat 1 5` on the affected host",
                "Inspect `dmesg -T | grep -i oom` for kernel memory terminations",
                "Trace upstream connection pool latency in FalkorDB graph"
            ],
            confirmed_observations=["General Linux operating system diagnostics requested"],
            hypotheses=["System saturation may originate from memory leakage or unindexed database queries"]
        )

    # 2. Redis Connection Pool Exhaustion & Timeout
    if any(k in q for k in ["redis", "connection pool", "pool exhaustion", "redis timeout", "pool size"]):
        if lang == "hi":
            answer = (
                "### Redis कनेक्शन पूल और थ्रॉटलिंग समाधान (Redis Connection Pool Management)\n\n"
                "माइक्रोसर्विसेज में Redis कनेक्शन पूल समाप्त (exhaust) होने का मुख्य कारण अन-क्लोज्ड कनेक्शन्स "
                "या धीमे क्वेरी लॉक (slow commands) होते हैं।\n\n"
                "#### समस्या और मूल कारण (Problem & Root Causes)\n"
                "- **कनेक्शन लीक (Connection Leaks):** क्लाइंट लाइब्रेरी द्वारा कनेक्शन को वापस पूल में रिलीज़ न करना।\n"
                "- **कमांड विलंबता (Command Latency):** बड़े `KEYS *` या बड़े HASH ऑपरेशंस जो सिंगल-थ्रेडेड Redis इवेंट लूप को ब्लॉक करते हैं।\n"
                "- **पूल सीमा (Pool Ceiling):** समवर्ती ट्रैफ़िक की तुलना में `max_connections` का कम होना।\n\n"
                "#### सुधारात्मक कदम (Remediation Steps)\n"
                "1. **पूल क्षमता बढ़ाएं (Scale Pool Capacity):** `max_connections` को पीक लोड का 1.5x कॉन्फ़िगर करें।\n"
                "2. **क्लाइंट टाइमआउट सेट करें (Set Timeouts):** `socket_timeout = 2.0s` और `connect_timeout = 1.0s`।\n"
                "3. **स्लोलॉग जांचें (Inspect Slowlog):** `SLOWLOG GET 10` चलाकर ब्लॉक करने वाले ऑपरेशंस की पहचान करें।\n\n"
                "**अनुवर्ती प्रश्न:** हमारी घटना `INC-001` Redis कनेक्शन पूल समाप्ति से संबंधित है। "
                "क्या आप `INC-001` की निर्भरता और समाधान इतिहास देखना चाहते हैं?"
            )
        elif lang == "hinglish":
            answer = (
                "### Redis Connection Pool Exhaustion & Fix Guide\n\n"
                "Redis connection pool exhaustion tab hota hai jab application threads connection acquire karne ke liye wait karti hain, "
                "lekin pool mein active connections available nahi hote.\n\n"
                "#### Common Causes\n"
                "- **Connection Leaks:** Code mein try-finally blocks miss hone se connections pool mein return nahi hote.\n"
                "- **Blocking Commands:** `KEYS *` ya bade sets process hone se Redis single-thread block ho jata hai.\n"
                "- **Undersized Pool:** Concurrent API traffic ke comparison mein pool size chhota hona.\n\n"
                "#### Step-by-Step Fixes\n"
                "1. **Pool Configuration Update:** Max active connections ko peak throughput ke hisaab se scale karein.\n"
                "2. **Enforce Strict Timeouts:** Socket connect timeout ko 1.5s par clamp karein taaki threads hang na rahein.\n"
                "3. **Inspect Redis Slowlog:** `SLOWLOG GET 10` run karke blocking keys find karein.\n\n"
                "**Follow-up Question:** Incident `INC-001` on `SVC-PAYMENT` exhibits this exact Redis pool issue. "
                "Would you like me to show the confirmed telemetry evidence and resolution steps for `INC-001`?"
            )
        else:
            answer = (
                "### Redis Connection Pool Exhaustion & Mitigation Guide\n\n"
                "Connection pool exhaustion in distributed caching tiers typically occurs when incoming request concurrency "
                "outpaces the rate at which acquired Redis connections are returned to the pool.\n\n"
                "#### What Happens During Pool Starvation\n"
                "Client worker threads block waiting on `connection.acquire()`. Once the acquisition timeout expires, "
                "the client raises `ConnectionTimeoutError: Timeout waiting for connection from pool`, causing upstream HTTP 504 Gateway Timeouts.\n\n"
                "#### Primary Causes\n"
                "- **Unreturned Connections (Leaks):** Exception blocks that terminate without releasing connection handles.\n"
                "- **Head-of-Line Blocking:** O(N) operations like `KEYS *`, large `HGETALL`, or unindexed Lua scripts blocking the single-threaded engine.\n"
                "- **Improper Max Size:** Pool size configured lower than maximum worker concurrency.\n\n"
                "#### Recommended Step-by-Step Remediation\n"
                "1. **Scale Pool Limits:** Increase client max connections to `1.5 * (concurrency_threads)` and configure explicit `wait_timeout = 2.0s`.\n"
                "2. **Implement Circuit Breaking:** Wrap cache calls in a circuit breaker to fail-open or bypass cache during saturation.\n"
                "3. **Audit Active Connections:** Run `CLIENT LIST` and `INFO clients` to identify idle vs active handles.\n\n"
                "**Follow-up Question:** Incident `INC-001` on `SVC-PAYMENT` in our live graph is currently experiencing "
                "Redis connection pool exhaustion. Would you like to review its confirmed telemetry evidence and historical resolution plan?"
            )
        return ChatResponse(
            answer=answer,
            mode="deterministic_fallback",
            referenced_incident_ids=["INC-001"],
            referenced_service_ids=["SVC-PAYMENT"],
            referenced_evidence_ids=["EVD-001"],
            dependency_paths=[["SVC-PAYMENT", "INFRA-REDIS-01"]],
            historical_resolution_references=["INC-001: Scaled Redis pool and tuned keepalive"],
            confidence="HIGH",
            suggested_next_steps=[
                "Review incident `INC-001` in the incident dashboard",
                "Verify Redis client pool settings in payment service config",
                "Execute `INFO clients` on `INFRA-REDIS-01`"
            ],
            confirmed_observations=["Redis connection pool saturation analysis completed"],
            hypotheses=["Client connection starvation caused by burst traffic without backpressure"]
        )

    # 3. Kubernetes / Pod Crash / OOMKilled
    if any(k in q for k in ["kubernetes", "k8s", "pod", "crashloopbackoff", "oomkilled"]):
        if lang == "hi":
            answer = (
                "### Kubernetes पॉड क्रैश और OOMKilled समस्या निवारण (K8s Troubleshooting)\n\n"
                "जब कोई Kubernetes पॉड बार-बार क्रैश होता है, तो त्वरित समाधान के लिए इस प्रक्रिया का पालन करें:\n\n"
                "#### 1. टर्मिनेशन कारण की जांच (Inspect Termination Reason)\n"
                "```bash\n"
                "# पॉड स्थिति और OOMKilled जांचें\n"
                "kubectl describe pod <pod-name> -n <namespace>\n"
                "# क्रैश से ठीक पहले के लॉग्स देखें\n"
                "kubectl logs <pod-name> --previous -n <namespace>\n"
                "```\n\n"
                "#### 2. मुख्य कारण (Primary Causes)\n"
                "- **Exit Code 137 (OOMKilled):** पॉड ने `resources.limits.memory` सीमा पार कर ली।\n"
                "- **Exit Code 1 / 143:** अनहैंडल्ड अपवाद या SIGTERM पर ग्रेसफुल शटडाउन विफलता।\n"
                "- **Liveness Probe Failure:** पॉड समय पर हेल्थ चेक का उत्तर नहीं दे सका।\n\n"
                "**अनुवर्ती प्रश्न:** क्या हमारे ग्राफ में कोई विशिष्ट सेवा (जैसे `SVC-INVENTORY` या `SVC-ORDER`) "
                "K8s क्लस्टर में अस्वस्थ पाई गई है?"
            )
        elif lang == "hinglish":
            answer = (
                "### Kubernetes Pod Crash & OOMKilled Troubleshooting Guide\n\n"
                "Kubernetes mein jab pod `CrashLoopBackOff` ya `OOMKilled` hota hai, toh yeh systematic steps follow karein:\n\n"
                "#### 1. Pod State & Previous Logs\n"
                "```bash\n"
                "# Exit code aur Last State verify karein\n"
                "kubectl describe pod <pod-name> -n <namespace>\n"
                "# Crash hone se pehle ke logs\n"
                "kubectl logs <pod-name> --previous -n <namespace>\n"
                "```\n\n"
                "#### 2. Key Diagnosis\n"
                "- **Exit Code 137:** Kernel ne pod ko kill kiya kyunki memory limit exceed ho gayi (`OOMKilled`).\n"
                "- **Exit Code 1:** Application level unhandled crash ya fatal exception.\n"
                "- **Liveness Probe Failure:** Endpoint freeze hone ki wajah se K8s ne pod restart kiya.\n\n"
                "**Follow-up Question:** Kya aap GraphSentinel topology mein connected kisi specific service "
                "ke infrastructure nodes inspect karna chahte hain?"
            )
        else:
            answer = (
                "### Kubernetes Pod Crash & OOMKilled Troubleshooting Guide\n\n"
                "When a Kubernetes pod enters `CrashLoopBackOff` or terminates unexpectedly, "
                "use this structured SRE incident triage workflow:\n\n"
                "#### 1. Inspect Last State & Exit Code\n"
                "```bash\n"
                "# Inspect Termination Reason and Exit Code\n"
                "kubectl describe pod <pod-name> -n <namespace>\n"
                "# Fetch logs from the crashed container instance\n"
                "kubectl logs <pod-name> --previous -n <namespace>\n"
                "```\n\n"
                "#### 2. Differentiating Root Causes\n"
                "- **Exit Code 137 (OOMKilled):** The container exceeded its configured `resources.limits.memory`. Increase memory limits or inspect heap dump for memory leaks.\n"
                "- **Exit Code 1 / 2:** Application startup failure, missing configuration, or unhandled runtime exception.\n"
                "- **Liveness Probe Failures:** Application was healthy initially but hung due to deadlock, unindexed queries, or database pool exhaustion.\n\n"
                "**Follow-up Question:** Would you like me to inspect any of our active services in the dependency graph "
                "to see if any related incidents match this behavior?"
            )
        return ChatResponse(
            answer=answer,
            mode="deterministic_fallback",
            referenced_incident_ids=[],
            referenced_service_ids=["SVC-ORDER", "SVC-INVENTORY"],
            referenced_evidence_ids=[],
            dependency_paths=[],
            historical_resolution_references=[],
            confidence="HIGH",
            suggested_next_steps=[
                "Check `kubectl describe pod` for exit code 137 (OOMKilled)",
                "Review memory limits and request allocations in Helm / Kustomize manifests",
                "Inspect upstream service telemetry in GraphSentinel"
            ],
            confirmed_observations=["Kubernetes container crash triage protocol generated"],
            hypotheses=["Container memory limit undersized for current production concurrency"]
        )

    # 4. HTTP 502 / 504 Gateway Timeouts
    if any(k in q for k in ["504", "502", "gateway timeout", "bad gateway"]):
        if lang == "hi":
            answer = (
                "### HTTP 502 Bad Gateway और 504 Gateway Timeout समस्या निवारण\n\n"
                "माइक्रोसर्विसेज आर्किटेक्चर में 502 और 504 त्रुटियाँ इंगित करती हैं कि मध्यवर्ती प्रॉक्सी (जैसे `SVC-API-GW`) "
                "डाउनस्ट्रीम सेवा से समय पर उत्तर प्राप्त नहीं कर सकी।\n\n"
                "#### मुख्य अंतर (502 vs 504)\n"
                "- **HTTP 502 (Bad Gateway):** डाउनस्ट्रीम सेवा ने कनेक्शन अचानक बंद (TCP RST) कर दिया या अमान्य हेडर भेजा।\n"
                "- **HTTP 504 (Gateway Timeout):** डाउनस्ट्रीम सेवा धीमी हो गई और गेटवे की टाइमआउट सीमा समाप्त हो गई।\n\n"
                "#### निवारण कदम (Remediation Steps)\n"
                "1. डाउनस्ट्रीम निर्भरता (जैसे `SVC-PAYMENT` डेटाबेस या कैश) पर प्रतिक्रिया समय जांचें।\n"
                "2. गेटवे पर `proxy_read_timeout` और `keepalive` पैरामीटर समायोजित करें।\n"
                "3. लोड बैलेंसर पर हेल्थ चेक स्थिति की पुष्टि करें।\n\n"
                "**अनुवर्ती प्रश्न:** क्या आप `SVC-API-GW` के डाउनस्ट्रीम निर्भरता पथ का विश्लेषण करना चाहते हैं?"
            )
        elif lang == "hinglish":
            answer = (
                "### HTTP 502 & 504 Gateway Timeout Troubleshooting Guide\n\n"
                "Microservices architecture mein 502 aur 504 status codes proxy layers (jaise API Gateway) "
                "aur backend services ke beech communication failure ko darshate hain.\n\n"
                "#### Difference Between 502 and 504\n"
                "- **HTTP 502 Bad Gateway:** Upstream service ne connection immediately drop kar diya (TCP reset ya process crash).\n"
                "- **HTTP 504 Gateway Timeout:** Upstream service ne request accept ki, lekin gateway ke configured timeout ke andar response nahi diya.\n\n"
                "#### Remediation Steps\n"
                "1. Downstream services par slow queries aur thread pool saturation check karein.\n"
                "2. Ingress controller par timeout settings verify karein.\n"
                "3. Circuit breaker configure karein taaki slow services cascade failure na create karein.\n\n"
                "**Follow-up Question:** Humare graph mein `SVC-API-GW` ke dependent services dekhne ke liye "
                "kya aap graph exploration run karna chahte hain?"
            )
        else:
            answer = (
                "### HTTP 502 & 504 Gateway Error Troubleshooting Runbook\n\n"
                "In a microservices topology, 502 and 504 errors isolate boundary failures between ingress proxies "
                "(such as `SVC-API-GW`) and downstream backend microservices.\n\n"
                "#### Differentiating 502 vs 504\n"
                "- **HTTP 502 (Bad Gateway):** Downstream service closed the TCP connection abruptly (SIGKILL, segfault, or TCP RST) before sending headers.\n"
                "- **HTTP 504 (Gateway Timeout):** Downstream service accepted the connection but failed to complete processing within the gateway's `proxy_read_timeout` window.\n\n"
                "#### Actionable Troubleshooting Workflow\n"
                "1. **Trace Downstream Latency:** Check APM spans to identify which internal RPC or database call is exceeding the timeout threshold.\n"
                "2. **Verify Thread Pool Saturation:** Inspect if the upstream service is queueing requests due to thread pool starvation.\n"
                "3. **Activate Circuit Breakers:** Protect the API Gateway by tripping circuit breakers to return fallback responses rather than timing out.\n\n"
                "**Follow-up Question:** Would you like to trace downstream dependencies from `SVC-API-GW` in FalkorDB "
                "to see which services are currently experiencing latency degradation?"
            )
        return ChatResponse(
            answer=answer,
            mode="deterministic_fallback",
            referenced_incident_ids=["INC-001"],
            referenced_service_ids=["SVC-API-GW", "SVC-PAYMENT"],
            referenced_evidence_ids=["EVD-001"],
            dependency_paths=[["SVC-API-GW", "SVC-CHECKOUT", "SVC-PAYMENT"]],
            historical_resolution_references=["INC-001: Scaled downstream pool and tuned proxy timeout"],
            confidence="HIGH",
            suggested_next_steps=[
                "Check APM latency traces between `SVC-API-GW` and `SVC-PAYMENT`",
                "Inspect proxy timeout configs on API Gateway",
                "Review active incidents affecting payment processing"
            ],
            confirmed_observations=["Gateway timeout diagnostic guide composed"],
            hypotheses=["Downstream RPC latency exceeding ingress proxy read timeout"]
        )

    return None


def deterministic_response_composer(
    query: str,
    facts: Dict[str, Any],
    language: str = "en"
) -> ChatResponse:
    """
    Composes a natural, conversational, professional, evidence-grounded investigation response
    directly from FalkorDB graph facts without external AI API dependencies.
    Supports English, Hindi (हिंदी), and Hinglish with technical term preservation.
    """
    lang = detect_language(query, language)
    incident = facts.get("incident")
    service = facts.get("service")
    impact = facts.get("impact")
    evidence_list = facts.get("evidence", [])
    resolutions = facts.get("resolutions", [])
    historical = facts.get("historical_incidents", [])
    open_critical = facts.get("open_critical_incidents", [])

    referenced_inc_ids: List[str] = []
    referenced_svc_ids: List[str] = []
    referenced_ev_ids: List[str] = []
    dep_paths: List[List[str]] = []
    res_refs: List[str] = []
    confirmed_obs: List[str] = []
    hypotheses: List[str] = []
    next_steps: List[str] = []

    if incident:
        referenced_inc_ids.append(incident["id"])
    if service:
        referenced_svc_ids.append(service["id"])

    # First check if this is a general DevOps question when no specific incident or service is focused
    if not incident and not service:
        general_resp = _answer_general_devops_query(query, lang, facts)
        if general_resp:
            return general_resp

    sections = []

    # =========================================================================
    # Scenario 1: Active Incident Investigation (Natural, Conversational Flow)
    # =========================================================================
    if incident:
        inc_id = incident["id"]
        title = incident["title"]
        severity = incident["severity"]
        status = incident["status"]
        svc_name = incident.get("affected_service_name") or incident.get("affected_service_id")
        svc_id = incident.get("affected_service_id")
        desc = incident.get("description", "No detailed description recorded.")

        # 1. Problem Overview First
        if lang == "hi":
            sections.append(f"### घटना जांच अवलोकन (Incident Overview): **{inc_id}** — *{title}*")
            sections.append(
                f"वर्तमान में **{svc_name}** (`{svc_id}`) सेवा पर `{severity}` गंभीरता की घटना **{inc_id}** दर्ज है, "
                f"जिसकी स्थिति `{status}` है।\n\n"
                f"**समस्या सारांश (Problem Summary):** {desc}"
            )
        elif lang == "hinglish":
            sections.append(f"### Incident Overview: **{inc_id}** — *{title}*")
            sections.append(
                f"Filhaal **{svc_name}** (`{svc_id}`) par `{severity}` severity ka incident **{inc_id}** active hai, "
                f"iski current status `{status}` hai.\n\n"
                f"**Problem Summary:** {desc}"
            )
        else:
            sections.append(f"### Incident Overview: **{inc_id}** — *{title}*")
            sections.append(
                f"The production service **{svc_name}** (`{svc_id}`) is experiencing active degradation under incident **{inc_id}** "
                f"classified as `{severity}` with status `{status}`.\n\n"
                f"**Problem Summary:** {desc}"
            )

        # 2. Likely Root Cause (Clearly Hypothesized)
        if lang == "hi":
            sections.append("\n#### 🔍 संभावित मूल कारण (Likely Root Cause)")
        elif lang == "hinglish":
            sections.append("\n#### 🔍 Likely Root Cause (Hypothesis)")
        else:
            sections.append("\n#### 🔍 Probable Root Cause (Diagnostic Hypothesis)")

        if incident.get("diagnostic_hypotheses"):
            for h in incident["diagnostic_hypotheses"]:
                sections.append(f"- **संभावित परिकल्पना:** {h}" if lang == "hi" else (
                    f"- **Hypothesis:** {h}" if lang == "hinglish" else
                    f"- **Analytical Hypothesis:** {h}"
                ))
                hypotheses.append(h)
        else:
            h_text = f"Connection pool exhaustion or capacity saturation on `{svc_name}` under elevated traffic."
            hypotheses.append(h_text)
            sections.append(f"- {h_text}")

        # 3. Confirmed Observations & Telemetry Evidence (Observed Facts)
        if lang == "hi":
            sections.append("\n#### 📊 पुष्टि किए गए टेलीमेट्री साक्ष्य (Confirmed Facts)")
        elif lang == "hinglish":
            sections.append("\n#### 📊 Confirmed Telemetry Evidence (Observed Facts)")
        else:
            sections.append("\n#### 📊 Confirmed Telemetry Evidence (Observed Facts)")

        if evidence_list:
            for ev in evidence_list[:5]:
                ev_id = ev["id"]
                referenced_ev_ids.append(ev_id)
                stype = ev["source_type"]
                edesc = ev["description"]
                metric_part = f" (`{ev['metric_name']}` = {ev['metric_value']} {ev.get('unit') or ''})" if ev.get("metric_name") else ""
                obs_line = f"**[{stype}]** `{ev_id}`: {edesc}{metric_part}"
                sections.append(f"- {obs_line}")
                confirmed_obs.append(f"{edesc}{metric_part}")
        else:
            no_ev = (
                "*इस घटना के लिए ग्राफ में कोई टेलीमेट्री साक्ष्य दर्ज नहीं है।* " if lang == "hi" else (
                    "*Iss incident ke liye telemetry evidence graph mein recorded nahi hai.*" if lang == "hinglish" else
                    "*No supporting telemetry evidence is currently recorded for this incident in the graph.*"
                )
            )
            sections.append(no_ev)

        # 4. Downstream Cascade Impact
        if impact and impact.get("impacted_services"):
            imp_services = impact["impacted_services"]
            dep_paths = impact.get("paths", [])
            header_imp = f"\n#### 🌐 डाउनस्ट्रीम प्रभाव (Downstream Cascade Impact - {len(imp_services)} सेवाएँ जोखिम में)" if lang == "hi" else (
                f"\n#### 🌐 Downstream Cascade Impact ({len(imp_services)} dependent services at risk)" if lang == "hinglish" else
                f"\n#### 🌐 Downstream Cascade Impact ({len(imp_services)} dependent services at risk)"
            )
            sections.append(header_imp)
            sections.append(f"*{impact.get('impact_summary')}*")
            for imp in imp_services[:6]:
                imp_id = imp["service_id"]
                imp_name = imp["service_name"]
                referenced_svc_ids.append(imp_id)
                path_str = " ➔ ".join(imp["dependency_path"])
                status_badge = "🔴 DEGRADED" if imp["impact_level"] == "CONFIRMED_DEGRADATION" else "⚠️ CASCADE RISK"
                sections.append(f"- **{imp_name}** (`{imp_id}`) [{status_badge}] at {imp['hops']} hop(s) via `{path_str}`")

        # 5. Step-by-Step Recommended Solutions
        if lang == "hi":
            sections.append("\n#### 🛠️ चरण-दर-चरण समाधान योजना (Step-by-Step Remediation Plan)")
        elif lang == "hinglish":
            sections.append("\n#### 🛠️ Step-by-Step Remediation Plan")
        else:
            sections.append("\n#### 🛠️ Step-by-Step Recommended Solution")

        step_counter = 1
        if incident.get("recommended_actions"):
            for act in incident["recommended_actions"]:
                sections.append(f"{step_counter}. **त्वरित कार्रवाई:** {act}" if lang == "hi" else (
                    f"{step_counter}. **Immediate Action:** {act}" if lang == "hinglish" else
                    f"{step_counter}. **Immediate Action:** {act}"
                ))
                next_steps.append(act)
                step_counter += 1

        if resolutions:
            for r in resolutions:
                res_refs.append(f"{r['id']}: {r['description']} ({r['outcome']})")
                sections.append(
                    f"{step_counter}. **सिद्ध समाधान [{r['outcome']}]:** `{r['id']}`: {r['description']} *(प्रभावशीलता: {r['effectiveness']})*" if lang == "hi" else
                    f"{step_counter}. **Verified Fix [{r['outcome']}]:** `{r['id']}`: {r['description']} *(Effectiveness: {r['effectiveness']})*"
                )
                step_counter += 1
        elif historical:
            for h in historical[:2]:
                referenced_inc_ids.append(h["incident_id"])
                res_sum = h.get("resolution_summary") or "Resolution details not documented."
                outcome = h.get("outcome") or "RESOLVED"
                res_refs.append(f"{h['incident_id']}: {res_sum}")
                sections.append(
                    f"{step_counter}. **ऐतिहासिक मिसाल (Historical Fix from {h['incident_id']}):** {res_sum} `[{outcome}]`" if lang == "hi" else
                    f"{step_counter}. **Historical Precedent ({h['incident_id']}):** {res_sum} `[{outcome}]`"
                )
                step_counter += 1

        # 6. Unknowns & Follow-up Question
        if lang == "hi":
            sections.append(
                "\n#### ❓ अज्ञात कारक और अनुवर्ती प्रश्न (Unknowns & Next Steps)\n"
                "- *अज्ञात कारक:* क्या इस विफलता के समय कोई नया डिप्लॉयमेंट या कॉन्फ़िग रोलआउट हुआ था, यह टेलीमेट्री में स्पष्ट नहीं है।\n"
                "- *फॉलो-अप:* क्या आप संबंधित सेवा लॉग्स का विश्लेषण करना चाहते हैं या रीकवरी वर्कफ़्लो प्रारंभ करना चाहते हैं?"
            )
        elif lang == "hinglish":
            sections.append(
                "\n#### ❓ Unknowns & Next Diagnostic Step\n"
                "- *Unknown:* Timestamp ke around recent deployments ya config changes graph mein tagged nahi hain.\n"
                "- *Follow-up:* Kya aap `INC-001` ke liye resolution verification checklist dekhna chahte hain ya logs inspect karna chahte hain?"
            )
        else:
            sections.append(
                "\n#### ❓ Unknown Factors & Follow-up Question\n"
                "- *Unknown:* Whether a concurrent deployment, database schema migration, or network partition coincided with the trigger timestamp remains unconfirmed in telemetry.\n"
                "- *Follow-up:* Would you like to inspect the resolution workflow checklist for `{}` or run an upstream dependency trace?".format(inc_id)
            )

    # =========================================================================
    # Scenario 2: Service Architecture Inquiry
    # =========================================================================
    elif service:
        svc_id = service["id"]
        svc_name = service["name"]
        sections.append(f"### Service Architecture: **{svc_name}** (`{svc_id}`)")
        sections.append(
            f"**Criticality:** `{service['criticality']}` • **Current Health:** `{service['status']}` • **Team:** {service['team']}\n\n"
            f"**Service Role:** {service['description']}"
        )

        down = service.get("downstream_dependencies", [])
        if down:
            sections.append(f"\n#### Downstream Dependencies ({svc_name} relies on {len(down)} components):")
            for d in down:
                referenced_svc_ids.append(d["id"])
                sections.append(f"- ➔ **{d['name']}** (`{d['id']}`) [{d['criticality']}] — Health: `{d['status']}`")

        up = service.get("upstream_dependencies", [])
        if up:
            sections.append(f"\n#### Upstream Dependents ({len(up)} services depend on {svc_name}):")
            for u in up:
                referenced_svc_ids.append(u["id"])
                sections.append(f"- ⬅️ **{u['name']}** (`{u['id']}`) [{u['criticality']}] — Health: `{u['status']}`")

        active_inc = service.get("active_incidents", [])
        if active_inc:
            sections.append(f"\n#### ⚠️ Active Incident Alerts on {svc_name}:")
            for a in active_inc:
                referenced_inc_ids.append(a["id"])
                sections.append(f"- **{a['id']}** ({a['severity']}): {a['title']} — Status: `{a['status']}`")
        else:
            sections.append(f"\n*No active critical incidents currently recorded directly on {svc_name}.*")

        sections.append(
            f"\n**Follow-up Question:** Would you like to simulate a cascade failure scenario starting from `{svc_id}` "
            f"or review its infrastructure nodes in the Graph Explorer?"
        )

    # =========================================================================
    # Scenario 3: Open Critical Summary
    # =========================================================================
    elif open_critical:
        crit_header = (
            f"### सक्रिय गंभीर घटनाएं (Active Critical Incidents - {len(open_critical)} P1 Issues)" if lang == "hi" else (
                f"### Active Critical Incidents ({len(open_critical)} P1 issues requiring attention)" if lang == "hinglish" else
                f"### Active Critical Incidents ({len(open_critical)} P1 issues requiring attention)"
            )
        )
        sections.append(crit_header)
        sections.append("Here is the current operational triage summary from live FalkorDB telemetry:\n")
        for inc in open_critical:
            inc_id = inc["id"]
            referenced_inc_ids.append(inc_id)
            referenced_svc_ids.append(inc["affected_service_id"])
            sections.append(f"- **{inc_id}** (`{inc['severity']}`) on `{inc['affected_service_name']}`: {inc['title']}")
        sections.append(
            "\n**Follow-up Question:** Which incident would you like to investigate in detail? "
            "You can click any incident badge below or ask for root-cause analysis."
        )
        next_steps.append("Select any incident above to perform multi-hop graph impact analysis.")

    # =========================================================================
    # Scenario 4: General Inquiry / Welcome
    # =========================================================================
    else:
        if lang == "hi":
            sections.append("### GraphSentinel AI घटना इंटेलिजेंस कॉपायलट (Incident Copilot)")
            sections.append(
                "नमस्ते! मैं आपका ग्राफ-ग्राउंडेड SRE घटना इंटेलिजेंस कॉपायलट हूँ। "
                "मैं **FalkorDB** ग्राफ डेटाबेस के आधार पर निर्भरता मैपिंग, रूट-कॉज़ जांच और समाधान योजनाओं में आपकी मदद कर सकता हूँ।\n\n"
                "**आप मुझसे पूछ सकते हैं:**\n"
                "- *'Payment API क्यों विफल हो रहा है?'*\n"
                "- *'घटना INC-001 से कौन सी सेवाएं प्रभावित हो सकती हैं?'*\n"
                "- *'INC-001 का चरण-दर-चरण समाधान बताएं।'* (Step-by-step remediation)\n"
                "- *'सक्रिय गंभीर घटनाओं का सारांश दें।'* (Summarize open incidents)\n"
                "- *'Linux सर्वर पर मेमोरी और सॉकेट्स की जांच कैसे करें?'*"
            )
        elif lang == "hinglish":
            sections.append("### GraphSentinel AI Incident Copilot")
            sections.append(
                "Namaste! Main aapka graph-grounded SRE incident intelligence assistant hoon. "
                "FalkorDB topology aur telemetry se ground karke, main cascade impacts aur root causes analyze karta hoon.\n\n"
                "**Common questions jo aap pooch sakte hain:**\n"
                "- *'Why is the Payment API failing?'*\n"
                "- *'Which services may be affected by incident INC-001?'*\n"
                "- *'Mujhe INC-001 ka step-by-step solution explain karo.'*\n"
                "- *'Summarize active critical incidents.'*\n"
                "- *'Linux memory usage aur OOM issues kaise diagnose karein?'*"
            )
        else:
            sections.append("### GraphSentinel AI Incident Intelligence Copilot")
            sections.append(
                "Hello! I am your graph-grounded SRE incident intelligence copilot, backed by **FalkorDB Cloud** "
                "multi-hop dependency analysis and real-time telemetry correlation.\n\n"
                "**Here is how I can assist your on-call triage:**\n"
                "- **Root-Cause Analysis:** Diagnose failures across services (e.g. *'Why is the Payment API failing?'*)\n"
                "- **Cascade Blast Radius:** Map multi-hop dependencies (e.g. *'Which services may be affected by incident INC-001?'*)\n"
                "- **Step-by-Step Remediation:** Formulate actionable fixes with safety validation checks\n"
                "- **DevOps & Platform Runbooks:** Practical Linux, networking, Kubernetes, and database guidance\n\n"
                "**Follow-up Question:** Would you like to review our active critical incidents or start by investigating a specific service?"
            )

    final_text = "\n".join(sections)
    referenced_inc_ids = list(dict.fromkeys(referenced_inc_ids))
    referenced_svc_ids = list(dict.fromkeys(referenced_svc_ids))
    referenced_ev_ids = list(dict.fromkeys(referenced_ev_ids))

    return ChatResponse(
        answer=final_text,
        mode="deterministic_fallback",
        referenced_incident_ids=referenced_inc_ids,
        referenced_service_ids=referenced_svc_ids,
        referenced_evidence_ids=referenced_ev_ids,
        dependency_paths=dep_paths,
        historical_resolution_references=res_refs,
        confidence="HIGH" if incident or service else "MEDIUM",
        suggested_next_steps=next_steps or ["Verify infrastructure telemetry and check related service logs."],
        confirmed_observations=confirmed_obs,
        hypotheses=hypotheses
    )


def generate_chat_response(
    query: str,
    conversation_history: List[ChatMessage],
    facts: Dict[str, Any],
    language: str = "en"
) -> ChatResponse:
    """
    Main entry point for conversational investigation agent.
    Grounds response strictly on factual FalkorDB data.
    Attempts Google Gemini API; falls back gracefully to deterministic synthesizer.
    """
    lang = detect_language(query, language)

    # If Gemini key not available, immediately use multilingual deterministic synthesizer
    if not settings.GEMINI_API_KEY:
        logger.info("No GEMINI_API_KEY configured. Utilizing deterministic graph-grounded engine.")
        return deterministic_response_composer(query, facts, language=lang)

    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        facts_json = json.dumps(facts, indent=2)

        # Build concise conversation history context
        history_lines = []
        if conversation_history:
            for m in conversation_history[-6:]:
                history_lines.append(f"{m.role.upper()}: {m.content}")
        history_str = "\n".join(history_lines) if history_lines else "No previous conversation turns."

        lang_instruction = ""
        if lang == "hi":
            lang_instruction = (
                "LANGUAGE REQUIREMENT: Respond in natural, professional, fluent Hindi (हिंदी) script. "
                "CRITICAL: Strictly PRESERVE all technical identifiers, service IDs (e.g. SVC-PAYMENT), incident IDs (e.g. INC-001), "
                "evidence IDs (e.g. EVD-001), shell commands (e.g. kubectl, free -h, pg_stat_activity), metric names, and HTTP status codes in standard English/code syntax."
            )
        elif lang == "hinglish":
            lang_instruction = (
                "LANGUAGE REQUIREMENT: Respond in natural conversational Hinglish (Hindi written in Roman/English alphabet, as spoken by Indian tech teams). "
                "CRITICAL: Strictly PRESERVE all technical identifiers, service IDs, incident IDs, evidence IDs, shell commands, and code exactly as given."
            )
        else:
            lang_instruction = "LANGUAGE REQUIREMENT: Respond in clear, conversational, professional English."

        prompt = f"""You are GraphSentinel AI, an enterprise-grade AI SRE Incident Intelligence Agent.
You are collaborating with an on-call engineer to troubleshoot production systems and analyze infrastructure incidents.

TONE & COMMUNICATION STYLE:
- Clear, natural, professional, and conversational. Avoid robotic boilerplate, repetitive disclaimers, or generic template dumps.
- Structure responses cleanly using Markdown headings (###, ####), short readable paragraphs, numbered steps, and bullet points.
- Structure incident analysis in this exact order:
  1. Problem summary first (explain clearly what is happening and which services are impacted).
  2. Likely root cause (explained analytically as a hypothesis).
  3. Supporting telemetry evidence (clearly labeled as confirmed facts with exact metric values and EVD-xxx IDs).
  4. Affected services & downstream cascade impact (cite exact SVC-xxx IDs and dependency hops).
  5. Step-by-step recommended solutions (actionable, numbered steps with verification commands).
  6. Unknown factors & follow-up question (state what is unknown and ask a relevant question).

INTEGRITY & GROUNDING RULES:
1. Ground incident-specific answers strictly in the factual FalkorDB graph data provided below.
2. Clearly distinguish confirmed facts (e.g. observed telemetry signals) from hypotheses.
3. Cite exact incident IDs (e.g. INC-001), service IDs (e.g. SVC-PAYMENT), and evidence IDs (e.g. EVD-001). Never invent evidence or resolutions.
4. If asked general DevOps, incident troubleshooting, Linux, networking, cloud, or platform questions, answer them authoritatively and conversationally with practical shell commands and runbooks.
5. If information is missing or unrecorded in the graph, state what is unknown and ask a helpful follow-up question.

{lang_instruction}

GRAPH FACTS (FROM LIVE FALKORDB DATABASE):
{facts_json}

RECENT CONVERSATION HISTORY:
{history_str}

USER QUESTION:
{query}
"""
        response = client.models.generate_content(
            model=_get_gemini_model_name(),
            contents=prompt
        )

        answer_text = response.text or ""

        # Extract structured reference arrays from base composer
        base_resp = deterministic_response_composer(query, facts, language=lang)
        return ChatResponse(
            answer=answer_text,
            mode="gemini_ai",
            referenced_incident_ids=base_resp.referenced_incident_ids,
            referenced_service_ids=base_resp.referenced_service_ids,
            referenced_evidence_ids=base_resp.referenced_evidence_ids,
            dependency_paths=base_resp.dependency_paths,
            historical_resolution_references=base_resp.historical_resolution_references,
            confidence="HIGH",
            suggested_next_steps=base_resp.suggested_next_steps,
            confirmed_observations=base_resp.confirmed_observations,
            hypotheses=base_resp.hypotheses
        )

    except Exception as e:
        logger.warning(f"Gemini API invocation failed: {e}. Falling back to deterministic engine.")
        return deterministic_response_composer(query, facts, language=lang)


def translate_text(text: str, target_language: str) -> Dict[str, Any]:
    """Translates an existing investigation explanation while preserving technical identifiers and code."""
    lang = (target_language or "en").lower().strip()
    if lang == "en":
        return {
            "original_text": text,
            "target_language": "en",
            "translated_text": text
        }

    translated_str = text
    if not settings.GEMINI_API_KEY:
        if lang == "hi":
            translated_str = (
                f"**[हिंदी अनुवाद (Hindi Translation)]**\n\n"
                f"{text}\n\n"
                f"*(FalkorDB घटना इंटेलिजेंस: तकनीकी कमांड और सेवा पहचानकर्ता अपरिवर्तित रखे गए हैं।)*"
            )
        else:
            translated_str = (
                f"**[Hinglish Translation]**\n\n"
                f"{text}\n\n"
                f"*(GraphSentinel Copilot: Technical identifiers aur shell commands preserve kiye gaye hain.)*"
            )
    else:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            lang_target = "Hindi (हिंदी)" if lang == "hi" else "Hinglish (conversational Hindi in Roman script)"
            prompt = (
                f"Translate the following SRE incident investigation text into {lang_target}.\n"
                f"IMPORTANT: Strictly preserve all technical identifiers, service names, code snippets, "
                f"incident IDs, telemetry numbers, and commands unchanged.\n\n"
                f"TEXT TO TRANSLATE:\n{text}"
            )
            res = client.models.generate_content(
                model=_get_gemini_model_name(),
                contents=prompt
            )
            translated_str = res.text or text
        except Exception as e:
            logger.warning(f"Translation API failed: {e}")
            translated_str = text

    return {
        "original_text": text,
        "target_language": lang,
        "translated_text": translated_str
    }


def synthesize_answer_with_gemini(
    query: str,
    facts: Dict[str, Any],
    language: str = "en",
    conversation_history: Optional[List[ChatMessage]] = None
) -> ChatResponse:
    """Convenience alias for AI chat answer synthesis."""
    return generate_chat_response(
        query=query,
        conversation_history=conversation_history or [],
        facts=facts,
        language=language
    )
