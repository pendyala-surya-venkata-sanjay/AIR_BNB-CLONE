import React from "react";
import { Globe } from "lucide-react";

const FacebookIcon: React.FC = () => (
  <svg className="w-4 h-4 text-current fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const TwitterIcon: React.FC = () => (
  <svg className="w-4 h-4 text-current fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 18.43" />
  </svg>
);

const InstagramIcon: React.FC = () => (
  <svg className="w-4 h-4 text-current stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-light-gray border-t border-border-gray py-12 mt-auto text-dark text-xs sm:text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-border-gray">
        
        {/* Support Section */}
        <div className="flex flex-col gap-3">
          <h4 className="font-bold text-dark text-xs tracking-wider uppercase">Support</h4>
          <a href="#" className="text-muted hover:underline">Help Center</a>
          <a href="#" className="text-muted hover:underline">AirCover</a>
          <a href="#" className="text-muted hover:underline">Anti-discrimination</a>
          <a href="#" className="text-muted hover:underline">Disability support</a>
          <a href="#" className="text-muted hover:underline">Cancellation options</a>
        </div>

        {/* Hosting Section */}
        <div className="flex flex-col gap-3">
          <h4 className="font-bold text-dark text-xs tracking-wider uppercase">Hosting</h4>
          <a href="#" className="text-muted hover:underline">Rent your home</a>
          <a href="#" className="text-muted hover:underline">AirCover for Hosts</a>
          <a href="#" className="text-muted hover:underline">Hosting resources</a>
          <a href="#" className="text-muted hover:underline">Community forum</a>
          <a href="#" className="text-muted hover:underline">Hosting responsibly</a>
        </div>

        {/* StayNest Section */}
        <div className="flex flex-col gap-3">
          <h4 className="font-bold text-dark text-xs tracking-wider uppercase">StayNest</h4>
          <a href="#" className="text-muted hover:underline">Newsroom</a>
          <a href="#" className="text-muted hover:underline">New features</a>
          <a href="#" className="text-muted hover:underline">Careers</a>
          <a href="#" className="text-muted hover:underline">Investors</a>
          <a href="#" className="text-muted hover:underline">Gift cards</a>
        </div>

        {/* Disclaimer / Assignment Section */}
        <div className="flex flex-col gap-3">
          <h4 className="font-bold text-dark text-xs tracking-wider uppercase">StayNest Marketplace</h4>
          <p className="text-muted leading-relaxed text-xs">
            This project is an accommodation marketplace built for demonstration purposes, satisfying fullstack architectural guidelines with FastAPI and Next.js.
          </p>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side */}
        <div className="flex flex-wrap items-center gap-2 text-muted text-xs">
          <span>© 2026 StayNest, Inc.</span>
          <span>·</span>
          <a href="#" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:underline">Terms</a>
          <span>·</span>
          <a href="#" className="hover:underline">Sitemap</a>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6 text-dark font-semibold text-xs">
          <button className="flex items-center gap-1.5 hover:underline">
            <Globe size={14} />
            <span>English (US)</span>
          </button>
          <button className="hover:underline">
            <span>$ USD</span>
          </button>
          
          {/* Socials */}
          <div className="flex items-center gap-4 text-dark">
            <a href="#" className="hover:opacity-85" aria-label="Facebook"><FacebookIcon /></a>
            <a href="#" className="hover:opacity-85" aria-label="Twitter"><TwitterIcon /></a>
            <a href="#" className="hover:opacity-85" aria-label="Instagram"><InstagramIcon /></a>
          </div>
        </div>

      </div>
    </footer>
  );
};
export default Footer;
