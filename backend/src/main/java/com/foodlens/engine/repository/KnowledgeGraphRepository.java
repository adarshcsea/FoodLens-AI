package com.foodlens.engine.repository;

import com.foodlens.engine.model.IngredientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface KnowledgeGraphRepository extends JpaRepository<IngredientEntity, UUID> {

    @Query(value = """
        WITH RECURSIVE metabolic_pathway AS (
            -- Base Case: Direct impacts from matched ingredient
            SELECT 
                i.id::text AS source_id,
                i.canonical_name AS source_label,
                'INGREDIENT' AS source_type,
                'NONE' AS source_severity,
                m.target_id::text AS target_id,
                m.target_label,
                m.target_type,
                m.severity_level,
                m.relationship_type,
                m.evidence_strength,
                1 AS depth
            FROM ingredients i
            JOIN metabolic_relationships m ON i.id = m.source_id
            WHERE i.id = :ingredientId

            UNION ALL

            -- Recursive Step: Multi-tier cascade impacts
            SELECT 
                m_curr.source_id::text AS source_id,
                m_curr.source_label,
                m_curr.source_type,
                m_curr.source_severity,
                m_next.target_id::text AS target_id,
                m_next.target_label,
                m_next.target_type,
                m_next.severity_level,
                m_next.relationship_type,
                m_next.evidence_strength,
                p.depth + 1
            FROM metabolic_pathway p
            JOIN metabolic_relationships m_curr ON p.target_id = m_curr.source_id::text
            JOIN metabolic_relationships m_next ON m_curr.target_id = m_next.source_id
            WHERE p.depth < :maxDepth
        )
        SELECT DISTINCT 
            source_id, source_label, source_type, source_severity,
            target_id, target_label, target_type, severity_level,
            relationship_type, evidence_strength
        FROM metabolic_pathway;
        """, nativeQuery = true)
    List<Object[]> findMetabolicPathwayByIngredientId(
        @Param("ingredientId") UUID ingredientId, 
        @Param("maxDepth") int maxDepth
    );
}