"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface CountyData {
  county: string;
  income: number;
  hypertension: number;
}

export default function IncomeVsCardioGeorgia() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<CountyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      d3.csv("/GeorgiaIncomeData.csv"),
      d3.csv("/HypertensionCountyData.csv")
    ]).then(([incomeRows, hypertensionRows]) => {
      // Normalize function for county names
      function normalizeCountyName(name: string | undefined | null) {
        if (typeof name !== 'string') return '';
        return name.replace(/^"|"$/g, '') // remove leading/trailing quotes
          .replace(/ County$/i, '') // remove ' County' suffix
          .trim()
          .toLowerCase();
      }
      // Build lookup for hypertension by county
      const hypertensionMap: Record<string, number> = {};
      hypertensionRows.forEach(row => {
        if (!row.County || row.County.trim() === "") return;
        const countyName = normalizeCountyName(row.County);
        const val = parseFloat(row.HypertensionRate as string);
        if (!isNaN(val) && val > 0) {
          hypertensionMap[countyName] = val;
        }
      });
      // Parse income data robustly
      const mergedData: CountyData[] = [];
      incomeRows.forEach(row => {
        if (!row.County || row.County === "Georgia" || row.County === "United States" || row.County.trim() === "") return;
        if (row.FIPS && String(row.FIPS).length !== 5) return;
        const countyName = normalizeCountyName(row.County);
        const incomeStr = (row["Value (Dollars)"] as string).replace(/[^0-9.]/g, "");
        const income = parseFloat(incomeStr);
        const hypertension = hypertensionMap[countyName];
        if (!isNaN(income) && income > 0 && hypertension !== undefined) {
          mergedData.push({ county: countyName, income, hypertension });
        }
      });
      if (mergedData.length === 0) {
        setError("No matching county data found in both CSVs. Check data format and county names.");
        setLoading(false);
        return;
      }
      setData(mergedData);
      setLoading(false);
    }).catch((err) => {
      setError("Failed to load data: " + (err.message || String(err)));
      setLoading(false);
    });
  }, []);

  // Function to calculate linear regression
  function linearRegression(data: CountyData[]) {
    const n = data.length;
    // Extract x and y values
    const xValues = data.map(d => d.income);
    const yValues = data.map(d => d.hypertension);
    
    // Calculate means
    const xMean = xValues.reduce((sum, val) => sum + val, 0) / n;
    const yMean = yValues.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate coefficients
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }
    
    // Calculate slope and intercept
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    // Calculate R-squared
    const yPredicted = xValues.map(x => slope * x + intercept);
    const ssResidual = yValues.reduce((sum, y, i) => sum + Math.pow(y - yPredicted[i], 2), 0);
    const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    
    // Calculate correlation coefficient (r)
    const r = Math.sqrt(rSquared) * (slope < 0 ? -1 : 1);
    
    return { slope, intercept, rSquared, r };
  }

  useEffect(() => {
    if (loading || error || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const width = 700;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Calculate linear regression
    const regression = linearRegression(data);
    
    // Scales
    const x = d3.scaleLinear()
      .domain([d3.min(data, d => d.income)! * 0.95, d3.max(data, d => d.income)! * 1.05])
      .range([0, innerWidth]);
    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.hypertension)! * 0.95, d3.max(data, d => d.hypertension)! * 1.05])
      .range([innerHeight, 0]);
    
    // Axes
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(8));
    g.append("g").call(d3.axisLeft(y).ticks(8));
    
    // Labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "1.25rem")
      .attr("font-weight", "bold")
      .text("Median Income vs Hypertension Rate by County");
    
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "1rem")
      .text("Median Income (USD)");
    
    svg.append("text")
      .attr("transform", `rotate(-90)`)
      .attr("y", 18)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "1rem")
      .text("Hypertension Rate (%)");
    
    // Add grid lines for better readability
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(x)
          .tickSize(-innerHeight)
          .tickFormat(() => "")
      );
    
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(
        d3.axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      );
    
    // Draw regression line
    const lineGenerator = d3.line<{x: number, y: number}>()
      .x(d => d.x)
      .y(d => d.y);
    
    const xDomain = x.domain();
    const regressionPoints = [
      { x: x(xDomain[0]), y: y(regression.slope * xDomain[0] + regression.intercept) },
      { x: x(xDomain[1]), y: y(regression.slope * xDomain[1] + regression.intercept) }
    ];
    
    g.append("path")
      .datum(regressionPoints)
      .attr("fill", "none")
      .attr("stroke", "#FF5252")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("d", lineGenerator);
    
    // Add regression statistics
    g.append("text")
      .attr("x", innerWidth - 180)
      .attr("y", 30)
      .attr("fill", "#333")
      .attr("font-size", "0.8rem")
      .attr("font-weight", "bold")
      .text(`Correlation: ${regression.r.toFixed(3)}`);
    
    g.append("text")
      .attr("x", innerWidth - 180)
      .attr("y", 50)
      .attr("fill", "#333")
      .attr("font-size", "0.8rem")
      .attr("font-weight", "bold")
      .text(`R²: ${regression.rSquared.toFixed(3)}`);
    
    // Points
    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.income))
      .attr("cy", d => y(d.hypertension))
      .attr("r", 6)
      .attr("fill", "#7F4DE2")
      .attr("opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseenter", function (event, d) {
        // Highlight the point
        d3.select(this)
          .attr("r", 8)
          .attr("stroke-width", 2)
          .attr("opacity", 1);
          
        const [mx, my] = d3.pointer(event, svg.node());
        d3.select("#income-vs-cardio-tooltip")
          .style("display", "block")
          .style("left", `${mx + 15}px`)
          .style("top", `${my - 15}px`)
          .html(`<strong>${d.county.charAt(0).toUpperCase() + d.county.slice(1)} County</strong><br/>
                 <span style="color:#555;">Income:</span> <span style="font-weight:bold;">$${d3.format(",.0f")(d.income)}</span><br/>
                 <span style="color:#555;">Hypertension:</span> <span style="font-weight:bold;">${d3.format(".1f")(d.hypertension)}%</span>`);
      })
      .on("mouseleave", function() {
        // Restore the point
        d3.select(this)
          .attr("r", 6)
          .attr("stroke-width", 1)
          .attr("opacity", 0.7);
          
        d3.select("#income-vs-cardio-tooltip").style("display", "none");
      });
  }, [loading, error, data]);

  if (loading) {
    return <div className="w-full h-96 flex items-center justify-center bg-white/60 rounded-xl border border-primary-100 shadow">Loading...</div>;
  }
  if (error) {
    return <div className="w-full h-96 flex items-center justify-center bg-white/60 rounded-xl border border-primary-100 shadow text-red-600">{error}</div>;
  }
  return (
    <div className="w-full h-[500px] flex flex-col bg-white rounded-xl border-l-4 border border-primary-500 shadow-sm overflow-hidden">
      <div className="bg-surface px-8 py-4 border-b border-primary-100">
        <h3 className="text-xl font-mono text-primary-700 font-bold">Income vs. Hypertension Analysis</h3>
        <p className="text-neutral text-medium-contrast">Georgia Counties (2019-2023 Data)</p>
      </div>
      <div className="flex-grow relative p-4">
        <svg ref={svgRef} width={700} height={400} style={{ width: "100%", height: "100%", minWidth: 400, minHeight: 300 }} />
        <div id="income-vs-cardio-tooltip" style={{ 
          position: "absolute", 
          pointerEvents: "none", 
          display: "none", 
          background: "white",
          border: "1px solid #2c3e50",
          borderRadius: "6px",
          padding: "10px",
          fontSize: "14px", 
          boxShadow: "0 4px 14px rgba(44,62,80,0.15)",
          zIndex: 10 
        }} />
        <div className="absolute bottom-2 right-4 text-xs text-gray-500">
          <span className="inline-block mr-4"><span className="inline-block w-3 h-3 bg-[#7F4DE2] rounded-full mr-1"></span> County Data</span>
          <span className="inline-block"><span className="inline-block w-4 h-[2px] bg-[#FF5252] mr-1"></span> Regression Line</span>
        </div>
      </div>
    </div>
  );
}
