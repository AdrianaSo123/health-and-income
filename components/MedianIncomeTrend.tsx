"use client";
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

interface DataPoint {
  year: number;
  income: number;
}

export default function MedianIncomeTrend() {
  const svgRef = useRef<SVGSVGElement | null>(null);
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

    // Chart dimensions
    const width = 750;
    const height = 375;
    const margin = { top: 50, right: 50, bottom: 60, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // SVG setup with responsive design
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
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "#f8f9fa")
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
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    // X axis with styled labels
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .attr("class", "x-axis")
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("fill", "#555");

    // Style the x-axis path
    g.select(".x-axis path")
      .attr("stroke", "#aaa");

    // Y axis with dollar format
    g.append("g")
      .call(
        d3.axisLeft(y)
          .tickFormat(d => `$${d3.format(",")(d as number)}`)
          .ticks(5)
      )
      .attr("class", "y-axis");
      
    // Style the y-axis path
    g.select(".y-axis path")
      .attr("stroke", "#aaa");

    // Y axis label
    g.append("text")
      .attr("x", -innerHeight / 2)
      .attr("y", -45)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#555")
      .text("Median Household Income");

    // Chart title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "1.5rem")
      .attr("font-weight", 700)
      .attr("fill", "#1976d2")
      .text("US Median Household Income (2013-2023)");

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
      .attr("stroke-width", 3)
      .attr("d", line);

    // Add data points with interactive tooltips
    g.selectAll(".data-point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", d => x(d.year.toString()) as number)
      .attr("cy", d => y(d.income))
      .attr("r", 6)
      .attr("fill", d => d.year === 2020 ? "#e15759" : "#4e79a7") // Highlight 2020 (COVID year)
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
          income: d.income
        });
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("r", 6)
          .attr("stroke-width", 2);
          
        setTooltipData(prev => ({ ...prev, visible: false }));
      });
      
    // Add annotations for key events
    const annotations = [
      {
        year: 2020,
        income: data.find(d => d.year === 2020)?.income || 0,
        text: "COVID-19 Impact",
        dx: 0,
        dy: -30
      },
      {
        year: 2023,
        income: data.find(d => d.year === 2023)?.income || 0,
        text: "Record High",
        dx: -10,
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
        .attr("x1", x(anno.year.toString()) as number)
        .attr("y1", y(anno.income))
        .attr("x2", (x(anno.year.toString()) as number) + anno.dx)
        .attr("y2", y(anno.income) + anno.dy)
        .attr("stroke", "#555")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");
        
      // Add annotation text
      annoGroup.append("text")
        .attr("x", (x(anno.year.toString()) as number) + anno.dx)
        .attr("y", y(anno.income) + anno.dy - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", anno.year === 2020 ? "#e15759" : "#4e79a7")
        .text(anno.text);
    });
  }, []);

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
          <p className="text-sm">${tooltipData.income.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
