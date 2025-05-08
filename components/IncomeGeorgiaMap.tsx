"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
// import getDataContent from "../src/utils/dataPath";
// Now using d3.csv to fetch from /public

interface CountyIncome {
  county: string;
  median_income: number;
}

// Wrapper component to handle client-side only rendering
export default function IncomeGeorgiaMap() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Return a skeleton during server-side rendering
  if (!isMounted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mb-2"></div>
        <p className="text-xs text-gray-600">Loading...</p>
      </div>
    );
  }
  
  // Only render the actual component content on the client side
  return <IncomeGeorgiaMapContent />;
}

// Main component with all the functionality
function IncomeGeorgiaMapContent() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  interface CountyIncome {
    fips: string;
    median_income: number;
  }
  const [countyData, setCountyData] = useState<CountyIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unmatchedCSV, setUnmatchedCSV] = useState<string[]>([]);
  const [unmatchedGeo, setUnmatchedGeo] = useState<string[]>([]);

  // NOTE: In a real project, you would fetch this from a static file or API
  // For this demo, we'll use a minimal GeoJSON for Georgia counties
  // You should replace this with your actual topojson/geojson if available
  const [geoJson, setGeoJson] = useState<any>(null);

  useEffect(() => {
    // Fetch the Plotly US counties GeoJSON and filter to Georgia counties (FIPS starts with '13')
    fetch("https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json")
      .then((res) => res.json())
      .then((usGeoJson) => {
        if (!usGeoJson || !usGeoJson.features || !Array.isArray(usGeoJson.features) || usGeoJson.features.length === 0) {
          console.error("US counties GeoJSON fetch returned empty or invalid data.", usGeoJson);
          setGeoJson(null);
        } else {
          // Filter features to only Georgia counties
          const gaFeatures = usGeoJson.features.filter((feature: any) => String(feature.id).startsWith("13"));
          console.log("Fetched and filtered GA counties:", gaFeatures.length, gaFeatures.slice(0, 2));
          setGeoJson({ type: "FeatureCollection", features: gaFeatures });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch US counties GeoJSON:", err);
        setGeoJson(null);
      });
  }, []);

  useEffect(() => {
    // Use fetch to get raw CSV text and parse it manually
    fetch("/GeorgiaIncomeData.csv")
      .then(response => response.text())
      .then(csvText => {
        
        // Split into lines and skip header lines
        const lines = csvText.split('\n');
        // Skip the first 4 lines (headers)
        const dataLines = lines.slice(4);
        
        const extractedData: CountyIncome[] = [];
        
        dataLines.forEach(line => {
          // Skip empty lines
          if (!line.trim()) return;
          
          // Parse CSV line manually
          // Need to handle quoted fields with commas inside them
          const fields: string[] = [];
          let currentField = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              fields.push(currentField);
              currentField = '';
            } else {
              currentField += char;
            }
          }
          
          // Don't forget the last field
          fields.push(currentField);
          
          // Now process the fields
          const countyName = fields[0].replace(/^"|"$/g, '');
          const fipsRaw = fields[1]?.replace(/^"|"$/g, '');
          const incomeStr = fields[2]?.replace(/^"|"$/g, '').replace(/[^0-9.]/g, '');
          
          // Skip state/country rows
          if (countyName === "Georgia" || countyName === "United States") {
            return;
          }
          
          // Validate FIPS
          if (!fipsRaw || fipsRaw.length !== 5) {
            return;
          }
          
          const fips = String(fipsRaw).padStart(5, "0");
          const income = parseFloat(incomeStr);
          
          if (!isNaN(income) && income > 0) {
            extractedData.push({ fips, median_income: income });
          }
        });
        
        setCountyData(extractedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load income data:", err);
        setError("Failed to load income data: " + (err.message || String(err)));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!geoJson || !countyData.length || !svgRef.current) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Chart dimensions - smaller for dashboard integration
    const width = 360;
    const height = 240;
    const margin = { top: 5, right: 10, bottom: 30, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const incomeByFips: Record<string, number> = {};
    countyData.forEach((d) => {
      incomeByFips[d.fips] = d.median_income;
    });
    const features = geoJson.features;
    features.forEach((feature: any) => {
      const fips = feature.id;
      feature.properties.median_income = incomeByFips[fips] || null;
    });
    // Store any unmatched counties for debugging if needed
    const missingFips = features.filter((feature: any) => !incomeByFips[feature.id]).map((feature: any) => feature.id);
    const missingGeo = countyData.filter((d) => !features.find((f: any) => f.id === d.fips)).map((d) => d.fips);
    setUnmatchedCSV(missingGeo);
    setUnmatchedGeo(missingFips);

    // Create a color scale with a more vibrant palette
    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([d3.min(countyData.map(d => d.median_income)) || 40000, d3.max(countyData.map(d => d.median_income)) || 90000]);

    // Create tooltip div if it doesn't exist - with consistent styling across visualizations
    // First remove any existing tooltip to avoid duplicates
    d3.select("#income-tooltip").remove();
    
    // Create a new tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("id", "income-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "6px 10px")
      .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
      .style("font-size", "10px")
      .style("font-family", "system-ui, -apple-system, sans-serif")
      .style("pointer-events", "none")
      .style("transition", "opacity 0.15s ease, transform 0.15s ease")
      .style("opacity", "0")
      .style("transform", "translateY(3px)")
      .style("z-index", "9999");

    // Create the SVG element
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("overflow", "hidden");
      
    // Instead of adding title to SVG, we'll add it via a div above the map
      
    // Create a group for the map with a background
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Add a background for the map area
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "#f8f9fa")
      .attr("rx", 8);

    // Create a projection for Georgia
    const projection = d3.geoMercator()
      .fitSize([innerWidth, innerHeight], geoJson);

    // Create a path generator
    const path = d3.geoPath().projection(projection);

    // Draw the counties with improved interaction
    g.selectAll("path")
      .data(geoJson.features)
      .enter()
      .append("path")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        const countyFips = d.id;
        const countyDataItem = countyData.find((item) => item.fips === countyFips);
        return countyDataItem ? colorScale(countyDataItem.median_income) : "#e0e0e0";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("cursor", "pointer")
      .on("mouseover", function(event, d: any) {
        const countyFips = d.id;
        const countyDataItem = countyData.find((item) => item.fips === countyFips);
        const countyName = d.properties.NAME;
        const income = countyDataItem ? countyDataItem.median_income : "No data";
        const incomeFormatted = `$${income.toLocaleString()}`;
        
        // Enhanced tooltip content with consistent styling - smaller for dashboard
        tooltip.html(
          `<div style='font-weight:bold; font-size:11px; color:#333; margin-bottom:2px;'>${countyName}</div>
           <div style='display:flex; justify-content:space-between;'>
             <span style='color:#555; font-size:10px; margin-right:6px;'>Income:</span>
             <span style='color:#333; font-weight:bold; font-size:10px;'>${income.toLocaleString ? '$' + income.toLocaleString() : income}</span>
           </div>`
        );
        
        d3.select(this)
          .attr("stroke", "#333")
          .attr("stroke-width", 2)
          .attr("fill", (d: any) => {
            const countyFips = d.id;
            const countyDataItem = countyData.find((item) => item.fips === countyFips);
            return countyDataItem ? d3.color(colorScale(countyDataItem.median_income))?.brighter(0.3)?.toString() || "#4e79a7" : "#e0e0e0";
          });
        
        // Show the tooltip
        tooltip
          .style("visibility", "visible")
          .style("opacity", "1")
          .style("transform", "translateY(0)");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function(event, d: any) {
        tooltip.style("visibility", "hidden");
        d3.select(this)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("fill", (d: any) => {
            const countyFips = d.id;
            const countyDataItem = countyData.find((item) => item.fips === countyFips);
            return countyDataItem ? colorScale(countyDataItem.median_income) : "#e0e0e0";
          });
      });

    // Add a legend - positioned completely below the map
    const legendWidth = 120;
    const legendHeight = 8;
    const legendX = width / 2 - legendWidth / 2; // Center horizontally
    const legendY = height - 10; // Position at the very bottom
    const legendSvg = svg.append("g")
      .attr("transform", `translate(${legendX},${legendY})`);
    
    // Create a linear scale for the legend
    const legendScale = d3
      .scaleLinear()
      .domain(colorScale.domain() as [number, number])
      .range([0, legendWidth]);
    
    // Create the axis with abbreviated dollar formatting (40k instead of $40,000)
    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(3) 
      .tickFormat((d) => {
        const num = d as number;
        return `$${Math.round(num/1000)}k`; 
      });
    
    // Create gradient for the legend
    const defs = d3
      .select(svgRef.current)
      .append("defs");
    const gradientId = "income-gradient";
    const gradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");
    
    // Add color stops to the gradient
    for (let i = 0; i <= 100; i++) {
      gradient
        .append("stop")
        .attr("offset", `${i}%`)
        .attr("stop-color", colorScale(
          legendScale.invert((i / 100) * legendWidth)
        ));
    }
    
    // Draw the colored rectangle
    legendSvg
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", `url(#${gradientId})`)
      .style("stroke", "#ccc")
      .style("stroke-width", 0.5);
    
    // Add the axis below the colored rectangle
    legendSvg
      .append("g")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .attr("font-size", "8px")
      .attr("dy", "0.8em");
      
    // Add legend title
    legendSvg.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("fill", "#666")
      .text("Median Income");
  }, [geoJson, countyData]);

  // These states are now handled within the content component
  if (loading || !geoJson) {
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-white rounded-xl border-l-4 border border-accent-500 shadow-sm">
        <div className="text-accent-500 text-5xl mb-4">⚠️</div>
        <p className="text-lg font-medium text-neutral">{error}</p>
        <button 
          className="mt-6 px-6 py-2 bg-accent-50 hover:bg-accent-100 text-accent-700 font-mono rounded-lg transition-colors"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full relative">
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
    </div>
  );
}
