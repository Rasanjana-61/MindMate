import React from "react";
import { useAuthStore } from "../lib/auth";
import { Footer } from "../components/Footer";

export function HomePage({ onNavigateToLogin = () => {}, onNavigateToRegister = () => {} }) {
  const { isAuthenticated } = useAuthStore();

  return (
    <main className="overflow-hidden" style={{ backgroundColor: "#FBF8F3" }}>
      {/* =====================================
         Header Navigation
      ====================================== */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#7BAE7F' }}>
              M
            </div>
            <span className="text-xl font-bold text-slate-900">MindMate</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#features" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-medium text-slate-600 transition" style={{ color: '#5F705F' }}
              onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
              onMouseLeave={(e) => e.target.style.color = '#5F705F'}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-medium text-slate-600 transition" style={{ color: '#5F705F' }}
              onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
              onMouseLeave={(e) => e.target.style.color = '#5F705F'}
            >
              How It Works
            </a>
            <a 
              href="#benefits" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-medium text-slate-600 transition" style={{ color: '#5F705F' }}
              onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
              onMouseLeave={(e) => e.target.style.color = '#5F705F'}
            >
              Benefits
            </a>
            <a href="#" className="text-sm font-medium text-slate-600 transition" style={{ color: '#5F705F' }}
              onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
              onMouseLeave={(e) => e.target.style.color = '#5F705F'}>
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToLogin}
              className="px-4 py-2 text-sm font-medium text-slate-700 transition" style={{ color: '#5F705F' }}
              onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
              onMouseLeave={(e) => e.target.style.color = '#5F705F'}
            >
              Sign In
            </button>
            <button
              onClick={onNavigateToRegister}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition" style={{ backgroundColor: '#7BAE7F' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4F7D5C'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#7BAE7F'}
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* =====================================
         Part 1: Hero Section
      ====================================== */}
      <section
        className="relative"
        style={{
          backgroundImage: "radial-gradient(#d1d5db 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 lg:py-32">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
                Your Student <span style={{ color: '#7BAE7F' }}>Wellness</span>
                <br />
                Hub
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Balance academics, mental health, and productivity in one intelligent platform. Track moods, manage tasks, connect with peers, and access AI-powered resources.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={onNavigateToLogin}
                      className="inline-flex items-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ backgroundColor: '#7BAE7F', '--tw-ring-color': '#7BAE7F' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#4F7D5C'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#7BAE7F'}
                    >
                      Get Started
                      <svg
                        className="ml-2 h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                    </button>

                    <a
                      href="#features"
                      className="inline-flex items-center rounded-xl px-6 py-3 text-base font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: '#7BAE7F', border: '1px solid #7BAE7F', color: '#7BAE7F' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#F6F7F5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ borderColor: '#7BAE7F', border: '1px solid #7BAE7F' }}>
                        <svg
                          className="h-3.5 w-3.5" style={{ color: '#7BAE7F' }}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7L8 5z" />
                        </svg>
                      </span>
                      Learn More
                    </a>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {}}
                      className="inline-flex items-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ backgroundColor: '#7BAE7F' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#4F7D5C'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#7BAE7F'}
                    >
                      Go to Dashboard
                      <svg
                        className="ml-2 h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                    </button>

                    <a
                      href="#features"
                      className="inline-flex items-center rounded-xl px-6 py-3 text-base font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: '#7BAE7F', border: '1px solid #7BAE7F', color: '#7BAE7F' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#F6F7F5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Explore Features
                    </a>
                  </>
                )}
              </div>

              <div className="mt-14 grid max-w-xl grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                    1000+
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Active Students
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                    4
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Core Modules
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                    24/7
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Peer Support
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-6 left-6 z-10 rounded-xl bg-white px-4 py-2 shadow-md ring-1 ring-slate-200">
                <span className="flex items-center text-sm font-semibold text-slate-700">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  Wellness Active
                </span>
              </div>

              <div className="rounded-2xl p-8 shadow-xl ring-1 ring-slate-200" style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(123, 174, 127, 0.1), rgba(127, 127, 127, 0.05))' }}>
                <div className="space-y-4">
                  <div className="flex items-center rounded-lg bg-white p-4 shadow-sm">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: 'rgba(123, 174, 127, 0.2)' }}>
                      😊
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-slate-900">Mood Tracking</div>
                      <div className="text-sm text-slate-500">Daily wellness logs</div>
                    </div>
                  </div>

                  <div className="flex items-center rounded-lg bg-white p-4 shadow-sm">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-xl">
                      ⏱️
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-slate-900">Focus Timer</div>
                      <div className="text-sm text-slate-500">Pomodoro sessions</div>
                    </div>
                  </div>

                  <div className="flex items-center rounded-lg bg-white p-4 shadow-sm">
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-xl">
                      🤝
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-slate-900">Peer Support</div>
                      <div className="text-sm text-slate-500">Anonymous Q&A</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 right-6 z-10 rounded-xl px-5 py-3 text-white shadow-lg" style={{ backgroundColor: '#7BAE7F' }}>
                <div className="text-sm font-semibold">Always Here</div>
                <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>For Your Wellness</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-white/60 to-transparent"></div>
      </section>

      {/* =====================================
         Part 2: Key Features/Modules
      ====================================== */}
      <section className="relative bg-white" id="features"
        style={{
          backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20 lg:py-24">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7BAE7F' }}>
              Core Features
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Everything You Need for Student Success
            </h2>
            <div className="mx-auto mt-4 h-1 w-24 rounded" style={{ backgroundColor: '#7BAE7F' }} />
          </div>

          <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-4">
            {/* Module 1: Mood Tracker */}
            <div className="rounded-2xl bg-slate-50 p-8 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition">
              <div className="flex items-start">
                <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(123, 174, 127, 0.2)' }}>
                  <svg className="h-7 w-7" style={{ color: '#7BAE7F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Mood Tracker
                  </h3>
                  <p className="mt-3 text-slate-600">
                    Log daily moods, stress levels, and emotions. Get AI-powered insights and personalized wellness recommendations.
                  </p>
                </div>
              </div>
            </div>

            {/* Module 2: Focus Timer */}
            <div className="rounded-2xl bg-slate-50 p-8 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition">
              <div className="flex items-start">
                <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-7 w-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Focus Timer
                  </h3>
                  <p className="mt-3 text-slate-600">
                    Pomodoro timer with task management. Track productivity streaks and get focus analytics.
                  </p>
                </div>
              </div>
            </div>

            {/* Module 3: Peer Support */}
            <div className="rounded-2xl bg-slate-50 p-8 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition">
              <div className="flex items-start">
                <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                  <svg className="h-7 w-7 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Peer Support
                  </h3>
                  <p className="mt-3 text-slate-600">
                    Anonymous Q&A platform. Connect with peers, share experiences, and get real-time support.
                  </p>
                </div>
              </div>
            </div>

            {/* Module 4: AI Resource Hub */}
            <div className="rounded-2xl bg-slate-50 p-8 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition">
              <div className="flex items-start">
                <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: '#E8F3E9' }}>
                  <svg className="h-7 w-7" style={{ color: '#7BAE7F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Resource Hub
                  </h3>
                  <p className="mt-3 text-slate-600">
                    AI-powered note summarizer. Upload materials and get auto-generated key points and summary PDFs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
         Part 3: How It Works
      ====================================== */}
      <section className="relative bg-slate-50" id="how-it-works">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20 lg:py-24">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7BAE7F' }}>
              Simple Process
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              How MindMate Works
            </h2>
            <div className="mx-auto mt-4 h-1 w-24 rounded" style={{ backgroundColor: '#7BAE7F' }} />
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: '#7BAE7F' }}>
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sign In</h3>
              <p className="mt-2 text-slate-600">
                Quick Google OAuth authentication for easy access.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: '#7BAE7F' }}>
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Explore</h3>
              <p className="mt-2 text-slate-600">
                Choose features that suit your wellness needs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: '#7BAE7F' }}>
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Track or Share</h3>
              <p className="mt-2 text-slate-600">
                Log moods, manage tasks, or connect with peers.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: '#7BAE7F' }}>
                4
              </div>
              <h3 className="text-lg font-bold text-slate-900">Get Insights</h3>
              <p className="mt-2 text-slate-600">
                Receive AI recommendations and wellness advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
         Part 4: Stats Ribbon
      ====================================== */}
      <section style={{ backgroundColor: '#7BAE7F' }}>
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-14 lg:py-16">
          <div className="grid grid-cols-2 gap-y-10 text-center text-white sm:grid-cols-4">
            <div>
              <div className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                1000+
              </div>
              <div className="mt-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Active Students</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                50K+
              </div>
              <div className="mt-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Mood Logs</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                100K+
              </div>
              <div className="mt-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Focus Sessions</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                500+
              </div>
              <div className="mt-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Peer Q&As</div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
         Part 5: Benefits Section
      ====================================== */}
      <section className="relative bg-white" id="benefits"
        style={{
          backgroundImage: "radial-gradient(#e5e7eb 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-inset" style={{ backgroundColor: 'rgba(123, 174, 127, 0.1)', color: '#7BAE7F', borderColor: '#7BAE7F', '--tw-ring-color': '#7BAE7F' }}>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2l2.09 6.26L20 9l-5 3.64L16.18 20 12 16.9 7.82 20 9 12.64 4 9l5.91-.74L12 2z" />
                </svg>
                Student Wellness
              </span>

              <h2 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl md:text-6xl">
                Transform Your <span style={{ color: '#7BAE7F' }}>Student Life</span>
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Balance academics and mental health. Track your wellness journey, boost productivity, connect with peers, and unlock your full potential.
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex items-start">
                  <svg
                    className="h-6 w-6 flex-shrink-0 text-green-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <span className="ml-3 text-lg text-slate-700">
                    Reduce stress with daily mood tracking and insights
                  </span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="h-6 w-6 flex-shrink-0 text-green-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <span className="ml-3 text-lg text-slate-700">
                    Boost productivity with Pomodoro timer and analytics
                  </span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="h-6 w-6 flex-shrink-0 text-green-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <span className="ml-3 text-lg text-slate-700">
                    Find peer support anonymously whenever you need it
                  </span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="h-6 w-6 flex-shrink-0 text-green-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <span className="ml-3 text-lg text-slate-700">
                    Access AI-summarized study materials and resources
                  </span>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                {!isAuthenticated ? (
                  <button
                    onClick={onNavigateToRegister}
                    className="inline-flex items-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ backgroundColor: '#7BAE7F' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4F7D5C'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#7BAE7F'}
                  >
                    Start Free Today
                    <svg
                      className="ml-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => {}}
                    className="inline-flex items-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ backgroundColor: '#7BAE7F' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4F7D5C'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#7BAE7F'}
                  >
                    Go to Dashboard
                    <svg
                      className="ml-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl p-8 shadow-xl ring-1 ring-slate-200" style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(123, 174, 127, 0.1), rgba(127, 127, 127, 0.05))' }}>
                <div className="space-y-6">
                  <div className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Wellness Score</div>
                        <div className="mt-1 text-2xl font-bold text-slate-900">7.5/10</div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-xl">
                        📈
                      </div>
                    </div>
                    <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Focus Streak</div>
                        <div className="mt-1 text-2xl font-bold text-slate-900">12 days</div>
                      </div>
                      <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: 'rgba(123, 174, 127, 0.2)' }}>
                        🔥
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      Keep the momentum going!
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Peer Connections</div>
                        <div className="mt-1 text-2xl font-bold text-slate-900">23 helped</div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-xl">
                        🤝
                      </div>
                    </div>
                    <div className="mt-4 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-4 w-4 ${
                            i < 4 ? "text-yellow-400" : "text-slate-300"
                          }`}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2l2.09 6.26L20 9l-5 3.64L16.18 20 12 16.9 7.82 20 9 12.64 4 9l5.91-.74L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
         Part 6: CTA Section
      ====================================== */}
      <section style={{ backgroundImage: 'linear-gradient(to right, #7BAE7F, #4F7D5C)' }}>
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20 lg:py-24 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
            Ready to Transform Your Student Journey?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Join thousands of students already using MindMate to balance academics, mental health, and productivity in one intelligent platform.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={onNavigateToRegister}
                  className="inline-flex items-center rounded-xl px-8 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ backgroundColor: '#FBF8F3', color: '#7BAE7F', '--tw-ring-offset-color': '#7BAE7F' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#FBF8F3'}
                >
                  Get Started Now
                  <svg
                    className="ml-2 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </button>

                <a
                  href="#features"
                  className="inline-flex items-center rounded-xl px-8 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2" style={{ borderColor: 'white', border: '2px solid white' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Learn More
                </a>
              </>
            ) : (
              <>
                <button
                  onClick={() => {}}
                  className="inline-flex items-center rounded-xl px-8 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ backgroundColor: '#FBF8F3', color: '#7BAE7F', '--tw-ring-offset-color': '#7BAE7F' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#FBF8F3'}
                >
                  Go to Dashboard
                  <svg
                    className="ml-2 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </button>

                <a
                  href="#features"
                  className="inline-flex items-center rounded-xl px-8 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2" style={{ borderColor: 'white', border: '2px solid white' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Explore Features
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
