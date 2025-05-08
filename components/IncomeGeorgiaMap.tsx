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
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-white rounded-xl border-l-4 border border-primary-500 shadow-sm">
        <div className="w-16 h-16 border-4 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-mono text-primary-700">Loading Georgia income data...</p>
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
    if (!geoJson || !countyData.length) return;
    d3.select(svgRef.current).selectAll("*").remove();
    const width = 750;
    const height = 375;
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

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
    // Income color scale
    const incomes = countyData.map((d) => d.median_income);
    const minIncome = d3.min(incomes) || 40000;
    const maxIncome = d3.max(incomes) || 90000;
    
    // Use a reliable color scale that works well for choropleth maps
    const color = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([minIncome, maxIncome]);
      
    // Use all features from the Georgia-only GeoJSON
    // 'features' already declared above, so just reuse it here.
    // Projector - use the standard projection that was working before
    const projection = d3.geoMercator().fitSize([width, height], { type: "FeatureCollection", features });
    const path = d3.geoPath().projection(projection);
    // Draw counties
    const paths = svg
      .append("g")
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d: any) => {
        // Use FIPS code for color lookup
        const fips = d.id;
        const val = incomeByFips[fips];
        return val ? color(val) : "#f5f5f5"; // Light gray for counties with no data
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.8)
      .attr("shape-rendering", "geometricPrecision"); // Smoother rendering

    // Tooltip interaction
    const tooltip = document.getElementById("income-tooltip");
    paths
      .on("mousemove", function (event: MouseEvent, d: any) {
        if (!tooltip) return;
        const countyName = d.properties.NAME || d.properties.name || d.id;
        const fips = d.id;
        const val = incomeByFips[fips];
        tooltip.style.display = "block";
        tooltip.style.left = event.offsetX + 24 + "px";
        tooltip.style.top = event.offsetY + 12 + "px";
        tooltip.innerHTML = val
          ? `<div style='font-family:monospace; font-weight:700; font-size:16px; color:#246BCE; margin-bottom:4px;'>${countyName} County</div>
             <div style='display:flex; justify-content:space-between; margin-top:6px;'>
               <span style='color:#22223B; font-weight:500;'>Median Income:</span>
               <span style='color:#246BCE; font-weight:700;'>$${d3.format(",.0f")(val)}</span>
             </div>`
          : `<div style='font-family:monospace; font-weight:700; font-size:16px; color:#246BCE; margin-bottom:4px;'>${countyName} County</div>
             <div style='color:#888; font-style:italic; margin-top:6px;'>No income data available</div>`;
      })
      .on("mouseleave", function () {
        if (tooltip) tooltip.style.display = "none";
      });

    // Add legend
    const legendWidth = 180; // Even smaller width for compact display
    const legendHeight = 12;
    // Position the legend in the top right corner, far away from any counties
    const legendSvg = svg
      .append("g")
      .attr("transform", `translate(${width - legendWidth - 130},${60})`);
    
    // Create a linear scale for the legend
    const legendScale = d3
      .scaleLinear()
      .domain(color.domain() as [number, number])
      .range([0, legendWidth]);
    
    // Create the axis with abbreviated dollar formatting (40k instead of $40,000)
    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(4) // Fewer ticks to prevent overlap
      .tickFormat((d) => {
        const num = d as number;
        return `$${Math.round(num/1000)}k`; // Format as 40k instead of $40,000
      });
    
    // Create gradient for the legend
    const defs = svg.append("defs");
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
        .attr("stop-color", color(
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
      .attr("font-size", "0.75rem")
      .attr("dy", "0.5em");
    
    // Add a title above the legend
    legendSvg
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .attr("font-size", "0.9rem")
      .attr("fill", "#333")
      .text("Median Family Income (USD)");
  }, [geoJson, countyData]);

  // These states are now handled within the content component
  if (loading || !geoJson) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-white rounded-xl border-l-4 border border-primary-500 shadow-sm">
        <div className="w-16 h-16 border-4 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-mono text-primary-700">Loading Georgia income data...</p>
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
    <div className="w-full h-[500px] flex flex-col bg-white rounded-xl border-l-4 border border-primary-500 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="bg-surface px-8 py-4 border-b border-primary-100">
        <h3 className="text-xl font-mono text-primary-700 font-bold">Median Family Income by County in Georgia</h3>
        <p className="text-neutral text-medium-contrast">2019-2023 Census Data</p>
      </div>
      
      {/* Map Container */}
      <div className="flex-grow relative overflow-x-auto p-4">
        <svg ref={svgRef} style={{ width: "100%", height: "100%", minWidth: 600, minHeight: 400 }} />
        
        {/* Tooltip overlay */}
        <div
          id="income-tooltip"
          style={{
            position: "absolute",
            background: "rgba(255,255,255,0.97)",
            border: "1px solid #246BCE", // Primary blue from brand guidelines
            borderRadius: 8,
            padding: "0.75rem 1.25rem",
            fontSize: "1rem",
            color: "#22223B", // Neutral deep navy from brand guidelines
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            zIndex: 10,
            display: "none",
            minWidth: 200,
            maxWidth: 280,
            pointerEvents: "none"
          }}
        />
      </div>
    </div>
  );
}
