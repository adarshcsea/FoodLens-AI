-- =============================================================================
-- Migration: V2__Seed_Canonical_Ingredients.sql
-- Description: Core Seed Data for FoodLens AI Engine
-- Target Database: PostgreSQL 15+ (Supabase compatible)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. INGREDIENT CATEGORIES (LTREE HIERARCHY)
-- =============================================================================

INSERT INTO ingredient_categories (id, name, slug, description, path) VALUES
('c1000000-0000-0000-0000-000000000001', 'Food Ingredients', 'food-ingredients', 'Root category for all dietary constituents', 'Food'),
('c1000000-0000-0000-0000-000000000002', 'Additives', 'additives', 'Substances added to preserve, enhance flavor, or modify texture', 'Food.Additives'),
('c1000000-0000-0000-0000-000000000003', 'Sweeteners', 'sweeteners', 'Nutritive and non-nutritive sweetening agents', 'Food.Additives.Sweeteners'),
('c1000000-0000-0000-0000-000000000004', 'Artificial Sweeteners', 'artificial-sweeteners', 'Synthetic sugar substitutes', 'Food.Additives.Sweeteners.Artificial'),
('c1000000-0000-0000-0000-000000000005', 'Emulsifiers & Stabilizers', 'emulsifiers-stabilizers', 'Agents preventing phase separation in fat/water mixtures', 'Food.Additives.Emulsifiers'),
('c1000000-0000-0000-0000-000000000006', 'Preservatives', 'preservatives', 'Chemical additives inhibiting microbial growth or oxidation', 'Food.Additives.Preservatives'),
('c1000000-0000-0000-0000-000000000007', 'Carbohydrates', 'carbohydrates', 'Energy-providing saccharide molecules', 'Food.Carbohydrates'),
('c1000000-0000-0000-0000-000000000008', 'Added Sugars', 'added-sugars', 'Caloric sweeteners added during manufacturing', 'Food.Carbohydrates.AddedSugars'),
('c1000000-0000-0000-0000-000000000009', 'Major Allergens', 'allergens', 'Common triggers for IgE-mediated immune responses', 'Food.Allergens'),
('c1000000-0000-0000-0000-000000000010', 'Artificial Colors', 'artificial-colors', 'Synthetic azo dyes and pigments', 'Food.Additives.Colors');


-- =============================================================================
-- 2. CANONICAL INGREDIENTS
-- =============================================================================

INSERT INTO ingredients (
    id, canonical_name, slug, scientific_name, category_id, node_path,
    nova_group, is_additive, ins_e_number, is_hidden_sugar, is_allergen, allergen_category,
    glycemic_index, acceptable_daily_intake_mg_kg, fda_status, fssai_status, efsa_status,
    purpose, why_companies_use_it, short_term_effects, long_term_effects, demographic_risks
) VALUES
-- 1. Aspartame
(
    'i1000000-0000-0000-0000-000000000001',
    'Aspartame',
    'aspartame',
    'N-(L-alpha-Aspartyl)-L-phenylalanine methyl ester',
    'c1000000-0000-0000-0000-000000000004',
    'Food.Additives.Sweeteners.Artificial.Aspartame',
    'ULTRA_PROCESSED', TRUE, 'E951', FALSE, FALSE, NULL,
    0, 40.00, 'APPROVED', 'APPROVED', 'APPROVED',
    'Low-calorie artificial sweetener (~200x sweeter than sucrose)',
    'Provides intense sweetness without the caloric load or bulk cost of real sugar.',
    'Headaches, dizziness, or gastrointestinal distress in sensitive individuals.',
    'Metabolized into phenylalanine, aspartic acid, and methanol. Classified as "possibly carcinogenic to humans" (Group 2B) by WHO IARC (2023).',
    '{"pediatric": "MODERATE", "pregnancy": "SAFE_WITHIN_ADI", "phenylketonuria": "CRITICAL_HAZARD"}'::jsonb
),

