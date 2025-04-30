import React from 'react';
import './App.css';
import './force-white-bg.css';
import './debug-hypertension.css';
import MedianIncomeTrend from './components/MedianIncomeTrend';
import HypertensionTrend from './components/HypertensionTrend';
import IncomeGeorgiaMap from './components/IncomeGeorgiaMap';
import HypertensionGeorgia from './components/HypertensionGeorgia';
import IncomeVsCardioGeorgia from './components/IncomeVsCardioGeorgia';
import RaceInGeorgia from './components/RaceInGeorgia';

function App() {
  // Detect if embedded (via query param or window context)
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

  return (
    <>
      <div className="App container">
        {/* Navigation Bar: Only show if not embedded */}
        {!isEmbedded && (
          <nav className="navbar" role="navigation" aria-label="Main Navigation">
            <span className="navbar-logo" style={{fontSize: '2.1rem', fontWeight: 800, letterSpacing: '1.5px', color: '#7F4DE2'}}>HealthViz</span>
            <div className="navbar-links">
              <a href="/" className="navbar-link">Home</a>
              <a href="/projects" className="navbar-link">Projects</a>
              <a href="/contact" className="navbar-link">Contact</a>
            </div>
          </nav>
        )}

        <header className="App-header">

          <div style={{
            background: 'rgba(255,255,255,0.98)',
            borderRadius: '1.5rem',
            padding: '2.5rem 2.5rem 2.2rem 2.5rem',
            margin: '0 auto',
            maxWidth: 850,
            boxShadow: '0 4px 24px 0 rgba(124,86,255,0.08)',
            position: 'relative',
            zIndex: 2
          }}>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'linear-gradient(90deg, var(--color-brand-primary), var(--color-brand-accent))',
              borderTopLeftRadius: '1.5rem',
              borderTopRightRadius: '1.5rem',
              marginBottom: '1.2rem'
            }} />
            <h1 style={{
              fontFamily: 'IBM Plex Mono, monospace',
              color: 'var(--color-brand-primary)',
              fontWeight: 800,
              fontSize: '2.9rem',
              margin: '0 0 1.3rem 0',
              letterSpacing: '-0.025em',
              lineHeight: 1.12
            }}>Income and Cardiovascular Disease Analysis</h1>
            <div className="section-intro" style={{
              background: 'rgba(255,255,255,0.98)',
              borderRadius: '1rem',
              padding: '1.25rem 2rem',
              margin: '0 auto',
              maxWidth: 700,
              boxShadow: '0 1px 8px rgba(124,86,255,0.06)'
            }}>
              <span className="section-tag" style={{
                color: 'var(--color-brand-accent)',
                fontWeight: 700,
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: '1.02rem',
                marginBottom: '0.5em',
                display: 'inline-block'
              }}>Georgia Counties Data Project</span>
              <p style={{
                fontSize: '1.18rem',
                color: '#3b0764',
                fontFamily: 'Inter, IBM Plex Mono, sans-serif',
                margin: 0
              }}>
                This analysis explores the relationships between socioeconomic factors, cardiovascular disease, 
                and demographics across Georgia counties, with a focus on how these factors intersect and affect health outcomes.
              </p>
            </div>
          </div>
        </header>

        {/* Trend Analysis Section */}
        <section id="trends">
          <h2><span className="section-icon" role="img" aria-label="chart">💹</span> Trend Analysis</h2>
          <div className="section-context">
            <p style={{ marginBottom: 0 }}>
              The time series below illustrate how median household income across the US has changed over time. This was important to see if there 
              were any drastic changes to be aware of. 
            </p>
          </div>
          <div className="trends-container">
            <div className="trend-card">
              <MedianIncomeTrend />
              <div className="visualization-context">
                <p style={{ marginBottom: 0 }}>
                  The chart shows the national median household income trend over time.
                </p>
              </div>
            </div>
            <div className="trend-card">
              <HypertensionTrend />
              <div className="visualization-context">
                <p style={{ marginBottom: 0 }}>
                  The chart shows the national hypertension prevalence over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Geographic Patterns Section */}
        <section id="maps">
          <h2><span className="section-icon" role="img" aria-label="map">🗺️</span> Geographic Patterns</h2>
          <div className="section-context">
            <p style={{ marginBottom: 0 }}>
              The maps below reveal how income and cardiovascular disease are distributed across Georgia counties. The purpose of 
              these maps was to see if there were any obvious patterns between income and hypertension.
            </p>
          </div>
          <div className="maps-container">
            <div className="map-card">
              <h3>Hypertension by County</h3>
              <HypertensionGeorgia />
              <div className="visualization-context"></div>
            </div>
            <div className="map-card">
              <h3>Income by County</h3>
              <IncomeGeorgiaMap />
              <div className="visualization-context"></div>
            </div>
          </div>
        </section>

        {/* Demographics Section */}
        <section id="demographics">
          <div className="demographics-container">
            {/* You can add other demographic visualizations here if needed */}
          </div>
        </section>

        {/* Correlation Analysis Section */}
        <section id="correlation">
          <h2><span className="section-icon" role="img" aria-label="scatterplot">📈</span> Correlation Analysis</h2>
          <div className="section-context">
            <p style={{ marginBottom: 0 }}>
              The scatterplot below examines the direct relationship between income and cardiovascular disease rates,
              helping us understand how strongly these factors are connected across Georgia counties.
            </p>
          </div>
          <div className="correlation-container">
            <IncomeVsCardioGeorgia />
            <div className="visualization-context">
              <p style={{ marginBottom: 0 }}>
                Each point represents a Georgia county, positioned according to its median household income and 
                cardiovascular disease rate. The trend line indicates a negative correlation with an r-value of -0.467, suggesting that 
                as income increases, disease rates tend to decrease. However, the scatter of points and r-value indicate that 
                other factors beyond income also influence health outcomes.
              </p>
            </div>
          </div>
        </section>

        {/* Key Findings Section */}
        <section id="findings">
          <div className="analysis-section">
            <h2>Key Findings</h2>
            <p>
              The scatterplot above reveals the relationship between household income and hypertension rates in Georgia counties. 
              Counties with lower median household incomes tend to have higher rates of cardiovascular disease, 
              suggesting socioeconomic factors may play a significant role in health outcomes, however since there correlation is 
              moderate, there are other factors to consider. Income levels are not the sole reason for varying hypertension rates.
            </p>
          </div>
        </section>

        {/* Demographic Context Section */}
        <section id="demographic-context">
          <div className="demographic-section">
            <h2>Demographic Context</h2>
            <p style={{ marginBottom: 0 }}>
              When examining health disparities in Georgia, demographic factors provide additional context to understanding 
              the relationship between income and cardiovascular disease. The map below shows the distribution of Black population 
              by county, which may help explain some of the patterns observed in the previous visualizations. I thought it was important 
              to consider this lense because there could be discrepancies based on race. Historically, the healthcare system has treated 
              black people poorly, causing fear and distrust. This would make people less likely to get treatment for their conditions. 
            </p>
            <div className="map-card full-width" style={{ marginBottom: '1.1rem', padding: '1.1rem 0.5rem 1.5rem 0.5rem' }}>
              <h3 style={{ marginBottom: '0.6rem' }}>Black Population by County</h3>
              <RaceInGeorgia />
              <div className="visualization-context">
                <p style={{ marginBottom: 0 }}>
                  The distribution of Black populations across Georgia counties reveals patterns that often align with 
                  both economic indicators and cardiovascular disease rates. This overlap highlights how social determinants 
                  of health, including systemic inequities, can contribute to health disparities. Understanding these 
                  demographic patterns is essential for developing targeted, culturally-appropriate healthcare interventions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Conclusion Section */}
        <section id="conclusion" style={{ marginBottom: '1.2rem', paddingTop: '0.6rem' }}>
          <div className="conclusion-section" style={{ marginBottom: '1.1rem', padding: '1rem 1.2rem' }}>
            <h2 style={{ marginBottom: '0.7rem', marginTop: '2.1rem' }}>Conclusion</h2>
            <p style={{ marginBottom: 0 }}>
              This analysis demonstrates how income, geography, and race intersect to influence cardiovascular health outcomes 
              in Georgia. While economic factors clearly play an important role, the impact of historical inequities and ongoing 
              systemic racism must be considered when addressing these health disparities. Effective interventions will require 
              both improvements in healthcare access and broader efforts to address social determinants of health and racial inequities.
            </p>
          </div>
        </section>
        <div style={{textAlign: 'center'}}>
          <a href="/projects" className="back-btn" aria-label="Back to Projects">← Back to Projects</a>
        </div>
        <footer className="footer" role="contentinfo" style={{ background: '#fafaff', borderTop: '1.5px solid #ede9fe', color: '#7F4DE2', fontSize: '1rem', padding: '1.2rem 0 0.5rem 0', marginTop: '2.5rem', opacity: 0.92 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '1rem', marginBottom: '0.1rem' }}>
              &copy; {new Date().getFullYear()} Adriana So
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1.25rem' }}>
              <a href="https://www.linkedin.com/in/adriana-so-24071219b/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: '#7F4DE2', textDecoration: 'none' }}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.29c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.29h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.76 1.39-1.56 2.87-1.56 3.07 0 3.64 2.02 3.64 4.65v5.68z"/></svg>
              </a>
              <a href="https://github.com/AdrianaSo123/health-hypertension_copy" target="_blank" rel="noopener noreferrer" aria-label="GitHub" style={{ color: '#7F4DE2', textDecoration: 'none' }}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}><path d="M12 0c-6.627 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.415-4.042-1.415-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.006.404 2.289-1.552 3.295-1.23 3.295-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.804 5.624-5.476 5.921.43.372.823 1.104.823 2.222 0 1.604-.014 2.896-.014 3.289 0 .321.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://ams328.myportfolio.com" target="_blank" rel="noopener noreferrer" aria-label="Adobe Portfolio" style={{ color: '#7F4DE2', textDecoration: 'none' }}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff">AP</text></svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;