import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import getDataContent from '../utils/dataPath';

const IncomeVsCardioGeorgia = () => {
  const svgRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Load and process data
  useEffect(() => {
    // Only run if svg ref is defined
    if (!svgRef.current) return;
    
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Get the CSV content directly from our utility
        console.log("Getting Income and Hypertension data directly");
        // eslint-disable-next-line import/no-webpack-loader-syntax
        let incomeText = require('!!raw-loader!../data/GeorgiaIncomeData.csv').default;
        console.log("First 300 chars of incomeText:", incomeText && incomeText.substring(0, 300));
        // Skip metadata lines at the top
        const incomeLines = incomeText.split('\n');
        // Find the header row (first line that starts with 'County,FIPS,Value (Dollars)')
        const headerIdx = incomeLines.findIndex(line => line.trim().startsWith('County,FIPS,Value (Dollars)'));
        if (headerIdx === -1) throw new Error('Could not find header row in income CSV');
        incomeText = incomeLines.slice(headerIdx).join('\n');
        const hypertensionText = getDataContent('HypertensionCountyData.csv');
        console.log('Hypertension CSV text length:', hypertensionText && hypertensionText.length);
        console.log('First 200 chars of hypertension CSV:', hypertensionText && hypertensionText.substring(0, 200));
        
        console.log("Income data loaded, length:", incomeText.length);
        console.log("Hypertension data loaded, length:", hypertensionText.length);
        
        // Process income data using PapaParse for robust CSV parsing
        const incomeData = {};
        const parsed = Papa.parse(incomeText, {
          header: true,
          skipEmptyLines: true
        });
        parsed.data.forEach(row => {
          let county = row['County'] ? row['County'].replace(/"/g, '').replace(' County', '').trim() : '';
          if (county === 'United States' || county === 'Georgia' || !county) return;
          let incomeStr = row['Value (Dollars)'] ? row['Value (Dollars)'].replace(/"/g, '').replace(/,/g, '') : '';
          const income = parseFloat(incomeStr);
          if (!isNaN(income) && income > 0) {
            incomeData[county] = income;
            // Optionally log: console.log(`Income data: ${county} = ${income}`);
          }
        });
        
        // Process hypertension data with more reliable parsing
        const hypertensionData = {};
        const hypertensionLines = hypertensionText.split('\n').slice(1); // Skip header line
        
        for (const line of hypertensionLines) {
          // Parse the CSV line
          const parts = [];
          let currentPart = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              parts.push(currentPart);
              currentPart = '';
            } else {
              currentPart += char;
            }
          }
          
          // Add the last part
          parts.push(currentPart);
          
          // Clean the parts
          const cleanParts = parts.map(part => part.replace(/"/g, '').trim());
          
          if (cleanParts.length >= 2) {
            const countyName = cleanParts[0];
            const rate = parseFloat(cleanParts[1]);
            
            if (!isNaN(rate) && rate > 0) {
              // Remove "County" suffix for better mapping
              const mappingName = countyName.replace(/ County$/i, '');
              hypertensionData[mappingName] = rate;
              console.log(`Hypertension data: ${mappingName} = ${rate}`);
            }
          }
        }
        
        console.log("Processed hypertension data:", Object.keys(hypertensionData).length, "counties");
        
        // --- Normalize and capitalize county names for robust joining ---
        function normalizeCounty(name) {
          return name
            .toLowerCase()
            .replace(/county/g, '')
            .replace(/[^a-z0-9]/g, '') // remove all non-alphanumeric
            .trim();
        }
        function capitalizeCounty(name) {
          return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }

        // Build normalized maps
        const normIncomeData = {};
        Object.entries(incomeData).forEach(([county, val]) => {
          normIncomeData[normalizeCounty(county)] = { val, original: county };
        });
        const normHypertensionData = {};
        Object.entries(hypertensionData).forEach(([county, val]) => {
          normHypertensionData[normalizeCounty(county)] = { val, original: county };
        });

        // Debug: print sample normalized keys and values (capitalized for counties)
        console.log('Sample normalized income counties:', Object.values(normIncomeData).slice(0, 10).map(e => capitalizeCounty(e.original)));
        console.log('Sample normalized hypertension counties:', Object.values(normHypertensionData).slice(0, 10).map(e => capitalizeCounty(e.original)));
        console.log('Sample income values:', Object.values(normIncomeData).slice(0, 10).map(e => e.val));
        console.log('Sample hypertension values:', Object.values(normHypertensionData).slice(0, 10).map(e => e.val));
        console.log('Total normalized income counties:', Object.keys(normIncomeData).length);
        console.log('Total normalized hypertension counties:', Object.keys(normHypertensionData).length);

        // Join on normalized names, and capitalize county names for output
        const chartData = [];
        Object.keys(normIncomeData).forEach(normCounty => {
          if (normHypertensionData[normCounty]) {
            // Use the original county name from income data, capitalized
            const originalCounty = normIncomeData[normCounty].original;
            chartData.push({
              county: capitalizeCounty(originalCounty),
              income: normIncomeData[normCounty].val,
              hypertension: normHypertensionData[normCounty].val
            });
          }
        });

        // Debug: log counties missing in either dataset
        const incomeOnly = Object.keys(normIncomeData).filter(c => !(c in normHypertensionData));
        const hyperOnly = Object.keys(normHypertensionData).filter(c => !(c in normIncomeData));
        console.log('Counties in income only:', incomeOnly);
        console.log('Counties in hypertension only:', hyperOnly);

        // Debug: print sample joined data
        console.log('Sample joined chartData:', chartData.slice(0, 10));
        console.log("Combined data points:", chartData.length);
        
        if (chartData.length === 0) {
          throw new Error("No matching counties found between datasets");
        }
        
        // Now create the visualization with the data
        createVisualization(chartData);
        setIsLoading(false);
        
      } catch (error) {
        console.error("Error loading or processing data:", error);
        setErrorMessage(error.message || "Error loading data");
        setIsLoading(false);
      }
    }
    
    // Function to create the visualization
    function createVisualization(data) {
      // Clear any existing content
      d3.select(svgRef.current).selectAll("*").remove();
      
      // Create the SVG element
      const svg = d3.select(svgRef.current)
        .style('background', 'white');
      const width = 900;
      const height = 500;
      const margin = { top: 60, right: 50, bottom: 70, left: 70 };
      
      // Calculate inner dimensions
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      
      // Create scales
      const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.income) * 1.05])
        .range([0, innerWidth]);
      
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.hypertension) * 1.05])
        .range([innerHeight, 0]);
      
      // Create chart group
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Add X axis with darker color
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d => `$${d}k`))
        .attr("color", "#333") // Make axis darker
        .attr("font-weight", "bold") // Make labels bolder
        .selectAll("line")
        .attr('stroke', '#FFB43A') // brand accent color (Unified regression color, 2025-04-26)
        .attr("stroke-width", 1.5); // Make tick lines thicker
      
      // Add x-axis label
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 50)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "var(--color-brand-primary)")
        .text("Median Household Income ($k)");
      
      // Add Y axis with darker color
      g.append("g")
        .call(d3.axisLeft(yScale))
        .attr("color", "#333") // Make axis darker
        .attr("font-weight", "bold") // Make labels bolder
        .selectAll("line")
        .attr('stroke', '#FFB43A') // brand accent color (Unified regression color, 2025-04-26)
        .attr("stroke-width", 1.5); // Make tick lines thicker
      
      // Add Y axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .attr('fill', 'var(--color-brand-primary)') // brand primary color
        .text("Hypertension Rate");
      
      // Add title
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .attr('fill', 'var(--color-brand-primary)') // brand primary color
        .text("Income vs. Hypertension in Georgia Counties");
      
      // Create a tooltip
      const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("z-index", "1000");
      
      // Calculate regression
      const xMean = d3.mean(data, d => d.income);
      const yMean = d3.mean(data, d => d.hypertension);
      let numerator = 0, denominator = 0;
      
      data.forEach(d => {
        const xDiff = d.income - xMean;
        const yDiff = d.hypertension - yMean;
        numerator += xDiff * yDiff;
        denominator += xDiff * xDiff;
      });
      
      const slope = numerator / denominator;
      const intercept = yMean - (slope * xMean);
      
      // Calculate correlation coefficient
      let sumXY = 0, sumX2 = 0, sumY2 = 0;
      
      data.forEach(d => {
        const xDiff = d.income - xMean;
        const yDiff = d.hypertension - yMean;
        sumXY += xDiff * yDiff;
        sumX2 += xDiff * xDiff;
        sumY2 += yDiff * yDiff;
      });
      
      const correlation = sumXY / Math.sqrt(sumX2 * sumY2);
      
      // Add regression line
      const x1 = d3.min(data, d => d.income);
      const y1 = (slope * x1) + intercept;
      const x2 = d3.max(data, d => d.income);
      const y2 = (slope * x2) + intercept;
      
      g.append("line")
        .attr("x1", xScale(x1))
        .attr("y1", yScale(y1))
        .attr("x2", xScale(x2))
        .attr("y2", yScale(y2))
        .attr("stroke", "#FFB43A") // brand accent color (Unified regression color, 2025-04-26)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");
      
      // Add correlation text
      g.append("text")
        .attr("x", innerWidth - 150)
        .attr("y", 20)
        .text(`Correlation: ${correlation.toFixed(3)}`)
        .attr("font-size", "12px")
        .attr("fill", "#333"); // Darker text color
      
      // Find extreme points to label
      const extremePoints = [
        // Highest hypertension rate
        data.reduce((max, d) => d.hypertension > max.hypertension ? d : max, data[0]),
        // Lowest hypertension rate
        data.reduce((min, d) => d.hypertension < min.hypertension ? d : min, data[0]),
        // Highest income
        data.reduce((max, d) => d.income > max.income ? d : max, data[0]),
        // Lowest income 
        data.reduce((min, d) => d.income < min.income ? d : min, data[0])
      ];
      
      // Find outliers (counties with largest residuals)
      const outliers = data
        .map(d => {
          const predicted = slope * d.income + intercept;
          return {
            ...d,
            residual: Math.abs(d.hypertension - predicted)
          };
        })
        .sort((a, b) => b.residual - a.residual)
        .slice(0, 3);
      
      // Combine extreme points and outliers (without duplicates)
      const pointsToLabel = [...extremePoints];
      
      // Add outliers if they're not already in the extreme points
      outliers.forEach(outlier => {
        if (!pointsToLabel.some(p => p.county === outlier.county)) {
          pointsToLabel.push(outlier);
        }
      });
      
      // Add dots for each county
      g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.income))
        .attr("cy", d => yScale(d.hypertension))
        .attr("r", d => {
          // Make extreme points and outliers slightly larger
          return pointsToLabel.some(p => p.county === d.county) ? 7 : 5;
        })
        .attr("fill", d => {
          // Highlight extreme points and outliers
          return pointsToLabel.some(p => p.county === d.county) ? "#FFB43A" : "var(--color-brand-primary)"; // brand primary color
        })
        .attr("opacity", 0.7)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("r", 9)
            .attr("stroke-width", 2);
          
          tooltip
            .style("visibility", "visible")
            .html(`<strong>${d.county} County</strong><br>
                   Income: $${d.income.toFixed(1)}k<br>
                   Hypertension: ${d.hypertension.toFixed(1)}`)
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function(d) {
          // Determine if this is a labeled point
          const isLabeled = pointsToLabel.some(p => p.county === d.county);
          
          d3.select(this)
            .attr("r", isLabeled ? 7 : 5)
            .attr("stroke-width", 1);
          
          tooltip.style("visibility", "hidden");
        });
      
      // Label the extreme and outlier points
      pointsToLabel.forEach(d => {
        g.append("text")
          .attr("x", xScale(d.income) + 8)
          .attr("y", yScale(d.hypertension) - 8)
          .text(d.county)
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "#333"); // Darker text color
      });
      
      // Add a legend to explain the highlighted points - moved to top right
      const legend = g.append("g")
        .attr("transform", `translate(${innerWidth - 150}, 40)`); // Moved to top right
      
      legend.append("rect")
        .attr("width", 150)
        .attr("height", 80)
        .attr("fill", "white")
        .attr("stroke", "var(--color-brand-primary)") // brand primary color
        .attr("rx", 10);
      
      legend.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .text("Highlighted Points:")
        .attr("font-weight", "bold")
        .attr("font-size", "12px")
        .attr("fill", "#333"); // Darker text color
      
      legend.append('circle')
        .attr('cx', 20)
        .attr('cy', 40)
        .attr('r', 7)
        .attr('fill', '#FFB43A'); // orange for extreme values
      
      legend.append("text")
        .attr("x", 35)
        .attr("y", 44)
        .text("Extreme values")
        .attr("font-size", "11px")
        .attr("fill", "#333"); // Darker text color
      
      legend.append("circle")
        .attr("cx", 20)
        .attr("cy", 60)
        .attr("r", 5)
        .attr("fill", "var(--color-brand-primary)");
      
      legend.append("text")
        .attr("x", 35)
        .attr("y", 64)
        .text("Other counties")
        .attr("font-size", "11px")
        .attr("fill", "#333"); // Darker text color
    }
    
    loadData();
    
    // Cleanup function - remove any tooltips when component unmounts
    return () => {
      d3.selectAll("body > div.tooltip").remove();
    };
  }, []);
  
  return (
    <div className="visualization-container">
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <h2>Income vs. Hypertension in Georgia Counties</h2>
        {isLoading && <p>Loading data...</p>}
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      </div>
      
      <div className="card-visual">
        <svg 
          ref={svgRef}
          width="900" 
          height="500" 
          style={{
            margin: '0 auto',
            display: 'block',
            border: '1px solid #bbb',
            borderRadius: '12px',
            background: 'white'
          }}
        ></svg>
      </div>
      
      <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 20px' }}>
        <h3>About this Visualization</h3>
        <p>
          This scatterplot explores the relationship between median household income 
          and hypertension rates across Georgia counties. Each point represents a county,
          with the horizontal position showing income level and the vertical position showing
          hypertension rate.
        </p>
        <p>
          The red dashed line represents the trend line (linear regression).
          A negative correlation suggests that as income increases, hypertension rates tend
          to decrease.
        </p>
        <p>
          Orange highlighted points represent counties with extreme values: the highest and lowest
          incomes, the highest and lowest hypertension rates, and the counties that deviate most
          from the overall trend.
        </p>
      </div>
    </div>
  );
};

export default IncomeVsCardioGeorgia;