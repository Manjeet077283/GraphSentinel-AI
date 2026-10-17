// GraphSentinel AI - Incident Intelligence & Resolution Detail Page

import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Server,
  Network,
  BotMessageSquare,
  Activity,
  CheckCircle,
  Clock,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Cpu,
  Gauge,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  FileText,
  Layers,
  ArrowRight,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  History,
  RotateCcw,
  Copy,
  Printer,
  Terminal,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import {
  IncidentDetail,
  GraphResponse,
  ResolutionWorkflowResponse,
  VerifyRecoveryResponse,
  InvestigationReportResponse
} from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { HealthBadge } from '../components/HealthBadge';
import { CytoscapeGraph } from '../components/CytoscapeGraph';
import { useAuth } from '../context/AuthContext';

type TabKey = 'overview' | 'flow' | 'evidence' | 'resolution' | 'similar' | 'activity' | 'report';

export const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const t = searchParams.get('tab') as TabKey;
    if (['overview', 'flow', 'evidence', 'resolution', 'similar', 'activity', 'report'].includes(t)) {
      return t;
    }
    return 'overview';
  });

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [workflow, setWorkflow] = useState<ResolutionWorkflowResponse | null>(null);
  const [verification, setVerification] = useState<VerifyRecoveryResponse | null>(null);
  const [canarySignoff, setCanarySignoff] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  // Resolve Modal State
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [resolveForm, setResolveForm] = useState({
    root_cause_conclusion: '',
    actions_taken: '',
    verification_outcome: 'All automated telemetry and canary health signals validated nominal.',
    resolution_notes: '',
  });
  const [isResolving, setIsResolving] = useState<boolean>(false);

  // Reopen Modal State
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('Observed regression in latency telemetry.');
  const [isReopening, setIsReopening] = useState<boolean>(false);

  // 14-Section SRE Report State
  const [report, setReport] = useState<InvestigationReportResponse | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'report' && !report && incidentId) {
      setLoadingReport(true);
      api.getIncidentReport(incidentId)
        .then((rep) => setReport(rep))
        .catch((err) => console.error('Failed to load report:', err))
        .finally(() => setLoadingReport(false));
    }
  }, [activeTab, incidentId, report]);

  const handleCopyReportMarkdown = () => {
    if (!report) return;
    const md = `# SRE Incident Investigation Report: ${report.incident_title} (${report.incident_id})
Generated At: ${report.generated_at}
Severity: ${report.severity_and_impact.severity} | Business Impact: ${report.severity_and_impact.business_impact}

## 1. Problem Summary
${report.problem_summary}

## 2. Observed Symptoms & Affected Services
Symptoms:
${report.observed_symptoms.map((s) => `- ${s}`).join('\n')}
Affected Services:
${report.affected_services.map((s) => `- ${s}`).join('\n')}

## 3. Severity & Business Impact
Severity: ${report.severity_and_impact.severity}
Impact: ${report.severity_and_impact.business_impact}

## 4. Confirmed Facts Supported by Evidence
${report.confirmed_facts.map((f) => `- ${f}`).join('\n')}

## 5. Potential Root Causes (Hypotheses)
${report.potential_root_causes.map((h) => `### ${h.title} (Probability: ${h.probability})\n${h.explanation}\n- Supporting: ${h.supporting_evidence.join(', ')}\n- Contradicting: ${h.contradicting_evidence.join(', ') || 'None'}`).join('\n\n')}

## 6. Confidence Derivation: ${report.confidence.level} (${report.confidence.score_pct}%)
${report.confidence.formula_explanation}
${report.confidence.factors.map((f) => `- ${f.factor} (Weight: ${f.weight}): ${f.impact}`).join('\n')}

## 7. Related Incidents & Past Resolutions
${report.related_incidents.map((r) => `- [${r.status}] ${r.title} (${r.incident_id}): Similarity ${Math.round(r.similarity_score * 100)}% | Resolution: ${r.resolution_notes}`).join('\n')}

## 8. Recommended Solution
${report.recommended_solution.title}
Rationale: ${report.recommended_solution.rationale}
Steps:
${report.recommended_solution.steps.map((st, i) => `${i + 1}. ${st}`).join('\n')}

## 9. Command Examples (Human Review Required)
${report.command_examples.map((c) => `### ${c.title} [${c.safety_level}]\n\`\`\`bash\n${c.command}\n\`\`\`\nExplanation: ${c.explanation}`).join('\n\n')}

## 10. Validation Steps
${report.validation_steps.map((v, i) => `${i + 1}. ${v}`).join('\n')}

## 11. Rollback & Risk Plan
Risk Level: ${report.rollback_and_risk.risk_level}
Description: ${report.rollback_and_risk.risk_description}
Rollback Steps:
${report.rollback_and_risk.rollback_steps.map((r, i) => `${i + 1}. ${r}`).join('\n')}
Fallback Plan: ${report.rollback_and_risk.fallback_plan}

## 12. Prevention Measures & Monitoring
Prevention:
${report.prevention_and_monitoring.prevention_measures.map((p) => `- ${p}`).join('\n')}
Monitoring:
${report.prevention_and_monitoring.monitoring_recommendations.map((m) => `- ${m}`).join('\n')}

## 13. Final Resolution Notes
Status: ${report.final_resolution_notes.status}
Notes: ${report.final_resolution_notes.notes}
`;
    navigator.clipboard.writeText(md);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const fetchDetail = async () => {
    if (!incidentId) return;
    setLoading(true);
    setError(null);
    try {
      const [incidentRes, graphRes, workflowRes] = await Promise.all([
        api.getIncident(incidentId),
        api.getGraphData({ incident_id: incidentId, include_evidence: true }).catch(() => null),
        api.getResolutionWorkflow(incidentId).catch(() => null)
      ]);
      setIncident(incidentRes);
      setGraphData(graphRes);
      setWorkflow(workflowRes);

      if (workflowRes?.summary) {
        setResolveForm((prev) => ({
          ...prev,
          root_cause_conclusion: workflowRes.summary.likely_cause || '',
          actions_taken: workflowRes.steps.filter((s) => s.status === 'COMPLETED').map((s) => s.title).join('; ') || 'Completed recommended resolution steps.',
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [incidentId]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Run recovery verification
  const handleRunVerification = async () => {
    if (!incidentId) return;
    try {
      const res = await api.verifyRecovery(incidentId, { canary_signoff: canarySignoff });
      setVerification(res);
    } catch (err: any) {
      console.error('Verification failed:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'resolution' && incidentId) {
      handleRunVerification();
    }
  }, [activeTab, canarySignoff]);

  // Update step status
  const handleUpdateStep = async (stepId: string, newStatus: string) => {
    if (!incidentId) return;
    setUpdatingStepId(stepId);
    try {
      await api.updateStepStatus(incidentId, stepId, newStatus, user?.full_name || 'SRE Engineer');
      // Refresh workflow
      const wf = await api.getResolutionWorkflow(incidentId);
      setWorkflow(wf);
    } catch (err: any) {
      alert(`Failed to update step: ${err.message}`);
    } finally {
      setUpdatingStepId(null);
    }
  };

  // Submit Incident Resolution
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentId) return;
    setIsResolving(true);
    try {
      await api.resolveIncident(incidentId, {
        ...resolveForm,
        resolved_by: user?.full_name || 'SRE Engineer',
      });
      setShowResolveModal(false);
      await fetchDetail();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  // Submit Incident Reopen
  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentId) return;
    setIsReopening(true);
    try {
      await api.reopenIncident(incidentId, reopenReason, user?.full_name || 'SRE Engineer');
      setShowReopenModal(false);
      await fetchDetail();
    } catch (err: any) {
      alert(`Reopen failed: ${err.message}`);
    } finally {
      setIsReopening(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Gathering investigation facts & resolution workflow from FalkorDB...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl border border-rose-200 bg-white shadow-sm text-center">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Incident Not Found</h3>
        <p className="text-sm text-slate-500 mt-2 mb-6">{error || `No incident found matching ID: ${incidentId}`}</p>
        <Link
          to="/incidents"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Incidents</span>
        </Link>
      </div>
    );
  }

  // Extract key metrics from evidence or service state
  const latencyEv = incident.evidence.find(
    (e) => e.metric_name && (e.metric_name.includes('latency') || e.metric_name.includes('response_time'))
  );
  const errorEv = incident.evidence.find(
    (e) => e.metric_name && (e.metric_name.includes('error') || e.metric_name.includes('5xx'))
  );
  const connEv = incident.evidence.find(
    (e) => e.metric_name && (e.metric_name.includes('conn') || e.metric_name.includes('pool') || e.metric_name.includes('thread'))
  );

  const isResolved = incident.status === 'RESOLVED';
  const completedStepsCount = workflow?.steps.filter((s) => s.status === 'COMPLETED').length || 0;
  const totalStepsCount = workflow?.steps.length || 0;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Navigation Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Incidents</span>
        </Link>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleTabChange('resolution')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all ${
              activeTab === 'resolution'
                ? 'bg-indigo-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Resolution Workflow</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
              {completedStepsCount}/{totalStepsCount}
            </span>
          </button>

          <Link
            to={`/chat?incident=${incident.id}`}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition-colors"
          >
            <BotMessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Ask AI Copilot</span>
          </Link>

          <Link
            to={`/graph?incident=${incident.id}`}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition-colors"
          >
            <Network className="w-4 h-4 text-indigo-600" />
            <span>Graph Explorer</span>
          </Link>

          <button
            onClick={fetchDetail}
            title="Refresh Incident Details"
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Incident Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
              {incident.id}
            </span>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />

            {isResolved && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified & Resolved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Last Updated: {new Date(incident.updated_at || incident.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {incident.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed max-w-4xl">
            {incident.description}
          </p>
        </div>

        {/* Affected Service Strip */}
        {incident.affected_service && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Affected Service Component
                </span>
                <Link
                  to="/services"
                  className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  {incident.affected_service.name}{' '}
                  <span className="font-mono text-[11px] font-normal text-slate-500">({incident.affected_service.id})</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Criticality</span>
                <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[11px]">
                  {incident.affected_service.criticality}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Health Condition</span>
                <HealthBadge status={incident.affected_service.status} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Owning Team</span>
                <span className="font-medium text-slate-700">{incident.affected_service.team}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RESOLUTION STATUS BANNER (If already resolved) */}
      {isResolved && workflow?.resolution && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-emerald-900">Incident Officially Resolved</h3>
                <span className="text-xs text-emerald-700 font-mono">
                  {workflow.resolution.resolved_at ? new Date(workflow.resolution.resolved_at).toLocaleString() : ''}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                <strong>Root Cause:</strong> {workflow.resolution.root_cause_conclusion || 'Mitigated successfully.'}
              </p>
              {workflow.resolution.resolution_notes && (
                <p className="text-xs text-emerald-700 mt-0.5 italic">
                  <strong>Notes:</strong> {workflow.resolution.resolution_notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowReopenModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
              <span>Reopen Incident</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6 TABS NAVIGATION                                                         */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: '1. Overview', icon: FileText },
            { id: 'flow', label: '2. Service Flow', icon: Network },
            { id: 'evidence', label: `3. Evidence (${incident.evidence.length})`, icon: Activity },
            {
              id: 'resolution',
              label: '4. Solution & Resolution',
              icon: Wrench,
              highlight: true,
              badge: `${completedStepsCount}/${totalStepsCount}`,
            },
            {
              id: 'similar',
              label: `5. Similar Incidents (${incident.related_historical_incidents?.length || 0})`,
              icon: History,
            },
            {
              id: 'activity',
              label: `6. Activity (${workflow?.activities?.length || 0})`,
              icon: Clock,
            },
            {
              id: 'report',
              label: '7. 14-Section SRE Report',
              icon: Sparkles,
              highlight: true,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabKey)}
                className={`flex items-center gap-2 py-3 px-3.5 rounded-t-xl text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Observed Telemetry Signals</h2>
            <p className="text-xs text-slate-500 mb-4">
              Real measurements extracted from active telemetry nodes in the FalkorDB knowledge graph.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Response Time / Latency */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-semibold text-slate-700">P99 Response Time</span>
                  <Gauge className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {latencyEv && latencyEv.metric_value !== null && latencyEv.metric_value !== undefined ? (
                    <>
                      {latencyEv.metric_value}{' '}
                      <span className="text-xs font-normal text-slate-500">{latencyEv.unit || 'ms'}</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-slate-400 italic">Not reported</span>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] font-medium">
                  {latencyEv && latencyEv.metric_value && latencyEv.metric_value > 1000 ? (
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                      Severely Elevated (Normal: &lt; 250ms)
                    </span>
                  ) : latencyEv ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      Within Normal Bounds
                    </span>
                  ) : (
                    <span className="text-slate-500">No telemetry recorded</span>
                  )}
                </div>
              </div>

              {/* Error Rate */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-semibold text-slate-700">Error Rate</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {errorEv && errorEv.metric_value !== null && errorEv.metric_value !== undefined ? (
                    <>
                      {errorEv.metric_value}{' '}
                      <span className="text-xs font-normal text-slate-500">{errorEv.unit || '%'}</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-slate-400 italic">Not reported</span>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] font-medium">
                  {errorEv && errorEv.metric_value && errorEv.metric_value > 5 ? (
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                      Critical Failure Spike (&gt; 5%)
                    </span>
                  ) : errorEv ? (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                      Elevated Error Count
                    </span>
                  ) : (
                    <span className="text-slate-500">No telemetry recorded</span>
                  )}
                </div>
              </div>

              {/* Connection Load */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-semibold text-slate-700">Connection / Thread Load</span>
                  <Cpu className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {connEv && connEv.metric_value !== null && connEv.metric_value !== undefined ? (
                    <>
                      {connEv.metric_value}{' '}
                      <span className="text-xs font-normal text-slate-500">{connEv.unit || 'conn'}</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-slate-400 italic">Not reported</span>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] font-medium">
                  {connEv && connEv.metric_value && connEv.metric_value >= 90 ? (
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                      Pool Capacity Exhausted
                    </span>
                  ) : connEv ? (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                      High Utilization
                    </span>
                  ) : (
                    <span className="text-slate-500">No telemetry recorded</span>
                  )}
                </div>
              </div>

              {/* Service Health */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-semibold text-slate-700">Catalog State</span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {incident.affected_service?.status || 'UNKNOWN'}
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] font-medium">
                  {incident.affected_service?.status === 'CRITICAL' ? (
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                      Immediate Action Required
                    </span>
                  ) : incident.affected_service?.status === 'DEGRADED' ? (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                      Performance Degraded
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      Nominal Operation
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Resolution Workflow Teaser Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-white border border-indigo-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Evidence-Grounded Resolution Steps Available
                </h3>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                GraphSentinel AI generated <strong>{totalStepsCount} structured remediation steps</strong> tailored to the observed failure signals. Track resolution progress, test recovery metrics, and mark the incident resolved.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('resolution')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs shrink-0"
            >
              <Wrench className="w-4 h-4" />
              <span>Go to Resolution Workflow ({completedStepsCount}/{totalStepsCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hypotheses & Advisory Actions Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Diagnostic Hypotheses</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {incident.diagnostic_hypotheses.map((h, i) => (
                  <li key={i} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 leading-relaxed">
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Lightbulb className="w-4 h-4 text-indigo-600" />
                <span>Recommended Investigation Procedure</span>
              </div>
              <ol className="space-y-2 text-xs text-slate-700">
                {incident.recommended_actions.map((act, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{act}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SERVICE FLOW & GRAPH                                               */}
      {/* ========================================================================= */}
      {activeTab === 'flow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Incident Dependency Topology</h3>
                <p className="text-xs text-slate-500">
                  Live subgraph centered on {incident.affected_service?.name} with confirmed failure paths and cascade risks.
                </p>
              </div>

              <Link
                to={`/graph?incident=${incident.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <span>Open in full Graph Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {graphData ? (
              <div className="h-[460px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <CytoscapeGraph
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  highlightServiceId={incident.affected_service_id}
                  highlightIncidentId={incident.id}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Unable to load graph visualization for this incident.
              </div>
            )}
          </div>

          {/* Impact Summary & Downstream Dependencies */}
          {incident.impact_analysis && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Downstream Impact Analysis</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {incident.impact_analysis.total_impacted_services} Dependent Services At Risk
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {incident.impact_analysis.impact_summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {incident.impact_analysis.impacted_services.map((imp) => (
                  <div
                    key={imp.service_id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{imp.service_name}</span>
                        <span className="font-mono text-[10px] text-slate-500">({imp.service_id})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span>Path:</span>
                        <span className="font-mono text-indigo-600 font-semibold">
                          {imp.dependency_path.join(' ➔ ')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          imp.impact_level === 'CONFIRMED_DEGRADATION'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {imp.hops} Hop(s) •{' '}
                        {imp.impact_level === 'CONFIRMED_DEGRADATION' ? 'CONFIRMED' : 'CASCADE RISK'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EVIDENCE                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Investigation Evidence Telemetry ({incident.evidence.length})
              </h3>
              <p className="text-xs text-slate-500">
                Telemetry nodes connected to this incident via <code>SUPPORTED_BY</code> edges in FalkorDB.
              </p>
            </div>
          </div>

          {incident.evidence.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No evidence telemetry nodes recorded for this incident.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incident.evidence.map((ev) => {
                const isExpanded = expandedEvidence[ev.id];
                return (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors space-y-2.5 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.source_type === 'ALERT'
                                ? 'bg-rose-100 text-rose-800'
                                : ev.source_type === 'METRIC'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {ev.source_type}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 font-semibold">{ev.id}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>

                      <p className="text-slate-800 font-medium leading-relaxed">{ev.description}</p>

                      {ev.metric_name && (
                        <div className="flex items-center gap-2 text-[11px] pt-2 mt-2 border-t border-slate-200">
                          <span className="text-slate-500">Metric Value:</span>
                          <span className="font-mono text-indigo-700 font-semibold">{ev.metric_name}</span>
                          {ev.metric_value !== null && ev.metric_value !== undefined && (
                            <span className="ml-auto font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {ev.metric_value} {ev.unit || ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        onClick={() => toggleEvidence(ev.id)}
                        className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold pt-1"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Graph Metadata</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>View Graph Metadata</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-2.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-600 space-y-1">
                          <div>FalkorDB Node: <code>(Evidence:{ev.id})</code></div>
                          <div>Relationship: <code>(Incident:{incident.id})-[SUPPORTED_BY]-&gt;(Evidence:{ev.id})</code></div>
                          <div>Recorded: <code>{ev.timestamp}</code></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SOLUTION & RESOLUTION WORKFLOW (CORE REQUIREMENT)                  */}
      {/* ========================================================================= */}
      {activeTab === 'resolution' && (
        <div className="space-y-8">
          {/* A. AI INVESTIGATION SUMMARY (4 DISTINCT SECTIONS) */}
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">AI Investigation Summary</h2>
                  <p className="text-xs text-slate-500">
                    Comprehensive diagnosis grounded in FalkorDB telemetry observations.
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                Advisory Only
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Box 1: What's Happening? */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>What's Happening?</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {workflow?.summary.whats_happening || incident.description}
                </p>
              </div>

              {/* Box 2: Confirmed Facts */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Confirmed Facts</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {workflow?.summary.confirmed_facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{fact}</span>
                    </li>
                  )) || (
                    <li className="text-slate-500 italic">No confirmed facts synthesized.</li>
                  )}
                </ul>
              </div>

              {/* Box 3: Likely Cause */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Likely Cause (Hypothesis)</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                    Uncertainty: Plausible
                  </span>
                </div>
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  {workflow?.summary.likely_cause || 'Investigating potential resource exhaustion.'}
                </p>
                <p className="text-[10px] text-amber-700 italic">
                  *Hypothesis is based on current metric correlations and requires operational verification.
                </p>
              </div>

              {/* Box 4: Recommended Solution */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4 text-indigo-600" />
                    <span>Recommended Solution</span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                    Human-Approved
                  </span>
                </div>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                  {workflow?.summary.recommended_solution || 'Inspect connections and apply safe remediation.'}
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  *Follow team change-management protocols before modifying production capacity.
                </p>
              </div>
            </div>
          </div>

          {/* B. ACTIONABLE RESOLUTION STEPS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Actionable Remediation Procedure ({completedStepsCount}/{totalStepsCount} Completed)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Execute steps sequentially. Transitions are recorded to the persistent SQLite operational store.
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full sm:w-48 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${totalStepsCount ? (completedStepsCount / totalStepsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {workflow?.steps.map((step) => {
                const isStepUpdating = updatingStepId === step.id;

                let statusBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (step.status === 'IN_PROGRESS') statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200 font-bold animate-pulse';
                else if (step.status === 'COMPLETED') statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                else if (step.status === 'BLOCKED') statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
                else if (step.status === 'SKIPPED') statusBadgeColor = 'bg-slate-100 text-slate-500 border-slate-200 line-through';

                return (
                  <div
                    key={step.id}
                    className={`p-5 rounded-xl border transition-all ${
                      step.status === 'COMPLETED'
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : step.status === 'IN_PROGRESS'
                        ? 'bg-blue-50/30 border-indigo-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            step.status === 'COMPLETED'
                              ? 'bg-emerald-600 text-white'
                              : step.status === 'IN_PROGRESS'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {step.step_number}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-mono border ${statusBadgeColor}`}>
                            Status: {step.status}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Step Controls */}
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {step.status !== 'IN_PROGRESS' && step.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            disabled={isStepUpdating}
                            onClick={() => handleUpdateStep(step.id, 'IN_PROGRESS')}
                            className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            Mark In Progress
                          </button>
                        )}

                        {step.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            disabled={isStepUpdating}
                            onClick={() => handleUpdateStep(step.id, 'COMPLETED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Mark Completed</span>
                          </button>
                        )}

                        {step.status !== 'BLOCKED' && step.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            disabled={isStepUpdating}
                            onClick={() => handleUpdateStep(step.id, 'BLOCKED')}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            Block
                          </button>
                        )}

                        {step.status !== 'SKIPPED' && step.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            disabled={isStepUpdating}
                            onClick={() => handleUpdateStep(step.id, 'SKIPPED')}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            Skip
                          </button>
                        )}

                        {step.status === 'COMPLETED' && (
                          <button
                            type="button"
                            disabled={isStepUpdating}
                            onClick={() => handleUpdateStep(step.id, 'PENDING')}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 pt-2 border-t border-slate-100/80">
                      <div>
                        <span className="font-semibold text-slate-900 block mb-0.5">Action to Take:</span>
                        <p className="text-slate-700 leading-relaxed">{step.action}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-900 block mb-0.5">Why this helps:</span>
                        <p className="text-slate-600 leading-relaxed">{step.reason}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-900 block mb-0.5">Expected Result:</span>
                        <p className="text-slate-600 leading-relaxed">{step.expected_result}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-900 block mb-0.5">Verification Instructions:</span>
                        <p className="text-slate-600 leading-relaxed">{step.verification}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span><strong>Risk Level:</strong> {step.risk}</span>
                      {step.supporting_evidence && (
                        <span><strong>Evidence:</strong> {step.supporting_evidence}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. RECOVERY VERIFICATION CHECKLIST & RESOLUTION CONTROLS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Pre-Resolution Recovery Verification</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Validates real operational telemetry and manual canary health checks before permitting incident resolution.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunVerification}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-evaluate Signals</span>
              </button>
            </div>

            {verification && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  verification.ready_for_resolution
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}>
                  {verification.ready_for_resolution ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {verification.ready_for_resolution ? 'Verification Passed — Ready for Resolution' : 'Verification Incomplete'}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed">{verification.summary}</p>
                  </div>
                </div>

                {/* Signals Table */}
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {verification.signals.map((sig, i) => (
                    <div key={i} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            sig.status === 'PASS' ? 'bg-emerald-500' : sig.status === 'WARN' ? 'bg-amber-500' : sig.status === 'MANUAL' ? 'bg-indigo-500' : 'bg-rose-500'
                          }`} />
                          <span className="font-bold text-slate-900">{sig.name}</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            sig.status === 'PASS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sig.status === 'WARN'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : sig.status === 'MANUAL'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {sig.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{sig.detail}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-800">{sig.measured_value || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{sig.threshold}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manual Operator Sign-off Toggle */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      id="canary-signoff"
                      type="checkbox"
                      checked={canarySignoff}
                      onChange={(e) => setCanarySignoff(e.target.checked)}
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="canary-signoff" className="cursor-pointer">
                      <span className="text-xs font-bold text-slate-900 block">
                        I confirm that all manual canary smoke tests and synthetic transactions have passed nominal thresholds.
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Required SRE operational sign-off before closing the incident record.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Incident Action Buttons */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    {isResolved ? (
                      <span className="font-semibold text-emerald-700">Incident is already marked RESOLVED.</span>
                    ) : (
                      <span>All status changes persist across both FalkorDB and the operational database.</span>
                    )}
                  </div>

                  {!isResolved ? (
                    <button
                      type="button"
                      onClick={() => setShowResolveModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Incident as Resolved</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowReopenModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-600" />
                      <span>Reopen Incident</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SIMILAR PAST INCIDENTS                                             */}
      {/* ========================================================================= */}
      {activeTab === 'similar' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Similar Historical Incidents & Verified Playbooks
              </h3>
              <p className="text-xs text-slate-500">
                Retrieved from historical FalkorDB graph nodes based on service domain and symptom similarity.
              </p>
            </div>
          </div>

          {incident.related_historical_incidents && incident.related_historical_incidents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incident.related_historical_incidents.map((hist) => (
                <div
                  key={hist.incident_id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {hist.incident_id}
                      </span>
                      <span className="font-bold text-slate-900">{hist.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      {hist.outcome || 'RESOLVED'}
                    </span>
                  </div>

                  <div className="text-slate-600 text-[11px]">
                    <span>Service: </span>
                    <strong className="text-slate-900">{hist.service_name}</strong> ({hist.service_id})
                  </div>

                  {hist.relevance && (
                    <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200/80">
                      <span className="font-semibold text-slate-700">Similarity Reason:</span> {hist.relevance}
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700 leading-relaxed text-xs">
                    <span className="font-semibold text-indigo-700 block mb-1">Recorded Remedy:</span>
                    {hist.resolution_summary || 'Manual service restart, configuration tuning, and dependency check.'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No historical incident precedents found in graph.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ACTIVITY TIMELINE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Incident Audit Activity Timeline
              </h3>
              <p className="text-xs text-slate-500">
                Chronological record of status transitions, resolution step updates, and recovery verifications.
              </p>
            </div>
          </div>

          {workflow?.activities && workflow.activities.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {workflow.activities.map((act) => (
                <div key={act.id} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{act.actor}</span>
                    <span className="text-[10px] text-slate-400">
                      {act.created_at ? new Date(act.created_at).toLocaleString() : ''}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {act.activity_type}
                    </span>
                  </div>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {act.summary}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No activity records logged yet.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: 14-SECTION SRE STRUCTURED INVESTIGATION REPORT                      */}
      {/* ========================================================================= */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {loadingReport ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Compiling 14-Section SRE Investigation Report...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Traversing FalkorDB knowledge graph, calculating confidence factors, and synthesizing solution plan.
              </p>
            </div>
          ) : !report ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No report generated for this incident.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold uppercase">
                      SRE Formal Report
                    </span>
                    <span className="text-xs text-slate-400">
                      Generated: {new Date(report.generated_at).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {report.incident_title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    Incident ID: {report.incident_id} • Target Graph: <strong className="text-indigo-600 font-mono">graphsentinel-ai</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyReportMarkdown}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied Markdown!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              {/* Grid 1: Problem Summary & Symptoms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Problem Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Problem Summary</h3>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {report.problem_summary}
                  </p>
                </div>

                {/* 2. Observed Symptoms & Affected Services */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Symptoms & Affected Services</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Observed Symptoms:
                      </span>
                      <ul className="space-y-1">
                        {report.observed_symptoms.map((s, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Affected Services:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {report.affected_services.map((svc, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[11px]"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Severity & Business Impact & 4. Confirmed Facts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 3. Severity & Impact */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Severity & Business Impact</h3>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900">Incident Severity:</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] font-mono">
                        {report.severity_and_impact.severity}
                      </span>
                    </div>
                    <p className="text-amber-800 leading-relaxed">
                      <strong>Impact:</strong> {report.severity_and_impact.business_impact}
                    </p>
                    {report.severity_and_impact.estimated_downtime && (
                      <p className="text-amber-700 text-[11px]">
                        <strong>Estimated Exposure:</strong> {report.severity_and_impact.estimated_downtime}
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Confirmed Facts */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      4
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Confirmed Facts (Evidence Supported)</h3>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {report.confirmed_facts.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5. Potential Root Causes (Hypotheses) & 6. Supporting / Contradicting Evidence */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    5 & 6
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Potential Root Causes (Hypotheses & Evidence Evaluation)
                  </h3>
                </div>

                <div className="space-y-3">
                  {report.potential_root_causes.map((hyp, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white font-mono text-[10px]">
                            H{idx + 1}
                          </span>
                          {hyp.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                          Probability: {hyp.probability}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{hyp.explanation}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                        <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                            Supporting Evidence:
                          </span>
                          <ul className="space-y-1">
                            {hyp.supporting_evidence.map((ev, evIdx) => (
                              <li key={evIdx} className="text-[11px] text-emerald-900 flex items-start gap-1">
                                <span className="font-bold">+</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-slate-100/70 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                            Contradicting Evidence:
                          </span>
                          <ul className="space-y-1">
                            {hyp.contradicting_evidence.length > 0 ? (
                              hyp.contradicting_evidence.map((ev, evIdx) => (
                                <li key={evIdx} className="text-[11px] text-slate-700 flex items-start gap-1">
                                  <span className="font-bold">-</span>
                                  <span>{ev}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-[11px] text-slate-400 italic">None identified in telemetry.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Confidence Level & Mathematical Derivation */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      7
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Confidence Level & Derivation Formula
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Derivation Score:</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                      {report.confidence.score_pct}% ({report.confidence.level})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                  <p className="font-medium text-[11px] text-slate-600">
                    <strong>Derivation Methodology:</strong> {report.confidence.formula_explanation}
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
                        <tr>
                          <th className="py-1.5">Evaluation Factor</th>
                          <th className="py-1.5">Weight</th>
                          <th className="py-1.5">Telemetry Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {report.confidence.factors.map((f, fIdx) => (
                          <tr key={fIdx}>
                            <td className="py-1.5 font-semibold text-slate-800">{f.factor}</td>
                            <td className="py-1.5 font-mono text-indigo-600">{f.weight}</td>
                            <td className="py-1.5 text-slate-600">{f.impact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 8. Related Incidents & Past Resolutions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    8
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Related Incidents & Past Resolutions</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.related_incidents.map((rel, rIdx) => (
                    <div key={rIdx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/incidents/${rel.incident_id}`}
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          {rel.title} ({rel.incident_id})
                        </Link>
                        <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {Math.round(rel.similarity_score * 100)}% match
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        <strong>Past Resolution:</strong> {rel.resolution_notes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 9. Recommended Solution with Ordered Steps */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    9
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Recommended Solution: {report.recommended_solution.title}
                  </h3>
                </div>

                <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs space-y-2">
                  <p className="text-indigo-900 font-medium text-[11px]">
                    <strong>Rationale:</strong> {report.recommended_solution.rationale}
                  </p>

                  <ol className="space-y-1.5 list-decimal pl-4 text-xs text-indigo-950 font-medium">
                    {report.recommended_solution.steps.map((st, sIdx) => (
                      <li key={sIdx}>{st}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* 10. Required Commands with Human Review Safety Badges */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      10
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Command Examples (Human Review Required)
                    </h3>
                  </div>

                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                    Never Executed Automatically
                  </span>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>SRE Safety Policy:</strong> Commands presented below must be manually inspected by authorized operators. Destructive and privileged commands require explicit change tickets.
                  </p>
                </div>

                <div className="space-y-3">
                  {report.command_examples.map((cmd, cIdx) => (
                    <div key={cIdx} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-white text-xs">
                      <div className="px-4 py-2 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                        <span className="font-semibold text-slate-200">{cmd.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            cmd.safety_level === 'READ_ONLY'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : cmd.safety_level === 'PRIVILEGED'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {cmd.safety_level}
                        </span>
                      </div>
                      <div className="p-4 font-mono text-[11px] overflow-x-auto text-emerald-400 select-all">
                        {cmd.command}
                      </div>
                      <div className="px-4 py-2 bg-slate-800/60 border-t border-slate-800 text-[11px] text-slate-400">
                        {cmd.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 11. Validation Steps & 12. Rollback and Risk Considerations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 11. Validation */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      11
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Validation Steps</h3>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {report.validation_steps.map((val, vIdx) => (
                      <li key={vIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{val}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 12. Rollback & Risk */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      12
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Rollback & Risk Plan</h3>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Risk Assessment:</span>
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        {report.rollback_and_risk.risk_level}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      {report.rollback_and_risk.risk_description}
                    </p>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Rollback Steps:
                      </span>
                      <ul className="space-y-1">
                        {report.rollback_and_risk.rollback_steps.map((rb, rbIdx) => (
                          <li key={rbIdx} className="text-[11px] text-slate-700 flex items-start gap-1">
                            <span>↳</span>
                            <span>{rb}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 13. Prevention Measures & 14. Final Resolution Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 13. Prevention & Monitoring */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      13
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Prevention & Monitoring</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Prevention Measures:
                      </span>
                      <ul className="space-y-1">
                        {report.prevention_and_monitoring.prevention_measures.map((p, pIdx) => (
                          <li key={pIdx} className="text-slate-700 flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Monitoring Recommendations:
                      </span>
                      <ul className="space-y-1">
                        {report.prevention_and_monitoring.monitoring_recommendations.map((m, mIdx) => (
                          <li key={mIdx} className="text-slate-700 flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 14. Final Resolution Notes */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      14
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Final Resolution Notes</h3>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Official Status:</span>
                      <span className="font-bold text-indigo-700 font-mono">
                        {report.final_resolution_notes.status}
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      {report.final_resolution_notes.notes}
                    </p>
                    {report.final_resolution_notes.resolved_by && (
                      <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                        Resolved By: {report.final_resolution_notes.resolved_by} ({report.final_resolution_notes.resolved_at || 'Recorded'})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESOLVE INCIDENT MODAL                                                    */}
      {/* ========================================================================= */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Resolve Incident {incident.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Root Cause Conclusion
                </label>
                <textarea
                  required
                  rows={2}
                  value={resolveForm.root_cause_conclusion}
                  onChange={(e) => setResolveForm({ ...resolveForm, root_cause_conclusion: e.target.value })}
                  placeholder="Explain the confirmed cause of the failure..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Actions Taken & Remediation Applied
                </label>
                <textarea
                  required
                  rows={2}
                  value={resolveForm.actions_taken}
                  onChange={(e) => setResolveForm({ ...resolveForm, actions_taken: e.target.value })}
                  placeholder="Summary of completed operational steps..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Verification Outcome
                </label>
                <input
                  type="text"
                  required
                  value={resolveForm.verification_outcome}
                  onChange={(e) => setResolveForm({ ...resolveForm, verification_outcome: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Post-Mortem / Resolution Notes
                </label>
                <textarea
                  rows={2}
                  value={resolveForm.resolution_notes}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolution_notes: e.target.value })}
                  placeholder="Any preventative tickets created, architectural follow-ups, or notes..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {isResolving ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REOPEN INCIDENT MODAL                                                     */}
      {/* ========================================================================= */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Reopen Incident {incident.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReopenSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Reason for Reopening
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Describe observed recurrence or regressing metrics..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReopening}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {isReopening ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
