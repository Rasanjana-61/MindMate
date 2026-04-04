package com.mindmate.backend.service;

import com.mindmate.backend.domain.FocusSession;
import com.mindmate.backend.domain.FocusSettings;
import com.mindmate.backend.domain.SessionMode;
import com.mindmate.backend.dto.FocusSessionRequest;
import com.mindmate.backend.dto.FocusSettingsRequest;
import com.mindmate.backend.dto.FocusSettingsResponse;
import com.mindmate.backend.dto.FocusStatsResponse;
import com.mindmate.backend.dto.WeeklyTrendItem;
import com.mindmate.backend.exception.BadRequestException;
import com.mindmate.backend.repository.FocusSessionRepository;
import com.mindmate.backend.repository.FocusSettingsRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class FocusService {

    private final FocusSettingsRepository focusSettingsRepository;
    private final FocusSessionRepository focusSessionRepository;

    public FocusService(FocusSettingsRepository focusSettingsRepository, FocusSessionRepository focusSessionRepository) {
        this.focusSettingsRepository = focusSettingsRepository;
        this.focusSessionRepository = focusSessionRepository;
    }

    public FocusSettingsResponse getSettings() {
        FocusSettings settings = getOrCreateSettings();
        return new FocusSettingsResponse(settings.getFocusDuration(), settings.getBreakDuration());
    }

    public FocusSettingsResponse updateSettings(FocusSettingsRequest request) {
        FocusSettings settings = getOrCreateSettings();
        settings.setFocusDuration(request.focusDuration());
        settings.setBreakDuration(request.breakDuration());
        FocusSettings saved = focusSettingsRepository.save(settings);
        return new FocusSettingsResponse(saved.getFocusDuration(), saved.getBreakDuration());
    }

    public FocusStatsResponse getStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.atTime(LocalTime.MAX);
        LocalDate weekStartDate = today.minusDays(6);
        LocalDateTime weekStart = weekStartDate.atStartOfDay();
        LocalDateTime weekEnd = endOfToday;

        List<FocusSession> todayFocusSessions = focusSessionRepository.findAllByModeAndCompletedAtBetween(
                SessionMode.FOCUS,
                startOfToday,
                endOfToday
        );
        List<FocusSession> weekFocusSessions = focusSessionRepository.findAllByModeAndCompletedAtBetween(
                SessionMode.FOCUS,
                weekStart,
                weekEnd
        );

        int todayMinutes = todayFocusSessions.stream().mapToInt(FocusSession::getDurationMinutes).sum();
        int weekMinutes = weekFocusSessions.stream().mapToInt(FocusSession::getDurationMinutes).sum();
        int completedSessions = (int) focusSessionRepository.countByMode(SessionMode.FOCUS);

        Map<DayOfWeek, Integer> minutesByDay = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek day : DayOfWeek.values()) {
            minutesByDay.put(day, 0);
        }
        for (FocusSession session : weekFocusSessions) {
            DayOfWeek day = session.getCompletedAt().getDayOfWeek();
            minutesByDay.put(day, minutesByDay.get(day) + session.getDurationMinutes());
        }

        List<WeeklyTrendItem> weeklyTrend = new ArrayList<>();
        weeklyTrend.add(new WeeklyTrendItem("Sun", minutesByDay.get(DayOfWeek.SUNDAY)));
        weeklyTrend.add(new WeeklyTrendItem("Mon", minutesByDay.get(DayOfWeek.MONDAY)));
        weeklyTrend.add(new WeeklyTrendItem("Tue", minutesByDay.get(DayOfWeek.TUESDAY)));
        weeklyTrend.add(new WeeklyTrendItem("Wed", minutesByDay.get(DayOfWeek.WEDNESDAY)));
        weeklyTrend.add(new WeeklyTrendItem("Thu", minutesByDay.get(DayOfWeek.THURSDAY)));
        weeklyTrend.add(new WeeklyTrendItem("Fri", minutesByDay.get(DayOfWeek.FRIDAY)));
        weeklyTrend.add(new WeeklyTrendItem("Sat", minutesByDay.get(DayOfWeek.SATURDAY)));

        return new FocusStatsResponse(todayMinutes, weekMinutes, calculateStreak(), completedSessions, weeklyTrend);
    }

    public void recordSession(FocusSessionRequest request) {
        SessionMode mode = parseMode(request.mode());
        FocusSession session = new FocusSession();
        session.setMode(mode);
        session.setDurationMinutes(request.completedMinutes());
        session.setCompletedAt(request.completedAt() == null ? LocalDateTime.now() : request.completedAt());
        focusSessionRepository.save(session);
    }

    private int calculateStreak() {
        List<FocusSession> sessions = focusSessionRepository.findAllByModeOrderByCompletedAtDesc(SessionMode.FOCUS).stream()
                .sorted(Comparator.comparing(FocusSession::getCompletedAt).reversed())
                .toList();

        if (sessions.isEmpty()) {
            return 0;
        }

        List<LocalDate> uniqueDates = sessions.stream()
                .map(session -> session.getCompletedAt().toLocalDate())
                .distinct()
                .toList();

        LocalDate cursor = uniqueDates.get(0);
        int streak = 0;
        for (LocalDate date : uniqueDates) {
            if (date.equals(cursor)) {
                streak++;
                cursor = cursor.minusDays(1);
                continue;
            }
            break;
        }
        return streak;
    }

    private FocusSettings getOrCreateSettings() {
        return focusSettingsRepository.findById(1L)
                .orElseGet(() -> focusSettingsRepository.save(new FocusSettings()));
    }

    private SessionMode parseMode(String value) {
        return switch (value.trim().toUpperCase()) {
            case "FOCUS" -> SessionMode.FOCUS;
            case "BREAK" -> SessionMode.BREAK;
            default -> throw new BadRequestException("Invalid session mode: " + value);
        };
    }
}
