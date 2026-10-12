import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Paper } from "../types";

interface PaperSidebarProps {
  papers: Paper[];
  selectedPapers: Paper[];
  onSelectPaper: (paper: Paper, multi: boolean) => void;
  onSelectPapers?: (papers: Paper[]) => void;
  onPaperUploaded: () => void;
}

const PAPER_COLORS = [
  "#38bdf8", // Sky blue (Paper 1)
  "#f43f5e", // Rose (Paper 2)
  "#a855f7", // Violet (Paper 3)
  "#f59e0b", // Amber (Paper 4)
  "#06b6d4"  // Cyan (Paper 5)
];

export const PaperSidebar: React.FC<PaperSidebarProps> = ({
  papers,
  selectedPapers,
  onSelectPaper,
  onSelectPapers,
  onPaperUploaded,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [multiMode, setMultiMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyPreset = (id1: string, id2: string) => {
    const p1 = papers.find(p => p.paper_id.includes(id1));
    const p2 = papers.find(p => p.paper_id.includes(id2));
    if (p1 && p2) {
      if (onSelectPapers) {
        onSelectPapers([p1, p2]);
      } else {
        onSelectPaper(p1, false);
        setTimeout(() => onSelectPaper(p2, true), 50);
      }
      setMultiMode(true);
    }
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage(null);
    }, 6000);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showError("Please select a valid PDF file.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress("Uploading PDF to server...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.pdf$/i, ""));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let msg = `Upload failed (${res.status})`;
        try {
          const errData = await res.json();
          if (errData?.error) msg = errData.error;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();

      if (data.duplicate || data.status === "ready") {
        setUploadProgress("Paper recognized in storage — loaded without duplication!");
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(null);
          onPaperUploaded();
          if (data.paper) {
            onSelectPaper(data.paper, false);
          }
        }, 600);
        return;
      }

      const jobId = data.job_id;

      // Poll job status
      const interval = setInterval(async () => {
        try {
          const jRes = await fetch(`/api/jobs/${jobId}`);
          if (jRes.ok) {
            const jData = await jRes.json();
            setUploadProgress(`${jData.message} (${jData.progress}%)`);

            if (jData.state === "COMPLETED" || jData.state === "FAILED") {
              clearInterval(interval);
              setIsUploading(false);
              setUploadProgress(null);
              onPaperUploaded();
            }
          }
        } catch {
          clearInterval(interval);
          setIsUploading(false);
          setUploadProgress(null);
        }
      }, 800);
    } catch (err: any) {
      console.error("Upload error:", err);
      showError(err.message || "Failed to upload file");
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleIndexPaper = async (p: Paper, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(`Indexing ${p.title}...`);

    try {
      const form = new FormData();
      form.append("preloaded_id", p.paper_id);
      form.append("title", p.title);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        let msg = `Indexing failed (${res.status})`;
        try {
          const errData = await res.json();
          if (errData?.error) msg = errData.error;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      const jobId = data.job_id;

      const interval = setInterval(async () => {
        try {
          const jRes = await fetch(`/api/jobs/${jobId}`);
          if (jRes.ok) {
            const jData = await jRes.json();
            setUploadProgress(`${jData.message} (${jData.progress}%)`);
            if (jData.state === "COMPLETED" || jData.state === "FAILED") {
              clearInterval(interval);
              setIsUploading(false);
              setUploadProgress(null);
              onPaperUploaded();
            }
          }
        } catch {
          clearInterval(interval);
          setIsUploading(false);
          setUploadProgress(null);
        }
      }, 800);
    } catch (err: any) {
      console.error("Indexing error:", err);
      showError(err.message || "Failed to extract graph");
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0">
      {/* Upload Zone */}
      <div className="p-4 border-b border-slate-800">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-slate-700/80 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/80"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2">
            <Upload className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-slate-200">Upload Research Paper (PDF)</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Drag and drop or browse</p>
        </div>

        {errorMessage && (
          <div className="mt-3 bg-rose-950/70 border border-rose-500/40 rounded-lg p-2.5 flex items-start gap-2 text-rose-200 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="flex-1 leading-snug">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-semibold px-1"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {isUploading && (
          <div className="mt-3 bg-indigo-950/50 border border-indigo-500/30 rounded-lg p-2.5 flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-indigo-200 font-medium truncate">{uploadProgress}</p>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Paper Mode & Quick Compare Presets */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-900/70 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Multi-Paper Compare
            </span>
            {selectedPapers.length > 1 && (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/40">
                {selectedPapers.length} active
              </span>
            )}
          </div>
          <button
            onClick={() => setMultiMode(!multiMode)}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${
              multiMode
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {multiMode ? "Multi Mode: ON" : "Multi Mode: OFF"}
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => applyPreset("Attention", "GCN")}
            className="text-[10px] bg-slate-800/90 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-all truncate"
            title="Compare Attention Is All You Need + Graph Convolutional Networks"
          >
            Transformer + GCN
          </button>
          <button
            onClick={() => applyPreset("GCN", "GAT")}
            className="text-[10px] bg-slate-800/90 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-all truncate"
            title="Compare GCN + GAT"
          >
            GCN + GAT
          </button>
          <button
            onClick={() => applyPreset("DeepWalk", "node2vec")}
            className="text-[10px] bg-slate-800/90 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-all truncate"
            title="Compare DeepWalk + node2vec"
          >
            DeepWalk + node2vec
          </button>
          <button
            onClick={() => applyPreset("BERT", "RAG")}
            className="text-[10px] bg-slate-800/90 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-all truncate"
            title="Compare BERT + RAG"
          >
            BERT + RAG
          </button>
        </div>

        {selectedPapers.length > 1 && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span className="text-[10px] text-emerald-400 font-medium">
              Combined graph active
            </span>
            <button
              onClick={() => onSelectPaper(selectedPapers[0], false)}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline"
            >
              Reset to Single
            </button>
          </div>
        )}
      </div>

      {/* Landmark Papers Catalog */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Landmark Papers ({papers.length})
        </span>
        <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
          arXiv Preloaded
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
        {papers.map((p) => {
          const selectedIdx = selectedPapers.findIndex(sp => sp.paper_id === p.paper_id);
          const isSelected = selectedIdx !== -1;
          const assignedColor = isSelected ? PAPER_COLORS[selectedIdx % PAPER_COLORS.length] : undefined;

          return (
            <div
              key={p.paper_id}
              onClick={(e) => onSelectPaper(p, multiMode || e.ctrlKey || e.shiftKey || e.metaKey)}
              className={`group p-2.5 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? "bg-indigo-600/15 border border-indigo-500/40 text-white"
                  : "hover:bg-slate-800/60 text-slate-300 border border-transparent"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Selection Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPaper(p, true);
                  }}
                  className={`w-4 h-4 rounded mt-1 flex items-center justify-center border transition-all flex-shrink-0 ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "border-slate-600 hover:border-slate-400 bg-slate-800"
                  }`}
                  title="Toggle multi-paper selection"
                >
                  {isSelected && <span className="text-[10px] font-bold leading-none">✓</span>}
                </button>

                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                  }`}
                  style={assignedColor ? { backgroundColor: assignedColor } : undefined}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-medium leading-snug line-clamp-2">{p.title}</h4>
                    {isSelected && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: assignedColor }}
                        title={`Assigned graph color: Paper ${selectedIdx + 1}`}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                    <span>{p.file_size_kb} KB</span>
                    <span>&bull;</span>
                    {p.num_entities > 0 ? (
                      <span className="text-emerald-400 font-medium">
                        {p.num_entities} ents / {p.num_relations} rels
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleIndexPaper(p, e)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Extract Graph
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
