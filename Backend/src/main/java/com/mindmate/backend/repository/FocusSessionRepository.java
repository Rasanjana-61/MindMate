package com.mindmate.backend.repository;

import com.mindmate.backend.domain.FocusSession;
import com.mindmate.backend.domain.SessionMode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {

    long countByMode(SessionMode mode);

    List<FocusSession> findAllByCompletedAtBetween(LocalDateTime start, LocalDateTime end);

    List<FocusSession> findAllByModeAndCompletedAtBetween(SessionMode mode, LocalDateTime start, LocalDateTime end);

    List<FocusSession> findAllByModeOrderByCompletedAtDesc(SessionMode mode);
}
