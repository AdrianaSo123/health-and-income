"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface CountyRaceData {
  county: string;
  value: number;
}

export default function RaceInGeorgiaMap() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [countyData, setCountyData] = useState<CountyRaceData[]>([]);
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
          console.log("RaceInGeorgia: Fetched and filtered GA counties:", gaFeatures.length);
          return { type: "FeatureCollection", features: gaFeatures };
        }
      })
      .then((geoJsonData) => {
        // Only proceed if we have valid GeoJSON data
        if (!geoJsonData) return;
        
        // Save the GeoJSON data
        setGeoJson(geoJsonData);
        
        // Now fetch the CSV data after GeoJSON is loaded
        return d3.csv("/health-and-income-demo/data/georgia race population - Sheet1.csv")
          .then((data: any[] | undefined) => {
            // Skip if we don't have data (this happens if CSV loading failed)
            if (!data) return;
            
            // Process the CSV data
            const extractedData: CountyRaceData[] = [];
            data.forEach((row) => {
              if (!row.County || !row.Value) return;
              const countyName = String(row.County).trim();
              const value = parseFloat(row.Value);
              if (!isNaN(value)) {
                extractedData.push({ county: countyName, value });
              }
            });
            
            // Check if we have valid data after processing
            if (extractedData.length === 0) {
              setError("No county data extracted from CSV");
            } else {
              console.log(`RaceInGeorgia: Successfully loaded data for ${extractedData.length} counties`);
              setCountyData(extractedData);
            }
            
            // Always set loading to false when done
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error("Error in RaceInGeorgia data loading:", err);
        setError("Failed to load race data: " + (err.message || String(err)));
        setLoading(false);
      });
  }, []);

  // D3 rendering effect
  useEffect(() => {
    if (!geoJson || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Chart dimensions - smaller for dashboard integration
    const width = 360;
    const height = 240;
    const margin = { top: 5, right: 10, bottom: 30, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    // Create the SVG element with responsive sizing
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("overflow", "visible");

    // Create percentage lookup for counties
    const percentByCounty: Record<string, number> = {};
    countyData.forEach(d => {
      const name = d.county.toLowerCase();
      percentByCounty[name] = d.value;
      percentByCounty[name + " county"] = d.value;
    });

    // Color scale for black population percentage
    const values = countyData.map((d) => d.value);
    const minValue = d3.min(values) || 0;
    const maxValue = d3.max(values) || 100;
    
    // Use a reliable color scale that works well for choropleth maps
    // Using the same color scheme as other visualizations for consistency
    const color = d3
      .scaleSequential(d3.interpolatePurples) // Changed to purple for demographic data
      .domain([minValue, maxValue]);
      
    // Title will be added via a div above the map instead of in the SVG

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
    
    // Create a group for the map with margin
    const mapGroup = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
      
    // Add a background for the map area
    mapGroup.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "#f8f9fa")
      .attr("rx", 8);
    const path = d3.geoPath().projection(projection);

    // Draw counties
    const paths = mapGroup
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("d", (d: any) => path(d))
      .attr("fill", (d: any) => {
        // Use county name for color lookup
        const countyName = d.properties.NAME.toLowerCase();
        // Try different variations to match county names
        const variations = [
          countyName,
          countyName.replace(" county", ""),
          countyName.replace(" county", "") + " county"
        ];
        
        // Find matching county in our data
        for (const variant of variations) {
          if (percentByCounty[variant] !== undefined) {
            return color(percentByCounty[variant]);
          }
        }
        return "#f5f5f5"; // Light gray for counties with no data
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.8)
      .attr("shape-rendering", "geometricPrecision") // Smoother rendering
      .attr("cursor", "pointer"); // Show pointer cursor on hover

    // Create tooltip div if it doesn't exist
    paths
      .on("mouseover", function(event, d: any) {
        const countyName = d.properties.NAME || "Unknown";
        const countyFips = d.id;
        const countyValue = percentByCounty[countyName.toLowerCase()] || percentByCounty[countyName.toLowerCase() + " county"] || "No data";
        
        // Remove any existing tooltips
        d3.select(".race-tooltip").remove();
        
        // Create tooltip
        d3.select("body")
          .append("div")
          .attr("class", "race-tooltip")
          .style("position", "absolute")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px")
          .style("background", "white")
          .style("border", "1px solid #ddd")
          .style("border-radius", "4px")
          .style("padding", "6px 10px")
          .style("font-size", "10px")
          .style("font-family", "system-ui, -apple-system, sans-serif")
          .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
          .style("z-index", 9999)
          .style("pointer-events", "none")
          .html(`
            <div style="font-weight:bold; margin-bottom:2px;">${countyName} County</div>
            <div>Black Population: ${typeof countyValue === 'number' ? countyValue.toFixed(1) + '%' : countyValue}</div>
          `);
      })
      .on("mouseout", function() {
        d3.select(".race-tooltip").remove();
        d3.select(this)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("fill", (d: any) => {
            const countyName = d.properties.NAME || "Unknown";
            const countyValue = percentByCounty[countyName.toLowerCase()] || percentByCounty[countyName.toLowerCase() + " county"];
            return countyValue ? color(countyValue) : "#e0e0e0";
          });
      });

    // Add subtitle - moved higher
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("fill", "#666")
      .text(`Data from U.S. Census Bureau`);

    // Add a legend - positioned completely below the map
    const legendWidth = 120;
    const legendHeight = 8;
    const legendX = width / 2 - legendWidth / 2; // Center horizontally
    const legendY = height - 10; // Position at the very bottom

    // Create gradient for legend
    const defs = svg.append("defs");
    const gradientId = "race-gradient";
    const gradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");
      
    // Add legend title
    svg.append("text")
      .attr("x", legendX + legendWidth / 2)
      .attr("y", legendY - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("fill", "#666")
      .text("Black Population %");

    // Add color stops to gradient
    gradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.1) as number[])
      .enter().append("stop")
      .attr("offset", (d: number) => d * 100 + "%")
      .attr("stop-color", (d: number) => color(minValue + d * (maxValue - minValue)));

    // Draw legend rectangle with gradient
    svg.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#race-gradient)")
      .style("stroke", "#ccc")
      .style("stroke-width", 0.5)
      .attr("rx", 2);

    // Add legend title
    svg.append("text")
      .attr("x", legendX + legendWidth / 2)
      .attr("y", legendY - 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#555")
      .text("Black Population");
      
    // Add legend labels
    svg.append("text")
      .attr("x", legendX)
      .attr("y", legendY - 2)
      .attr("font-size", "10px")
      .attr("text-anchor", "start")
      .attr("fill", "#555")
      .text(`${minValue.toFixed(1)}%`);

    svg.append("text")
      .attr("x", legendX + legendWidth)
      .attr("y", legendY - 2)
      .attr("font-size", "10px")
      .attr("text-anchor", "end")
      .attr("fill", "#555")
      .text(`${maxValue}%`);

  }, [geoJson, countyData, loading, error]);

  return (
    <div className="relative w-full h-full">
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