-- 2. High Fructose Corn Syrup (HFCS)
(
    'i1000000-0000-0000-0000-000000000002',
    'High Fructose Corn Syrup',
    'high-fructose-corn-syrup',
    'Fructose-Glucose Hydrolysate',
    'c1000000-0000-0000-0000-000000000008',
    'Food.Carbohydrates.AddedSugars.HFCS',
    'ULTRA_PROCESSED', FALSE, NULL, TRUE, FALSE, NULL,
    73, NULL, 'APPROVED', 'APPROVED', 'RESTRICTED',
    'Caloric liquid sweetener composed of unbound fructose and glucose',
    'significantly cheaper than cane sugar, highly soluble, extends product shelf life, and enhances browning.',
    'Rapid blood glucose and insulin spikes, energy crash, appetite stimulation.',
    'Promotes hepatic de novo lipogenesis (fat accumulation in liver), visceral obesity, insulin resistance, and Type-2 Diabetes.',
    '{"diabetic": "HIGH_HAZARD", "cardiovascular": "HIGH_HAZARD", "pediatric": "HIGH_RISK"}'::jsonb
),

-- 3. Maltodextrin
(
    'i1000000-0000-0000-0000-000000000003',
    'Maltodextrin',
    'maltodextrin',
    'Polysaccharide Hydrolysate',
    'c1000000-0000-0000-0000-000000000007',
    'Food.Carbohydrates.Maltodextrin',
    'ULTRA_PROCESSED', TRUE, 'E1400', TRUE, FALSE, NULL,
    110, NULL, 'APPROVED', 'APPROVED', 'APPROVED',
    'Thickener, bulking agent, carrier, and mouthfeel improver',
    'Very cheap filler that improves texture without dramatically altering flavor profiles.',
    'Causes extreme glycemic spikes—higher glycemic index than pure table sugar (GI 110 vs 65).',
    'Alters gut microbiota composition, impairs intestinal mucous protective layer, promotes inflammatory bowel markers.',
    '{"diabetic": "CRITICAL_HAZARD", "gut_health": "MODERATE_HAZARD"}'::jsonb
),

-- 4. Monosodium Glutamate (MSG)
(
    'i1000000-0000-0000-0000-000000000004',
    'Monosodium Glutamate',
    'monosodium-glutamate',
    'Sodium 2-aminopentanedioate',
    'c1000000-0000-0000-0000-000000000002',
    'Food.Additives.FlavorEnhancers.MSG',
    'PROCESSED', TRUE, 'E621', FALSE, FALSE, NULL,
    0, 30.00, 'APPROVED', 'APPROVED', 'APPROVED',
    'Umami flavor enhancer',
    'Triggers taste receptors to perceive foods as savory and rich, compensating for low-quality real ingredients.',
    'Mild temporary symptoms in sensitive individuals ("MSG Symptom Complex": flushing, numbness, sweating).',
    'Generally recognized as safe (GRAS), but excessive consumption encourages overeating of hyper-palatable ultra-processed foods.',
    '{"hypertension": "MODERATE_RISK"}'::jsonb
),

-- 5. Red 40 (Allura Red AC)
(
    'i1000000-0000-0000-0000-000000000005',
    'Allura Red AC',
    'allura-red-ac',
    'Disodium 6-hydroxy-5-[(2-methoxy-5-methyl-4-sulfophenyl)azo]-2-naphthalenesulfonate',
    'c1000000-0000-0000-0000-000000000010',
    'Food.Additives.Colors.Red40',
    'ULTRA_PROCESSED', TRUE, 'E129', FALSE, FALSE, NULL,
    0, 7.00, 'APPROVED', 'APPROVED', 'RESTRICTED',
    'Synthetic petroleum-derived red azo dye',
    'Provides vibrant, stable red coloring to ultra-processed foods, candies, and beverages.',
    'Hypersensitivity, hives, facial swelling in rare cases.',
    'Linked to hyperactivity, ADHD symptoms, and behavioral issues in children (EU requires mandatory warning label: "May have an adverse effect on activity and attention in children").',
    '{"pediatric": "HIGH_HAZARD", "adhd_prone": "HIGH_HAZARD"}'::jsonb
),

-- 6. Sodium Benzoate
(
    'i1000000-0000-0000-0000-000000000006',
    'Sodium Benzoate',
    'sodium-benzoate',
    'Sodium Salt of Benzoic Acid',
    'c1000000-0000-0000-0000-000000000006',
    'Food.Additives.Preservatives.SodiumBenzoate',
    'PROCESSED', TRUE, 'E211', FALSE, FALSE, NULL,
    0, 5.00, 'APPROVED', 'APPROVED', 'APPROVED',
    'Antifungal and antibacterial preservative',
    'Inhibits yeast, mold, and bacterial growth in acidic environments (sodas, juices, pickles).',
    'Allergic reactions or worsening asthma in susceptible individuals.',
    'When combined with Vitamin C (Ascorbic Acid) under heat/light, reacts to form Benzene—a known human carcinogen.',
    '{"asthma": "MODERATE_RISK", "combined_ascorbic_acid": "HIGH_HAZARD"}'::jsonb
),

