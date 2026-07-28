import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from 'recharts';
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  HeartPulse,
  Info,
  ChevronDown,
  ShieldCheck,
  Baby,
  Activity,
} from 'lucide-react';
import { useScanStore } from '../store/useScanStore';

// =============================================================================
// TYPES (Matching Spring Boot Health Scoring Payload)
// =============================================================================

export interface ScoreDeduction {
  dimension: string;
  pointsDeducted: number;
  reason: string;
  sourceIngredient: string;
}

export interface HealthScorePayload {
  overallGrade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'HAZARDOUS';
  novaGroup: 1 | 2 | 3 | 4;
  processingScore: number;
  additiveScore: number;
  sugarScore: number;
  cardiovascularScore: number;
  diabeticSafetyScore: number;
  pediatricSafetyScore: number;
  maternalSafetyScore: number;
  deductions: ScoreDeduction[];
}

export const SafetyDashboard: React.FC = () => {
  const { matchedIngredients, healthScores } = useScanStore();
  const [showDeductions, setShowDeductions] = useState(false);

  if (!matchedIngredients || matchedIngredients.length === 0) {
    return null;
  }

  // Fallback defaults if healthScores vector isn't fully hydrated yet
  const scores: HealthScorePayload = healthScores || {
    overallGrade: 'FAIR',
    novaGroup: 4,
    processingScore: 40,
    additiveScore: 60,
    sugarScore: 35,
    cardiovascularScore: 70,
    diabeticSafetyScore: 45,
    pediatricSafetyScore: 50,
    maternalSafetyScore: 80,
    deductions: [],
  };

  // Structured Multi-Axis Radar Payload
  const radarData = [
    { dimension: 'Processing', score: scores.processingScore },
    { dimension: 'Additive Safety', score: scores.additiveScore },
    { dimension: 'Sugar Control', score: scores.sugarScore },
    { dimension: 'Cardio Safety', score: scores.cardiovascularScore },
    { dimension: 'Diabetic Safe', score: scores.diabeticSafetyScore },
    { dimension: 'Pediatric Safe', score: scores.pediatricSafetyScore },
  ];

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'EXCELLENT':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'GOOD':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
      case 'FAIR':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-800/60';
      case 'POOR':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      default:
        return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
    }
  };

  const getNovaBadge = (group: number) => {
    switch (group) {
      case 1:
        return { label: 'NOVA 1: Unprocessed', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
      case 2:
        return { label: 'NOVA 2: Processed Culinary', color: 'text-blue-400 bg-blue-950/60 border-blue-800' };
      case 3:
        return { label: 'NOVA 3: Processed', color: 'text-amber-400 bg-amber-950/60 border-amber-800' };
      default:
        return { label: 'NOVA 4: Ultra-Processed', color: 'text-rose-400 bg-rose-950/60 border-rose-800' };
    }
  };

  const novaInfo = getNovaBadge(scores.novaGroup);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 mt-8">
      {/* Top Banner: Overall Score & NOVA Processing Classification */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">
                {Math.round(
                  (scores.processingScore + scores.sugarScore + scores.additiveScore) / 3
                )}
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Score</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border ${getGradeBadge(scores.overallGrade)}`}>
                {scores.overallGrade}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-mono rounded-full border ${novaInfo.color}`}>
                {novaInfo.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">Deterministic Health Assessment</h3>
            <p className="text-xs text-slate-400">
              Evaluated across 6 clinical dimensions using database regulatory matrices.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDeductions(!showDeductions)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 shrink-0"
        >
          <Info className="w-4 h-4 text-indigo-400" />
          Explainable Score Audit Log
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDeductions ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expandable Score Deduction Audit Panel */}
      <AnimatePresence>
        {showDeductions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl border border-indigo-900/50 bg-indigo-950/20 p-5 backdrop-blur-md"
          >
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Score Deduction Vectors (Audit Traceability)
            </h4>
            {scores.deductions.length > 0 ? (
              <div className="space-y-2">
                {scores.deductions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-rose-400 font-bold">-{d.pointsDeducted} pts</span>
                      <span className="text-slate-300">{d.reason}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                      Source: {d.sourceIngredient}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No major health deductions detected in this product matrix.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Dimensional Radar Chart */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-indigo-400" />
              6-Axis Safety Radar Spectrum
            </h4>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
              0-100 Scale
            </span>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" tick={{ fill: '#64748b', fontSize: 9 }} />
                <Radar
                  name="Health Score"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.45}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Personalized Risk Indicators */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Demographic Hazard Breakdown
            </h4>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Baby className="w-5 h-5 text-purple-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200">Child & Pediatric Safety</span>
                    <p className="text-[10px] text-slate-400">Evaluates artificial colors & hyper-palatable sugars</p>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold ${scores.pediatricSafetyScore < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {scores.pediatricSafetyScore}/100
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200">Diabetic Glycemic Impact</span>
                    <p className="text-[10px] text-slate-400">Flags hidden sugars, HFCS & Maltodextrin spikes</p>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold ${scores.diabeticSafetyScore < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {scores.diabeticSafetyScore}/100
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200">Additive Toxicity Load</span>
                    <p className="text-[10px] text-slate-400">Evaluates WHO/IARC & EFSA additive safety status</p>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold ${scores.additiveScore < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {scores.additiveScore}/100
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};