import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowRight,
  Trash2,
  Eye,
  RefreshCw,
  Info,
  ShieldCheck,
  Check,
  X,
  FileCheck2,
  Table,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import {
  UploadPreviewResponse,
  DatasetSummary,
  DatasetRecordItem,
  ProvenanceSummaryResponse
} from '../types';

export const DataWorkspacePage: React.FC = () => {
  // Provenance breakdown
  const [provenance, setProvenance] = useState<ProvenanceSummaryResponse | null>(null);

  // Datasets list
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState<boolean>(true);

  // File upload & preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<UploadPreviewResponse | null>(null);

  // Column mapping & import configuration
  const [datasetName, setDatasetName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [deduplicate, setDeduplicate] = useState<boolean>(true);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Record inspector modal
  const [inspectingDataset, setInspectingDataset] = useState<DatasetSummary | null>(null);
  const [records, setRecords] = useState<DatasetRecordItem[]>([]);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [recordsFilter, setRecordsFilter] = useState<'all' | 'valid' | 'rejected'>('all');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoadingDatasets(true);
    try {
      const [provRes, dataRes] = await Promise.all([
        api.getProvenance().catch(() => null),
        api.getDatasets().catch(() => []),
      ]);
      if (provRes) setProvenance(provRes);
      setDatasets(dataRes);
    } finally {
      setLoadingDatasets(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
    setPreview(null);
    setImportSuccess(null);
    setUploading(true);

    try {
      const res = await api.uploadDatasetFile(file);
      setPreview(res);
      setDatasetName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      setColumnMapping(res.suggested_mapping || {});
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse file. Please verify format.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setIsImporting(true);
    setUploadError(null);
    try {
      const imported = await api.importDataset({
        session_id: preview.session_id,
        dataset_name: datasetName || preview.filename,
        description: description || `Imported from ${preview.filename}`,
        column_mapping: columnMapping,
        deduplicate,
      });

      setImportSuccess(
        `Successfully imported "${imported.dataset_name}". ${imported.valid_records} valid records stored in FalkorDB.`
      );
      setPreview(null);
      setSelectedFile(null);
      fetchInitialData();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to complete dataset import.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteDataset = async (datasetId: string) => {
    if (!confirm('Are you sure you want to delete this dataset and its imported records?')) {
      return;
    }
    try {
      await api.deleteDataset(datasetId);
      setDatasets(datasets.filter((d) => d.id !== datasetId));
      fetchInitialData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete dataset.');
    }
  };

  const handleOpenInspector = async (dataset: DatasetSummary) => {
    setInspectingDataset(dataset);
    setLoadingRecords(true);
    try {
      const recs = await api.getDatasetRecords(dataset.id, {
        valid_only: recordsFilter === 'valid',
        rejected_only: recordsFilter === 'rejected',
        limit: 100,
      });
      setRecords(recs);
    } catch (err: any) {
      console.error('Failed to load dataset records:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleFilterRecords = async (filter: 'all' | 'valid' | 'rejected') => {
    setRecordsFilter(filter);
    if (!inspectingDataset) return;
    setLoadingRecords(true);
    try {
      const recs = await api.getDatasetRecords(inspectingDataset.id, {
        valid_only: filter === 'valid',
        rejected_only: filter === 'rejected',
        limit: 100,
      });
      setRecords(recs);
    } finally {
      setLoadingRecords(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 text-indigo-600" />
            Data Workspace & Provenance Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload incident datasets, error logs, and metrics. Map schema columns, deduplicate records, and inspect source transparency.
          </p>
        </div>

        <button
          onClick={fetchInitialData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh Workspace
        </button>
      </div>

      {/* Provenance Transparency Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900">Synthetic Demo Data</span>
              <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-mono">
                BASELINE
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {provenance?.synthetic_count ?? 22} <span className="text-xs font-normal text-slate-500">records</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Verified ground-truth incident graph & dependencies
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900">User-Imported Data</span>
              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-mono">
                SECURE
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {provenance?.imported_count ?? 0} <span className="text-xs font-normal text-slate-500">records</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Isolated to your account with FalkorDB source lineage
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900">Verified External Data</span>
              <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-mono">
                AUDITED
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {provenance?.external_count ?? 0} <span className="text-xs font-normal text-slate-500">records</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Third-party APM and cloud provider telemetry streams
            </p>
          </div>
        </div>
      </div>

      {/* Upload Dropzone Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
          <UploadCloud className="w-4 h-4 text-indigo-600" />
          Import Incident Dataset or Logs
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Supported file formats: <strong>CSV, Excel (.xlsx, .xls), JSON, JSONL, Application Logs, Plain-Text Reports</strong>.
        </p>

        {uploadError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {importSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}

        {/* Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.005]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json,.jsonl,.txt,.log"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {uploading ? 'Analyzing and parsing file...' : 'Drop your dataset or log file here, or click to browse'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Drag and drop your incident reports, server logs, or infrastructure dumps. Automatic schema detection and column mapping will run instantly.
          </p>

          <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> CSV / Excel
            </span>
            <span className="flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-blue-600" /> JSON / JSONL
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-600" /> Logs / Plain Text
            </span>
          </div>
        </div>

        {/* Upload Preview & Column Mapping Section */}
        {preview && (
          <div className="mt-6 border-t border-slate-100 pt-6 space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {preview.detected_format}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{preview.filename}</h4>
                  <p className="text-xs text-slate-500">
                    Detected format: <strong className="uppercase">{preview.detected_format}</strong> • {preview.total_rows} total rows discovered
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Schema Validated
                </span>
              </div>
            </div>

            {/* Dataset Details Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dataset Name</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  placeholder="e.g. Q3 Production Incident Dump"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  placeholder="e.g. Exported from CloudWatch / Datadog"
                />
              </div>
            </div>

            {/* Column Mapping Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-indigo-600" />
                  Map Dataset Fields to Graph Entities
                </h4>
                <span className="text-[11px] text-slate-500">
                  Auto-mapped based on column names. Adjust if needed.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                {[
                  { key: 'incident_id', label: 'Incident / Alert ID' },
                  { key: 'title', label: 'Title / Summary' },
                  { key: 'service', label: 'Affected Service' },
                  { key: 'severity', label: 'Severity (P1-P4)' },
                  { key: 'status', label: 'Status' },
                  { key: 'error_message', label: 'Error / Evidence' },
                  { key: 'dependencies', label: 'Dependencies' },
                  { key: 'resolution', label: 'Resolution / Notes' },
                ].map(({ key, label }) => (
                  <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {label}
                    </label>
                    <select
                      value={columnMapping[key] || ''}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [key]: e.target.value })
                      }
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 text-slate-800"
                    >
                      <option value="">-- None / Default --</option>
                      {preview.columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Preview Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                Sample Data Preview (First {preview.sample_rows.length} rows)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-48">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-[11px] font-semibold text-slate-600 sticky top-0">
                    <tr>
                      {preview.columns.map((col) => (
                        <th key={col} className="px-3 py-2 border-b border-slate-200">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-[11px]">
                    {preview.sample_rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {preview.columns.map((col) => (
                          <td key={col} className="px-3 py-1.5 whitespace-nowrap max-w-xs truncate">
                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deduplication & Confirmation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  Enable SHA-256 deduplication (prevents duplicate incidents & logs on safe retry)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  {isImporting ? 'Importing into FalkorDB...' : 'Confirm & Import to Graph'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Datasets List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-indigo-600" />
          Imported Datasets & Provenance Records
        </h2>

        {loadingDatasets ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading datasets...</div>
        ) : datasets.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No user datasets imported yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Upload a CSV, Excel, or JSON log file above to populate your workspace.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Dataset Name</th>
                  <th className="px-4 py-3">Source File & Format</th>
                  <th className="px-4 py-3">Record Counts</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Import Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{d.dataset_name}</div>
                      {d.description && (
                        <div className="text-[11px] font-normal text-slate-500 truncate max-w-xs">
                          {d.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="font-mono text-[11px] text-slate-800">{d.source_filename}</div>
                      <span className="uppercase text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                        {d.format}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-semibold">
                          {d.valid_records} valid
                        </span>
                        {d.rejected_records > 0 && (
                          <span className="text-rose-600 font-semibold">
                            ({d.rejected_records} rejected)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{d.total_records} total rows</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          d.status === 'IMPORTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenInspector(d)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Inspect Records & Normalization"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDataset(d.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Dataset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Inspector Modal */}
      {inspectingDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Dataset Records Inspector: {inspectingDataset.dataset_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Source: {inspectingDataset.source_filename} • Total records: {inspectingDataset.total_records}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingDataset(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterRecords('all')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    recordsFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Records
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterRecords('valid')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    recordsFilter === 'valid'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Valid Stored ({inspectingDataset.valid_records})
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterRecords('rejected')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    recordsFilter === 'rejected'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Rejected ({inspectingDataset.rejected_records})
                </button>
              </div>

              <span className="text-[11px] text-slate-400">
                Showing up to 100 sample records
              </span>
            </div>

            {/* Records Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {loadingRecords ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Loading records...
                </div>
              ) : records.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No records match the selected filter.
                </div>
              ) : (
                records.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                      r.is_valid
                        ? 'border-slate-200 bg-white'
                        : 'border-rose-200 bg-rose-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-600">
                          Row #{r.row_index + 1}
                        </span>
                        {r.is_valid ? (
                          <span className="px-2 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                        {r.dedup_hash && (
                          <span className="font-mono text-[10px] text-slate-400">
                            Hash: {r.dedup_hash.slice(0, 10)}...
                          </span>
                        )}
                      </div>
                    </div>

                    {!r.is_valid && r.validation_errors && (
                      <div className="text-[11px] text-rose-700 font-medium bg-rose-50 p-2 rounded border border-rose-100">
                        Reason: {r.validation_errors.join('; ')}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-semibold mb-1">Normalized Record:</span>
                        <pre className="p-2 bg-slate-50 border border-slate-200 rounded text-[10px] overflow-x-auto text-slate-800">
                          {JSON.stringify(r.normalized_data, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <span className="text-slate-400 block font-semibold mb-1">Raw Original Input:</span>
                        <pre className="p-2 bg-slate-50 border border-slate-200 rounded text-[10px] overflow-x-auto text-slate-600">
                          {JSON.stringify(r.raw_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setInspectingDataset(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
