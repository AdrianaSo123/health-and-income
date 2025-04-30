import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import getDataContent from '../utils/dataPath';

const HypertensionChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get the CSV content directly from our utility
        const fileContent = getDataContent('HypertensionHistoricalData.csv');
        
        // Parse CSV data
        const parsedData = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true
        });
        
        // Transform data for visualization
        const chartData = parsedData.data
          .filter(row => row && Object.keys(row).length > 0)
          .map(row => {
            // Get first two columns (assuming first is year, second is value)
            const columns = Object.keys(row);
            const year = row[columns[0]];
            const value = parseFloat(row[columns[1]]);
            
            return { 
              year: year,
              value: isNaN(value) ? 0 : value
            };
          })
          .filter(item => item.year && item.value > 0);
        
        setData(chartData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading CSV:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Create the chart when data is loaded
  useEffect(() => {
    if (!data || data.length === 0) return;
    // CLEAR SVG BEFORE DRAWING
    d3.select(svgRef.current).selectAll('*').remove();
    // Larger, more readable, and consistent chart
    const width = 750;
    const height = 375;
    const margin = { top: 70, right: 40, bottom: 150, left: 90 }; // Increased bottom margin
    
    // Calculate inner dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Chart area group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    // Chart area background (brand background)
    g.insert('rect', ':first-child')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'var(--background)');
    
    // Create x scale (simple band scale for categories)
    const xScale = d3.scaleBand()
                     .domain(data.map(d => d.year))
                     .range([0, innerWidth])
                     .padding(0.2);
    
    // Create y scale based on data, with padding
    const minY = d3.min(data, d => d.value);
    const maxY = d3.max(data, d => d.value);
    const yPadding = 2; // percentage points
    const yScale = d3.scaleLinear()
     .domain([Math.floor(minY - yPadding), Math.ceil(maxY + yPadding)])
     .range([innerHeight, 0]);
    
    // Add x-axis with rotated labels
    g.append('g')
      .attr('class', 'x-axis brand-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('class', 'brand-tick')
      .attr('transform', 'rotate(-35)')
      .style('text-anchor', 'end')
      .style('font-family', 'var(--font-heading)')
      .style('fill', 'var(--color-brand-primary)');
    
    // Add y-axis (match MedianIncomeTrend ticks)
    g.append('g')
      .attr('class', 'y-axis brand-axis')
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => `${d}%`))
      .selectAll('text')
      .attr('class', 'brand-tick')
      .style('font-family', 'var(--font-heading)')
      .style('fill', 'var(--accent)')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', 'var(--foreground)');
    
    // Make ALL axis lines black after BOTH axes are created
    svg.selectAll(".domain, .tick line")
     .attr("stroke", "var(--border)")
     .attr("stroke-width", 1.5);
    
    // Add grid lines (match MedianIncomeTrend)
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(6))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', 'var(--neutral-200)')
      .attr('stroke-dasharray', '2,2');

    // Define a shared color for the dots and line (match legend)
    const mainDotColor = getComputedStyle(document.documentElement).getPropertyValue('--color-brand-primary').trim() || '#7F4DE2';

    // Create line generator
    const line = d3.line()
                   .x(d => xScale(d.year) + xScale.bandwidth() / 2)
                   .y(d => yScale(d.value))
                   .curve(d3.curveMonotoneX);
    
    // Add line path (match legend color)
    g.append("path")
     .datum(data)
     .attr("fill", "none")
     .attr("stroke", mainDotColor)
     .attr("stroke-width", 3)
     .attr("d", line);
    
    // Add data points (match legend color)
    g.selectAll(".dot")
     .data(data)
     .enter()
     .append("circle")
     .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
     .attr("cy", d => yScale(d.value))
     .attr("r", 5)
     .attr("fill", mainDotColor);
    
    // Add value labels (match MedianIncomeTrend)
    g.selectAll(".label")
     .data(data)
     .enter()
     .append("text")
     .attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
     .attr("y", d => yScale(d.value) - 10)
     .attr("text-anchor", "middle")
     .attr("font-size", "10px")
     .attr("font-family", 'var(--font-heading)')
     .attr("fill", 'var(--secondary)')
     .text(d => `${d.value}%`);
    
    // Add title
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", 30)
       .attr("text-anchor", "middle")
       .attr('font-size', '28px')
       .attr('font-family', 'var(--font-heading)')
       .attr('font-weight', 'bold')
       .attr('fill', 'var(--accent)')
       .text('Hypertension Prevalence Trend (2013-2023)');
    
    // Add x-axis label (match MedianIncomeTrend)
    g.append("text")
     .attr("x", innerWidth / 2)
     .attr("y", innerHeight + 110)
     .attr("text-anchor", "middle")
     .attr("font-size", "16px")
     .attr('font-family', 'var(--font-heading)')
     .attr('fill', 'var(--foreground)')
     .text("Survey Period");
    
    // Add y-axis label (match MedianIncomeTrend)
    g.append("text")
     .attr("transform", "rotate(-90)")
     .attr("x", -innerHeight / 2)
     .attr("y", -90)
     .attr("text-anchor", "middle")
     .attr("font-size", "16px")
     .text("Percentage (%)");
    
  }, [data]);
  
  if (loading) {
    return (
      <div style={{ background: 'var(--card)', borderRadius: '12px', padding: '24px', margin: '24px 0', boxShadow: '0 2px 8px var(--neutral-200)' }}>
        {loading && <div aria-live="polite" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>Loading data...</div>}
        {error && <div style={{ color: 'var(--destructive)', fontFamily: 'var(--font-heading)' }} role="alert">{error}</div>}
        <svg ref={svgRef} style={{ width: '100%', height: 'auto', background: 'var(--background)', borderRadius: '12px' }} aria-label="Hypertension Prevalence Trend chart" role="img" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '5px', margin: '20px auto', maxWidth: '900px' }}>
        <h3 style={{ color: 'var(--destructive)', fontWeight: 'bold', fontSize: '20px' }}>Error loading data</h3>
        <p style={{ color: 'var(--foreground)', marginTop: '10px' }}>Error: {error}</p>
        <div style={{ marginTop: '15px', fontSize: '14px', color: 'var(--muted-foreground)' }}>
          <p><strong>Current environment:</strong> {window.location.hostname === 'localhost' ? 'Local Development' : 'GitHub Pages'}</p>
          <p><strong>Data file:</strong> HypertensionHistoricalData.csv</p>
          <p><strong>Full URL:</strong> {window.location.href}</p>
          <p><strong>Note:</strong> Please check that your CSV file is in the correct location: /public/data/HypertensionHistoricalData.csv</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="debug-hypertension" style={{ margin: '20px auto', maxWidth: 750, borderRadius: '12px', padding: 24 }}>
      <svg
        ref={svgRef}
        className="debug-hypertension"
        width={750}
        height={375}
        viewBox="0 0 750 375"
        style={{
          display: 'block',
          margin: '0 auto',
          background: '#fff'
        }}
      />
    </div>
  );
};

export default HypertensionChart;