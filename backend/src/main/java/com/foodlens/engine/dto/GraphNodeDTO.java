package com.foodlens.engine.dto;

public record GraphNodeDTO(
    String id,
    String label,
    String type,          // "INGREDIENT", "EFFECT", "CONDITION", "RISK"
    String severityLevel  // "LOW", "MODERATE", "HIGH", "CRITICAL"
) {}