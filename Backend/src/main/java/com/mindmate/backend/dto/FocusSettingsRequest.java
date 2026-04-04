package com.mindmate.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record FocusSettingsRequest(
        @NotNull
        @Min(10)
        @Max(90)
        Integer focusDuration,

        @NotNull
        @Min(5)
        @Max(30)
        Integer breakDuration
) {
}
