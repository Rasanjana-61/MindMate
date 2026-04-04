package com.mindmate.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TaskRequest(
        @NotBlank
        @Size(min = 3, max = 120)
        String title,

        @NotBlank
        @Size(min = 10, max = 600)
        String description,

        @NotBlank
        @Size(min = 2, max = 60)
        String course,

        @NotNull
        @Min(1)
        @Max(8)
        Integer estimatedPomodoros,

        @NotBlank
        @Size(min = 5, max = 255)
        String nextAction,

        @NotBlank
        String priority,

        @NotBlank
        String status
) {
}
