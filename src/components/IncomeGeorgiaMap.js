import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import getDataContent from '../utils/dataPath';

const IncomeGeorgiaMap = () => {
  const svgRef = useRef(null);
  const [countyData, setCountyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const parseCSV = async () => {
      try {
        // Import the CSV data directly as a string using raw-loader
        // eslint-disable-next-line import/no-webpack-loader-syntax
        const csvText = require('!!raw-loader!../data/GeorgiaIncomeData.csv').default;
        console.log("CSV data loaded, length:", csvText.length);
        console.log("First 100 chars:", csvText.substring(0, 100));

        // Find the header row robustly (ignore BOM, whitespace, case)
        const lines = csvText.split('\n');
        const headerIndex = lines.findIndex(line => {
          const clean = line.replace(/^\uFEFF/, '').trim().toLowerCase();
          return clean.startsWith('county,');
        });
        if (headerIndex === -1) {
          // Deep debug: log char codes of first 10 lines
          lines.slice(0, 10).forEach((line, idx) => {
            const codes = Array.from(line).map(c => c.charCodeAt(0));
            console.error(`Line ${idx}:`, line, codes);
          });
          console.error('CSV header not found. First 5 lines:', lines.slice(0, 5));
          throw new Error('CSV header not found');
        }
        // Only include lines up to the last valid data row (at least 4 commas)
        let lastDataIdx = headerIndex;
        for (let i = headerIndex + 1; i < lines.length; i++) {
          if ((lines[i].match(/,/g) || []).length >= 3) {
            lastDataIdx = i;
          } else {
            break;
          }
        }
        const csvData = lines.slice(headerIndex, lastDataIdx + 1).join('\n');

        // Parse CSV using d3.csvParse
        const parsedRows = d3.csvParse(csvData);
        if (parsedRows.length === 0) {
          console.error('CSV parsed but no data rows found. Header:', lines[headerIndex]);
          throw new Error('CSV parsed but no data rows found');
        }
        console.log('CSV header:', lines[headerIndex]);
        console.log('CSV data rows:', parsedRows.length);
        const extractedData = [];

        parsedRows.forEach(row => {
          // Only include rows with a county and a valid income
          if (!row.County || !row["Value (Dollars)"]) return;
          if (row.County.includes('Georgia') || row.County.includes('United States')) return;

          const countyName = row.County.replace(/ County$/i, '');
          const incomeStr = row["Value (Dollars)"].replace(/[^0-9.]/g, '');
          const income = parseFloat(incomeStr);

          if (!isNaN(income) && income > 0) {
            extractedData.push({
              county: countyName,
              median_income: income
            });
          }
        });

        console.log(`Extracted ${extractedData.length} counties`);
        console.log("Sample counties:", extractedData.slice(0, 3));

        if (extractedData.length === 0) {
          throw new Error("No county data extracted from CSV");
        }

        setCountyData(extractedData);
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    parseCSV();
  }, []);
  
  useEffect(() => {
    if (loading || error || !countyData.length) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Map dimensions with increased margins for more spacing
    const width = 1200;
    const height = 700;
    const margin = { top: 120, right: 50, bottom: 70, left: 70 };
    
    // Create SVG with a background for better contrast with white text
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('max-width', '100%')
      .style('height', 'auto');
    
    // Create income lookup for counties
    const incomeByCounty = {};
    countyData.forEach(d => {
      const name = d.county.toLowerCase();
      incomeByCounty[name] = d.median_income;
      incomeByCounty[name + " county"] = d.median_income;
    });
    
    // Set up color scale
    const minIncome = d3.min(countyData, d => d.median_income);
    const maxIncome = d3.max(countyData, d => d.median_income);
    
    console.log(`Income range: $${minIncome.toLocaleString()} - $${maxIncome.toLocaleString()}`);
    
    const colorScale = d3.scaleSequential()
      .domain([minIncome, maxIncome])
      .interpolator(d3.interpolateViridis);
    
    // Fetch Georgia counties GeoJSON
    fetch("https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json")
      .then(response => response.json())
      .then(geojson => {
        // Filter for Georgia counties (FIPS codes starting with 13)
        const georgiaCounties = geojson.features.filter(feature => 
          feature.id && feature.id.toString().startsWith('13')
        );
        
        console.log(`Found ${georgiaCounties.length} Georgia counties in GeoJSON`);
        
        const georgiaGeoJSON = {
          type: "FeatureCollection",
          features: georgiaCounties
        };
        
        // Set up projection
        const projection = d3.geoMercator()
          .fitSize([width - margin.left - margin.right, 
                  height - margin.top - margin.bottom], 
                  georgiaGeoJSON);
        
        const path = d3.geoPath().projection(projection);
        
        // Create tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("font-size", "18px")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("color", "white")
          .style("border", "1px solid #555")
          .style("border-radius", "4px")
          .style("padding", "8px")
          .style("pointer-events", "none")
          .style("opacity", 0);
        
        // Track matching for debugging
        let matchedCounties = 0;
        
        // Draw counties
        svg.append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`)
          .selectAll("path")
          .data(georgiaCounties)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", d => {
            if (d && d.properties) {
              const countyName = d.properties.NAME;
              
              // Try different variations to match county names
              const variations = [
                countyName.toLowerCase(),
                countyName.toLowerCase().replace(" county", ""),
                countyName.toLowerCase().replace(" county", "") + " county"
              ];
              
              // Find matching county in our data
              for (const variant of variations) {
                if (incomeByCounty[variant] !== undefined) {
                  matchedCounties++;
                  return colorScale(incomeByCounty[variant]);
                }
              }
            }
            return "#ccc"; // Default color for counties with no data
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .on("mouseover", function(event, d) {
            d3.select(this)
              .attr("stroke", "#fff")
              .attr("stroke-width", 1.5);
            
            const countyName = d.properties.NAME;
            let income = null;
            
            // Find income for this county
            const variations = [
              countyName.toLowerCase(),
              countyName.toLowerCase().replace(" county", ""),
              countyName.toLowerCase().replace(" county", "") + " county"
            ];
            
            for (const variant of variations) {
              if (incomeByCounty[variant] !== undefined) {
                income = incomeByCounty[variant];
                break;
              }
            }
            
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
              <strong>${countyName}</strong><br/>
              ${income !== null ? `$${income.toLocaleString()}` : 'No data'}
            `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 30) + "px");
          })
          .on("mouseout", function() {
            d3.select(this)
              .attr("stroke", "#fff")
              .attr("stroke-width", 0.5);
            
            tooltip.transition().duration(500).style("opacity", 0);
          });
        
        console.log(`Matched ${matchedCounties} counties with income data`);
        
        // Add legend (moved up for more space from bottom)
        const legendWidth = 300;
        const legendHeight = 20;
        const legendX = width - margin.right - legendWidth;
        const legendY = height - margin.bottom + 20;
        
        // Create gradient for legend
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
          .attr("id", "income-gradient")
          .attr("x1", "0%").attr("x2", "100%").attr("y1", "0%").attr("y2", "0%");
        
        // Add gradient stops
        const stops = 10;
        for (let i = 0; i < stops; i++) {
          gradient.append("stop")
            .attr("offset", `${i * 100 / (stops - 1)}%`)
            .attr("stop-color", colorScale(minIncome + (i / (stops - 1)) * (maxIncome - minIncome)));
        }

        // Draw legend background
        svg.append("rect")
          .attr("x", legendX - 8)
          .attr("y", legendY - 8)
          .attr("width", legendWidth + 16)
          .attr("height", legendHeight + 32)
          .attr("rx", 8)
          .attr("fill", "#f8f8f8")
          .attr("stroke", "#bbb")
          .attr("stroke-width", 1);

        // Draw legend rectangle
        svg.append("rect")
          .attr("x", legendX)
          .attr("y", legendY)
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#income-gradient)");

        // Add legend labels below the gradient
        svg.append("text")
          .attr("x", legendX)
          .attr("y", legendY + legendHeight + 18)
          .style("font-size", "18px")
          .style("text-anchor", "start")
          .style("fill", "#333")
          .text(`$${minIncome.toLocaleString()}`);
        
        svg.append("text")
          .attr("x", legendX + legendWidth / 2)
          .attr("y", legendY + legendHeight + 18)
          .style("font-size", "18px")
          .style("text-anchor", "middle")
          .style("fill", "#333")
          .text(`$${Math.round((minIncome + maxIncome) / 2).toLocaleString()}`);
        
        svg.append("text")
          .attr("x", legendX + legendWidth)
          .attr("y", legendY + legendHeight + 18)
          .style("font-size", "18px")
          .style("text-anchor", "end")
          .style("fill", "#333")
          .text(`$${maxIncome.toLocaleString()}`);

        // Add title (positioned higher from the map)
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", 48)
          .attr("text-anchor", "middle")
          .attr("font-size", "32px")
          .attr("font-weight", "bold")
          .text("Median Family Income by County in Georgia");

        svg.append("text")
          .attr("x", width / 2)
          .attr("y", 82)
          .attr("text-anchor", "middle")
          .attr("font-size", "24px")
          .attr("font-weight", "normal")
          .text("2019-2023");
        
        // Add subtitle (with more space between it and the map)
        
      })
      .catch(err => {
        console.error("Error loading GeoJSON:", err);
        setError("Error loading map data: " + err.message);
      });
  }, [countyData, loading, error]);
  
  return (
    <div className="w-full flex flex-col items-center">
      {loading && <p className="text-white">Loading data...</p>}
      {error && (
        <div className="chart-container" style={{ margin: '20px auto', maxWidth: '900px', padding: '20px', backgroundColor: '#ffeeee', border: '1px solid #ff6666', borderRadius: '5px' }}>
          <h3 style={{ color: '#cc0000', fontWeight: 'bold', fontSize: '20px' }}>Error loading data</h3>
          <p style={{ color: '#333', marginTop: '10px' }}>Error: {error}</p>
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#555' }}>
            <p><strong>Current environment:</strong> {window.location.hostname === 'localhost' ? 'Local Development' : 'GitHub Pages'}</p>
            <p><strong>Data file:</strong> GeorgiaIncomeData.csv</p>
            <p><strong>Full URL:</strong> {window.location.href}</p>
            <p><strong>Note:</strong> Please check that your CSV file is in the correct location: /public/data/GeorgiaIncomeData.csv</p>
          </div>
        </div>
      )}
      <svg ref={svgRef} width="900" height="500"></svg>
      {countyData.length > 0 && (
        <p className="text-sm mt-2 text-white">
          Showing median income for {countyData.length} Georgia counties
        </p>
      )}
    </div>
  );
};

export default IncomeGeorgiaMap;