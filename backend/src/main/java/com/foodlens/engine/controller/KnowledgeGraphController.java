package com.foodlens.engine.controller;

import com.foodlens.engine.dto.KnowledgeGraphResponseDTO;
import com.foodlens.engine.service.KnowledgeGraphService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/graph")
@CrossOrigin(origins = "*")
public class KnowledgeGraphController {

    private final KnowledgeGraphService knowledgeGraphService;

    public KnowledgeGraphController(KnowledgeGraphService knowledgeGraphService) {
        this.knowledgeGraphService = knowledgeGraphService;
    }

    @GetMapping("/metabolic-pathway/{ingredientId}")
    public ResponseEntity<KnowledgeGraphResponseDTO> getMetabolicPathway(
            @PathVariable UUID ingredientId,
            @RequestParam(defaultValue = "3") int depth) {
        return ResponseEntity.ok(knowledgeGraphService.getMetabolicPathway(ingredientId, depth));
    }
}