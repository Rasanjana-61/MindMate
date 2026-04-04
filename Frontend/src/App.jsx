import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { Dashboard } from './pages/Dashboard';
import { Dashboard as MoodDashboard } from './pages/Overview';
import { JournalEntry } from './pages/JournalEntry';
import { MoodHistory } from './pages/MoodHistory';
import { Results as MoodResults } from './pages/Results';
import { FocusTimer } from './pages/FocusTimer';
import { PeerSupport } from './pages/PeerSupport';
import { BookmarkedQuestions } from './pages/BookmarkedQuestions';
import { ResourceHub } from './pages/ResourceHub';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import { SummarizerDashboard } from './pages/summarizer/SummarizerDashboard';
import { VideoSummary } from './pages/summarizer/VideoSummary';
import { TextSummary } from './pages/summarizer/TextSummary';
import { FileSummary } from './pages/summarizer/FileSummary';
import {
  API_BASE_URL,
  clearToken,
  fetchCurrentUser,
  fetchNotifications,
  getToken,
  loginUser,
  logoutUser,
  markAllNotificationsRead,
  markNotificationRead,
  registerUser,
  saveToken,
} from './lib/auth';

export function App() {
  console.log("App component is rendering...");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const [authPage, setAuthPage] = useState('login');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [toastNotifications, setToastNotifications] = useState([]);
  const [chatbotData, setChatbotData] = useState(null);
  const [moodScreen, setMoodScreen] = useState('dashboard');
  const [moodAnalysisResult, setMoodAnalysisResult] = useState(null);
  const [moodSelectedJournalDate, setMoodSelectedJournalDate] = useState(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return undefined;
    }

    let isMounted = true;
    const socket = io(API_BASE_URL.replace(/\/api$/, ''), {
      auth: {
        token: getToken(),
      },
      transports: ['websocket'],
    });

    async function loadNotificationCenter() {
      try {
        const data = await fetchNotifications();
        if (!isMounted) {
          return;
        }
        setNotifications(data.notifications);
        setUnreadNotificationCount(data.unreadCount);
      } catch (error) {
        // Keep the app usable if notification sync fails.
      }
    }

    socket.on('notification:new', (notification) => {
      if (!isMounted) {
        return;
      }

      setNotifications((current) => [notification, ...current].slice(0, 20));
      setUnreadNotificationCount((current) => current + 1);
      setToastNotifications((current) => [...current, notification].slice(-4));
    });

    loadNotificationCenter();

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!toastNotifications.length) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setToastNotifications((current) => current.slice(1));
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [toastNotifications]);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
      setIsAuthenticated(false);
      setAuthPage('login');
      setCurrentPage('dashboard');
      setIsInitializing(false);
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleLoginSuccess = async (credentials) => {
    const data = await loginUser(credentials);
    saveToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleRegisterSuccess = async (registrationData) => {
    const data = await registerUser(registrationData);
    saveToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Clear local UI session even if the backend session was already gone.
    }
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
    setNotifications([]);
    setUnreadNotificationCount(0);
    setToastNotifications([]);
    setShowHome(true);
    setAuthPage('login');
    setCurrentPage('dashboard');
  };

  const handleUserUpdate = (nextUser) => {
    setUser(nextUser);
  };

  const handleMarkAllNotificationsRead = async () => {
    await markAllNotificationsRead();
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    setUnreadNotificationCount(0);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage === 'mood') {
      // Always open the mood module dashboard when selecting Mood from navigation.
      setMoodScreen('dashboard');
      setMoodSelectedJournalDate(null);
    }

    setCurrentPage(nextPage);
  };

  const handleMoodNavigate = (screen, options = {}) => {
    if (screen === 'journal') {
      setMoodSelectedJournalDate(options.entryDate ?? null);
    } else {
      setMoodSelectedJournalDate(null);
    }

    setMoodScreen(screen);
  };

  const handleMoodAnalysisComplete = (result) => {
    setMoodAnalysisResult(result);
    setMoodScreen('results');
  };

  const renderMoodModule = () => {
    switch (moodScreen) {
      case 'dashboard':
        return <MoodDashboard onNavigate={handleMoodNavigate} />;
      case 'journal':
        return (
          <JournalEntry
            onAnalysisComplete={handleMoodAnalysisComplete}
            initialEntryDate={moodSelectedJournalDate}
          />
        );
      case 'history':
        return <MoodHistory onNavigate={handleMoodNavigate} />;
      case 'results':
        return <MoodResults analysisResult={moodAnalysisResult} onNavigate={handleMoodNavigate} />;
      default:
        return <MoodDashboard onNavigate={handleMoodNavigate} />;
    }
  };

  const handleNotificationOpen = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
      } catch (error) {
        // Ignore secondary failures and continue navigation.
      }

      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
      );
      setUnreadNotificationCount((current) => Math.max(0, current - 1));
    }

    if (notification.linkPage) {
      handlePageChange(notification.linkPage);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-wellness-bg flex items-center justify-center">
        <div className="bg-white border border-wellness-border rounded-3xl px-8 py-6 shadow-xl shadow-wellness-blue/5 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-wellness-blue/30 border-t-wellness-blue rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-wellness-text">Restoring session...</span>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setPage={handlePageChange} userName={user?.name || 'User'} />;
      case 'mood':
        return renderMoodModule();
      case 'focus':
        return <FocusTimer user={user} />;
      case 'peer':
        return <PeerSupport user={user} />;
      case 'bookmarks':
        return <BookmarkedQuestions />;
      case 'resources':
        return <ResourceHub user={user} />;
      case 'profile':
        return <Profile user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
      case 'admin':
        return user?.role === 'admin' ? <AdminDashboard /> : <Dashboard setPage={handlePageChange} userName={user?.name || 'User'} />;
      case 'summarizer':
        return <SummarizerDashboard setPage={handlePageChange} />;
      case 'video-summary':
        return <VideoSummary setPage={handlePageChange} />;
      case 'text-summary':
        return <TextSummary setPage={handlePageChange} />;
      case 'file-summary':
        return <FileSummary setPage={handlePageChange} />;
      default:
        return <Dashboard setPage={handlePageChange} userName={user?.name || 'User'} />;
    }
  };

  if (!isAuthenticated) {
    if (showHome) {
      return (
        <HomePage
          onNavigateToLogin={() => setShowHome(false)}
          onNavigateToRegister={() => {
            setShowHome(false);
            setAuthPage('register');
          }}
        />
      );
    }

    if (authPage === 'login') {
      return (
        <Login
          onLogin={handleLoginSuccess}
          onNavigateToRegister={(data) => {
            if (data) setChatbotData(data);
            setAuthPage('register');
          }}
          onNavigateToHome={() => setShowHome(true)}
        />
      );
    }

    return (
      <Register
        onRegister={handleRegisterSuccess}
        onNavigateToLogin={() => setAuthPage('login')}
        chatbotData={chatbotData}
        onNavigateToHome={() => setShowHome(true)}
      />
    );
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Layout
        currentPage={currentPage}
        setPage={handlePageChange}
        user={user}
        onLogout={handleLogout}
        notifications={notifications}
        unreadNotificationCount={unreadNotificationCount}
        onOpenNotification={handleNotificationOpen}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        toastNotifications={toastNotifications}
      >
        {renderPage()}
      </Layout>
    </>
  );
}
