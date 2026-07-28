import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Network,
  BookOpen,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Users,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { useScanStore } from './store/useScanStore';
import { ScannerDropper } from './components/ScannerDropper';
import { SafetyDashboard } from './components/SafetyDashboard';
import { KnowledgeGraphViewer, type GraphNodeData, type GraphEdgeData } from './components/KnowledgeGraphViewer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export type FamilyProfile = 'GENERAL' | 'DIABETIC_FATHER' | 'PREGNANT_MOTHER' | 'TODDLER_CHILD';

export const App: React.FC = () => {
  const {
    matchedIngredients,
    activeTab,
    setActiveTab,
    selectedIngredientId,
    setSelectedIngredientId,
    graphNodes,
    graphEdges,
    setGraphData,
  } = useScanStore();

  const [activeProfile, setActiveProfile] = useState<FamilyProfile>('GENERAL');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const hasScanResults = matchedIngredients && matchedIngredients.length > 0;

  // Set default selected ingredient when scan finishes
  useEffect(() => {
    if (hasScanResults && !selectedIngredientId) {
      setSelectedIngredientId(matchedIngredients[0].id);
    }
  }, [hasScanResults, selectedIngredientId, matchedIngredients, setSelectedIngredientId]);

  // Fetch metabolic knowledge graph pathway from Spring Boot CTE Engine
  useEffect(() => {
    if (!selectedIngredientId) return;

    const fetchGraph = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/graph/metabolic-pathway/${selectedIngredientId}?depth=3`
        );
        if (response.ok) {
          const data = await response.json();
          setGraphData(data.nodes, data.edges);
        }
      } catch (err) {
        console.error('Failed to fetch metabolic graph pathway:', err);
      }
    };

    fetchGraph();
  }, [selectedIngredientId, setGraphData]);

  // Fetch Gemini AI Plain-Language Explanations (Strictly grounded in database facts)
  const fetchGeminiExplanation = async () => {
    if (!hasScanResults) return;
    setIsAiLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/explain-ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: matchedIngredients,
          userProfile: activeProfile,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiExplanation(data.explanation);
      } else {
        setAiExplanation('Unable to generate AI explanation at this time. Standard database rules apply.');
      }
    } catch (err) {
      console.error('Gemini AI service error:', err);
      setAiExplanation('Gemini AI service offline. Showing verified regulatory database facts.');
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights' && !aiExplanation) {
      fetchGeminiExplanation();
    }
  }, [activeTab, activeProfile]);

  // Type-safe mapping of backend graph nodes to React Flow expectations
  const transformedNodes = graphNodes.map((node: any) => ({
    id: node.id,
    data: {
      label: node.label || (node.data && node.data.label) || 'Entity',
      type: (node.type || (node.data && node.data.type) || 'EFFECT') as GraphNodeData['type'],
      severityLevel: (node.severityLevel || (node.data && node.data.severityLevel) || 'MODERATE') as GraphNodeData['severityLevel'],
    },
  }));

  const transformedEdges = graphEdges.map((edge: any) => ({
    source: edge.source,
    target: edge.target,
    relationship: edge.relationship || 'CONNECTED_TO',
    evidenceStrength: (edge.evidenceStrength || 'MODERATE') as GraphEdgeData['evidenceStrength'],
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Accent Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Navigation / Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                FoodLens <span className="text-xs font-mono px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded-full">AI v2.0</span>
              </h1>
              <p className="text-xs text-slate-400">
                Ultra-Processed Food Intelligence & Knowledge Graph Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Deterministic Engine + Gemini Explainer
          </div>
        </header>

        {/* OCR Scanner Dropzone Component */}
        <section className="mb-10">
          <ScannerDropper />
        </section>

        {/* Dynamic Analysis Dashboard */}
        {hasScanResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Family Profile Switcher Banner */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Family Perspective Mode:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(['GENERAL', 'DIABETIC_FATHER', 'PREGNANT_MOTHER', 'TODDLER_CHILD'] as FamilyProfile[]).map((prof) => (
                  <button
                    key={prof}
                    onClick={() => {
                      setActiveProfile(prof);
                      setAiExplanation(null); // Reset AI explanation to refetch for new perspective
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
                      activeProfile === prof
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {prof.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Navigation Controls */}
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 overflow-x-auto">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'summary'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" /> Safety Spectrum & Metrics
              </button>

              <button
                onClick={() => setActiveTab('graph')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'graph'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Network className="w-4 h-4" /> Knowledge Graph Visualizer
              </button>

              <button
                onClick={() => setActiveTab('insights')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'insights'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Gemini AI Metabolic Explanations
              </button>
            </div>

            {/* Tab Panels */}
            <AnimatePresence mode="wait">
              {activeTab === 'summary' && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SafetyDashboard />
                </motion.div>
              )}

              {activeTab === 'graph' && (
                <motion.div
                  key="graph"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 uppercase">Focus Entity:</span>
                      <select
                        value={selectedIngredientId || ''}
                        onChange={(e) => setSelectedIngredientId(e.target.value)}
                        className="bg-slate-900 text-slate-200 text-xs font-semibold border border-slate-800 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
                      >
                        {matchedIngredients.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.matchedName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-900">
                      PostgreSQL Recursive CTE Pathway Graph
                    </span>
                  </div>

                  <KnowledgeGraphViewer
                    nodes={transformedNodes}
                    edges={transformedEdges}
                    onNodeSelect={(id, data) => console.log('Node selected:', id, data)}
                  />
                </motion.div>
              )}

              {activeTab === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-400" />
                      Gemini AI Plain-Language Report ({activeProfile.replace('_', ' ')})
                    </h3>
                    <button
                      onClick={fetchGeminiExplanation}
                      disabled={isAiLoading}
                      className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {isAiLoading ? (
                    <div className="p-8 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-mono text-slate-400">
                        Synthesizing medical research and grounding DB entities via Gemini...
                      </span>
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {aiExplanation || 'No explanation generated yet. Click refresh to synthesize insights.'}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default App;