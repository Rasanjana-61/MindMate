import { Facebook, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#2F3E2F', color: '#B8D0B8' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-5 mb-12">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#7BAE7F' }}>
                M
              </div>
              <span className="text-lg font-bold text-white">MindMate</span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Streamline your wellness journey with mental health, productivity, and peer support.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 transition" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                <Facebook size={20} />
              </a>
              <a href="#" className="text-slate-400 transition" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                <Twitter size={20} />
              </a>
              <a href="#" className="text-slate-400 transition" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wide">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  Features
                </a>
              </li>
              <li>
                <a href="#benefits" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  Benefits
                </a>
              </li>
              <li>
                <a href="#pricing" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  Pricing
                </a>
              </li>
              <li>
                <a href="#security" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  Security
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wide">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#about" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  About Us
                </a>
              </li>
              <li>
                <a href="#blog" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  Blog
                </a>
              </li>
              <li>
                <a href="#careers" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  Careers
                </a>
              </li>
              <li>
                <a href="#contact" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wide">Legal</h4>
            <ul className="space-y-3">
              <li>
                <a href="#privacy" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#cookies" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#gdpr" className="transition text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                  onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                  GDPR
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-8" style={{ borderColor: 'rgba(123, 174, 127, 0.2)' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: 'rgba(184, 208, 184, 0.6)' }}>
              © 2026 MindMate. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#privacy" className="text-sm transition" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                Privacy
              </a>
              <a href="#terms" className="text-sm transition" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                Terms
              </a>
              <a href="#cookies" className="text-sm transition" style={{ color: 'rgba(184, 208, 184, 0.6)' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(184, 208, 184, 0.6)'}>
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
