import { useEffect, useRef, useState } from 'react';
import { FaCirclePause, FaPlay, FaRotateLeft, FaSliders } from 'react-icons/fa6';
import '../../styles/focus-timer.css';

const presets = [
  { label: 'Sprint', focusDuration: 20, breakDuration: 5 },
  { label: 'Classic', focusDuration: 25, breakDuration: 5 },
  { label: 'Deep Work', focusDuration: 45, breakDuration: 10 },
];

function formatTimer(secondsLeft) {
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateFloatingTimerWindow(floatingWindow, { mode, progress, status, time }) {
  if (!floatingWindow || floatingWindow.closed) {
    return;
  }

  floatingWindow.document.querySelector('[data-floating-time]').textContent = time;
  floatingWindow.document.querySelector('[data-floating-mode]').textContent = mode;
  floatingWindow.document.querySelector('[data-floating-status]').textContent = status;
  floatingWindow.document.querySelector('[data-floating-dial]').style.setProperty('--progress', `${progress}%`);
}

function FocusTimer({ focusDuration, breakDuration, onUpdateSettings, onSessionComplete }) {
  const floatingWindowRef = useRef(null);
  const [mode, setMode] = useState('Focus');
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState({
    focusDuration,
    breakDuration,
  });
  const [notification, setNotification] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isFloatingTimerActive, setIsFloatingTimerActive] = useState(false);

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
  const displayTime = formatTimer(timeLeft);
  const floatingStatus = isRunning ? 'Running' : 'Paused';

  useEffect(() => {
    const floatingWindow = floatingWindowRef.current;

    if (!floatingWindow || floatingWindow.closed) {
      if (isFloatingTimerActive) {
        setIsFloatingTimerActive(false);
      }
      return;
    }

    updateFloatingTimerWindow(floatingWindow, {
      mode,
      progress: Math.max(progress, 0),
      status: floatingStatus,
      time: displayTime,
    });
  }, [displayTime, floatingStatus, isFloatingTimerActive, mode, progress]);

  useEffect(() => () => {
    if (floatingWindowRef.current && !floatingWindowRef.current.closed) {
      floatingWindowRef.current.close();
    }
  }, []);

  const openFloatingTimer = async ({ notifyOnError = true, status = floatingStatus } = {}) => {
    if (!('documentPictureInPicture' in window)) {
      if (notifyOnError) {
        setNotification('Floating timer is not supported in this browser. Use Chrome or Edge for the popup.');
      }
      return false;
    }

    if (floatingWindowRef.current && !floatingWindowRef.current.closed) {
      floatingWindowRef.current.focus();
      return true;
    }

    try {
      const floatingWindow = await window.documentPictureInPicture.requestWindow({
        width: 220,
        height: 220,
      });

      floatingWindowRef.current = floatingWindow;
      floatingWindow.document.title = 'MindMate Timer';
      floatingWindow.document.body.innerHTML = `
        <main class="floating-timer">
          <div class="floating-timer__dial" data-floating-dial>
            <div class="floating-timer__inner">
              <span data-floating-status>Paused</span>
              <strong data-floating-time>00:00</strong>
              <small data-floating-mode>Focus</small>
            </div>
          </div>
        </main>
      `;

      const style = floatingWindow.document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; }
        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          overflow: hidden;
          background: transparent;
          font-family: Inter, Arial, sans-serif;
        }
        .floating-timer {
          width: 100vw;
          height: 100vh;
          display: grid;
          place-items: center;
          background: #eef5ef;
        }
        .floating-timer__dial {
          --progress: 0%;
          width: min(88vw, 185px);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          padding: 12px;
          border-radius: 50%;
          background: conic-gradient(from 180deg, #4f7f7f 0 var(--progress), #d4e4d5 var(--progress) 100%);
          box-shadow: 0 18px 34px rgba(43, 79, 79, 0.22);
        }
        .floating-timer__inner {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          padding: 18px;
          border-radius: 50%;
          background: #fbf8f3;
          color: #253737;
          text-align: center;
        }
        .floating-timer__inner span {
          color: #6b7d74;
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .floating-timer__inner strong {
          font-size: 2.2rem;
          line-height: 1;
        }
        .floating-timer__inner small {
          color: #4f7f7f;
          font-size: 0.86rem;
          font-weight: 800;
        }
      `;
      floatingWindow.document.head.append(style);

      floatingWindow.addEventListener('pagehide', () => {
        floatingWindowRef.current = null;
        setIsFloatingTimerActive(false);
      });

      setIsFloatingTimerActive(true);
      updateFloatingTimerWindow(floatingWindow, {
        mode,
        progress: Math.max(progress, 0),
        status,
        time: displayTime,
      });
      return true;
    } catch (error) {
      console.error('Failed to open floating timer.', error);
      if (notifyOnError) {
        setNotification('Floating timer could not be opened. Please allow the browser popup and try again.');
      }
      return false;
    }
  };

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const stopTimer = () => {
      setIsRunning(false);
      setNotification('Timer paused because you left the focus tab.');
      openFloatingTimer({ notifyOnError: false, status: 'Paused' });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, openFloatingTimer]);

  const handleStart = () => {
    setIsRunning(true);
  };

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
                {displayTime}
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
            <button className="btn btn--primary" type="button" onClick={handleStart}>
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
