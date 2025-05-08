"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
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
    const width = 750;
    const height = 375;
    const margin = { top: 50, right: 60, bottom: 60, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", height)
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
      
    // Add chart title and subtitle
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("Hypertension Prevalence in the United States (1999-2018)");
      
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 45)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#666")
      .text("Age-adjusted trend among adults aged 18 and over, by sex");
    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);
      
    // X axis with styled labels
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("fill", "#555");
    // Y axis with percentage format
    g.append("g")
      .attr("class", "y-axis")
      .call(
        d3.axisLeft(yScale)
          .tickFormat(d => `${d}%`)
          .ticks(5)
      )
      .selectAll("text")
      .attr("font-size", "12px")
      .attr("fill", "#555");
      
    // Add y-axis label
    g.append("text")
      .attr("x", -innerHeight / 2)
      .attr("y", -45)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#555")
      .text("Hypertension Prevalence (%)");
    // Style the axis paths
    g.select(".x-axis path")
      .attr("stroke", "#aaa");
      
    g.select(".y-axis path")
      .attr("stroke", "#aaa");
      
    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right + 10}, ${margin.top + 10})`);
      
    // Overall line
    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", "#4e79a7")
      .attr("stroke-width", 3);
      
    legend.append("text")
      .attr("x", 25)
      .attr("y", 4)
      .attr("font-size", "12px")
      .text("Overall");
      
    // Men line
    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 20)
      .attr("y2", 20)
      .attr("stroke", "#59a14f")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2");
      
    legend.append("text")
      .attr("x", 25)
      .attr("y", 24)
      .attr("font-size", "12px")
      .text("Men");
      
    // Women line
    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 40)
      .attr("y2", 40)
      .attr("stroke", "#e15759")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2");
      
    legend.append("text")
      .attr("x", 25)
      .attr("y", 44)
      .attr("font-size", "12px")
      .text("Women");
    // Create line generators for each dataset
    const overallLine = d3
      .line<DataPoint>()
      .x(d => xScale(d.year) as number)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
      
    const menLine = d3
      .line<DataPoint>()
      .x(d => xScale(d.year) as number)
      .y(d => d.men ? yScale(d.men) : null)
      .curve(d3.curveMonotoneX);
      
    const womenLine = d3
      .line<DataPoint>()
      .x(d => xScale(d.year) as number)
      .y(d => d.women ? yScale(d.women) : null)
      .curve(d3.curveMonotoneX);
    
    // Add the overall line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#4e79a7")
      .attr("stroke-width", 3)
      .attr("d", overallLine);
      
    // Add the men line
    g.append("path")
      .datum(data.filter(d => d.men !== undefined))
      .attr("fill", "none")
      .attr("stroke", "#59a14f")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2")
      .attr("d", menLine as any);
      
    // Add the women line
    g.append("path")
      .datum(data.filter(d => d.women !== undefined))
      .attr("fill", "none")
      .attr("stroke", "#e15759")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2")
      .attr("d", womenLine as any);
    
    // Add data points with interactive tooltips
    g.selectAll(".data-point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", d => xScale(d.year) as number)
      .attr("cy", d => yScale(d.value))
      .attr("r", 6)
      .attr("fill", "#4e79a7")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("r", 8)
          .attr("stroke-width", 3);
          
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
      .on("mouseout", function() {
        d3.select(this)
          .attr("r", 6)
          .attr("stroke-width", 2);
          
        setTooltipData(prev => ({ ...prev, visible: false }));
      });
      
    // Add annotations for key points
    const annotations = [
      {
        year: "2009-2010",
        value: data.find(d => d.year === "2009-2010")?.value || 0,
        text: "Lowest Point",
        dx: 0,
        dy: -30
      },
      {
        year: "2017-2018",
        value: data.find(d => d.year === "2017-2018")?.value || 0,
        text: "Recent Increase",
        dx: 10,
        dy: -20
      }
    ];
    
    // Add annotation group
    const annotationGroup = g.append("g")
      .attr("class", "annotations");
      
    // Add each annotation
    annotations.forEach(anno => {
      const annoGroup = annotationGroup.append("g");
      
      // Add connector line
      annoGroup.append("line")
        .attr("x1", xScale(anno.year) as number)
        .attr("y1", yScale(anno.value))
        .attr("x2", (xScale(anno.year) as number) + anno.dx)
        .attr("y2", yScale(anno.value) + anno.dy)
        .attr("stroke", "#555")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");
        
      // Add annotation text with background
      const textElement = annoGroup.append("text")
        .attr("x", (xScale(anno.year) as number) + anno.dx)
        .attr("y", yScale(anno.value) + anno.dy - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text(anno.text);
        
      // Get text dimensions for background
      const textBox = textElement.node()?.getBBox();
      if (textBox) {
        annoGroup.insert("rect", "text")
          .attr("x", textBox.x - 4)
          .attr("y", textBox.y - 2)
          .attr("width", textBox.width + 8)
          .attr("height", textBox.height + 4)
          .attr("fill", "rgba(255, 255, 255, 0.8)")
          .attr("rx", 3);
      }
    });
  }, [data]);

  if (loading) {
    return <div className="w-full h-96 flex items-center justify-center">Loading...</div>;
  }
  if (error) {
    return <div className="w-full h-96 flex items-center justify-center text-red-500">{error}</div>;
  }
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg ref={svgRef} className="w-full h-full"></svg>
      {tooltipData.visible && (
        <div 
          className="absolute bg-white px-3 py-2 rounded shadow-md border border-gray-200 z-10 pointer-events-none"
          style={{
            left: tooltipData.x + 10,
            top: tooltipData.y - 40,
            transition: "all 0.2s ease"
          }}
        >
          <p className="font-bold text-sm">{tooltipData.year}</p>
          <p className="text-sm">Overall: {tooltipData.value}%</p>
          {tooltipData.men && <p className="text-sm">Men: {tooltipData.men}%</p>}
          {tooltipData.women && <p className="text-sm">Women: {tooltipData.women}%</p>}
        </div>
      )}
    </div>
  );
}
