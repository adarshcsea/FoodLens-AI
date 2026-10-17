package com.foodlens.engine.repository;

import com.foodlens.engine.model.IngredientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface KnowledgeGraphRepository extends JpaRepository<IngredientEntity, UUID> {

    @Query(value = """
        SELECT
            i.id::text AS source_id,
            i.canonical_name AS source_label,
            'INGREDIENT' AS source_type,
            'NONE' AS source_severity,
            c.id::text AS target_id,
            c.name AS target_label,
            'CONDITION' AS target_type,
            c.severity_level,
            r.relationship_type,
            r.evidence_level
        FROM ingredients i
        JOIN ingredient_condition_relationships r ON i.id = r.ingredient_id
        JOIN medical_conditions c ON c.id = r.condition_id
        WHERE i.id = :ingredientId
          AND :maxDepth >= 1
        """, nativeQuery = true)
    List<Object[]> findMetabolicPathwayByIngredientId(
        @Param("ingredientId") UUID ingredientId, 
        @Param("maxDepth") int maxDepth
    );
}