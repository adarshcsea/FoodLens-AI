package com.foodlens.engine.service;
import com.foodlens.engine.dto.MatchedIngredientDTO;
import com.foodlens.engine.repository.IngredientFuzzyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IngredientParserServiceTest {

    @Mock
    private IngredientFuzzyRepository fuzzyRepository;

    private IngredientParserService parserService;

    @BeforeEach
    void setUp() {
        parserService = new IngredientParserService(fuzzyRepository);
    }

    @Test
    void parseAndMatch_ShouldStripPrefixAndResolveFuzzyMatch() {
        String rawInput = "High Fructos Corn Sirup";
        UUID mockId = UUID.randomUUID();

        // Mock DB return array matching query select columns:
        // [0: id, 1: canonical_name, 2: score, 3: is_additive, 4: is_hidden_sugar, 5: is_allergen]
        Object[] mockResult = new Object[]{
            mockId.toString(), "High Fructose Corn Syrup", 0.82, false, true, false
        };

        when(fuzzyRepository.findFuzzyMatchesForToken(anyString(), anyDouble()))
                .thenReturn(List.<Object[]>of(mockResult));

        List<MatchedIngredientDTO> results = parserService.parseAndMatch(rawInput);

        assertFalse(results.isEmpty());
        assertEquals("High Fructose Corn Syrup", results.get(0).matchedName());
        assertTrue(results.get(0).isHiddenSugar());
    }
}