-- 7. Polysorbate 80
(
    'i1000000-0000-0000-0000-000000000007',
    'Polysorbate 80',
    'polysorbate-80',
    'Polyoxyethylene (20) sorbitan monooleate',
    'c1000000-0000-0000-0000-000000000005',
    'Food.Additives.Emulsifiers.Polysorbate80',
    'ULTRA_PROCESSED', TRUE, 'E433', FALSE, FALSE, NULL,
    0, 25.00, 'APPROVED', 'APPROVED', 'APPROVED',
    'Synthetic non-ionic emulsifier and dispersant',
    'Prevents ice crystals in ice cream, keeps oil/water blended in sauces, improves dough structure.',
    'Gastrointestinal irritation in high doses.',
    'Disrupts protective gut mucus layer, promotes low-grade intestinal inflammation, shifts microbiota toward pro-inflammatory strains.',
    '{"ibd_sufferers": "HIGH_HAZARD", "gut_health": "HIGH_HAZARD"}'::jsonb
),

-- 8. Peanut Protein / Peanuts
(
    'i1000000-0000-0000-0000-000000000008',
    'Peanuts',
    'peanuts',
    'Arachis hypogaea',
    'c1000000-0000-0000-0000-000000000009',
    'Food.Allergens.Peanuts',
    'UNPROCESSED', FALSE, NULL, FALSE, TRUE, 'PEANUT',
    14, NULL, 'APPROVED', 'APPROVED', 'APPROVED',
    'Nutritional legume seed (source of fat and protein)',
    'Primary constituent in peanut butter, snacks, and confectionery.',
    'In allergic individuals: hives, swelling, wheezing, or immediate life-threatening anaphylaxis.',
    'Safe and nutritious for non-allergic individuals; severe hazard for sensitized population.',
    '{"peanut_allergy": "CRITICAL_HAZARD"}'::jsonb
);


-- =============================================================================
-- 3. INGREDIENT ALIASES & SYNONYMS (FOR OCR & STANDARDIZATION ENGINE)
-- =============================================================================

INSERT INTO ingredient_aliases (ingredient_id, alias_name, language) VALUES
-- Aspartame Aliases
('i1000000-0000-0000-0000-000000000001', 'Aspartame', 'en'),
('i1000000-0000-0000-0000-000000000001', 'E951', 'en'),
('i1000000-0000-0000-0000-000000000001', 'INS 951', 'en'),
('i1000000-0000-0000-0000-000000000001', 'NutraSweet', 'en'),
('i1000000-0000-0000-0000-000000000001', 'Equal', 'en'),
('i1000000-0000-0000-0000-000000000001', 'Aspartyl-phenylalanine-1-methyl ester', 'en'),

-- HFCS Aliases
('i1000000-0000-0000-0000-000000000002', 'High Fructose Corn Syrup', 'en'),
('i1000000-0000-0000-0000-000000000002', 'HFCS', 'en'),
('i1000000-0000-0000-0000-000000000002', 'HFCS-55', 'en'),
('i1000000-0000-0000-0000-000000000002', 'HFCS-42', 'en'),
('i1000000-0000-0000-0000-000000000002', 'Glucose-Fructose Syrup', 'en'),
('i1000000-0000-0000-0000-000000000002', 'Isoglucose', 'en'),
('i1000000-0000-0000-0000-000000000002', 'Maize Syrup', 'en'),

-- Maltodextrin Aliases
('i1000000-0000-0000-0000-000000000003', 'Maltodextrin', 'en'),
('i1000000-0000-0000-0000-000000000003', 'E1400', 'en'),
('i1000000-0000-0000-0000-000000000003', 'Corn Maltodextrin', 'en'),
('i1000000-0000-0000-0000-000000000003', 'Tapioca Maltodextrin', 'en'),

-- MSG Aliases
('i1000000-0000-0000-0000-000000000004', 'Monosodium Glutamate', 'en'),
('i1000000-0000-0000-0000-000000000004', 'MSG', 'en'),
('i1000000-0000-0000-0000-000000000004', 'E621', 'en'),
('i1000000-0000-0000-0000-000000000004', 'INS 621', 'en'),
('i1000000-0000-0000-0000-000000000004', 'Monosodium L-Glutamate Monohydrate', 'en'),
('i1000000-0000-0000-0000-000000000004', 'Ajinomoto', 'en'),

