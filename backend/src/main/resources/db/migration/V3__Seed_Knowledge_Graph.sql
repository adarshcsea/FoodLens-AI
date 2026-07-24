-- =============================================================================
-- Migration: V3__Seed_Medical_Conditions_And_Graph.sql
-- Description: Core Seed for Medical Conditions, Allergies & Knowledge Graph Edges
-- Target Database: PostgreSQL 15+ (Supabase Compatible)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. MEDICAL CONDITIONS & HEALTH TARGETS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS medical_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'INSULIN_RESISTANCE', 'NAFLD'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    severity_level VARCHAR(20) DEFAULT 'MODERATE', -- 'MILD', 'MODERATE', 'SEVERE', 'CRITICAL'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medical_conditions_code ON medical_conditions(code);

-- Seed Real-World Medical Conditions
INSERT INTO medical_conditions (id, code, name, description, severity_level) VALUES
('m3333333-3333-3333-3333-333333333333', 'INSULIN_RESISTANCE', 'Insulin Resistance', 'Reduced cellular sensitivity to circulating insulin, causing elevated blood glucose spikes.', 'SEVERE'),
('m4444444-4444-4444-4444-444444444444', 'NAFLD', 'Non-Alcoholic Fatty Liver Disease', 'Hepatic fat accumulation driven by excessive fructose metabolism and de novo lipogenesis.', 'SEVERE'),
('m5555555-5555-5555-5555-555555555555', 'INFLAMMATION', 'Systemic Low-Grade Inflammation', 'Elevated inflammatory markers (CRP, TNF-alpha) triggered by ultra-processed food matrix disruption.', 'MODERATE'),
('m6666666-6666-6666-6666-666666666666', 'PKU', 'Phenylketonuria', 'Rare genetic metabolic disorder preventing metabolism of the amino acid phenylalanine.', 'CRITICAL'),
('m7777777-7777-7777-7777-777777777777', 'HYPERTENSION', 'Hypertension (High Blood Pressure)', 'Chronic elevation of systemic arterial blood pressure heavily aggravated by excessive sodium.', 'SEVERE')
ON CONFLICT (code) DO NOTHING;


-- =============================================================================
-- 2. KNOWLEDGE GRAPH RELATIONSHIPS (EXTENDED ENUM SAFE GRAPH)
-- =============================================================================

-- Upgrade Relationships Table to support Explicit Foreign Keys for Integrity
CREATE TABLE IF NOT EXISTS ingredient_condition_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    condition_id UUID NOT NULL REFERENCES medical_conditions(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'TRIGGERS', 'EXACERBATES', 'CONTRAINDICATED_FOR', 'PROTECTS_AGAINST'
    evidence_level VARCHAR(50) NOT NULL DEFAULT 'MODERATE', -- 'WEAK', 'MODERATE', 'STRONG', 'CLINICAL_CONSENSUS'
    description TEXT NOT NULL,
    CONSTRAINT unique_ingredient_condition UNIQUE (ingredient_id, condition_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_graph_ingredient ON ingredient_condition_relationships(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_graph_condition ON ingredient_condition_relationships(condition_id);


-- =============================================================================
-- 3. SEED KNOWLEDGE GRAPH EDGES (INGREDIENT -> CONDITION)
-- =============================================================================

INSERT INTO ingredient_condition_relationships 
(id, ingredient_id, condition_id, relationship_type, evidence_level, description) 
VALUES 

-- High Fructose Corn Syrup (HFCS) -> Insulin Resistance
(
    'r1111111-1111-1111-1111-111111111111', 
    'i1000000-0000-0000-0000-000000000002', -- HFCS (seeded in V2)
    'm3333333-3333-3333-3333-333333333333', -- Insulin Resistance
    'EXACERBATES', 
    'STRONG', 
    'Unbound hepatic fructose metabolism bypasses phosphofructokinase regulation, impairing insulin receptor sensitivity.'
),

-- HFCS -> NAFLD
(
    'r2222222-2222-2222-2222-222222222222', 
    'i1000000-0000-0000-0000-000000000002', -- HFCS
    'm4444444-4444-4444-4444-444444444444', -- NAFLD
    'TRIGGERS', 
    'STRONG', 
    'Excess liquid fructose directly stimulates de novo lipogenesis (fat accumulation) in liver hepatocytes.'
),

-- Aspartame -> Phenylketonuria (PKU)
(
    'r3333333-3333-3333-3333-333333333333', 
    'i1000000-0000-0000-0000-000000000001', -- Aspartame (seeded in V2)
    'm6666666-6666-6666-6666-666666666666', -- Phenylketonuria
    'CONTRAINDICATED_FOR', 
    'CLINICAL_CONSENSUS', 
    'Aspartame hydrolyzes into Phenylalanine in the gastrointestinal tract, posing severe neurotoxic hazard to PKU patients.'
),

-- Maltodextrin -> Gut Inflammation
(
    'r4444444-4444-4444-4444-444444444444', 
    'i1000000-0000-0000-0000-000000000003', -- Maltodextrin
    'm5555555-5555-5555-5555-555555555555', -- Systemic Inflammation
    'EXACERBATES', 
    'STRONG', 
    'Alters intestinal mucus layers and promotes growth of pro-inflammatory bacterial strains.'
)
ON CONFLICT DO NOTHING;

COMMIT;