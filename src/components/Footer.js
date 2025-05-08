import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t bg-white/70 text-neutral-800 py-6 mt-12">
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
        <div className="text-sm font-mono tracking-tight">&copy; {new Date().getFullYear()} Adriana So</div>
        <div className="flex gap-6 text-lg">
          <a
            href="https://www.linkedin.com/in/adriana-so-24071219b/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-700 transition-colors"
            aria-label="LinkedIn"
          >
            <span className="sr-only">LinkedIn</span>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.025-3.062-1.867-3.062-1.868 0-2.154 1.459-2.154 2.967v5.699h-3v-10h2.881v1.367h.041c.401-.762 1.379-1.562 2.841-1.562 3.04 0 3.601 2.002 3.601 4.604v5.591z"/></svg>
          </a>
          <a
            href="https://github.com/AdrianaSo123"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-700 transition-colors"
            aria-label="GitHub"
          >
            <span className="sr-only">GitHub</span>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.304.762-1.604-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.527.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.649.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.371.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
          <a
            href="https://ams328.myportfolio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-700 transition-colors"
            aria-label="Adobe Portfolio"
          >
            <span className="sr-only">Adobe Portfolio</span>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff">AP</text></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
