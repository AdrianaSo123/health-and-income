"use client";
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

interface DataPoint {
  year: number;
  income: number;
}

function MedianIncomeTrend() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    year: number;
    income: number;
  }>({ visible: false, x: 0, y: 0, year: 0, income: 0 });

  useEffect(() => {
    // Sample data for median household income in Georgia
    const data: DataPoint[] = [
      { year: 2013, income: 52250 },
      { year: 2014, income: 53657 },
      { year: 2015, income: 55775 },
      { year: 2016, income: 57617 },
      { year: 2017, income: 60336 },
      { year: 2018, income: 61937 },
      { year: 2019, income: 65712 },
      { year: 2020, income: 64994 }, // Note the slight dip during COVID-19
      { year: 2021, income: 69717 },
      { year: 2022, income: 74755 },
      { year: 2023, income: 77719 },
    ];

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Chart dimensions - smaller for dashboard integration
    const width = 400;
    const height = 250;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // SVG setup with responsive design
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add a background for the chart area
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "#f8f9fa")
      .attr("stroke", "#e5e5e5")
      .attr("stroke-width", 1)
      .attr("rx", 8);

    // X scale - using scalePoint for better positioning
    const x = d3
      .scalePoint()
      .domain(data.map(d => d.year.toString()))
      .range([0, innerWidth])
      .padding(0.5);

    // Y scale with proper padding
    const minIncome = d3.min(data, d => d.income) || 50000;
    const maxIncome = d3.max(data, d => d.income) || 80000;
    const yPadding = (maxIncome - minIncome) * 0.1;
    
    const y = d3
      .scaleLinear()
      .domain([Math.max(0, minIncome - yPadding), maxIncome + yPadding])
      .range([innerHeight, 0]);

    // Add grid lines for better readability
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(y.ticks(4)) // Match the number of y-axis ticks
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "3,3"); // Dashed lines

    // X axis with styled labels - improved readability
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickValues(["2013", "2015", "2017", "2019", "2021", "2023"])) // Show fewer years
      .attr("class", "x-axis")
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("font-size", "11px")
      .attr("dy", "0.5em")
      .attr("dx", "-0.5em")
      .attr("fill", "#333");

    // Style the x-axis path
    g.select(".x-axis path")
      .attr("stroke", "#aaa");

    // Y axis with dollar format - improved readability
    g.append("g")
      .call(
        d3.axisLeft(y)
          .tickFormat(d => `$${d3.format(",.0f")(d as number)}`)
          .ticks(4) // Fewer ticks
      )
      .attr("class", "y-axis")
      .selectAll("text")
      .attr("font-size", "11px")
      .attr("font-weight", "normal")
      .attr("dx", "-0.2em")
      .attr("fill", "#333");
      
    // Style the y-axis path
    g.select(".y-axis path")
      .attr("stroke", "#aaa");

    // Y axis label - moved even further away to avoid overlap with tick labels
    g.append("text")
      .attr("x", -innerHeight / 2)
      .attr("y", -55)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("Median Income ($)");

    // Create a line generator
    const line = d3
      .line<DataPoint>()
      .x(d => x(d.year.toString()) as number)
      .y(d => y(d.income))
      .curve(d3.curveMonotoneX); // Smooth curve

    // Add the line path
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#4e79a7")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add data points with interactive tooltips
    g.selectAll(".data-point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", d => x(d.year.toString()) as number)
      .attr("cy", d => y(d.income))
      .attr("r", 4)
      .attr("fill", d => d.year === 2020 ? "#e15759" : "#4e79a7") // Highlight 2020 (COVID year)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("r", 6)
          .attr("stroke-width", 2);
        
        // Remove any existing tooltip
        d3.select(".income-tooltip").remove();
        
        // Create tooltip
        d3.select("body")
          .append("div")
          .attr("class", "income-tooltip")
          .style("position", "absolute")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px")
          .style("background", "white")
          .style("border", "1px solid #ddd")
          .style("border-radius", "4px")
          .style("padding", "6px 10px")
          .style("font-size", "12px")
          .style("font-family", "system-ui, -apple-system, sans-serif")
          .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
          .style("z-index", 9999)
          .style("pointer-events", "none")
          .html(`
            <div style="font-weight:bold; margin-bottom:2px;">${d.year}</div>
            <div>Median Income: $${d.income.toLocaleString()}</div>
          `);
          
        setTooltipData({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          year: d.year,
          income: d.income
        });
      })
      .on("mousemove", function(event) {
        // Update tooltip position as mouse moves
        d3.select(".income-tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("r", 4)
          .attr("stroke-width", 1);
          
        // Remove tooltip
        d3.select(".income-tooltip").remove();
        
        setTooltipData(prev => ({ ...prev, visible: false }));
      });
      
    // Add minimal annotation for COVID impact only
    const covidAnnotation = {
      year: 2020,
      income: 64994,
      text: "COVID",
      dx: 0,
      dy: -15,
    };

    // Add annotation
    const annoGroup = g.append("g");
      
    // Add connector line
    const xPos = x(covidAnnotation.year.toString()) as number;
    const yPos = y(covidAnnotation.income);
    
    annoGroup.append("line")
      .attr("x1", xPos)
      .attr("y1", yPos)
      .attr("x2", xPos + covidAnnotation.dx)
      .attr("y2", yPos + covidAnnotation.dy)
      .attr("stroke", "#555")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");
      
    // Add annotation text with background
    const textElement = annoGroup.append("text")
      .attr("x", xPos + covidAnnotation.dx)
      .attr("y", yPos + covidAnnotation.dy - 3)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#333")
      .text(covidAnnotation.text);
      
    // Get text dimensions for background
    const textBox = textElement.node()?.getBBox();
    if (textBox) {
      annoGroup.insert("rect", "text")
        .attr("x", textBox.x - 2)
        .attr("y", textBox.y - 1)
        .attr("width", textBox.width + 4)
        .attr("height", textBox.height + 2)
        .attr("fill", "rgba(255, 255, 255, 0.8)")
        .attr("rx", 2);
    }
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
          <div className="w-8 h-8 border-2 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mb-2"></div>
          <p className="text-xs text-gray-600">Loading...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
          <div className="text-red-500 text-center max-w-md">
            <p className="text-xs font-bold">Error</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full" />
      {tooltipData.visible && (
        <div 
          className="absolute bg-white px-2 py-1 rounded shadow-sm border border-gray-200 z-10 pointer-events-none text-xs"
          style={{
            left: tooltipData.x + 10,
            top: tooltipData.y - 30,
            transition: "all 0.2s ease"
          }}
        >
          <p className="font-medium">{tooltipData.year}</p>
          <p>${tooltipData.income.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default MedianIncomeTrend;
