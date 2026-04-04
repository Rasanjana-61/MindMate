package com.mindmate.backend.dto;

public record TaskResponse(
        String id,
        String title,
        String description,
        String course,
        Integer estimatedPomodoros,
        String nextAction,
        String priority,
        String status
) {
}
