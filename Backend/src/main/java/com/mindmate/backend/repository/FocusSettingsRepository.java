package com.mindmate.backend.repository;

import com.mindmate.backend.domain.FocusSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FocusSettingsRepository extends JpaRepository<FocusSettings, Long> {
}
