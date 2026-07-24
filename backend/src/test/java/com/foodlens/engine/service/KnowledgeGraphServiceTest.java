package com.foodlens.engine.service;

import com.foodlens.engine.dto.KnowledgeGraphResponseDTO;
import com.foodlens.engine.repository.KnowledgeGraphRepository;
import com.foodlens.engine.service.KnowledgeGraphService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KnowledgeGraphServiceTest {

    @Mock
    private KnowledgeGraphRepository graphRepository;

    @InjectMocks
    private KnowledgeGraphService graphService;

    @Test
    void getMetabolicPathway_ShouldConstructNodesAndEdges() {
        UUID rootId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        // Object array matching native query column select format:
        // [0: sourceId, 1: sourceLabel, 2: sourceType, 3: sourceSeverity,
        //  4: targetId, 5: targetLabel, 6: targetType, 7: targetSeverity,
        //  8: relationship, 9: evidenceStrength]
        Object[] mockRow = new Object[]{
            rootId.toString(), "High Fructose Corn Syrup", "INGREDIENT", "NONE",
            targetId.toString(), "Non-Alcoholic Fatty Liver", "CONDITION", "HIGH",
            "TRIGGERS", "STRONG"
        };

        when(graphRepository.findMetabolicPathwayByIngredientId(eq(rootId), anyInt()))
                .thenReturn(List.<Object[]>of(mockRow));

        KnowledgeGraphResponseDTO result = graphService.getMetabolicPathway(rootId, 3);

        assertNotNull(result);
        assertEquals(2, result.nodes().size()); // 1 Source + 1 Target Node
        assertEquals(1, result.edges().size());
        assertEquals("TRIGGERS", result.edges().get(0).relationship());
        assertEquals("STRONG", result.edges().get(0).evidenceStrength());
    }
}