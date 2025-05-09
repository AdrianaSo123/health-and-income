import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar bg-glassy">
      <div className="container">
        <div className="navbar-content">
          <div className="navbar-logo">
            <img 
              src={`${process.env.PUBLIC_URL}/healthviz-logo.svg`} 
              alt="HealthViz Logo" 
              className="logo-img" 
            />
            <span className="logo-text">HealthViz</span>
          </div>
          <div className="navbar-links">
            <a href="#trends" className="nav-link">
              <i className="fas fa-chart-line"></i> Trends
            </a>
            <a href="#maps" className="nav-link">
              <i className="fas fa-map-marked-alt"></i> Maps
            </a>
            <a href="#analysis" className="nav-link">
              <i className="fas fa-chart-pie"></i> Analysis
            </a>
            <a 
              href="https://github.com/adrianaso/health-and-income" 
              target="_blank" 
              rel="noopener noreferrer"
              className="nav-link github-link"
            >
              <i className="fab fa-github"></i> GitHub
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
