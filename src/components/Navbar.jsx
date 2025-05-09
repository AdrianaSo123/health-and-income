import React, { useState } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo">
          <a href="/" className="navbar-logo-link">
            <img 
              src={`${process.env.PUBLIC_URL}/healthviz-logo.svg`} 
              alt="HealthViz Logo" 
              className="logo-img" 
            />
            <span className="logo-text">HealthViz</span>
          </a>
        </div>
        
        {/* Desktop Navigation */}
        <div className="navbar-links desktop-nav">
          <a href="#trends" className="nav-link">
            <i className="fas fa-chart-line"></i> <span>Trends</span>
          </a>
          <a href="#maps" className="nav-link">
            <i className="fas fa-map-marked-alt"></i> <span>Maps</span>
          </a>
          <a href="#analysis" className="nav-link">
            <i className="fas fa-chart-pie"></i> <span>Analysis</span>
          </a>
          <a 
            href="https://github.com/adrianaso/health-and-income" 
            target="_blank" 
            rel="noopener noreferrer"
            className="nav-link github-link"
          >
            <i className="fab fa-github"></i> <span>GitHub</span>
          </a>
        </div>
        
        {/* Mobile Navigation Toggle */}
        <div className="mobile-nav-toggle">
          <button 
            aria-label="Toggle menu" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="mobile-nav">
          <a href="#trends" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-chart-line"></i> Trends
          </a>
          <a href="#maps" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-map-marked-alt"></i> Maps
          </a>
          <a href="#analysis" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-chart-pie"></i> Analysis
          </a>
          <a 
            href="https://github.com/adrianaso/health-and-income" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mobile-nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            <i className="fab fa-github"></i> GitHub
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
