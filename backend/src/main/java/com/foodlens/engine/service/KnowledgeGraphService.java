package com.foodlens.engine.service;

import com.foodlens.engine.dto.GraphEdgeDTO;
import com.foodlens.engine.dto.GraphNodeDTO;
import com.foodlens.engine.dto.KnowledgeGraphResponseDTO;
import com.foodlens.engine.repository.KnowledgeGraphRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class KnowledgeGraphService {

    private final KnowledgeGraphRepository knowledgeGraphRepository;

    public KnowledgeGraphService(KnowledgeGraphRepository knowledgeGraphRepository) {
        this.knowledgeGraphRepository = knowledgeGraphRepository;
    }

    public KnowledgeGraphResponseDTO getMetabolicPathway(UUID ingredientId, int maxDepth) {
        List<Object[]> rawPaths = knowledgeGraphRepository.findMetabolicPathwayByIngredientId(
            ingredientId, 
            Math.min(maxDepth, 5) // Cap depth at 5
        );

        Map<String, GraphNodeDTO> nodeMap = new HashMap<>();
        List<GraphEdgeDTO> edges = new ArrayList<>();

        for (Object[] row : rawPaths) {
            String sourceId = (String) row[0];
            String sourceLabel = (String) row[1];
            String sourceType = (String) row[2];
            String sourceSeverity = (String) row[3];

            String targetId = (String) row[4];
            String targetLabel = (String) row[5];
            String targetType = (String) row[6];
            String targetSeverity = (String) row[7];

            String relationship = (String) row[8];
            String evidenceStrength = (String) row[9];

            nodeMap.putIfAbsent(sourceId, new GraphNodeDTO(sourceId, sourceLabel, sourceType, sourceSeverity));
            nodeMap.putIfAbsent(targetId, new GraphNodeDTO(targetId, targetLabel, targetType, targetSeverity));

            edges.add(new GraphEdgeDTO(sourceId, targetId, relationship, evidenceStrength));
        }

        return new KnowledgeGraphResponseDTO(new ArrayList<>(nodeMap.values()), edges);
    }
}