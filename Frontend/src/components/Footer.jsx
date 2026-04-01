export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-900">MindMate</h3>
            <p className="mt-2 text-sm text-slate-600">
              Your student wellness hub for productivity, mental health, and peer support.
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Features</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/mood-tracker" className="text-sm text-slate-600 hover:text-blue-600">
                  Mood Tracker
                </a>
              </li>
              <li>
                <a href="/focus-timer" className="text-sm text-slate-600 hover:text-blue-600">
                  Focus Timer
                </a>
              </li>
              <li>
                <a href="/peer-support" className="text-sm text-slate-600 hover:text-blue-600">
                  Peer Support
                </a>
              </li>
              <li>
                <a href="/resources" className="text-sm text-slate-600 hover:text-blue-600">
                  Resource Hub
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Support</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#help" className="text-sm text-slate-600 hover:text-blue-600">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#contact" className="text-sm text-slate-600 hover:text-blue-600">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-sm text-slate-600 hover:text-blue-600">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-sm text-slate-600 hover:text-blue-600">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Community</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#blog" className="text-sm text-slate-600 hover:text-blue-600">
                  Blog
                </a>
              </li>
              <li>
                <a href="#events" className="text-sm text-slate-600 hover:text-blue-600">
                  Events
                </a>
              </li>
              <li>
                <a href="#feedback" className="text-sm text-slate-600 hover:text-blue-600">
                  Send Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 border-t border-slate-200 pt-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="text-sm text-slate-600">
              © 2026 MindMate. All rights reserved.
            </p>
            <div className="mt-4 flex gap-6 md:mt-0">
              <a href="#twitter" className="text-slate-600 hover:text-blue-600">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#github" className="text-slate-600 hover:text-blue-600">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.186.092-.923.35-1.544.636-1.9-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817a9.56 9.56 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
