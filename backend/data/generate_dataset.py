"""
GraphSentinel AI - Synthetic Dataset Generator
Generates realistic, internally consistent synthetic datasets for incident investigation.
All records are explicitly synthetic and intended for demonstration and testing.
"""

import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

DATA_DIR = Path(__file__).resolve().parent

def generate():
    now = datetime(2026, 10, 16, 11, 30, 0, tzinfo=timezone.utc)

    # 1. Services (16 services)
    services = [
        {
            "id": "SVC-API-GW",
            "name": "API Gateway",
            "description": "Central entry point handling SSL termination, rate limiting, and request routing.",
            "criticality": "TIER_1",
            "status": "DEGRADED",
            "team": "Platform Engineering"
        },
        {
            "id": "SVC-AUTH",
            "name": "Authentication & Identity Service",
            "description": "Handles OAuth2 tokens, JWT verification, session management, and SSO.",
            "criticality": "TIER_1",
            "status": "DEGRADED",
            "team": "Security & Identity"
        },
        {
            "id": "SVC-PAYMENT",
            "name": "Payment Processing API",
            "description": "Integrates with payment acquirers, processes credit card transactions and refunds.",
            "criticality": "TIER_1",
            "status": "CRITICAL",
            "team": "Payments Engineering"
        },
        {
            "id": "SVC-CHECKOUT",
            "name": "Checkout Orchestrator",
            "description": "Manages shopping cart finalization, taxes, promos, and payment delegation.",
            "criticality": "TIER_1",
            "status": "DEGRADED",
            "team": "Commerce Core"
        },
        {
            "id": "SVC-ORDER",
            "name": "Order Management Service",
            "description": "State machine for order lifecycle, receipt creation, and fulfillment tracking.",
            "criticality": "TIER_1",
            "status": "DEGRADED",
            "team": "Commerce Core"
        },
        {
            "id": "SVC-USER",
            "name": "User Profile Service",
            "description": "Manages customer preferences, addresses, and account metadata.",
            "criticality": "TIER_2",
            "status": "HEALTHY",
            "team": "Identity & Accounts"
        },
        {
            "id": "SVC-INVENTORY",
            "name": "Inventory Tracking Service",
            "description": "Real-time stock reservation, SKU counts, and warehouse availability.",
            "criticality": "TIER_2",
            "status": "HEALTHY",
            "team": "Logistics Systems"
        },
        {
            "id": "SVC-CATALOG",
            "name": "Product Catalog Service",
            "description": "Serves product metadata, pricing, categories, and media references.",
            "criticality": "TIER_2",
            "status": "HEALTHY",
            "team": "Catalog Tech"
        },
        {
            "id": "SVC-SEARCH",
            "name": "Search & Recommendations Engine",
            "description": "Elasticsearch & vector-based search, ranking, and personalized feeds.",
            "criticality": "TIER_3",
            "status": "HEALTHY",
            "team": "Search & ML"
        },
        {
            "id": "SVC-NOTIF",
            "name": "Notification Dispatcher",
            "description": "Dispatches transactional emails, SMS alerts, and push notifications via RabbitMQ.",
            "criticality": "TIER_3",
            "status": "DEGRADED",
            "team": "Communications"
        },
        {
            "id": "SVC-BILLING",
            "name": "Billing & Invoicing Service",
            "description": "Generates PDF tax invoices, records ledger entries, and handles subscription cycles.",
            "criticality": "TIER_2",
            "status": "DEGRADED",
            "team": "Finance Tech"
        },
        {
            "id": "SVC-FRAUD",
            "name": "Fraud Detection Engine",
            "description": "Real-time risk scoring, velocity checks, and anomaly detection for payments.",
            "criticality": "TIER_1",
            "status": "HEALTHY",
            "team": "Risk & Compliance"
        },
        {
            "id": "SVC-SHIPPING",
            "name": "Shipping & Carrier Service",
            "description": "Calculates shipping rates, generates tracking numbers with FedEx/UPS APIs.",
            "criticality": "TIER_2",
            "status": "HEALTHY",
            "team": "Logistics Systems"
        },
        {
            "id": "SVC-DISCOUNTS",
            "name": "Discount & Coupon Engine",
            "description": "Validates promotional codes, calculates basket markdowns, and tracks campaigns.",
            "criticality": "TIER_3",
            "status": "HEALTHY",
            "team": "Marketing Tech"
        },
        {
            "id": "SVC-REVIEWS",
            "name": "Customer Reviews & Ratings",
            "description": "Stores user feedback, star ratings, and moderation flags.",
            "criticality": "TIER_4",
            "status": "HEALTHY",
            "team": "Community Experience"
        },
        {
            "id": "SVC-ANALYTICS",
            "name": "Telemetry & Event Streaming",
            "description": "Ingests clickstream and server telemetry into Kafka topic partitions.",
            "criticality": "TIER_4",
            "status": "HEALTHY",
            "team": "Data Platform"
        }
    ]

    # 2. Infrastructure (8 components)
    infrastructure = [
        {
            "id": "INF-RDS-PAYMENT",
            "name": "Payment Aurora PostgreSQL Primary",
            "type": "DATABASE",
            "environment": "PRODUCTION",
            "status": "DEGRADED"
        },
        {
            "id": "INF-RDS-REPLICA",
            "name": "Payment Aurora Read Replica",
            "type": "DATABASE",
            "environment": "PRODUCTION",
            "status": "HEALTHY"
        },
        {
            "id": "INF-REDIS-CLUSTER",
            "name": "Session & Token Redis Cluster",
            "type": "CACHE",
            "environment": "PRODUCTION",
            "status": "CRITICAL"
        },
        {
            "id": "INF-KAFKA-BROKER",
            "name": "Order Events Kafka Broker Cluster",
            "type": "MESSAGE_BROKER",
            "environment": "PRODUCTION",
            "status": "DEGRADED"
        },
        {
            "id": "INF-RABBITMQ",
            "name": "Notification RabbitMQ Cluster",
            "type": "MESSAGE_BROKER",
            "environment": "PRODUCTION",
            "status": "HEALTHY"
        },
        {
            "id": "INF-EKS-PROD",
            "name": "AWS EKS Cluster us-east-1",
            "type": "CONTAINER_PLATFORM",
            "environment": "PRODUCTION",
            "status": "HEALTHY"
        },
        {
            "id": "INF-ALB-PUBLIC",
            "name": "Production Internet ALB",
            "type": "LOAD_BALANCER",
            "environment": "PRODUCTION",
            "status": "DEGRADED"
        },
        {
            "id": "INF-CLOUDFLARE",
            "name": "Cloudflare Edge DNS & WAF",
            "type": "CDN_DNS",
            "environment": "PRODUCTION",
            "status": "HEALTHY"
        }
    ]

    # 3. Dependencies
    # Service depends on Service (source -> target means source depends on target)
    service_deps = [
        # API Gateway calls core services
        ("SVC-API-GW", "SVC-AUTH"),
        ("SVC-API-GW", "SVC-CHECKOUT"),
        ("SVC-API-GW", "SVC-CATALOG"),
        ("SVC-API-GW", "SVC-SEARCH"),
        ("SVC-API-GW", "SVC-USER"),
        ("SVC-API-GW", "SVC-ORDER"),
        ("SVC-API-GW", "SVC-REVIEWS"),

        # Checkout orchestrates auth, cart, inventory, payment, discount
        ("SVC-CHECKOUT", "SVC-AUTH"),
        ("SVC-CHECKOUT", "SVC-PAYMENT"),
        ("SVC-CHECKOUT", "SVC-ORDER"),
        ("SVC-CHECKOUT", "SVC-INVENTORY"),
        ("SVC-CHECKOUT", "SVC-DISCOUNTS"),
        ("SVC-CHECKOUT", "SVC-USER"),

        # Payment calls Fraud check, Billing, and Auth
        ("SVC-PAYMENT", "SVC-AUTH"),
        ("SVC-PAYMENT", "SVC-FRAUD"),
        ("SVC-PAYMENT", "SVC-BILLING"),

        # Order calls Payment, Inventory, Shipping, Notification
        ("SVC-ORDER", "SVC-PAYMENT"),
        ("SVC-ORDER", "SVC-INVENTORY"),
        ("SVC-ORDER", "SVC-SHIPPING"),
        ("SVC-ORDER", "SVC-NOTIF"),

        # Billing calls Notification and User
        ("SVC-BILLING", "SVC-NOTIF"),
        ("SVC-BILLING", "SVC-USER"),

        # Catalog and Search
        ("SVC-CATALOG", "SVC-INVENTORY"),
        ("SVC-SEARCH", "SVC-CATALOG"),
        ("SVC-REVIEWS", "SVC-CATALOG"),
        ("SVC-REVIEWS", "SVC-USER"),

        # Fraud needs User history and Orders
        ("SVC-FRAUD", "SVC-USER"),
        ("SVC-FRAUD", "SVC-ORDER"),

        # Shipping needs User address
        ("SVC-SHIPPING", "SVC-USER"),

        # Telemetry from critical services
        ("SVC-CHECKOUT", "SVC-ANALYTICS"),
        ("SVC-PAYMENT", "SVC-ANALYTICS"),
        ("SVC-ORDER", "SVC-ANALYTICS")
    ]

    # Service connects to Infrastructure
    infra_conns = [
        ("SVC-API-GW", "INF-ALB-PUBLIC"),
        ("SVC-API-GW", "INF-CLOUDFLARE"),
        ("SVC-AUTH", "INF-REDIS-CLUSTER"),
        ("SVC-AUTH", "INF-RDS-PAYMENT"),
        ("SVC-PAYMENT", "INF-RDS-PAYMENT"),
        ("SVC-PAYMENT", "INF-RDS-REPLICA"),
        ("SVC-PAYMENT", "INF-REDIS-CLUSTER"),
        ("SVC-ORDER", "INF-KAFKA-BROKER"),
        ("SVC-ORDER", "INF-RDS-PAYMENT"),
        ("SVC-BILLING", "INF-RDS-PAYMENT"),
        ("SVC-NOTIF", "INF-RABBITMQ"),
        ("SVC-USER", "INF-RDS-REPLICA"),
        ("SVC-ANALYTICS", "INF-KAFKA-BROKER"),
        ("SVC-CHECKOUT", "INF-EKS-PROD"),
        ("SVC-PAYMENT", "INF-EKS-PROD"),
        ("SVC-AUTH", "INF-EKS-PROD")
    ]

    dependencies = {
        "service_dependencies": [
            {"source": src, "target": tgt, "relationship": "DEPENDS_ON"}
            for src, tgt in service_deps
        ],
        "infrastructure_connections": [
            {"source": src, "target": tgt, "relationship": "CONNECTS_TO"}
            for src, tgt in infra_conns
        ]
    }

    # 4. Incidents (42 incidents)
    incident_templates = [
        # (id, title, desc, severity, status, service, hours_ago)
        ("INC-001", "Payment Gateway API Latency Spike & Gateway Timeout",
         "Payment Processing API experiencing p99 latency > 12000ms and connection timeouts during card authorization.",
         "P1_CRITICAL", "OPEN", "SVC-PAYMENT", 1),
        ("INC-002", "Authentication Token Cache Connection Pool Exhaustion",
         "Redis cluster max connections threshold breached causing JWT token validation failures.",
         "P1_CRITICAL", "OPEN", "SVC-AUTH", 2),
        ("INC-003", "Aurora PostgreSQL Connection Starvation on Payment DB",
         "Max connections reached on primary RDS cluster due to unclosed connection leak in billing webhook handler.",
         "P1_CRITICAL", "INVESTIGATING", "SVC-PAYMENT", 3),
        ("INC-004", "Ingress 504 Gateway Timeout Cascade on Checkout Endpoint",
         "API Gateway returning 504 errors to frontend clients as downstream checkout calls stall.",
         "P2_HIGH", "OPEN", "SVC-API-GW", 2),
        ("INC-005", "Order Events Kafka Consumer Lag & Queue Backlog",
         "Kafka consumer partition lag on topic 'order.created' exceeding 150,000 unconsumed messages.",
         "P2_HIGH", "INVESTIGATING", "SVC-ORDER", 4),
        ("INC-006", "Notification Worker Pod OOMKilled Memory Pressure",
         "Email dispatch worker pods hitting 2Gi memory limits repeatedly during marketing blast.",
         "P3_MEDIUM", "MITIGATED", "SVC-NOTIF", 6),
        ("INC-007", "Canary Deployment Regression in Fraud Scoring v2.4.1",
         "New ML scoring model throwing unhandled NullPointerExceptions on guest checkout payloads.",
         "P2_HIGH", "RESOLVED", "SVC-FRAUD", 12),
        ("INC-008", "Cloudflare Upstream DNS Resolution Flapping",
         "Intermittent DNS resolution failures for payment gateway third-party acquirer endpoints.",
         "P3_MEDIUM", "RESOLVED", "SVC-API-GW", 18),
        ("INC-009", "Checkout Orchestrator Thread Pool Saturation",
         "Tomcat thread pool exhaustion in Checkout Orchestrator caused by synchronous blocking HTTP calls to Payment API.",
         "P1_CRITICAL", "OPEN", "SVC-CHECKOUT", 1),
        ("INC-010", "Billing Invoice PDF Generation Disk Spool Full",
         "Ephemeral disk space on billing containers exhausted by untruncated ghostscript temp logs.",
         "P3_MEDIUM", "INVESTIGATING", "SVC-BILLING", 5),
        ("INC-011", "Inventory Lock Deadlock During Flash Sale Event",
         "Row-level deadlock on SKU inventory balances under concurrent cart reservation bursts.",
         "P2_HIGH", "MITIGATED", "SVC-INVENTORY", 24),
        ("INC-012", "Product Catalog Elasticsearch Heap Pressure",
         "JVM garbage collection pauses > 8s on catalog search nodes causing search query timeouts.",
         "P2_HIGH", "RESOLVED", "SVC-SEARCH", 36),
        ("INC-013", "User Profile Read Replica Replication Lag Spike",
         "Postgres read replica fell behind primary by 450 seconds during database vacuum process.",
         "P3_MEDIUM", "RESOLVED", "SVC-USER", 48),
        ("INC-014", "Shipping Label Carrier API Rate Limit Exceeded",
         "FedEx OAuth token bucket exhausted due to uncached rate calculation retries.",
         "P3_MEDIUM", "RESOLVED", "SVC-SHIPPING", 52),
        ("INC-015", "Coupon Engine Regex Denial of Service (ReDoS)",
         "Catastrophic backtracking on custom coupon wildcard validation pattern pinning CPU at 100%.",
         "P2_HIGH", "RESOLVED", "SVC-DISCOUNTS", 60),
        ("INC-016", "Review Spam Filter False-Positive Trigger Storm",
         "Spam classification microservice rejected legitimate customer reviews due to outdated threshold model.",
         "P4_LOW", "RESOLVED", "SVC-REVIEWS", 72),
        ("INC-017", "Payment Webhook Duplicate Processing Replay Storm",
         "Idempotency cache failure caused Stripe webhook retries to double-charge 14 transactions.",
         "P1_CRITICAL", "RESOLVED", "SVC-PAYMENT", 80),
        ("INC-018", "Redis Cache Eviction Avalanche on User Sessions",
         "Volatile-LRU policy evicted active JWT refresh tokens leading to unexpected user logouts.",
         "P2_HIGH", "RESOLVED", "SVC-AUTH", 96),
        ("INC-019", "Kafka Broker Disk Partition Exceeds 92% Threshold",
         "Retention policy misconfiguration on telemetry topic filled root volume on broker node 2.",
         "P2_HIGH", "MITIGATED", "SVC-ANALYTICS", 10),
        ("INC-020", "RabbitMQ Notification Exchange Dead-Letter Spike",
         "Dead letter exchange received 5,000 failed push notifications due to expired Apple APNs cert.",
         "P3_MEDIUM", "RESOLVED", "SVC-NOTIF", 110),
        ("INC-021", "Payment Acquirer TLS Certificate Rotation Failure",
         "Mutual TLS handshake failure between Payment Service and Visa Direct endpoint after cert rollover.",
         "P1_CRITICAL", "RESOLVED", "SVC-PAYMENT", 130),
        ("INC-022", "ALB Target Group Health Check Flap on Checkout Pods",
         "Health check endpoint /health/ready returned HTTP 500 when database connection pool spiked.",
         "P2_HIGH", "INVESTIGATING", "SVC-CHECKOUT", 7),
        ("INC-023", "Search Cluster Node Split-Brain Network Partition",
         "Inter-AZ network hiccup caused master node re-election loop in Elasticsearch cluster.",
         "P2_HIGH", "RESOLVED", "SVC-SEARCH", 144),
        ("INC-024", "Database Migration Lock Stall on Order Schema Update",
         "Exclusive table lock on 'orders' table blocked incoming order insertions for 4 minutes.",
         "P1_CRITICAL", "RESOLVED", "SVC-ORDER", 168),
        ("INC-025", "Memory Leak in User Profile Avatar Thumbnailer",
         "ImageMagick child process fork bomb caused worker node memory exhaustion.",
         "P3_MEDIUM", "RESOLVED", "SVC-USER", 180),
        ("INC-026", "Discount Engine In-Memory Cache Desynchronization",
         "Local Guava cache failed to invalidate stale coupon codes across distributed pods.",
         "P3_MEDIUM", "RESOLVED", "SVC-DISCOUNTS", 192),
        ("INC-027", "Notification SMS Provider Gateway Timeout Spike",
         "Twilio webhook responses degraded past 15s timeout causing dispatch worker backlog.",
         "P3_MEDIUM", "OPEN", "SVC-NOTIF", 8),
        ("INC-028", "Inventory Delta Feed Truncation During Nightly Sync",
         "ERP batch ingestion script crashed at record 45,000 leaving warehouse balances out of date.",
         "P2_HIGH", "RESOLVED", "SVC-INVENTORY", 210),
        ("INC-029", "Kubernetes Node NotReady Event Storm in Zone us-east-1a",
         "AWS EBS volume detach timeout left kubelet unresponsive across 4 worker nodes.",
         "P1_CRITICAL", "RESOLVED", "SVC-API-GW", 240),
        ("INC-030", "Payment Card Token Vault HSM Latency Spike",
         "Hardware Security Module (HSM) decryption latency jumped from 20ms to 450ms.",
         "P2_HIGH", "RESOLVED", "SVC-PAYMENT", 260),
        ("INC-031", "Order State Machine Race Condition on Concurrent Cancellations",
         "Optimistic concurrency check failed when customer cancelled order during automated warehouse pick.",
         "P3_MEDIUM", "RESOLVED", "SVC-ORDER", 280),
        ("INC-032", "API Gateway JWT Secret Key Drift Across Canaries",
         "Canary pods loaded updated HMAC secret before baseline pods, causing intermittent 401 Unauthorized.",
         "P2_HIGH", "RESOLVED", "SVC-AUTH", 300),
        ("INC-033", "Catalog Price CDN Stale Cache Serving Zero Dollar Items",
         "Surrogate-Key cache purge failed on regional POPs, displaying promotional price of $0.00.",
         "P1_CRITICAL", "RESOLVED", "SVC-CATALOG", 320),
        ("INC-034", "Billing Recurring Charge Scheduler Clock Drift",
         "NTP daemon desync on cron worker triggered duplicate billing runs 1 hour early.",
         "P2_HIGH", "RESOLVED", "SVC-BILLING", 340),
        ("INC-035", "Fraud Engine ML Model Drift Detecting 40% False Positives",
         "Unannounced bank BIN range shift triggered aggressive fraud blocks for valid European cards.",
         "P2_HIGH", "RESOLVED", "SVC-FRAUD", 360),
        ("INC-036", "Carrier Tracking Webhook Ingestion Buffer Overflow",
         "UPS real-time tracking webhooks flooded ingestion buffer, dropping 12,000 delivery updates.",
         "P3_MEDIUM", "RESOLVED", "SVC-SHIPPING", 380),
        ("INC-037", "Search Synonym Graph Loop Causing OutOfMemoryError",
         "Circular synonym expansion in search dictionary caused runaway recursive query generation.",
         "P3_MEDIUM", "RESOLVED", "SVC-SEARCH", 400),
        ("INC-038", "Customer Reviews Moderation Queue SQS Backlog",
         "Image toxicity scanner microservice rate-limited by upstream third-party vision API.",
         "P4_LOW", "RESOLVED", "SVC-REVIEWS", 420),
        ("INC-039", "Analytics Clickstream S3 Parquet Compaction Failure",
         "AWS Athena query latency spiked due to millions of small 4KB parquet files in cold storage.",
         "P4_LOW", "RESOLVED", "SVC-ANALYTICS", 450),
        ("INC-040", "Payment 3D Secure Webhook Callback Timeout",
         "Issuer bank ACS iframe callback URLs failing due to strict SameSite cookie enforcement.",
         "P2_HIGH", "OPEN", "SVC-PAYMENT", 9),
        ("INC-041", "Order Receipt PDF Generation Timeout During Peak Checkout",
         "Puppeteer headless browser renderer leaked Chromium zombies, consuming 100% pod CPU.",
         "P3_MEDIUM", "INVESTIGATING", "SVC-ORDER", 11),
        ("INC-042", "API Gateway Global Rate Limiting Misconfiguration",
         "IP address extraction extracted load balancer private IP, throttling all incoming traffic globally.",
         "P1_CRITICAL", "RESOLVED", "SVC-API-GW", 500)
    ]

    incidents = []
    for inc_id, title, desc, severity, status, svc, hours in incident_templates:
        created_time = now - timedelta(hours=hours)
        updated_time = created_time + timedelta(minutes=45) if status != "OPEN" else created_time + timedelta(minutes=10)
        incidents.append({
            "id": inc_id,
            "title": title,
            "description": desc,
            "severity": severity,
            "status": status,
            "affected_service_id": svc,
            "created_at": created_time.isoformat(),
            "updated_at": updated_time.isoformat()
        })

    # 5. Evidence (70 records)
    evidence = [
        # Evidence for INC-001 (Payment Gateway Timeout)
        {
            "id": "EVD-001", "incident_id": "INC-001", "source_type": "METRIC",
            "description": "Payment API p99 latency spiked from 145ms to 12,850ms.",
            "timestamp": (now - timedelta(minutes=55)).isoformat(),
            "metric_name": "http_request_duration_p99_ms", "metric_value": 12850.0, "unit": "ms"
        },
        {
            "id": "EVD-002", "incident_id": "INC-001", "source_type": "LOG",
            "description": "HikariPool-1 - Connection is not available, request timed out after 30005ms (total=50, active=50, idle=0, waiting=124)",
            "timestamp": (now - timedelta(minutes=50)).isoformat(),
            "metric_name": "connection_pool_waiting", "metric_value": 124.0, "unit": "connections"
        },
        {
            "id": "EVD-003", "incident_id": "INC-001", "source_type": "ALERT",
            "description": "Datadog Alert: [CRITICAL] PaymentProcessingAPI error rate > 18.5% over 5m window",
            "timestamp": (now - timedelta(minutes=45)).isoformat(),
            "metric_name": "http_5xx_error_percentage", "metric_value": 18.5, "unit": "percent"
        },
        {
            "id": "EVD-004", "incident_id": "INC-001", "source_type": "TRACE",
            "description": "Distributed trace 9f3e4a shows 92% of request time stalled in PostgreSQL query 'SELECT * FROM payment_methods WHERE customer_id = ? FOR UPDATE'",
            "timestamp": (now - timedelta(minutes=40)).isoformat(),
            "metric_name": "span_duration_ms", "metric_value": 11800.0, "unit": "ms"
        },
        # Evidence for INC-002 (Redis Pool Exhaustion)
        {
            "id": "EVD-005", "incident_id": "INC-002", "source_type": "METRIC",
            "description": "Redis cluster connected_clients reached maximum server capacity limit 10,000.",
            "timestamp": (now - timedelta(hours=1, minutes=50)).isoformat(),
            "metric_name": "redis_connected_clients", "metric_value": 10000.0, "unit": "clients"
        },
        {
            "id": "EVD-006", "incident_id": "INC-002", "source_type": "LOG",
            "description": "io.lettuce.core.RedisConnectionException: Unable to connect to redis-cluster-node-01.internal:6379 (ERR max number of clients reached)",
            "timestamp": (now - timedelta(hours=1, minutes=45)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        {
            "id": "EVD-007", "incident_id": "INC-002", "source_type": "ALERT",
            "description": "PagerDuty: [P1] Authentication Service JWT verification failing with 500 status on /v1/auth/verify",
            "timestamp": (now - timedelta(hours=1, minutes=40)).isoformat(),
            "metric_name": "auth_failure_rate", "metric_value": 42.0, "unit": "percent"
        },
        # Evidence for INC-003 (RDS Connection Starvation)
        {
            "id": "EVD-008", "incident_id": "INC-003", "source_type": "METRIC",
            "description": "AWS CloudWatch DatabaseConnections metric reached 1,980 out of 2,000 max_connections on INF-RDS-PAYMENT.",
            "timestamp": (now - timedelta(hours=2, minutes=50)).isoformat(),
            "metric_name": "database_connections", "metric_value": 1980.0, "unit": "connections"
        },
        {
            "id": "EVD-009", "incident_id": "INC-003", "source_type": "LOG",
            "description": "Postgres FATAL: remaining connection slots are reserved for non-replication superuser connections",
            "timestamp": (now - timedelta(hours=2, minutes=45)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        # Evidence for INC-004 (API Gateway 504 Timeout)
        {
            "id": "EVD-010", "incident_id": "INC-004", "source_type": "METRIC",
            "description": "API Gateway 504 Gateway Timeout rate climbed from 0.01% to 14.8%.",
            "timestamp": (now - timedelta(hours=1, minutes=45)).isoformat(),
            "metric_name": "http_504_rate_percent", "metric_value": 14.8, "unit": "percent"
        },
        {
            "id": "EVD-011", "incident_id": "INC-004", "source_type": "LOG",
            "description": "Envoy upstream timeout (15000ms exceeded) calling backend checkout.internal.cluster:8080/v2/checkout/submit",
            "timestamp": (now - timedelta(hours=1, minutes=40)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        # Evidence for INC-005 (Kafka Consumer Lag)
        {
            "id": "EVD-012", "incident_id": "INC-005", "source_type": "METRIC",
            "description": "Kafka consumer group 'order-processor' total lag reached 152,400 messages across 12 partitions.",
            "timestamp": (now - timedelta(hours=3, minutes=30)).isoformat(),
            "metric_name": "kafka_consumer_lag", "metric_value": 152400.0, "unit": "messages"
        },
        {
            "id": "EVD-013", "incident_id": "INC-005", "source_type": "ALERT",
            "description": "Prometheus Alert: KafkaConsumerLagHigh on topic order.created > 50000 for 15m",
            "timestamp": (now - timedelta(hours=3, minutes=20)).isoformat(),
            "metric_name": "kafka_consumer_lag", "metric_value": 152400.0, "unit": "messages"
        },
        # Evidence for INC-006 (Notification OOM)
        {
            "id": "EVD-014", "incident_id": "INC-006", "source_type": "OBSERVATION",
            "description": "Kubernetes kubelet killed notification-worker-67b8fd9-9xkm with exit code 137 (OOMKilled).",
            "timestamp": (now - timedelta(hours=5, minutes=45)).isoformat(),
            "metric_name": "container_memory_usage_bytes", "metric_value": 2147483648.0, "unit": "bytes"
        },
        {
            "id": "EVD-015", "incident_id": "INC-006", "source_type": "METRIC",
            "description": "Notification worker pod memory utilization stayed at 99.8% of 2Gi limit for 18 minutes.",
            "timestamp": (now - timedelta(hours=5, minutes=40)).isoformat(),
            "metric_name": "memory_utilization_percent", "metric_value": 99.8, "unit": "percent"
        },
        # Evidence for INC-007 (Fraud Canary Error)
        {
            "id": "EVD-016", "incident_id": "INC-007", "source_type": "LOG",
            "description": "java.lang.NullPointerException: Cannot invoke 'RiskProfile.getDeviceFingerprint()' because 'profile' is null at FraudScorerV2.evaluate(FraudScorerV2.java:184)",
            "timestamp": (now - timedelta(hours=11, minutes=40)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        {
            "id": "EVD-017", "incident_id": "INC-007", "source_type": "METRIC",
            "description": "Canary deployment pod fraud-engine-canary-74d error rate 100% on guest transactions.",
            "timestamp": (now - timedelta(hours=11, minutes=35)).isoformat(),
            "metric_name": "canary_error_rate", "metric_value": 100.0, "unit": "percent"
        },
        # Evidence for INC-008 (DNS Flap)
        {
            "id": "EVD-018", "incident_id": "INC-008", "source_type": "ALERT",
            "description": "External synthetic probe: DNS resolution failed for api.stripe.com in us-east-1 region (SERVFAIL)",
            "timestamp": (now - timedelta(hours=17, minutes=50)).isoformat(),
            "metric_name": "dns_lookup_failures", "metric_value": 38.0, "unit": "count"
        },
        # Evidence for INC-009 (Checkout Thread Pool Saturation)
        {
            "id": "EVD-019", "incident_id": "INC-009", "source_type": "METRIC",
            "description": "Checkout service active HTTP worker threads reached 200/200 maximum capacity.",
            "timestamp": (now - timedelta(minutes=50)).isoformat(),
            "metric_name": "tomcat_active_threads", "metric_value": 200.0, "unit": "threads"
        },
        {
            "id": "EVD-020", "incident_id": "INC-009", "source_type": "TRACE",
            "description": "Thread dump indicates 184 threads blocked waiting for socketRead0 from Payment Processing API endpoint /v1/charges",
            "timestamp": (now - timedelta(minutes=45)).isoformat(),
            "metric_name": "blocked_threads_count", "metric_value": 184.0, "unit": "threads"
        },
        # Evidence for INC-010 (Billing Disk Full)
        {
            "id": "EVD-021", "incident_id": "INC-010", "source_type": "METRIC",
            "description": "Container root filesystem disk usage reached 100% (20GB / 20GB) on billing-worker-0.",
            "timestamp": (now - timedelta(hours=4, minutes=45)).isoformat(),
            "metric_name": "disk_used_percent", "metric_value": 100.0, "unit": "percent"
        },
        # Evidence for INC-011 (Inventory Lock Deadlock)
        {
            "id": "EVD-022", "incident_id": "INC-011", "source_type": "LOG",
            "description": "Postgres ERROR: deadlock detected between process 14092 and process 14115 waiting for ShareLock on transaction 89104",
            "timestamp": (now - timedelta(hours=23, minutes=45)).isoformat(),
            "metric_name": "deadlock_count", "metric_value": 14.0, "unit": "count"
        },
        # Evidence for INC-012 (Elasticsearch Heap Pressure)
        {
            "id": "EVD-023", "incident_id": "INC-012", "source_type": "METRIC",
            "description": "JVM GC Old Generation collection duration spiked to 8,400ms on es-data-03 node.",
            "timestamp": (now - timedelta(hours=35, minutes=30)).isoformat(),
            "metric_name": "jvm_gc_collection_time_ms", "metric_value": 8400.0, "unit": "ms"
        },
        # Evidence for INC-013 (Replication Lag)
        {
            "id": "EVD-024", "incident_id": "INC-013", "source_type": "METRIC",
            "description": "PostgreSQL pg_stat_replication replay_lag spiked to 452 seconds.",
            "timestamp": (now - timedelta(hours=47, minutes=30)).isoformat(),
            "metric_name": "replication_lag_seconds", "metric_value": 452.0, "unit": "seconds"
        },
        # Evidence for INC-014 (Shipping Rate Limit)
        {
            "id": "EVD-025", "incident_id": "INC-014", "source_type": "LOG",
            "description": "CarrierGatewayClient: HTTP 429 Too Many Requests returned from FedEx API endpoint /rate/v1/rates",
            "timestamp": (now - timedelta(hours=51, minutes=40)).isoformat(),
            "metric_name": "http_429_count", "metric_value": 240.0, "unit": "count"
        },
        # Evidence for INC-015 (ReDoS on Discount Engine)
        {
            "id": "EVD-026", "incident_id": "INC-015", "source_type": "METRIC",
            "description": "CPU utilization hit 100% on all 6 discount engine replicas during evaluation of promo code pattern '^(A+)+B$'.",
            "timestamp": (now - timedelta(hours=59, minutes=45)).isoformat(),
            "metric_name": "cpu_utilization_percent", "metric_value": 100.0, "unit": "percent"
        },
        # Evidence for INC-017 (Payment Webhook Replay)
        {
            "id": "EVD-027", "incident_id": "INC-017", "source_type": "LOG",
            "description": "Duplicate payment idempotency key 'evt_charge_88192' processed twice within 120ms due to cache timeout.",
            "timestamp": (now - timedelta(hours=79, minutes=45)).isoformat(),
            "metric_name": "duplicate_charges_count", "metric_value": 14.0, "unit": "count"
        },
        # Evidence for INC-018 (Redis Cache Eviction Storm)
        {
            "id": "EVD-028", "incident_id": "INC-018", "source_type": "METRIC",
            "description": "Redis evicted_keys rate surged to 45,000 keys/sec during session load spike.",
            "timestamp": (now - timedelta(hours=95, minutes=40)).isoformat(),
            "metric_name": "evicted_keys_per_sec", "metric_value": 45000.0, "unit": "keys/sec"
        },
        # Evidence for INC-019 (Kafka Disk 92%)
        {
            "id": "EVD-029", "incident_id": "INC-019", "source_type": "ALERT",
            "description": "DiskSpaceAlert: Kafka Broker 2 volume /var/lib/kafka/data reached 92.4% capacity (1.84TB / 2.0TB).",
            "timestamp": (now - timedelta(hours=9, minutes=30)).isoformat(),
            "metric_name": "disk_used_percent", "metric_value": 92.4, "unit": "percent"
        },
        # Evidence for INC-021 (TLS Cert Handshake Failure)
        {
            "id": "EVD-030", "incident_id": "INC-021", "source_type": "LOG",
            "description": "SSLHandshakeException: PKIX path validation failed: unable to find valid certification path to requested target",
            "timestamp": (now - timedelta(hours=129, minutes=45)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        # Evidence for INC-022 (ALB Target Group Health Check Flap)
        {
            "id": "EVD-031", "incident_id": "INC-022", "source_type": "METRIC",
            "description": "AWS ALB UnHealthyHostCount rose from 0 to 4 in checkout-service target group.",
            "timestamp": (now - timedelta(hours=6, minutes=45)).isoformat(),
            "metric_name": "unhealthy_host_count", "metric_value": 4.0, "unit": "hosts"
        },
        # Additional supporting evidence across historical and active incidents (EVD-032 to EVD-070)
        {
            "id": "EVD-032", "incident_id": "INC-001", "source_type": "OBSERVATION",
            "description": "Downstream checkout completion rate plummeted by 78% within 10 minutes of payment latency spike.",
            "timestamp": (now - timedelta(minutes=48)).isoformat(),
            "metric_name": "checkout_success_rate", "metric_value": 22.0, "unit": "percent"
        },
        {
            "id": "EVD-033", "incident_id": "INC-002", "source_type": "LOG",
            "description": "Auth service connection timeout after 5000ms attempting to acquire Redis socket from pool.",
            "timestamp": (now - timedelta(hours=1, minutes=48)).isoformat(),
            "metric_name": "socket_timeout_ms", "metric_value": 5000.0, "unit": "ms"
        },
        {
            "id": "EVD-034", "incident_id": "INC-003", "source_type": "OBSERVATION",
            "description": "pg_stat_activity shows 1,850 connections in 'idle in transaction' state originating from billing webhook worker pods.",
            "timestamp": (now - timedelta(hours=2, minutes=40)).isoformat(),
            "metric_name": "idle_in_transaction_connections", "metric_value": 1850.0, "unit": "connections"
        },
        {
            "id": "EVD-035", "incident_id": "INC-005", "source_type": "LOG",
            "description": "org.apache.kafka.clients.consumer.CommitFailedException: Commit cannot be completed since the group has rebalanced.",
            "timestamp": (now - timedelta(hours=3, minutes=15)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        {
            "id": "EVD-036", "incident_id": "INC-009", "source_type": "ALERT",
            "description": "Checkout Orchestrator request queue backlog breached 1,500 waiting requests.",
            "timestamp": (now - timedelta(minutes=35)).isoformat(),
            "metric_name": "pending_request_queue", "metric_value": 1500.0, "unit": "requests"
        },
        {
            "id": "EVD-037", "incident_id": "INC-022", "source_type": "LOG",
            "description": "Target group health probe timed out after 5000ms on http://10.0.12.44:8080/health/ready",
            "timestamp": (now - timedelta(hours=6, minutes=40)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        {
            "id": "EVD-038", "incident_id": "INC-024", "source_type": "METRIC",
            "description": "Postgres lock wait time on table orders peaked at 240,000ms during ALTER TABLE statement.",
            "timestamp": (now - timedelta(hours=167, minutes=50)).isoformat(),
            "metric_name": "lock_wait_time_ms", "metric_value": 240000.0, "unit": "ms"
        },
        {
            "id": "EVD-039", "incident_id": "INC-027", "source_type": "METRIC",
            "description": "SMS provider dispatch queue average delivery latency rose to 18,200ms.",
            "timestamp": (now - timedelta(hours=7, minutes=40)).isoformat(),
            "metric_name": "sms_dispatch_latency_ms", "metric_value": 18200.0, "unit": "ms"
        },
        {
            "id": "EVD-040", "incident_id": "INC-029", "source_type": "ALERT",
            "description": "EKS NodeStatus: 4 worker nodes transitioned to NotReady state due to kubelet heartbeat timeout.",
            "timestamp": (now - timedelta(hours=239, minutes=45)).isoformat(),
            "metric_name": "unready_nodes_count", "metric_value": 4.0, "unit": "nodes"
        },
        {
            "id": "EVD-041", "incident_id": "INC-030", "source_type": "METRIC",
            "description": "AWS CloudHSM crypto operation latency rose from 18ms baseline to 465ms p95.",
            "timestamp": (now - timedelta(hours=259, minutes=30)).isoformat(),
            "metric_name": "hsm_operation_duration_ms", "metric_value": 465.0, "unit": "ms"
        },
        {
            "id": "EVD-042", "incident_id": "INC-032", "source_type": "LOG",
            "description": "JWT signature verification failed for algorithm HS256: SignatureVerificationException on baseline pods.",
            "timestamp": (now - timedelta(hours=299, minutes=45)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        {
            "id": "EVD-043", "incident_id": "INC-033", "source_type": "OBSERVATION",
            "description": "1,420 orders submitted with item prices discounted by 100% due to cached promotional edge response.",
            "timestamp": (now - timedelta(hours=319, minutes=30)).isoformat(),
            "metric_name": "anomalous_zero_dollar_orders", "metric_value": 1420.0, "unit": "orders"
        },
        {
            "id": "EVD-044", "incident_id": "INC-034", "source_type": "METRIC",
            "description": "Chrony NTP daemon offset measured at +3604.2 seconds on batch scheduler node.",
            "timestamp": (now - timedelta(hours=339, minutes=50)).isoformat(),
            "metric_name": "ntp_clock_offset_seconds", "metric_value": 3604.2, "unit": "seconds"
        },
        {
            "id": "EVD-045", "incident_id": "INC-035", "source_type": "METRIC",
            "description": "Fraud block rate jumped from normal 1.8% to 41.2% following new BIN range ingestion.",
            "timestamp": (now - timedelta(hours=359, minutes=40)).isoformat(),
            "metric_name": "fraud_block_rate_percent", "metric_value": 41.2, "unit": "percent"
        },
        {
            "id": "EVD-046", "incident_id": "INC-040", "source_type": "METRIC",
            "description": "3D Secure authentication drop-off rate reached 64% on mobile Safari checkouts.",
            "timestamp": (now - timedelta(hours=8, minutes=45)).isoformat(),
            "metric_name": "three_ds_dropoff_percent", "metric_value": 64.0, "unit": "percent"
        },
        {
            "id": "EVD-047", "incident_id": "INC-041", "source_type": "LOG",
            "description": "Puppeteer browser launcher error: ProtocolError (Target.createTarget): Target closed or Chromium crashed.",
            "timestamp": (now - timedelta(hours=10, minutes=40)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        {
            "id": "EVD-048", "incident_id": "INC-042", "source_type": "METRIC",
            "description": "Global edge rate limiter blocked 99.4% of all public HTTP traffic across all customer IP addresses.",
            "timestamp": (now - timedelta(hours=499, minutes=50)).isoformat(),
            "metric_name": "rate_limit_drop_rate_percent", "metric_value": 99.4, "unit": "percent"
        },
        {
            "id": "EVD-049", "incident_id": "INC-001", "source_type": "LOG",
            "description": "Payment authorization gateway socket write timeout after 10000ms calling external credit card network.",
            "timestamp": (now - timedelta(minutes=42)).isoformat(),
            "metric_name": "gateway_timeout_ms", "metric_value": 10000.0, "unit": "ms"
        },
        {
            "id": "EVD-050", "incident_id": "INC-002", "source_type": "METRIC",
            "description": "Redis memory usage steady at 4.2GB / 16GB, confirming connection leak rather than memory saturation.",
            "timestamp": (now - timedelta(hours=1, minutes=30)).isoformat(),
            "metric_name": "redis_memory_used_gb", "metric_value": 4.2, "unit": "GB"
        },
        {
            "id": "EVD-051", "incident_id": "INC-004", "source_type": "ALERT",
            "description": "AWS ALB 5XX error count surged past 4,500 errors per minute on public ingress.",
            "timestamp": (now - timedelta(hours=1, minutes=35)).isoformat(),
            "metric_name": "alb_http_5xx_rate", "metric_value": 4500.0, "unit": "errors/min"
        },
        {
            "id": "EVD-052", "incident_id": "INC-005", "source_type": "METRIC",
            "description": "Order processor pod CPU throttled by cgroups for 48% of total CPU cycles.",
            "timestamp": (now - timedelta(hours=3, minutes=5)).isoformat(),
            "metric_name": "cgroup_cpu_throttled_percent", "metric_value": 48.0, "unit": "percent"
        },
        {
            "id": "EVD-053", "incident_id": "INC-009", "source_type": "LOG",
            "description": "Checkout service circuit breaker to Payment API OPENED after 50 consecutive failed calls.",
            "timestamp": (now - timedelta(minutes=30)).isoformat(),
            "metric_name": "consecutive_failures", "metric_value": 50.0, "unit": "failures"
        },
        {
            "id": "EVD-054", "incident_id": "INC-011", "source_type": "METRIC",
            "description": "Inventory reservation checkout rollback count spiked to 340 rollbacks per minute.",
            "timestamp": (now - timedelta(hours=23, minutes=30)).isoformat(),
            "metric_name": "rollback_rate", "metric_value": 340.0, "unit": "rollbacks/min"
        },
        {
            "id": "EVD-055", "incident_id": "INC-012", "source_type": "LOG",
            "description": "org.elasticsearch.transport.RemoteTransportException: [es-data-03][10.0.8.12:9300][indices:data/read/search[phase/query]]",
            "timestamp": (now - timedelta(hours=35, minutes=15)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        {
            "id": "EVD-056", "incident_id": "INC-015", "source_type": "LOG",
            "description": "Regex evaluator timeout aborted thread after 10000ms executing coupon rule validator.",
            "timestamp": (now - timedelta(hours=59, minutes=30)).isoformat(),
            "metric_name": "regex_eval_duration_ms", "metric_value": 10000.0, "unit": "ms"
        },
        {
            "id": "EVD-057", "incident_id": "INC-017", "source_type": "ALERT",
            "description": "FinOps Audit Alert: Detected 14 duplicate transaction tokens in daily settlement ledger.",
            "timestamp": (now - timedelta(hours=79, minutes=15)).isoformat(),
            "metric_name": "ledger_discrepancy_count", "metric_value": 14.0, "unit": "items"
        },
        {
            "id": "EVD-058", "incident_id": "INC-018", "source_type": "LOG",
            "description": "SessionManager: JWT token session_id_99a8b could not be resolved from Redis cache cluster.",
            "timestamp": (now - timedelta(hours=95, minutes=20)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        {
            "id": "EVD-059", "incident_id": "INC-021", "source_type": "METRIC",
            "description": "Payment service outbound HTTPS connection failure rate spiked to 100% on Visa Direct routes.",
            "timestamp": (now - timedelta(hours=129, minutes=30)).isoformat(),
            "metric_name": "outbound_https_failure_rate", "metric_value": 100.0, "unit": "percent"
        },
        {
            "id": "EVD-060", "incident_id": "INC-024", "source_type": "LOG",
            "description": "Liquibase migration script db/changelog-v3.18.xml failed with StatementTimeoutException after 300s.",
            "timestamp": (now - timedelta(hours=167, minutes=30)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        {
            "id": "EVD-061", "incident_id": "INC-028", "source_type": "LOG",
            "description": "InventorySyncJob: UnicodeDecodeError 'utf-8' codec cannot decode byte 0x8a in position 45102: invalid start byte",
            "timestamp": (now - timedelta(hours=209, minutes=45)).isoformat(),
            "metric_name": None, "metric_value": None, "unit": None
        },
        {
            "id": "EVD-062", "incident_id": "INC-033", "source_type": "ALERT",
            "description": "Price Anomaly Detector: SKU-APPLE-IPHONE-16 listed at $0.00 in US-WEST edge cache region.",
            "timestamp": (now - timedelta(hours=319, minutes=15)).isoformat(),
            "metric_name": "anomalous_price", "metric_value": 0.0, "unit": "USD"
        },
        {
            "id": "EVD-063", "incident_id": "INC-042", "source_type": "LOG",
            "description": "WAF rate limit rule 'Global-Protection-R1' matched client IP 10.0.0.1 (ALB private IP) exceeding 100 req/min limit.",
            "timestamp": (now - timedelta(hours=499, minutes=30)).isoformat(),
            "metric_name": "throttled_requests_per_sec", "metric_value": 8500.0, "unit": "req/sec"
        },
        {
            "id": "EVD-064", "incident_id": "INC-003", "source_type": "METRIC",
            "description": "Billing webhook endpoint /v1/webhooks/billing unclosed connections accumulation rate: +45 conn/min.",
            "timestamp": (now - timedelta(hours=2, minutes=30)).isoformat(),
            "metric_name": "connection_leak_rate", "metric_value": 45.0, "unit": "conn/min"
        },
        {
            "id": "EVD-065", "incident_id": "INC-001", "source_type": "METRIC",
            "description": "Payment authorization queue depth in Payment Service spiked from 2 to 840 pending requests.",
            "timestamp": (now - timedelta(minutes=38)).isoformat(),
            "metric_name": "internal_queue_depth", "metric_value": 840.0, "unit": "requests"
        },
        {
            "id": "EVD-066", "incident_id": "INC-002", "source_type": "METRIC",
            "description": "Auth Service pod connection pool wait time average jumped from 1.2ms to 4,800ms.",
            "timestamp": (now - timedelta(hours=1, minutes=25)).isoformat(),
            "metric_name": "pool_wait_duration_ms", "metric_value": 4800.0, "unit": "ms"
        },
        {
            "id": "EVD-067", "incident_id": "INC-005", "source_type": "METRIC",
            "description": "Order processor Kafka batch processing duration rose to 45 seconds per batch.",
            "timestamp": (now - timedelta(hours=3, minutes=0)).isoformat(),
            "metric_name": "batch_processing_duration_seconds", "metric_value": 45.0, "unit": "seconds"
        },
        {
            "id": "EVD-068", "incident_id": "INC-010", "source_type": "LOG",
            "description": "Billing container disk alert: /tmp/gs_ghostscript_temp_8849.tmp reached 14GB without deletion.",
            "timestamp": (now - timedelta(hours=4, minutes=30)).isoformat(),
            "metric_name": "temp_file_size_gb", "metric_value": 14.0, "unit": "GB"
        }
    ]

    # 6. Resolutions (16 detailed records)
    resolutions = [
        {
            "id": "RES-001",
            "incident_id": "INC-007",
            "description": "Rolled back Fraud Detection Engine canary deployment from v2.4.1 to stable v2.4.0 via ArgoCD, and added null-check unit tests for guest checkout sessions.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=11, minutes=15)).isoformat()
        },
        {
            "id": "RES-002",
            "incident_id": "INC-008",
            "description": "Overrode local CoreDNS upstream resolution to bypass failing recursive DNS cache and configured static fallback resolver 1.1.1.1 / 8.8.8.8.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=17, minutes=30)).isoformat()
        },
        {
            "id": "RES-003",
            "incident_id": "INC-012",
            "description": "Doubled Elasticsearch JVM heap allocation from 16GB to 32GB and triggered shard rebalancing away from hot node es-data-03.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=35, minutes=0)).isoformat()
        },
        {
            "id": "RES-004",
            "incident_id": "INC-013",
            "description": "Cancelled intensive long-running vacuum operation on read replica and reconfigured wal_keep_size to 8GB to prevent replication lag stalls.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=47, minutes=0)).isoformat()
        },
        {
            "id": "RES-005",
            "incident_id": "INC-014",
            "description": "Implemented client-side Redis distributed rate limiter with local 60-second caching for carrier quote estimates, reducing outbound API calls by 85%.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=51, minutes=15)).isoformat()
        },
        {
            "id": "RES-006",
            "incident_id": "INC-015",
            "description": "Hot-patched coupon regex engine with re2 non-backtracking regex library and set maximum input length to 32 characters on promo codes.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=59, minutes=10)).isoformat()
        },
        {
            "id": "RES-007",
            "incident_id": "INC-016",
            "description": "Updated review spam classifier threshold from 0.70 to 0.88 and reprocessed 120 false-positive flagged reviews back into catalog.",
            "outcome": "SUCCESS",
            "effectiveness": "MEDIUM",
            "applied_at": (now - timedelta(hours=71, minutes=30)).isoformat()
        },
        {
            "id": "RES-008",
            "incident_id": "INC-017",
            "description": "Patched Payment API idempotency key lock using Redis Redlock with 24-hour TTL and executed automated credit adjustment batch for all 14 affected customer accounts.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=78, minutes=45)).isoformat()
        },
        {
            "id": "RES-009",
            "incident_id": "INC-018",
            "description": "Scaled Redis cluster from 3 shards to 6 shards and changed maxmemory-policy from volatile-lru to allkeys-lru with persistent key namespaces.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=95, minutes=0)).isoformat()
        },
        {
            "id": "RES-010",
            "incident_id": "INC-020",
            "description": "Rotated expired Apple Push Notification Service (APNs) p12 certificate in production secret vault and restarted notification pods.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=109, minutes=30)).isoformat()
        },
        {
            "id": "RES-011",
            "incident_id": "INC-021",
            "description": "Updated Java truststore cacerts with newly issued DigiCert Global Root G2 certificate and initiated rolling restart of Payment API pods.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=129, minutes=0)).isoformat()
        },
        {
            "id": "RES-012",
            "incident_id": "INC-023",
            "description": "Enforced discovery.zen.minimum_master_nodes = 2 in Elasticsearch cluster configuration and migrated master nodes to dedicated AZ quorum nodes.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=143, minutes=30)).isoformat()
        },
        {
            "id": "RES-013",
            "incident_id": "INC-024",
            "description": "Terminated blocking schema migration lock query, re-ran migration using pg-online-schema-change with lock_timeout = 2s, and added statement timeout guardrails.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=167, minutes=10)).isoformat()
        },
        {
            "id": "RES-014",
            "incident_id": "INC-028",
            "description": "Updated ERP ingestion parser to handle UTF-8 replacement characters on unprintable bytes and configured auto-quarantine for corrupted records.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=209, minutes=15)).isoformat()
        },
        {
            "id": "RES-015",
            "incident_id": "INC-033",
            "description": "Invalidated edge CDN cache tags globally via Cloudflare API, disabled zero-price checkout validation bypass, and contacted 38 customers regarding pricing error orders.",
            "outcome": "PARTIAL_SUCCESS",
            "effectiveness": "MEDIUM",
            "applied_at": (now - timedelta(hours=318, minutes=45)).isoformat()
        },
        {
            "id": "RES-016",
            "incident_id": "INC-042",
            "description": "Fixed API Gateway client IP resolution by configuring 'use_remote_address: true' and X-Forwarded-For header indexing, whitelisting VPC CIDR ranges.",
            "outcome": "SUCCESS",
            "effectiveness": "HIGH",
            "applied_at": (now - timedelta(hours=499, minutes=0)).isoformat()
        }
    ]

    # Save to data directory
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DATA_DIR / "services.json", "w", encoding="utf-8") as f:
        json.dump(services, f, indent=2)
    with open(DATA_DIR / "infrastructure.json", "w", encoding="utf-8") as f:
        json.dump(infrastructure, f, indent=2)
    with open(DATA_DIR / "dependencies.json", "w", encoding="utf-8") as f:
        json.dump(dependencies, f, indent=2)
    with open(DATA_DIR / "incidents.json", "w", encoding="utf-8") as f:
        json.dump(incidents, f, indent=2)
    with open(DATA_DIR / "evidence.json", "w", encoding="utf-8") as f:
        json.dump(evidence, f, indent=2)
    with open(DATA_DIR / "resolutions.json", "w", encoding="utf-8") as f:
        json.dump(resolutions, f, indent=2)

    print(f"Generated synthetic dataset successfully:")
    print(f"  Services: {len(services)}")
    print(f"  Infrastructure: {len(infrastructure)}")
    print(f"  Service Dependencies: {len(dependencies['service_dependencies'])}")
    print(f"  Infrastructure Connections: {len(dependencies['infrastructure_connections'])}")
    print(f"  Incidents: {len(incidents)}")
    print(f"  Evidence: {len(evidence)}")
    print(f"  Resolutions: {len(resolutions)}")

if __name__ == "__main__":
    generate()
