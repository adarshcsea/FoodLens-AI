package com.foodlens.engine.dto;

import java.util.List;

public record KnowledgeGraphResponseDTO(
    List<GraphNodeDTO> nodes,
    List<GraphEdgeDTO> edges
) {}