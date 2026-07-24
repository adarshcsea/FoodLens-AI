package com.foodlens.engine.controller;

import com.foodlens.engine.dto.MatchRequest;
import com.foodlens.engine.dto.MatchedIngredientDTO;
import com.foodlens.engine.service.IngredientParserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ingredients")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Update for production origin
public class IngredientMatchController {

    private final IngredientParserService parserService;

    @PostMapping("/match")
    public ResponseEntity<List<MatchedIngredientDTO>> matchIngredients(
            @Valid @RequestBody MatchRequest request) {
        
        List<MatchedIngredientDTO> matched = parserService.parseAndMatch(request.rawText());
        return ResponseEntity.ok(matched);
    }
}