package com.foodlens.engine.dto;

public record GraphEdgeDTO(
    String source,
    String target,
    String relationship,    // "TRIGGERS", "EXACERBATES", "LEADS_TO"
    String evidenceStrength // "STRONG", "MODERATE", "PRELIMINARY"
) {}