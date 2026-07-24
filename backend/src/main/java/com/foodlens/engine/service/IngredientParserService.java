package com.foodlens.engine.service;

import com.foodlens.engine.dto.MatchedIngredientDTO;
import com.foodlens.engine.repository.IngredientFuzzyRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IngredientParserService {

    private final IngredientFuzzyRepository fuzzyRepository;

    public IngredientParserService(IngredientFuzzyRepository fuzzyRepository) {
        this.fuzzyRepository = fuzzyRepository;
    }

    public List<MatchedIngredientDTO> parseAndMatch(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return Collections.emptyList();
        }

        String[] tokens = rawText.split("[,;\\n\\r]+");
        List<MatchedIngredientDTO> results = new ArrayList<>();
        Set<UUID> matchedIds = new HashSet<>();

        for (String token : tokens) {
            String normalizedToken = token.replaceAll("[():]", "").trim();
            if (normalizedToken.length() < 2) continue;

            List<Object[]> matches = fuzzyRepository.findFuzzyMatchesForToken(normalizedToken, 0.3);

            if (!matches.isEmpty()) {
                Object[] bestMatch = matches.get(0);
                UUID id = UUID.fromString(bestMatch[0].toString());

                if (!matchedIds.contains(id)) {
                    matchedIds.add(id);

                    // Must match MatchedIngredientDTO fields in exact order:
                    // (rawToken, ingredientId, matchedName, matchConfidence, isAdditive, isHiddenSugar, isAllergen)
                    results.add(new MatchedIngredientDTO(
                        normalizedToken,                         // rawToken (String)
                        id,                                      // ingredientId (UUID)
                        (String) bestMatch[1],                   // matchedName (String)
                        ((Number) bestMatch[2]).doubleValue(),   // matchConfidence (Double)
                        bestMatch[3] != null && (Boolean) bestMatch[3], // isAdditive (Boolean)
                        bestMatch[4] != null && (Boolean) bestMatch[4], // isHiddenSugar (Boolean)
                        bestMatch[5] != null && (Boolean) bestMatch[5]  // isAllergen (Boolean)
                    ));
                }
            }
        }

        return results;
    }
}