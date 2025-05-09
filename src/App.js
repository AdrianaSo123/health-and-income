import React from 'react';
import './App.css';
import './force-white-bg.css';
import './debug-hypertension.css';
import './deployed-styles.css'; // Additional styles for deployed version

import MedianIncomeTrend from './components/MedianIncomeTrend';
import Footer from './components/Footer.jsx';
import Navbar from './components/Navbar.jsx';
import HypertensionTrend from './components/HypertensionTrend';
import IncomeGeorgiaMap from './components/IncomeGeorgiaMap';
import HypertensionGeorgia from './components/HypertensionGeorgia';
import IncomeVsCardioGeorgia from './components/IncomeVsCardioGeorgia';
import RaceInGeorgia from './components/RaceInGeorgia';

function App() {
  // Detect if embedded (via query param or window context)
  // Commented out since it's not currently used, but keeping for future use
  /* 
  const isEmbedded = (() => {
    if (typeof window !== 'undefined') {
      // Check for ?embedded=true in URL
      const params = new URLSearchParams(window.location.search);
      if (params.get('embedded') === 'true') return true;
      // Check for parent context (iframe)
      if (window !== window.parent) return true;
      // Optionally, check for a global variable
      if (window.EMBED_HEALTH_VIZ) return true;
    }
    return false;
  })();
  */

  return (
    <div className="App container">
      <Navbar />
      
      <header className="bg-glassy shadow">
        <h1 className="bold-title">Health and Income Trends</h1>
        <p className="tag">Explore the relationship between health and income in Georgia</p>
      </header>

      {/* Trends Container */}
      <div className="cards-container trends-container">
        <h2 className="container-title">Trends</h2>
        <section className="glassy-card">
          <h3 className="section-header">Median Income Trend</h3>
          <i className="fas fa-chart-line"></i>
          <MedianIncomeTrend />
          <p className="card-desc">This chart shows the national median household income trend over time, providing context for socioeconomic changes.</p>
        </section>
        <section className="glassy-card">
          <h3 className="section-header">Hypertension Trend</h3>
          <i className="fas fa-heartbeat"></i>
          <HypertensionTrend />
          <p className="card-desc">This chart shows the national hypertension prevalence over time, highlighting changes in cardiovascular health.</p>
        </section>
      </div>

      {/* Maps Container */}
      <div className="cards-container maps-container">
        <h2 className="container-title">Geographic Patterns</h2>
        <section className="glassy-card">
          <h3 className="section-header">Income in Georgia</h3>
          <i className="fas fa-map-marker-alt"></i>
          <IncomeGeorgiaMap />
          <p className="card-desc">This map visualizes the distribution of median income across Georgia counties, revealing regional disparities.</p>
        </section>
        <section className="glassy-card">
          <h3 className="section-header">Hypertension in Georgia</h3>
          <i className="fas fa-heartbeat"></i>
          <HypertensionGeorgia />
          <p className="card-desc">This map shows hypertension prevalence by county, allowing for spatial comparison with income and demographics.</p>
        </section>
      </div>

      {/* Correlation Container */}
      <div className="cards-container correlation-container">
        <h2 className="container-title">Correlation Analysis</h2>
        <section className="glassy-card">
          <i className="fas fa-chart-pie"></i>
          <IncomeVsCardioGeorgia />
          <p className="card-desc">This scatterplot examines the relationship between income and cardiovascular disease rates in Georgia counties.</p>
        </section>
      </div>

      {/* Demographics Container */}
      <div className="cards-container demographics-container">
        <h2 className="container-title">Demographic Context</h2>
        <section className="glassy-card">
          <h3 className="section-header">Race in Georgia</h3>
          <i className="fas fa-users"></i>
          <RaceInGeorgia />
          <p className="card-desc">This map shows the distribution of Black population by county, providing demographic context for observed health patterns.</p>
        </section>
      </div>

      <Footer className="bg-glassy" />
    </div>
  );
}

export default App;