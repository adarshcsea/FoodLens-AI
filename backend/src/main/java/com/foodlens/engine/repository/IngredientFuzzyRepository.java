package com.foodlens.engine.repository;

import com.foodlens.engine.model.IngredientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IngredientFuzzyRepository extends JpaRepository<IngredientEntity, UUID> {

    @Query(value = """
        SELECT DISTINCT i.id, 
               i.canonical_name, 
               i.ins_e_number, 
               i.is_hidden_sugar, 
               i.nova_group::text AS processing_level,
               GREATEST(
                   similarity(i.canonical_name, :token),
                   COALESCE((SELECT MAX(similarity(a.alias_name, :token)) 
                             FROM ingredient_aliases a WHERE a.ingredient_id = i.id), 0.0)
               ) AS match_score
        FROM ingredients i
        WHERE similarity(i.canonical_name, :token) >= :threshold
           OR EXISTS (
               SELECT 1 FROM ingredient_aliases a 
               WHERE a.ingredient_id = i.id AND similarity(a.alias_name, :token) >= :threshold
           )
           OR LOWER(i.ins_e_number) = LOWER(:token)
        ORDER BY match_score DESC
        LIMIT 5
        """, nativeQuery = true)
    List<Object[]> findFuzzyMatchesForToken(@Param("token") String token, @Param("threshold") double threshold);
}