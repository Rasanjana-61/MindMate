package com.mindmate.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record FocusSessionRequest(
        @NotBlank
        String mode,

        @NotNull
        @Min(1)
        Integer completedMinutes,

        LocalDateTime completedAt
) {
}
