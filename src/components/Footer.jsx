import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-glassy py-8 mt-12 border-t border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 max-w-screen-xl mx-auto">
        <div className="mb-6 md:mb-0">
          <p className="text-sm text-gray-700 mb-1">
            &copy; {new Date().getFullYear()} Adriana So. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Health and Income Dashboard - Data Visualization Portfolio
          </p>
        </div>
        
        <div className="flex gap-6">
          <a 
            href="https://github.com/adrianaso/health-and-income" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-700 hover:text-primary transition-colors"
            aria-label="GitHub"
          >
            <i className="fab fa-github text-lg"></i>
            <span className="ml-2">GitHub</span>
          </a>
          <a 
            href="https://www.linkedin.com/in/adriana-so-122ab5122/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-700 hover:text-primary transition-colors"
            aria-label="LinkedIn"
          >
            <i className="fab fa-linkedin text-lg"></i>
            <span className="ml-2">LinkedIn</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
