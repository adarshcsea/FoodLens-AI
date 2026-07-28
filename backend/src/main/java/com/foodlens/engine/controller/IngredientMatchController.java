package com.foodlens.engine.controller;

import com.foodlens.engine.dto.MatchedIngredientDTO;
import com.foodlens.engine.dto.MatchRequest;
import com.foodlens.engine.service.IngredientParserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ingredients")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class IngredientMatchController {

    private final IngredientParserService parserService;

    @PostMapping("/match")
    public ResponseEntity<Map<String, Object>> matchIngredients(@RequestBody MatchRequest request) {
        List<MatchedIngredientDTO> matched = parserService.parseAndMatch(request.getRawText());
        
        Map<String, Object> response = new HashMap<>();
        response.put("matchedIngredients", matched);
        
        // Return default scores structure so frontend hydration doesn't fail
        Map<String, Object> healthScores = new HashMap<>();
        healthScores.put("overallGrade", "GOOD");
        healthScores.put("novaGroup", 3);
        healthScores.put("processingScore", 65);
        healthScores.put("additiveScore", 80);
        healthScores.put("sugarScore", 70);
        healthScores.put("cardiovascularScore", 75);
        healthScores.put("diabeticSafetyScore", 60);
        healthScores.put("pediatricSafetyScore", 55);
        healthScores.put("maternalSafetyScore", 85);
        healthScores.put("deductions", List.of());

        response.put("healthScores", healthScores);

        return ResponseEntity.ok(response);
    }
}