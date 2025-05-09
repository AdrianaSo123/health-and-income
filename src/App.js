import React from 'react';
import './App.css';
import './force-white-bg.css';
import './debug-hypertension.css';
import './deployed-styles.css'; // Additional styles for deployed version
import './portfolio-theme.css'; // Added portfolio theme styles

import MedianIncomeTrend from './components/MedianIncomeTrend';
import Footer from './components/Footer.jsx';
import Navbar from './components/Navbar.jsx';
import HypertensionTrend from './components/HypertensionTrend';
import IncomeGeorgiaMap from './components/IncomeGeorgiaMap';
import HypertensionGeorgia from './components/HypertensionGeorgia';
import IncomeVsCardioGeorgia from './components/IncomeVsCardioGeorgia';
import RaceInGeorgia from './components/RaceInGeorgia';

function App() {
  return (
    <div className="portfolio-layout">
      <Navbar />
      
      {/* Animated SVG Background */}
      <div className="background-gradient">
        <div className="animated-background">
          <svg width="100%" height="100%" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="bg1" cx="50%" cy="50%" r="80%" fx="60%" fy="40%" gradientTransform="rotate(20)">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.25" />
                <stop offset="80%" stopColor="#f0abfc" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="bg2" cx="50%" cy="50%" r="80%" fx="30%" fy="70%" gradientTransform="rotate(-15)">
                <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.20" />
                <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="900" cy="250" rx="600" ry="300" fill="url(#bg1)">
              <animate attributeName="cx" values="900;700;900" dur="12s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="400" cy="650" rx="500" ry="230" fill="url(#bg2)">
              <animate attributeName="cy" values="650;600;650" dur="14s" repeatCount="indefinite" />
            </ellipse>
          </svg>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Health and Income</h1>
          <p className="hero-subtitle">Income and Cardiovascular Disease Analysis</p>
          <p className="hero-description">This analysis explores the relationships between socioeconomic factors, cardiovascular disease, and demographics across Georgia counties, with a focus on how these factors intersect and affect health outcomes.</p>
        </div>
      </section>

      <main className="main-content">
        <div className="content-container">
          {/* Trends Container */}
          <div className="section-container" id="trends">
            <h2 className="section-title">Trends</h2>
            <div className="card-grid">
              <section className="portfolio-card">
                <h3 className="card-title">Median Income Trend</h3>
                <div className="card-icon"><i className="fas fa-chart-line"></i></div>
                <MedianIncomeTrend />
                <p className="card-description">This chart shows the national median household income trend over time, providing context for socioeconomic changes.</p>
              </section>

              <section className="portfolio-card">
                <h3 className="card-title">Hypertension Prevalence Trend</h3>
                <div className="card-icon"><i className="fas fa-heartbeat"></i></div>
                <HypertensionTrend />
                <p className="card-description">This chart displays the trend of hypertension prevalence in the United States, showing how this key health indicator has changed over time.</p>
              </section>
            </div>
          </div>

          {/* Maps Container */}
          <div className="section-container" id="maps">
            <h2 className="section-title">Maps</h2>
            <div className="card-grid">
              <section className="portfolio-card wide-card">
                <h3 className="card-title">Median Income by County</h3>
                <div className="card-icon"><i className="fas fa-map-marked-alt"></i></div>
                <IncomeGeorgiaMap />
                <p className="card-description">This map visualizes median household income across Georgia counties, highlighting economic disparities within the state.</p>
              </section>

              <section className="portfolio-card wide-card">
                <h3 className="card-title">Hypertension Prevalence by County</h3>
                <div className="card-icon"><i className="fas fa-heart"></i></div>
                <HypertensionGeorgia />
                <p className="card-description">This map shows the prevalence of hypertension across Georgia counties, revealing geographic patterns in cardiovascular health.</p>
              </section>
            </div>
          </div>

          {/* Analysis Container */}
          <div className="section-container" id="analysis">
            <h2 className="section-title">Analysis</h2>
            <div className="card-grid">
              <section className="portfolio-card wide-card">
                <h3 className="card-title">Income vs. Hypertension Correlation</h3>
                <div className="card-icon"><i className="fas fa-chart-scatter"></i></div>
                <IncomeVsCardioGeorgia />
                <p className="card-description">This scatter plot explores the relationship between median household income and hypertension prevalence across Georgia counties.</p>
              </section>

              <section className="portfolio-card wide-card">
                <h3 className="card-title">Demographic Analysis</h3>
                <div className="card-icon"><i className="fas fa-users"></i></div>
                <RaceInGeorgia />
                <p className="card-description">This visualization examines demographic factors in relation to health outcomes and income levels in Georgia.</p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;