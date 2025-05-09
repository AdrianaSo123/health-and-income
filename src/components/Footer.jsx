import React from 'react';

const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-left">
          <p className="copyright">
            &copy; {new Date().getFullYear()} Adriana So. All rights reserved.
          </p>
          <p className="small-text">
            Health and Income Dashboard - Data Visualization Portfolio
          </p>
        </div>
        <div className="footer-right">
          <div className="social-links">
            <a 
              href="https://github.com/adrianaso/health-and-income" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              aria-label="GitHub"
            >
              <i className="fab fa-github"></i>
              <span>GitHub</span>
            </a>
            <a 
              href="https://www.linkedin.com/in/adriana-so-122ab5122/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              aria-label="LinkedIn"
            >
              <i className="fab fa-linkedin"></i>
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
