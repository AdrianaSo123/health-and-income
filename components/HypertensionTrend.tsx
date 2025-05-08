"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
// @ts-ignore
import Papa from "papaparse";
import getDataContent from "../src/utils/dataPath";

interface DataPoint {
  year: string;
  value: number;
  men?: number;
  women?: number;
}

export default function HypertensionTrend() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    year: string;
    value: number;
    men?: number;
    women?: number;
  }>({ visible: false, x: 0, y: 0, year: "", value: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const fileContent = getDataContent("HypertensionHistoricalData.csv");
        if (!fileContent || fileContent.trim().length === 0) {
          setError("Hypertension data file is empty or missing.");
          setLoading(false);
          console.error("HypertensionHistoricalData.csv is empty or missing:", fileContent);
          return;
        }
        const parsedData = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
        });
        if (!parsedData.data || (Array.isArray(parsedData.data) && parsedData.data.length === 0)) {
          setError("Failed to parse hypertension data. Check CSV format.");
          setLoading(false);
          console.error("PapaParse returned empty data for HypertensionHistoricalData.csv:", fileContent);
          return;
        }
        const chartData = (parsedData.data as any[])
          .filter((row) => row && Object.keys(row).length > 0)
          .map((row) => {
            const columns = Object.keys(row);
            const year = row[columns[0]];
            const value = parseFloat(row[columns[1]]);
            const men = parseFloat(row[columns[2]]);
            const women = parseFloat(row[columns[3]]);
            return {
              year,
              value: isNaN(value) ? 0 : value,
              men: isNaN(men) ? undefined : men,
              women: isNaN(women) ? undefined : women
            };
          })
          .filter((item) => item.year && item.value > 0);
        if (chartData.length === 0) {
          setError("No valid hypertension trend data found. Check CSV content.");
          setLoading(false);
          console.error("No valid hypertension trend data found. Raw CSV:", fileContent);
          return;
        }
        setData(chartData);
        setLoading(false);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        setLoading(false);
        console.error("Exception thrown during hypertension data load:", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    d3.select(svgRef.current).selectAll("*").remove();
    const width = 400;
    const height = 250;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
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
    g.insert("rect", ":first-child")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "#f8f9fa")
      .attr("stroke", "#e5e5e5")
      .attr("stroke-width", 1)
      .attr("rx", 8);
    // Use scalePoint for better positioning of points
    const xScale = d3
      .scalePoint()
      .domain(data.map(d => d.year))
      .range([0, innerWidth])
      .padding(0.5);
      
    // Calculate y-axis domain with appropriate padding
    const allValues = data.flatMap(d => [
      d.value,
      d.men || d.value,
      d.women || d.value
    ]);
    const minY = Math.min(d3.min(allValues) || 0, 38); // Ensure we go at least to 38%
    const maxY = Math.max(d3.max(allValues) || 100, 52); // Ensure we go at least to 52%
    const yPadding = (maxY - minY) * 0.1;
    
    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, minY - yPadding), maxY + yPadding])
      .range([innerHeight, 0]);
      
    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks(4))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "3,3"); // Dashed lines
      
    // X axis with styled labels - improved readability
    const yearValues = data.map(d => d.year);
    const filteredYears = yearValues.filter((year, i) => i === 0 || i === Math.floor(yearValues.length / 3) || i === Math.floor(2 * yearValues.length / 3) || i === yearValues.length - 1);
    
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickValues(filteredYears)) // Show only a few years
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("font-size", "11px")
      .attr("dy", "0.5em")
      .attr("dx", "-0.5em")
      .attr("fill", "#333");
    // Y axis with percentage format - improved readability
    g.append("g")
      .attr("class", "y-axis")
      .call(
        d3.axisLeft(yScale)
          .tickFormat(d => `${d3.format(".0f")(d)}%`) // No decimal places
          .ticks(4) // Fewer ticks
      )
      .selectAll("text")
      .attr("font-size", "11px")
      .attr("font-weight", "normal")
      .attr("dx", "-0.2em")
      .attr("fill", "#333");
      
    // X axis label - smaller and more compact
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("Year");

    // Y axis label - moved further away to avoid overlap with tick labels
    g.append("text")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("Hypertension Rate (%)");
    // Style the axis paths
    g.select(".x-axis path")
      .attr("stroke", "#aaa");
      
    g.select(".y-axis path")
      .attr("stroke", "#aaa");
      
    // Create line generators for each dataset
    const overallLine = d3
      .line<DataPoint>()
      .x(d => xScale(d.year) as number)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const menLine = d3
      .line<DataPoint>()
      .x(d => xScale(d.year) as number)
      .y(d => d.men !== undefined ? yScale(d.men) : 0)
      .defined(d => d.men !== undefined)
      .curve(d3.curveMonotoneX);

    const womenLine = d3
      .line<DataPoint>()
      .x(d => xScale(d.year) as number)
      .y(d => d.women !== undefined ? yScale(d.women) : 0)
      .defined(d => d.women !== undefined)
      .curve(d3.curveMonotoneX);
    
    // Add the overall line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#4e79a7")
      .attr("stroke-width", 3)
      .attr("d", overallLine);
      
    // Add the men line if we have men data
    const menData = data.filter(d => d.men !== undefined);
    if (menData.length > 0) {
      g.append("path")
        .datum(menData)
        .attr("fill", "none")
        .attr("stroke", "#59a14f")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2")
        .attr("d", menLine as any);
    }

    // Add the women line if we have women data
    const womenData = data.filter(d => d.women !== undefined);
    if (womenData.length > 0) {
      g.append("path")
        .datum(womenData)
        .attr("fill", "none")
        .attr("stroke", "#e15759")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2")
        .attr("d", womenLine as any);
    }
    
    // Add data points with hover effects
    g.selectAll(".data-point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", d => xScale(d.year) as number)
      .attr("cy", d => yScale(d.value))
      .attr("r", 4)
      .attr("fill", d => d.year === "2020" ? "#e15759" : "#4e79a7") // Highlight 2020 (COVID year)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d: any) {
        d3.select(this)
          .attr("r", 6)
          .attr("stroke-width", 2);
          
        // Remove any existing tooltip
        d3.select(".hypertension-trend-tooltip").remove();
        
        // Create tooltip with detailed information
        let tooltipContent = `
          <div style="font-weight:bold; margin-bottom:2px;">${d.year}</div>
          <div>Hypertension Rate: ${d.value.toFixed(1)}%</div>
        `;
        
        // Add gender breakdown if available
        if (d.men !== undefined && d.women !== undefined) {
          tooltipContent += `
            <div style="margin-top:4px; font-size:11px;">
              <div>Men: ${d.men.toFixed(1)}%</div>
              <div>Women: ${d.women.toFixed(1)}%</div>
            </div>
          `;
        }
        
        d3.select("body")
          .append("div")
          .attr("class", "hypertension-trend-tooltip")
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
          .html(tooltipContent);
          
        setTooltipData({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          year: d.year,
          value: d.value,
          men: d.men,
          women: d.women
        });
      })
      .on("mousemove", function(event) {
        // Update tooltip position as mouse moves
        d3.select(".hypertension-trend-tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("r", 4)
          .attr("stroke-width", 1);
          
        // Remove tooltip
        d3.select(".hypertension-trend-tooltip").remove();
          
        setTooltipData(prev => ({ ...prev, visible: false }));
      });
      
    // Add minimal annotation for COVID impact only
    const covidYear = "2020";
    const covidDataPoint = data.find(d => d.year === covidYear);
    
    if (covidDataPoint) {
      const covidAnnotation = {
        year: covidYear,
        value: covidDataPoint.value,
        text: "COVID",
        dx: 0,
        dy: -15,
      };

      // Add annotation
      const annoGroup = g.append("g");
      const xPos = xScale(covidAnnotation.year) as number;
      const yPos = yScale(covidAnnotation.value);
        
      // Add connector line
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
    }
  }, [data]);

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
          <p>Rate: {tooltipData.value}%</p>
          {tooltipData.men !== undefined && <p>Men: {tooltipData.men}%</p>}
          {tooltipData.women !== undefined && <p>Women: {tooltipData.women}%</p>}
        </div>
      )}
    </div>
  );
}
