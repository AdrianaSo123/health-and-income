import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const MedianIncomeTrend = () => {
  const svgRef = useRef();

  useEffect(() => {
    // Sample data - replace with your actual data
    const data = [
      {year: 2013, income: 52250 }, 
      {year: 2014, income: 53657 }, 
      {year: 2015, income: 55775}, 
      {year: 2016, income: 57617}, 
      {year: 2017, income: 60336},
      {year: 2018, income: 61937}, 
      { year: 2019, income: 65712 },
      { year: 2020, income: 64994 },
      { year: 2021, income: 69717 },
      { year: 2022, income: 74755 },
      { year: 2023, income: 77719 }
    ];

    const createChart = (data) => {
      // Clear any existing chart
      d3.select(svgRef.current).selectAll('*').remove();

      // Set dimensions
      // Larger, more readable, and consistent chart
      const width = 750;
      const height = 375;
      const margin = { top: 70, right: 40, bottom: 100, left: 90 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Create SVG
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create band scale for x (like HypertensionTrend)
      const x = d3.scaleBand()
        .domain(data.map(d => d.year.toString()))
        .range([0, innerWidth])
        .padding(0.2);

      // Get min income for y-axis calculation
      const minIncome = d3.min(data, d => d.income);
      // Set y-axis domain to end at 80,000
      const yAxisMax = 80000;
      const y = d3.scaleLinear()
        .domain([
          Math.floor(minIncome * 0.98),
          yAxisMax
        ])
        .range([innerHeight, 0]);



      // Add grid lines (match HypertensionTrend)
      g.append('g')
        .attr('class', 'grid')
        .selectAll('line')
        .data(y.ticks(4))
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', d => y(d))
        .attr('y2', d => y(d))
        .attr('stroke', '#eee')
        .attr('stroke-dasharray', '2,2');

      // Create line generator for band scale
      const line = d3.line()
        .x(d => x(d.year.toString()) + x.bandwidth() / 2)
        .y(d => y(d.income))
        .curve(d3.curveMonotoneX);

      // Add line path (distinct green)
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'var(--color-brand-primary)') // Brand Purple
        .attr('stroke-width', 3)
        .attr('d', line);

      // Add data points with hover effects
      g.selectAll('.data-point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'data-point')
        .attr('cx', d => x(d.year.toString()) + x.bandwidth() / 2)
        .attr('cy', d => y(d.income))
        .attr('r', 5)
        .attr('fill', d => d.year === 2020 ? '#e15759' : 'var(--color-brand-primary)') // Highlight 2020 (COVID year)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
          d3.select(this)
            .attr('r', 7)
            .attr('stroke-width', 2);
            
          // Remove any existing tooltip
          d3.select('.income-trend-tooltip').remove();
          
          // Format income with commas
          const formattedIncome = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(d.income);
          
          // Create tooltip with detailed information
          const tooltipContent = `
            <div style="font-weight:bold; margin-bottom:2px;">${d.year}</div>
            <div>Median Income: ${formattedIncome}</div>
          `;
          
          d3.select('body')
            .append('div')
            .attr('class', 'income-trend-tooltip')
            .style('position', 'absolute')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px')
            .style('background', 'white')
            .style('border', '1px solid #ddd')
            .style('border-radius', '4px')
            .style('padding', '6px 10px')
            .style('font-size', '12px')
            .style('font-family', 'system-ui, -apple-system, sans-serif')
            .style('box-shadow', '0 2px 5px rgba(0,0,0,0.1)')
            .style('z-index', 9999)
            .style('pointer-events', 'none')
            .html(tooltipContent);
        })
        .on('mousemove', function(event) {
          // Update tooltip position as mouse moves
          d3.select('.income-trend-tooltip')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('r', 5)
            .attr('stroke-width', 1);
            
          // Remove tooltip
          d3.select('.income-trend-tooltip').remove();
        });

      // Add value labels above every point, including the max value
      g.selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .attr('x', d => x(d.year.toString()) + x.bandwidth() / 2)
        .attr('y', d => y(d.income) - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-family', 'IBM Plex Mono, Inter')
        .attr('fill', 'black')
        .text(d => `$${d3.format(',')(d.income)}`);

      // Add axes (band scale, rotated labels)
      // X Axis
      g.append('g')
        .attr('class', 'x-axis brand-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('class', 'brand-tick')
        .attr('transform', 'rotate(-35)')
        .style('text-anchor', 'end')
        .attr('font-family', 'IBM Plex Mono, monospace')
        .attr('fill', 'black');

      // Restore default y-axis ticks (no filtering)
      // Keep the same number of ticks, but set the last tick to 80,000
      const numTicks = 6;
      let tickVals = y.ticks(numTicks);
      tickVals[tickVals.length - 1] = yAxisMax; // Ensure last tick is 80,000
      const yAxis = g.append('g')
        .call(d3.axisLeft(y)
          .tickValues(tickVals)
          .tickFormat(d => `$${d3.format(",")(d)}`));
      yAxis.selectAll('text')
        .attr('font-size', '16px')
        .attr('font-weight', 'normal')
        .attr('fill', 'black')
        .attr('font-family', 'IBM Plex Mono, monospace');
      yAxis.selectAll('line')
        .attr('stroke', '#e9d5ff')
        .attr('stroke-width', 1.5);
      yAxis.selectAll('.domain')
        .attr('stroke', '#e9d5ff')
        .attr('stroke-width', 2);
      // Set grid lines to same color and dash as HypertensionTrend
      g.selectAll('.grid line')
        .attr('stroke', '#eee')
        .attr('stroke-dasharray', '2,2');

      // Add title (move down, but enough margin)
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '28px')
        .attr('font-family', 'IBM Plex Mono, monospace')
        .attr('font-weight', 'bold')
        .attr('fill', 'var(--color-brand-primary)')
        .text('Median Household Income Trend (2013-2023)');

      // Add x axis label (move even lower)
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 80) // was +60
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .text('Year');

      // Add y axis label (move even further left)
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -90) // was -70
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .text('Median Household Income');
    };

    createChart(data);

    // Add resize handler
    const handleResize = () => {
      createChart(data);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ margin: '20px auto', maxWidth: 750, background: 'white', border: '1.5px solid #e9d5ff', borderRadius: '12px', padding: 24 }}>
      <div className="card-visual">
        <svg ref={svgRef} width={750} height={375} viewBox="0 0 750 375" style={{ display: 'block', margin: '0 auto', background: 'transparent' }} />
      </div>
    </div>
  );
};

export default MedianIncomeTrend;