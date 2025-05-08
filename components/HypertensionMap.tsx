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
    
    // Chart dimensions - smaller for dashboard integration
    const width = 360;
    const height = 240;
    const margin = { top: 5, right: 10, bottom: 30, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
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
    const colorScale = d3
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
    const projection = d3.geoMercator().fitSize([innerWidth, innerHeight], { type: "FeatureCollection", features });
    const path = d3.geoPath().projection(projection);

    // Create a group for the map with a background
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Title will be added via a div above the map instead of in the SVG
      
    // Add a background for the map area
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "#f8f9fa")
      .attr("rx", 8);

    // Draw the counties with improved interaction
    g.selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        const countyFips = d.id;
        const countyDataItem = countyData.find((item) => item.fips === countyFips);
        return countyDataItem ? colorScale(countyDataItem.disease_rate) : "#e0e0e0";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("cursor", "pointer")
      .on("mouseover", function(event, d: any) {
        const countyDataItem = countyData.find((item) => item.fips === d.id);
        const countyName = d.properties.NAME;
        const rate = countyDataItem ? countyDataItem.disease_rate : "No data";
        
        // Remove any existing tooltips
        d3.select(".hypertension-tooltip").remove();
        
        const tooltip = d3
          .select("body")
          .append("div")
          .attr("class", "hypertension-tooltip")
          .style("position", "absolute")
          .style("visibility", "visible")
          .style("background-color", "white")
          .style("border", "1px solid #ddd")
          .style("border-radius", "4px")
          .style("padding", "6px 10px")
          .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
          .style("font-size", "10px")
          .style("font-family", "system-ui, -apple-system, sans-serif")
          .style("pointer-events", "none")
          .style("z-index", "9999")
          .style("transition", "opacity 0.15s ease")
          .html(`<div><strong>${countyName} County</strong><br/>Hypertension Rate: ${rate}%</div>`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
        
        d3.select(this)
          .attr("stroke", "#333")
          .attr("stroke-width", 2);
      })
      .on("mousemove", function(event) {
        d3.select(".hypertension-tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function(event, d: any) {
        d3.select(".hypertension-tooltip").remove();
        d3.select(this)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("fill", (d: any) => {
            const countyFips = d.id;
            const countyDataItem = countyData.find((item) => item.fips === countyFips);
            return countyDataItem ? colorScale(countyDataItem.disease_rate) : "#e0e0e0";
          });
      });

    // Add a legend - positioned completely below the map
    const legendWidth = 120;
    const legendHeight = 8;
    const legendX = width / 2 - legendWidth / 2; // Center horizontally
    const legendY = height - 10; // Position at the very bottom
    const legendSvg = svg.append("g")
      .attr("transform", `translate(${legendX},${legendY})`);
      
    // Add legend title
    legendSvg.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("fill", "#666")
      .text("Hypertension Rate %");
    
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
        .attr("stop-color", colorScale(
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
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
          <div className="w-16 h-16 border-4 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-mono text-primary-700">Loading hypertension data...</p>
        </div>
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
          <div className="text-red-500 text-center max-w-md">
            <p className="text-lg font-bold mb-2">Error Loading Data</p>
            <p>{error}</p>
          </div>
        </div>
        <svg ref={svgRef} className="w-full h-full" />
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
