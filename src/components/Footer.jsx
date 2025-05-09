import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-glassy py-6 mt-8">
      <div className="container">
        <div className="footer-content">
          <div className="footer-left">
            <p className="copyright">
              &copy; {new Date().getFullYear()} Health and Income Dashboard. All rights reserved.
            </p>
            <p className="small-text">
              Created by Adriana So for data visualization portfolio
            </p>
          </div>
          <div className="footer-right">
            <div className="social-links">
              <a 
                href="https://github.com/adrianaso/health-and-income" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
              >
                <i className="fab fa-github"></i> GitHub
              </a>
              <a 
                href="https://www.linkedin.com/in/adriana-so-122ab5122/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
              >
                <i className="fab fa-linkedin"></i> LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
