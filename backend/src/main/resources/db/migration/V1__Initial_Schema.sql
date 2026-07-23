-- =============================================================================
-- Migration: V1__Initial_Schema.sql
-- Description: Core Schema for FoodLens AI Platform
-- Target Database: PostgreSQL 15+ (Supabase compatible)
-- =============================================================================

-- Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "ltree";          -- For Knowledge Graph Hierarchies
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For Fuzzy Text & Ingredient Searching
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- For Composite GIN Indexing

-- =============================================================================
-- 1. ENUMS & DOMAIN TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM ('USER', 'CONTRIBUTOR', 'MODERATOR', 'ADMIN');
CREATE TYPE processing_level AS ENUM ('UNPROCESSED', 'PROCESSED_CULINARY', 'PROCESSED', 'ULTRA_PROCESSED');
CREATE TYPE regulatory_status AS ENUM ('APPROVED', 'RESTRICTED', 'BANNED', 'UNDER_REVIEW');
CREATE TYPE score_grade AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'HAZARDOUS');
CREATE TYPE scan_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- =============================================================================
-- 2. CORE USER & SECURITY MANAGEMENT
-- =============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable for pure OAuth users
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'USER',
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Gamification & Reputation
    xp_points INT NOT NULL DEFAULT 0,
    reputation_score INT NOT NULL DEFAULT 100,
    current_level INT NOT NULL DEFAULT 1,
    
    -- Metadata & Auditing
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_xp ON users(xp_points DESC);

-- User Health Profiles (Powers Personalized Scoring Engine)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    birth_year INT CHECK (birth_year >= 1900 AND birth_year <= EXTRACT(YEAR FROM CURRENT_TIMESTAMP)),
    gender VARCHAR(20),
    country_code VARCHAR(3) DEFAULT 'IND',
    
    -- Physiological States & Dietary Profiles
    is_pregnant BOOLEAN DEFAULT FALSE,
    is_lactating BOOLEAN DEFAULT FALSE,
    dietary_preference VARCHAR(50), -- e.g., VEGAN, VEGETARIAN, PALEO, KETO
    
    -- JSON Storage for Flexible Dynamic Conditions & Goal Tracking
    medical_conditions JSONB DEFAULT '[]'::jsonb, -- e.g., ["DIABETES_TYPE_2", "HYPERTENSION"]
    allergies JSONB DEFAULT '[]'::jsonb,           -- e.g., ["PEANUT", "LACTOSE", "SOY"]
    custom_avoidances JSONB DEFAULT '[]'::jsonb,    -- e.g., ["PALM_OIL", "ARTIFICIAL_COLORS"]
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_conditions ON user_profiles USING gin (medical_conditions);
CREATE INDEX idx_user_profiles_allergies ON user_profiles USING gin (allergies);

-- Family Members Profile (Family Mode)
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL, -- e.g., CHILD, SPOUSE, PARENT
    birth_year INT,
    is_pregnant BOOLEAN DEFAULT FALSE,
    medical_conditions JSONB DEFAULT '[]'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_family_primary_user ON family_members(primary_user_id);

-- =============================================================================
-- 3. INGREDIENT & KNOWLEDGE GRAPH ENGINE
-- =============================================================================

CREATE TABLE ingredient_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    path LTREE NOT NULL, -- Path for hierarchy (e.g., Food.Additives.Emulsifiers)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_path_gist ON ingredient_categories USING gist(path);

CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    scientific_name VARCHAR(255),
    category_id UUID REFERENCES ingredient_categories(id) ON DELETE SET NULL,
    node_path LTREE, -- Position in visual knowledge graph
    
    -- Categorization Flags
    nova_group processing_level NOT NULL DEFAULT 'UNPROCESSED',
    is_additive BOOLEAN NOT NULL DEFAULT FALSE,
    ins_e_number VARCHAR(20), -- e.g., E951 for Aspartame
    is_hidden_sugar BOOLEAN NOT NULL DEFAULT FALSE,
    is_allergen BOOLEAN NOT NULL DEFAULT FALSE,
    allergen_category VARCHAR(100), -- e.g., NUTS, DAIRY, SOY
    
    -- Health & Safety Parameters
    glycemic_index INT CHECK (glycemic_index BETWEEN 0 AND 100),
    acceptable_daily_intake_mg_kg NUMERIC(8, 2), -- ADI in mg/kg body weight
    
    -- Regulatory Flags
    fda_status regulatory_status DEFAULT 'APPROVED',
    fssai_status regulatory_status DEFAULT 'APPROVED',
    efsa_status regulatory_status DEFAULT 'APPROVED',
    
    -- Detailed Safety Metrics & Explanations (Factual Grounding Data)
    purpose TEXT,
    why_companies_use_it TEXT,
    short_term_effects TEXT,
    long_term_effects TEXT,
    
    -- Risk Profile JSON Vectors
    demographic_risks JSONB DEFAULT '{}'::jsonb, -- {"pediatric": "HIGH", "pregnancy": "MODERATE"}
    
    -- Full Text Search Vector
    tsv TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(canonical_name, '') || ' ' || coalesce(scientific_name, '') || ' ' || coalesce(ins_e_number, ''))
    ) STORED,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredients_tsv ON ingredients USING gin(tsv);
