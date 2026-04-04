import { useEffect, useState } from 'react';
import { FaCirclePause, FaPlay, FaRotateLeft, FaSliders } from 'react-icons/fa6';
import '../../styles/focus-timer.css';

const presets = [
  { label: 'Sprint', focusDuration: 20, breakDuration: 5 },
  { label: 'Classic', focusDuration: 25, breakDuration: 5 },
  { label: 'Deep Work', focusDuration: 45, breakDuration: 10 },
];

function FocusTimer({ focusDuration, breakDuration, onUpdateSettings, onSessionComplete }) {
  const [mode, setMode] = useState('Focus');
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState({
    focusDuration,
    breakDuration,
  });
  const [notification, setNotification] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setSettings({ focusDuration, breakDuration });
  }, [breakDuration, focusDuration]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime > 1) {
          return currentTime - 1;
        }

        window.clearInterval(timer);
        const completedMode = mode;
        const completedMinutes = completedMode === 'Focus' ? settings.focusDuration : settings.breakDuration;

        setNotification(
          completedMode === 'Focus'
            ? 'Focus session complete. Take a mindful break.'
            : 'Break finished. You are ready for the next focus round.'
        );
        setMode((currentMode) => (currentMode === 'Focus' ? 'Break' : 'Focus'));
        setIsRunning(false);
        onSessionComplete(completedMode, completedMinutes);

        return completedMode === 'Focus' ? settings.breakDuration * 60 : settings.focusDuration * 60;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, mode, onSessionComplete, settings.breakDuration, settings.focusDuration]);

  const totalSeconds = mode === 'Focus' ? settings.focusDuration * 60 : settings.breakDuration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const numericValue = Number(value);

    setSettings((currentSettings) => ({
      ...currentSettings,
      [name]: Number.isNaN(numericValue) ? currentSettings[name] : numericValue,
    }));
  };

  const applySettings = async () => {
    const nextSettings = {
      focusDuration: Math.min(Math.max(settings.focusDuration, 10), 90),
      breakDuration: Math.min(Math.max(settings.breakDuration, 5), 30),
    };

    setIsSavingSettings(true);

    try {
      await onUpdateSettings(nextSettings);
      setSettings(nextSettings);
      setMode('Focus');
      setTimeLeft(nextSettings.focusDuration * 60);
      setIsRunning(false);
      setNotification('Timer settings updated successfully.');
    } catch (error) {
      console.error('Failed to update timer settings.', error);
      setNotification('Failed to save timer settings. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setMode('Focus');
    setTimeLeft(settings.focusDuration * 60);
    setNotification('Timer reset. Start when you are ready.');
  };

  const applyPreset = (preset) => {
    setSettings({
      focusDuration: preset.focusDuration,
      breakDuration: preset.breakDuration,
    });
    setMode('Focus');
    setTimeLeft(preset.focusDuration * 60);
    setIsRunning(false);
    setNotification(`${preset.label} preset applied.`);
  };

  return (
    <section className="focus-timer panel">
      <div className="section-heading">
        <div>
          <h2>Pomodoro Focus Timer</h2>
          <p>Stay on task with guided focus and break cycles designed for academic work.</p>
        </div>
        <span className={`focus-timer__mode focus-timer__mode--${mode.toLowerCase()}`}>{mode} Mode</span>
      </div>

      <div className="focus-timer__content">
        <div className="focus-timer__clock-card">
          <div className="focus-timer__dial" style={{ '--progress': `${Math.max(progress, 0)}%` }}>
            <div className="focus-timer__dial-inner">
              <span className="focus-timer__label">Current session</span>
              <strong className="focus-timer__time">
                {minutes}:{seconds}
              </strong>
              <p className="focus-timer__hint">
                {mode === 'Focus'
                  ? 'Keep one clear study goal for this session.'
                  : 'Step away from the screen and reset your attention.'}
              </p>
            </div>
          </div>

          <div className="focus-timer__session-strip">
            <div>
              <span>Focus</span>
              <strong>{settings.focusDuration}m</strong>
            </div>
            <div>
              <span>Break</span>
              <strong>{settings.breakDuration}m</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{mode}</strong>
            </div>
          </div>

          <div className="focus-timer__actions">
            <button className="btn btn--primary" type="button" onClick={() => setIsRunning(true)}>
              <FaPlay /> Start
            </button>
            <button className="btn btn--ghost" type="button" onClick={() => setIsRunning(false)}>
              <FaCirclePause /> Pause
            </button>
            <button className="btn btn--soft" type="button" onClick={handleReset}>
              <FaRotateLeft /> Reset
            </button>
          </div>
        </div>

        <div className="focus-timer__settings">
          <div className="section-heading">
            <div>
              <h3>Session Settings</h3>
              <p>Adjust durations to match your revision intensity.</p>
            </div>
            <span className="pill">
              <FaSliders />
              Customizable
            </span>
          </div>

          <div className="focus-timer__presets">
            {presets.map((preset) => (
              <button
                key={preset.label}
                className={`focus-timer__preset ${
                  settings.focusDuration === preset.focusDuration && settings.breakDuration === preset.breakDuration
                    ? 'focus-timer__preset--active'
                    : ''
                }`}
                type="button"
                onClick={() => applyPreset(preset)}
              >
                <strong>{preset.label}</strong>
                <span>
                  {preset.focusDuration}/{preset.breakDuration}
                </span>
              </button>
            ))}
          </div>

          <div className="focus-timer__fields">
            <label>
              Focus duration (minutes)
              <input
                type="number"
                min="10"
                max="90"
                name="focusDuration"
                value={settings.focusDuration}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Break duration (minutes)
              <input
                type="number"
                min="5"
                max="30"
                name="breakDuration"
                value={settings.breakDuration}
                onChange={handleInputChange}
              />
            </label>
          </div>

          <div className="focus-timer__mini-stats">
            <div>
              <span>Progress</span>
              <strong>{Math.max(0, Math.round(progress))}%</strong>
            </div>
            <div>
              <span>Next break</span>
              <strong>{settings.breakDuration} min</strong>
            </div>
            <div>
              <span>Focus goal</span>
              <strong>{settings.focusDuration} min</strong>
            </div>
          </div>

          <button
            className="btn btn--primary focus-timer__apply"
            type="button"
            onClick={applySettings}
            disabled={isSavingSettings}
          >
            {isSavingSettings ? 'Saving...' : 'Save Timer Settings'}
          </button>

          {notification && <div className="focus-timer__notification">{notification}</div>}
        </div>
      </div>
    </section>
  );
}

export default FocusTimer;
