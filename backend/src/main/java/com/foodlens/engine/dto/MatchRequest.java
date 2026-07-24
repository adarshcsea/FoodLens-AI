package com.foodlens.engine.dto;

import jakarta.validation.constraints.NotBlank;

public record MatchRequest(
    @NotBlank(message = "Raw OCR text must not be blank")
    String rawText
) {}