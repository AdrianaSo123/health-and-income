"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface CountyHypertension {
  fips: string;
  disease_rate: number;
}

export default function HypertensionMap() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [countyData, setCountyData] = useState<CountyHypertension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoJson, setGeoJson] = useState<any>(null);

  useEffect(() => {
    // Set loading state at the beginning
    setLoading(true);
    setError(null);
    
    // Fetch the Plotly US counties GeoJSON and filter to Georgia counties (FIPS starts with '13')
    fetch("https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json")
      .then((res) => res.json())
      .then((usGeoJson) => {
        if (!usGeoJson || !usGeoJson.features || !Array.isArray(usGeoJson.features) || usGeoJson.features.length === 0) {
          console.error("US counties GeoJSON fetch returned empty or invalid data.", usGeoJson);
          setError("Failed to load county boundaries");
          setLoading(false);
          return null;
        } else {
          // Filter features to only Georgia counties
          const gaFeatures = usGeoJson.features.filter((feature: any) => String(feature.id).startsWith("13"));
          console.log("HypertensionGeorgia: Fetched and filtered GA counties:", gaFeatures.length);
          return { type: "FeatureCollection", features: gaFeatures };
        }
      })
      .then((geoJsonData) => {
        // Only proceed if we have valid GeoJSON data
        if (!geoJsonData) return;
        
        // Save the GeoJSON data
        setGeoJson(geoJsonData);
        
        // Now fetch the CSV data after GeoJSON is loaded
        return d3.csv("/health-and-income-demo/data/HypertensionCountyData.csv")
          .then((data: any[] | undefined) => {
            // Skip if we don't have data (this happens if CSV loading failed)
            if (!data) return;
            
            // Process the CSV data with the GeoJSON that's now guaranteed to be loaded
            // Build a map from county name (normalized) to FIPS from geoJson
            const countyNameToFips: Record<string, string> = {};
            geoJsonData.features.forEach((feature: any) => {
              const name = (feature.properties.NAME || '').toLowerCase();
              countyNameToFips[name] = feature.id;
            });
            
            // Process the CSV data
            const extractedData: CountyHypertension[] = [];
            data.forEach((row) => {
              if (!row.County || !row.HypertensionRate) return;
              const countyName = String(row.County).toLowerCase();
              const fips = countyNameToFips[countyName];
              const rate = parseFloat(row.HypertensionRate as string);
              if (fips && !isNaN(rate) && rate > 0) {
                extractedData.push({ fips, disease_rate: rate });
              }
            });
            
            // Check if we have valid data after processing
            if (extractedData.length === 0) {
              setError("No county data extracted from CSV after FIPS join");
            } else {
              console.log(`HypertensionGeorgia: Successfully loaded data for ${extractedData.length} counties`);
              setCountyData(extractedData);
            }
            
            // Always set loading to false when done
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error("Error in HypertensionGeorgia data loading:", err);
        setError("Failed to load hypertension data: " + (err.message || String(err)));
        setLoading(false);
      });
  }, []); // Remove the dependency on geoJson to avoid circular dependency

  // D3 rendering effect
  useEffect(() => {
    if (error || loading || !geoJson || !countyData.length) {
      // Don't run D3 code until data is loaded and no error
      return;
    }

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = 750;
    const height = 375;
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Join CSV and GeoJSON by FIPS code
    const rateByFips: Record<string, number> = {};
    countyData.forEach((d) => {
      rateByFips[d.fips] = d.disease_rate;
    });

    // Color scale for hypertension rate
    const rates = countyData.map((d) => d.disease_rate);
    const minRate = d3.min(rates) || 20;
    const maxRate = d3.max(rates) || 60;
    
    // Use a reliable color scale that works well for choropleth maps
    const color = d3
      .scaleSequential(d3.interpolateReds)
      .domain([minRate, maxRate]);

    // Filter for Georgia counties
    const features = geoJson.features.filter((f: any) => {
      if (!f.id) {
        console.warn("GeoJSON feature missing 'id':", f);
        return false;
      }
      return f.id.startsWith("13");
    });

    // Projector
    const projection = d3.geoMercator().fitSize([width, height], { type: "FeatureCollection", features });
    const path = d3.geoPath().projection(projection);

    // Draw counties
    const paths = svg
      .append("g")
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("d", (d: any) => path(d)) // Fix TypeScript error by using a function
      .attr("fill", (d: any) => {
        // Use FIPS code for color lookup
        const fips = d.id;
        const val = rateByFips[fips];
        return val ? color(val) : "#f5f5f5"; // Light gray for counties with no data
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.8)
      .attr("shape-rendering", "geometricPrecision") // Smoother rendering
      .attr("cursor", "pointer"); // Show pointer cursor on hover

    // Tooltip interaction with enhanced styling
    const tooltip = document.getElementById("hypertension-tooltip");
    paths
      .on("mousemove", function (event: MouseEvent, d: any) {
        if (!tooltip) return;
        const countyName = d.properties.NAME || d.properties.name || "";
        const fips = d.id;
        const val = rateByFips[fips];
        
        // Get the SVG's position relative to the viewport
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        
        // Calculate position relative to the SVG container
        const mouseX = event.clientX - svgRect.left;
        const mouseY = event.clientY - svgRect.top;
        
        // Position tooltip with offset from cursor
        tooltip.style.display = "block";
        tooltip.style.left = mouseX + 24 + "px";
        tooltip.style.top = mouseY + 12 + "px";
        
        // Add transition effect
        tooltip.style.opacity = "1";
        tooltip.style.transform = "translateY(0)";
        
        // Enhanced tooltip content with brand styling
        tooltip.innerHTML = val
          ? `<div style='font-family:monospace; font-weight:700; font-size:16px; color:#d7263d; margin-bottom:4px; border-bottom:1px solid rgba(215,38,61,0.2); padding-bottom:4px;'>${countyName} County</div>
             <div style='display:flex; justify-content:space-between; margin-top:6px; align-items:center;'>
               <span style='color:#22223B; font-weight:500;'>Hypertension Rate:</span>
               <span style='color:#d7263d; font-weight:700; font-size:18px;'>${d3.format(".1f")(val)}%</span>
             </div>`
          : `<div style='font-family:monospace; font-weight:700; font-size:16px; color:#d7263d; margin-bottom:4px; border-bottom:1px solid rgba(215,38,61,0.2); padding-bottom:4px;'>${countyName} County</div>
             <div style='color:#888; font-style:italic; margin-top:6px;'>No data available</div>`;
      })
      .on("mouseleave", function () {
        if (tooltip) {
          // Add fade-out transition
          tooltip.style.opacity = "0";
          tooltip.style.transform = "translateY(10px)";
          // Hide after transition completes
          setTimeout(() => {
            tooltip.style.display = "none";
          }, 200);
        }
      })
      // Add hover effect to counties
      .on("mouseenter", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 1.5)
          .attr("stroke", "#333")
          .attr("stroke-opacity", 1);
      })
      .on("mouseleave", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 0.5)
          .attr("stroke", "#fff")
          .attr("stroke-opacity", 0.8);
      });

    // Add legend
    const legendWidth = 200;
    const legendHeight = 10;
    const legendX = width - legendWidth - 20;
    const legendY = height - 40;
    
    const legendSvg = svg
      .append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);
    
    const legendScale = d3
      .scaleLinear()
      .domain([minRate, maxRate])
      .range([0, legendWidth]);
    
    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(5)
      .tickFormat((d) => `${d}%`);
    
    const defs = svg.append("defs");
    const gradientId = "rate-gradient";
    const gradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");
    
    // Create gradient stops
    for (let i = 0; i <= 100; i++) {
      gradient
        .append("stop")
        .attr("offset", `${i}%`)
        .attr("stop-color", color(
          legendScale.invert((i / 100) * legendWidth)
        ));
    }
    
    legendSvg
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", `url(#${gradientId})`);
    
    legendSvg
      .append("g")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .attr("font-size", "0.9rem");
    
    legendSvg
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .attr("font-size", "1rem")
      .attr("fill", "#d7263d")
      .text("Hypertension Rate (%)");
  }, [geoJson, countyData, loading, error]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-mono text-primary-700">Loading hypertension data...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
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
  
  // Render the map
  return (
    <div className="relative h-full w-full">
      <svg 
        ref={svgRef} 
        style={{ 
          width: "100%", 
          height: "100%", 
          display: "block", // Prevent extra space issues
          maxWidth: "100%",
          maxHeight: "100%",
          overflow: "visible" // Allow tooltips to overflow
        }} 
        preserveAspectRatio="xMidYMid meet"
      />
      
      {/* Tooltip overlay */}
      <div
        id="hypertension-tooltip"
        style={{
          position: "absolute",
          pointerEvents: "none",
          background: "rgba(255,255,255,0.97)",
          border: "1px solid #d7263d",
          borderLeft: "4px solid #d7263d",
          borderRadius: 8,
          padding: "0.75rem 1.25rem",
          fontSize: "1rem",
          color: "#22223B",
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 10,
          display: "none",
          minWidth: 220,
          maxWidth: 300,
          opacity: 0,
          transform: "translateY(10px)",
          transition: "opacity 0.2s ease, transform 0.2s ease"
        }}
      />
    </div>
  );
}
