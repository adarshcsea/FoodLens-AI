import { create } from 'zustand';

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

export interface MatchedIngredient {
  id: string;
  matchedName: string;
  matchConfidence: number;
  isAdditive: boolean;
  isHiddenSugar: boolean;
  isAllergen: boolean;
}

export interface GraphNode {
  id: string;
  data: {
    label: string;
    type: 'INGREDIENT' | 'EFFECT' | 'CONDITION' | 'RISK';
    severityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    description?: string;
  };
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  evidenceStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'CLINICAL_CONSENSUS';
}

interface ScanState {
  isScanning: boolean;
  progress: number;
  rawText: string;
  matchedIngredients: MatchedIngredient[];
  healthScores: HealthScorePayload | null;
  selectedIngredientId: string | null;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  activeTab: 'summary' | 'sugar' | 'graph' | 'insights';

  setIsScanning: (status: boolean) => void;
  setProgress: (val: number) => void;
  setScanResults: (rawText: string, ingredients: MatchedIngredient[]) => void;
  setHealthScores: (scores: HealthScorePayload) => void;
  setSelectedIngredientId: (id: string | null) => void;
  setGraphData: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  setActiveTab: (tab: 'summary' | 'sugar' | 'graph' | 'insights') => void;
  resetScan: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  isScanning: false,
  progress: 0,
  rawText: '',
  matchedIngredients: [],
  healthScores: null,
  selectedIngredientId: null,
  graphNodes: [],
  graphEdges: [],
  activeTab: 'summary',

  setIsScanning: (isScanning) => set({ isScanning }),
  setProgress: (progress) => set({ progress }),
  setScanResults: (rawText, matchedIngredients) =>
    set({ rawText, matchedIngredients, isScanning: false, progress: 100 }),
  setHealthScores: (healthScores) => set({ healthScores }),
  setSelectedIngredientId: (selectedIngredientId) => set({ selectedIngredientId }),
  setGraphData: (graphNodes, graphEdges) => set({ graphNodes, graphEdges }),
  setActiveTab: (activeTab) => set({ activeTab }),
  resetScan: () =>
    set({
      isScanning: false,
      progress: 0,
      rawText: '',
      matchedIngredients: [],
      healthScores: null,
      selectedIngredientId: null,
      graphNodes: [],
      graphEdges: [],
      activeTab: 'summary',
    }),
}));