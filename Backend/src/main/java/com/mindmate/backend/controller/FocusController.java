package com.mindmate.backend.controller;

import com.mindmate.backend.dto.FocusSessionRequest;
import com.mindmate.backend.dto.FocusSettingsRequest;
import com.mindmate.backend.dto.FocusSettingsResponse;
import com.mindmate.backend.dto.FocusStatsResponse;
import com.mindmate.backend.service.FocusService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/focus")
public class FocusController {

    private final FocusService focusService;

    public FocusController(FocusService focusService) {
        this.focusService = focusService;
    }

    @GetMapping("/settings")
    public FocusSettingsResponse getSettings() {
        return focusService.getSettings();
    }

    @PutMapping("/settings")
    public FocusSettingsResponse updateSettings(@Valid @RequestBody FocusSettingsRequest request) {
        return focusService.updateSettings(request);
    }

    @GetMapping("/stats")
    public FocusStatsResponse getStats() {
        return focusService.getStats();
    }

    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public void recordSession(@Valid @RequestBody FocusSessionRequest request) {
        focusService.recordSession(request);
    }
}
