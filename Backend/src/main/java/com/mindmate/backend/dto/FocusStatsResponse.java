package com.mindmate.backend.dto;

import java.util.List;

public record FocusStatsResponse(
        Integer todayMinutes,
        Integer weekMinutes,
        Integer streak,
        Integer completedSessions,
        List<WeeklyTrendItem> weeklyTrend
) {
}