-- Red 40 Aliases
('i1000000-0000-0000-0000-000000000005', 'Allura Red AC', 'en'),
('i1000000-0000-0000-0000-000000000005', 'Red 40', 'en'),
('i1000000-0000-0000-0000-000000000005', 'FD&C Red No. 40', 'en'),
('i1000000-0000-0000-0000-000000000005', 'E129', 'en'),
('i1000000-0000-0000-0000-000000000005', 'INS 129', 'en'),

-- Sodium Benzoate Aliases
('i1000000-0000-0000-0000-000000000006', 'Sodium Benzoate', 'en'),
('i1000000-0000-0000-0000-000000000006', 'E211', 'en'),
('i1000000-0000-0000-0000-000000000006', 'INS 211', 'en'),
('i1000000-0000-0000-0000-000000000006', 'Benzoate of Soda', 'en'),

-- Polysorbate 80 Aliases
('i1000000-0000-0000-0000-000000000007', 'Polysorbate 80', 'en'),
('i1000000-0000-0000-0000-000000000007', 'E433', 'en'),
('i1000000-0000-0000-0000-000000000007', 'Tween 80', 'en'),
('i1000000-0000-0000-0000-000000000007', 'Polyoxyethylene sorbitan monooleate', 'en'),

-- Peanut Aliases
('i1000000-0000-0000-0000-000000000008', 'Peanuts', 'en'),
('i1000000-0000-0000-0000-000000000008', 'Groundnuts', 'en'),
('i1000000-0000-0000-0000-000000000008', 'Monkey Nuts', 'en'),
('i1000000-0000-0000-0000-000000000008', 'Arachis Hypogaea', 'en');


-- =============================================================================
-- 4. KNOWLEDGE GRAPH RELATIONSHIPS (GRAPH EDGES)
-- =============================================================================

INSERT INTO ingredient_relationships (source_ingredient_id, target_ingredient_id, relationship_type, description) VALUES
-- HFCS -> Maltodextrin (Synergistic Glucogenic Impact)
('i1000000-0000-0000-0000-000000000002', 'i1000000-0000-0000-0000-000000000003', 'SYNERGISTIC_WITH', 'When combined in ultra-processed snacks, HFCS and Maltodextrin create ultra-rapid glycemic spikes and excessive pancreatic beta-cell strain.'),

-- Sodium Benzoate -> Chemical synergy warning
('i1000000-0000-0000-0000-000000000006', 'i1000000-0000-0000-0000-000000000005', 'CO_OCCURS_IN_UPF', 'Frequently combined in commercial soft drinks with artificial dyes.');


-- =============================================================================
-- 5. RESEARCH STUDIES & EVIDENCE BASE
-- =============================================================================

INSERT INTO research_studies (ingredient_id, title, journal, publication_year, doi, pubmed_id, summary, evidence_level) VALUES
(
    'i1000000-0000-0000-0000-000000000001',
    'IARC Monographs evaluate the carcinogenicity of aspartame, methyleugenol, and acetochlor',
    'The Lancet Oncology',
    2023,
    '10.1016/S1470-2045(23)00341-8',
    '37454320',
    'WHO International Agency for Research on Cancer (IARC) classified aspartame as "possibly carcinogenic to humans" (Group 2B) based on limited evidence for hepatocellular carcinoma.',
    'EXPERT_CONSENSUS'
),
(
    'i1000000-0000-0000-0000-000000000002',
    'Dietary fructose and the metabolic syndrome',
    'Current Opinion in Gastroenterology',
    2010,
    '10.1097/MOG.0b013e32833612f0',
    '20078200',
    'High-fructose corn syrup bypasses the rate-limiting phosphofructokinase step in glycolysis, leading to unregulated hepatic lipid synthesis and insulin resistance.',
    'META_ANALYSIS'
),
(
    'i1000000-0000-0000-0000-000000000007',
    'Dietary emulsifiers impact the mouse gut microbiota promoting colitis and metabolic syndrome',
    'Nature',
    2015,
    '10.1038/nature14232',
    '25731162',
    'Low concentrations of Polysorbate-80 and carboxymethylcellulose induce bacterial translocation across human gut epithelium and promote inflammation.',
    'ANIMAL_STUDY'
);

COMMIT;