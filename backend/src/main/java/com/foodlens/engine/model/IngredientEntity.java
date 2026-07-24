package com.foodlens.engine.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "ingredients")
@Getter
@Setter
public class IngredientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "canonical_name", nullable = false, unique = true)
    private String canonicalName;

    @Column(name = "ins_e_code")
    private String insECode;

    @Column(name = "is_hidden_sugar")
    private boolean isHiddenSugar;

    @Column(name = "processing_level")
    private String processingLevel;
}