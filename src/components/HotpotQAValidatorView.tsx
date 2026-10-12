import React, { useState } from "react";
import { 
  CheckCircle2, 
  Play, 
  Zap, 
  Clock, 
  Cpu, 
  Layers, 
  GitMerge, 
  TrendingUp, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Database,
  Search,
  Sparkles,
  BarChart3
} from "lucide-react";
import { HOTPOTQA_MULTI_PAPER_DATASET, HotpotQASample } from "../hotpotQaData";

interface ValidationResult {
  sample_id: string;
  question: string;
  method: string;
  answer: string;
  ground_truth: string;
  paper_titles: string[];
  metrics: {
    latency_ms: number;
    graph_latency_ms: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    llm_calls: number;
    tokens_per_second: number;
    recall_score: number;
    quality_score: number;
    nodes_traversed: number;
    bridges_preserved: number;
    total_nodes: number;
    merged_shared_nodes: number;
  };
  graphs: {
    original_node_count: number;
    compressed_node_count: number;
    shared_node_count: number;
  };
}

export const HotpotQAValidatorView: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<HotpotQASample>(HOTPOTQA_MULTI_PAPER_DATASET[0]);
  const [activeMethod, setActiveMethod] = useState<string>("ours");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isComparingAll, setIsComparingAll] = useState<boolean>(false);
  const [comparisonResults, setComparisonResults] = useState<Record<string, ValidationResult>>({});

  const METHODS = [
    { id: "ours", name: "Ours (Tarjan SCC + Bridges)", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
    { id: "dynamic", name: "Dynamic Selection", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
    { id: "static", name: "Static Baseline", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
    { id: "local", name: "Local Search (2-Hop)", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  ];

  const handleRunValidation = async (methodToRun = activeMethod) => {
    setIsValidating(true);
    try {
      const res = await fetch("/api/hotpotqa/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sample_id: selectedSample.id,
          method: methodToRun,
        }),
      });

      if (res.ok) {
        const data: ValidationResult = await res.json();
        setValidationResult(data);
        setComparisonResults(prev => ({ ...prev, [methodToRun]: data }));
      }
    } catch (err) {
      console.error("HotpotQA validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCompareAllMethods = async () => {
    setIsComparingAll(true);
    const newComp: Record<string, ValidationResult> = {};
    for (const m of ["ours", "dynamic", "static", "local"]) {
      try {
        const res = await fetch("/api/hotpotqa/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sample_id: selectedSample.id,
            method: m,
          }),
        });
        if (res.ok) {
          const data: ValidationResult = await res.json();
          newComp[m] = data;
          if (m === activeMethod) setValidationResult(data);
        }
      } catch (err) {
        console.error("Comparison run error:", err);
      }
    }
    setComparisonResults(newComp);
    setIsComparingAll(false);
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-y-auto text-slate-200 p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              HotpotQA Multi-Paper Live Validation Benchmark
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Live Non-Hardcoded Execution
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Benchmarks multi-hop cross-paper reasoning across real pipeline calls measuring speed, tokens, latency, LLM calls, and graph preservation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRunValidation(activeMethod)}
            disabled={isValidating || isComparingAll}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isValidating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Validating Call...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Live Call</span>
              </>
            )}
          </button>

          <button
            onClick={handleCompareAllMethods}
            disabled={isValidating || isComparingAll}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isComparingAll ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating All 4 Methods...</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Compare All 4 Methods</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dataset Question Selection Carousel */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-indigo-400" />
          <span>Select HotpotQA Multi-Paper Multi-Hop Benchmark Question:</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {HOTPOTQA_MULTI_PAPER_DATASET.map((s) => {
            const isSelected = selectedSample.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSample(s);
                  setValidationResult(null);
                  setComparisonResults({});
                }}
                className={`text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-2.5 cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 border-emerald-500/60 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.type === "comparison" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"}`}>
                      {s.type} reasoning
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold uppercase">
                      {s.level}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-200 line-clamp-2 leading-relaxed">
                    {s.question}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium truncate max-w-[200px] text-emerald-400">
                    {s.paper_titles.join(" ⟷ ")}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Method Selector Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit">
        <span className="text-[11px] font-semibold text-slate-400 px-3 uppercase tracking-wider">Method:</span>
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setActiveMethod(m.id);
              if (comparisonResults[m.id]) {
                setValidationResult(comparisonResults[m.id]);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMethod === m.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Live Metrics Display */}
      {validationResult ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Key KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Latency
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {validationResult.metrics.latency_ms}
                </span>
                <span className="text-xs text-slate-500 ml-1">ms</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Live call timer</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Speed
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {validationResult.metrics.tokens_per_second}
                </span>
                <span className="text-xs text-slate-500 ml-1">tok/s</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Real throughput</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
                <Cpu className="w-3.5 h-3.5 text-amber-400" /> Total Tokens
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {validationResult.metrics.total_tokens.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Prompt: {validationResult.metrics.prompt_tokens} &bull; Comp: {validationResult.metrics.completion_tokens}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
                <Layers className="w-3.5 h-3.5 text-purple-400" /> LLM Calls
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-purple-400">
                  {validationResult.metrics.llm_calls}
                </span>
                <span className="text-xs text-slate-500 ml-1">calls</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Context invocations</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
                <GitMerge className="w-3.5 h-3.5 text-indigo-400" /> Merged Shared
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-indigo-400">
                  {validationResult.metrics.merged_shared_nodes}
                </span>
                <span className="text-xs text-slate-500 ml-1">nodes</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Combined concepts</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Quality Score
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {validationResult.metrics.quality_score.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 ml-1">/ 5.0</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">HotpotQA Rubric</span>
            </div>
          </div>

          {/* 4-Method Comparison Matrix if ran */}
          {Object.keys(comparisonResults).length > 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Live 4-Method Multi-Paper Benchmark Comparison
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Measured from live call executions</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Method</th>
                      <th className="px-6 py-3 font-semibold">Quality Score</th>
                      <th className="px-6 py-3 font-semibold">Latency (ms)</th>
                      <th className="px-6 py-3 font-semibold">Total Tokens</th>
                      <th className="px-6 py-3 font-semibold">Speed (tok/s)</th>
                      <th className="px-6 py-3 font-semibold">LLM Calls</th>
                      <th className="px-6 py-3 font-semibold">Nodes Traversed</th>
                      <th className="px-6 py-3 font-semibold">Bridges Preserved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {METHODS.map((m) => {
                      const res = comparisonResults[m.id];
                      if (!res) return null;
                      const isOurs = m.id === "ours";
                      return (
                        <tr
                          key={m.id}
                          className={isOurs ? "bg-indigo-950/20 font-medium text-white border-l-4 border-indigo-500" : "hover:bg-slate-800/40 text-slate-300"}
                        >
                          <td className="px-6 py-3.5 font-sans font-semibold flex items-center gap-2">
                            {isOurs && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                            <span className={m.color}>{m.name}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded font-bold ${res.metrics.quality_score >= 4.5 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-300"}`}>
                              {res.metrics.quality_score.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-300">{res.metrics.latency_ms} ms</td>
                          <td className="px-6 py-3.5 text-slate-300">{res.metrics.total_tokens.toLocaleString()}</td>
                          <td className="px-6 py-3.5 text-emerald-400 font-bold">{res.metrics.tokens_per_second}</td>
                          <td className="px-6 py-3.5 text-purple-300">{res.metrics.llm_calls}</td>
                          <td className="px-6 py-3.5 text-slate-400">{res.metrics.nodes_traversed} nodes</td>
                          <td className="px-6 py-3.5 text-emerald-400 font-bold">{res.metrics.bridges_preserved} bridges</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed Question Answering & Ground Truth Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generated Multi-Paper Answer */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Live Generated Synthesis Answer
                </span>
                <span className="text-[10px] font-mono text-slate-500">Method: {validationResult.method.toUpperCase()}</span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans max-h-[380px] overflow-y-auto pr-2">
                {validationResult.answer}
              </div>
            </div>

            {/* HotpotQA Ground Truth & Supporting Facts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> HotpotQA Ground Truth Gold Standard
                </span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Recall: {(validationResult.metrics.recall_score * 100).toFixed(1)}%
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-slate-200 leading-relaxed">
                  <strong className="text-amber-300 block mb-1">Target Answer:</strong>
                  {validationResult.ground_truth}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Cross-Paper Supporting Facts:
                  </span>
                  {selectedSample.supporting_facts.map((f, i) => (
                    <div key={i} className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-300">
                      <strong className="text-indigo-400 block mb-0.5">{f.paper_title}:</strong>
                      {f.fact}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Zap className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-white">Live Multi-Paper HotpotQA Validation Ready</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select any cross-paper multi-hop question above and click <strong>"Run Live Call"</strong> or <strong>"Compare All 4 Methods"</strong> to execute real live pipeline calls and see non-hardcoded speed, token usage, latency, and LLM call counts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