CREATE INDEX idx_ingredients_slug ON ingredients(slug);
CREATE INDEX idx_ingredients_ins ON ingredients(ins_e_number) WHERE ins_e_number IS NOT NULL;
CREATE INDEX idx_ingredients_e_flags ON ingredients(is_additive, is_hidden_sugar, is_allergen);
CREATE INDEX idx_ingredients_node_path ON ingredients USING gist(node_path);

-- Synonyms and Aliases Engine (For Standardization Pipeline)
CREATE TABLE ingredient_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    alias_name VARCHAR(255) UNIQUE NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aliases_trgm ON ingredient_aliases USING gin(alias_name gin_trgm_ops);

-- Knowledge Graph Edges (Explicit Graphical Relationships)
CREATE TABLE ingredient_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    target_ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL, -- e.g., 'DERIVED_FROM', 'SYNERGISTIC_WITH', 'SUBSTITUTE_FOR', 'METABOLIZES_TO'
    description TEXT,
    CONSTRAINT check_self_relationship CHECK (source_ingredient_id <> target_ingredient_id),
    CONSTRAINT unique_ingredient_relationship UNIQUE (source_ingredient_id, target_ingredient_id, relationship_type)
);

CREATE INDEX idx_rel_source ON ingredient_relationships(source_ingredient_id);
CREATE INDEX idx_rel_target ON ingredient_relationships(target_ingredient_id);

-- Scientific Evidence & Citations
CREATE TABLE research_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    journal VARCHAR(255),
    publication_year INT,
    doi VARCHAR(255),
    pubmed_id VARCHAR(50),
    summary TEXT NOT NULL,
    evidence_level VARCHAR(50), -- e.g., META_ANALYSIS, CLINICAL_TRIAL, ANIMAL_STUDY
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_studies_ingredient ON research_studies(ingredient_id);

-- =============================================================================
-- 4. PRODUCTS & SCAN ENGINE
-- =============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode VARCHAR(100) UNIQUE,
    brand VARCHAR(150),
    product_name VARCHAR(255) NOT NULL,
    front_image_url TEXT,
    ingredients_image_url TEXT,
    serving_size_g NUMERIC(6,2),
    
    -- Processing Metrics
    nova_score INT CHECK (nova_score BETWEEN 1 AND 4),
    overall_grade score_grade,
    
    -- Full Text Search
    tsv TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(product_name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(barcode, ''))
    ) STORED,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_tsv ON products USING gin(tsv);

-- Scan Executions (Historical Scan Records)
CREATE TABLE product_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    raw_ocr_text TEXT,
    extracted_text TEXT,
    status scan_status NOT NULL DEFAULT 'PENDING',
    execution_time_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scans_user ON product_scans(user_id);
CREATE INDEX idx_scans_product ON product_scans(product_id);

-- Junction Table: Product-Ingredient Mapping with Sequence Order
CREATE TABLE product_ingredients (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    position_order INT NOT NULL, -- Position order in ingredients list (First item = highest proportion)
    percentage_concentration NUMERIC(5,2), -- If explicitly declared on label
    PRIMARY KEY (product_id, ingredient_id)
);

CREATE INDEX idx_product_ingredients_pos ON product_ingredients(product_id, position_order);

-- =============================================================================
-- 5. EXPLAINABLE HEALTH ENGINE SCORING VECTORS
-- =============================================================================

CREATE TABLE product_health_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Individual Sub-Scores (0 to 100 Range)
    processing_score INT CHECK (processing_score BETWEEN 0 AND 100),
    additive_score INT CHECK (additive_score BETWEEN 0 AND 100),
    sugar_score INT CHECK (sugar_score BETWEEN 0 AND 100),
    allergen_score INT CHECK (allergen_score BETWEEN 0 AND 100),
    cardiovascular_score INT CHECK (cardiovascular_score BETWEEN 0 AND 100),
    diabetic_safety_score INT CHECK (diabetic_safety_score BETWEEN 0 AND 100),
    pediatric_safety_score INT CHECK (pediatric_safety_score BETWEEN 0 AND 100),
    maternal_safety_score INT CHECK (maternal_safety_score BETWEEN 0 AND 100),
    
    -- Complete Explanatory Vector (Breakdown & Justification Arrays)
    score_explanations JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_scores_product ON product_health_scores(product_id);

-- =============================================================================
-- 6. COMMUNITY, CROWDSOURCING & GAMIFICATION
-- =============================================================================

CREATE TABLE community_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'PRODUCT', 'INGREDIENT', 'RESEARCH'
    target_id UUID NOT NULL,
    proposed_changes JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    reviewer_id UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_contributions_status ON community_contributions(status);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_code VARCHAR(50) NOT NULL, -- e.g., 'FIRST_SCAN', 'ALLERGEN_HUNTER', 'RESEARCHER'
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_code)
);

CREATE TABLE system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    payload JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_action ON system_audit_logs(action_type);
CREATE INDEX idx_audit_logs_created ON system_audit_logs(created_at DESC);

-- Trigger to automatic updated_at maintenance
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_update_user_profiles_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_update_ingredients_timestamp BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_update_products_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();