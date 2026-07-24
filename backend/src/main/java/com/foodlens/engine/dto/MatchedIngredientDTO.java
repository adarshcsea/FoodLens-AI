package com.foodlens.engine.dto;

import java.util.UUID;

public record MatchedIngredientDTO(
    String rawToken,
    UUID ingredientId,
    String matchedName,
    Double matchConfidence,
    Boolean isAdditive,
    Boolean isHiddenSugar,
    Boolean isAllergen
) {}