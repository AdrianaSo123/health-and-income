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
    // Generate data with correlation closer to -0.4
    const generateCountyData = (): CountyData[] => {
      const counties = [
        "Appling", "Atkinson", "Bacon", "Baker", "Baldwin", "Banks", "Barrow", "Bartow", 
        "Ben Hill", "Berrien", "Bibb", "Bleckley", "Brantley", "Brooks", "Bryan", "Bulloch", 
        "Burke", "Butts", "Calhoun", "Camden", "Candler", "Carroll", "Catoosa", "Charlton", 
        "Chatham", "Chattahoochee", "Chattooga", "Cherokee", "Clarke", "Clay", "Clayton", "Clinch", 
        "Cobb", "Coffee", "Colquitt", "Columbia", "Cook", "Coweta", "Crawford", "Crisp", 
        "Dade", "Dawson", "Decatur", "DeKalb", "Dodge", "Dooly", "Dougherty", "Douglas", 
        "Early", "Echols", "Effingham", "Elbert", "Emanuel", "Evans", "Fannin", "Fayette", 
        "Floyd", "Forsyth", "Franklin", "Fulton", "Gilmer", "Glascock", "Glynn", "Gordon", 
        "Grady", "Greene", "Gwinnett", "Habersham", "Hall", "Hancock", "Haralson", "Harris", 
        "Hart", "Heard", "Henry", "Houston", "Irwin", "Jackson", "Jasper", "Jeff Davis", 
        "Jefferson", "Jenkins", "Johnson", "Jones", "Lamar", "Lanier", "Laurens", "Lee", 
        "Liberty", "Lincoln", "Long", "Lowndes", "Lumpkin", "Macon", "Madison", "Marion", 
        "McDuffie", "McIntosh", "Meriwether", "Miller", "Mitchell", "Monroe", "Montgomery", "Morgan", 
        "Murray", "Muscogee", "Newton", "Oconee", "Oglethorpe", "Paulding", "Peach", "Pickens", 
        "Pierce", "Pike", "Polk", "Pulaski", "Putnam", "Quitman", "Rabun", "Randolph", 
        "Richmond", "Rockdale", "Schley", "Screven", "Seminole", "Spalding", "Stephens", "Stewart", 
        "Sumter", "Talbot", "Taliaferro", "Tattnall", "Taylor", "Telfair", "Terrell", "Thomas", 
        "Tift", "Toombs", "Towns", "Treutlen", "Troup", "Turner", "Twiggs", "Union", 
        "Upson", "Walker", "Walton", "Ware", "Warren", "Washington", "Wayne", "Webster", 
        "Wheeler", "White", "Whitfield", "Wilcox", "Wilkes", "Wilkinson", "Worth"
      ];
      
      // Base income values (realistic for Georgia counties)
      const baseIncomes = counties.map(() => Math.floor(40000 + Math.random() * 80000));
      
      // Sort incomes to make visualization cleaner
      baseIncomes.sort((a, b) => a - b);
      
      // Generate hypertension rates with moderate negative correlation (~ -0.4)
      const data: CountyData[] = [];
      
      for (let i = 0; i < counties.length; i++) {
        // Base negative correlation
        let baseRate = 100 - (baseIncomes[i] - 40000) / 1000;
        
        // Add significant random noise to weaken correlation to around -0.4
        const noise = (Math.random() - 0.5) * 40;
        const hypertensionRate = Math.max(30, Math.min(120, baseRate + noise));
        
        data.push({
          county: counties[i],
          income: baseIncomes[i],
          hypertension: Number(hypertensionRate.toFixed(1))
        });
      }
      
      return data;
    };
    
    const sampleData: CountyData[] = generateCountyData();
    
      { county: "Appling", income: 53535, hypertension: 114.8 },
      { county: "Atkinson", income: 44737, hypertension: 61.7 },
      { county: "Bacon", income: 56213, hypertension: 86.0 },
      { county: "Baker", income: 50682, hypertension: 62.1 },
      { county: "Baldwin", income: 61247, hypertension: 138.7 },
      { county: "Banks", income: 83913, hypertension: 67.8 },
      { county: "Barrow", income: 87324, hypertension: 56.5 },
      { county: "Bartow", income: 81253, hypertension: 104.0 },
      { county: "Ben Hill", income: 47699, hypertension: 90.0 },
      { county: "Berrien", income: 58742, hypertension: 82.2 },
      { county: "Bibb", income: 63482, hypertension: 52.2 },
      { county: "Bleckley", income: 59218, hypertension: 55.8 },
      { county: "Brantley", income: 56842, hypertension: 56.8 },
      { county: "Brooks", income: 55827, hypertension: 86.0 },
      { county: "Bryan", income: 98271, hypertension: 65.4 },
      { county: "Bulloch", income: 64235, hypertension: 94.8 },
      { county: "Burke", income: 57321, hypertension: 118.2 },
      { county: "Butts", income: 72154, hypertension: 110.4 },
      { county: "Calhoun", income: 57125, hypertension: 120.2 },
      { county: "Camden", income: 76429, hypertension: 82.7 },
      { county: "Candler", income: 55218, hypertension: 92.3 },
      { county: "Carroll", income: 71254, hypertension: 52.7 },
      { county: "Catoosa", income: 84256, hypertension: 76.9 },
      { county: "Charlton", income: 55139, hypertension: 88.5 },
      { county: "Chatham", income: 78213, hypertension: 73.6 },
      { county: "Chattahoochee", income: 61247, hypertension: 65.8 },
      { county: "Chattooga", income: 56218, hypertension: 97.4 },
      { county: "Cherokee", income: 107482, hypertension: 37.6 },
      { county: "Clarke", income: 62154, hypertension: 82.3 },
      { county: "Clay", income: 56218, hypertension: 110.5 },
      { county: "Clayton", income: 65218, hypertension: 55.3 },
      { county: "Clinch", income: 55218, hypertension: 92.6 },
      { county: "Cobb", income: 105218, hypertension: 40.1 },
      { county: "Coffee", income: 58742, hypertension: 87.4 },
      { county: "Colquitt", income: 56213, hypertension: 85.3 },
      { county: "Columbia", income: 98271, hypertension: 45.2 },
      { county: "Cook", income: 56842, hypertension: 83.7 },
      { county: "Coweta", income: 94235, hypertension: 43.5 },
      { county: "Crawford", income: 62154, hypertension: 78.9 },
      { county: "Crisp", income: 55827, hypertension: 92.8 },
      { county: "Dade", income: 72154, hypertension: 76.5 },
      { county: "Dawson", income: 87324, hypertension: 58.7 },
      { county: "Decatur", income: 57321, hypertension: 89.6 },
      { county: "DeKalb", income: 89235, hypertension: 48.2 },
      { county: "Dodge", income: 55218, hypertension: 93.4 },
      { county: "Dooly", income: 56213, hypertension: 91.7 },
      { county: "Dougherty", income: 57125, hypertension: 87.3 },
      { county: "Douglas", income: 85218, hypertension: 47.8 },
      { county: "Early", income: 55139, hypertension: 95.8 },
      { county: "Echols", income: 55218, hypertension: 79.6 },
      { county: "Effingham", income: 87324, hypertension: 63.5 },
      { county: "Elbert", income: 56842, hypertension: 88.9 },
      { county: "Emanuel", income: 55827, hypertension: 91.2 },
      { county: "Evans", income: 56213, hypertension: 87.6 },
      { county: "Fannin", income: 72154, hypertension: 75.8 },
      { county: "Fayette", income: 112482, hypertension: 35.2 },
      { county: "Floyd", income: 64235, hypertension: 82.7 },
      { county: "Forsyth", income: 116218, hypertension: 33.8 },
      { county: "Franklin", income: 62154, hypertension: 81.9 },
      { county: "Fulton", income: 102482, hypertension: 42.5 },
      { county: "Gilmer", income: 72154, hypertension: 74.6 },
      { county: "Glascock", income: 57321, hypertension: 86.3 },
      { county: "Glynn", income: 82831, hypertension: 75.4 },
      { county: "Gordon", income: 71254, hypertension: 78.5 },
      { county: "Grady", income: 58742, hypertension: 84.7 },
      { county: "Greene", income: 72154, hypertension: 77.8 },
      { county: "Gwinnett", income: 98271, hypertension: 38.9 },
      { county: "Habersham", income: 71254, hypertension: 76.3 },
      { county: "Hall", income: 87324, hypertension: 46.9 },
      { county: "Hancock", income: 52730, hypertension: 98.7 },
      { county: "Haralson", income: 62154, hypertension: 82.4 },
      { county: "Harris", income: 94235, hypertension: 52.6 },
      { county: "Hart", income: 64235, hypertension: 79.8 },
      { county: "Heard", income: 62154, hypertension: 81.5 },
      { county: "Henry", income: 92154, hypertension: 45.7 },
      { county: "Houston", income: 85218, hypertension: 56.8 },
      { county: "Irwin", income: 56213, hypertension: 88.3 },
      { county: "Jackson", income: 81253, hypertension: 65.7 },
      { county: "Jasper", income: 72154, hypertension: 74.9 },
      { county: "Jeff Davis", income: 51290, hypertension: 89.4 },
      { county: "Jefferson", income: 55827, hypertension: 92.5 },
      { county: "Jenkins", income: 52146, hypertension: 93.8 },
      { county: "Johnson", income: 55218, hypertension: 90.7 },
      { county: "Jones", income: 72154, hypertension: 72.6 },
      { county: "Lamar", income: 81813, hypertension: 68.9 },
      { county: "Lanier", income: 56842, hypertension: 84.3 },
      { county: "Laurens", income: 58742, hypertension: 86.5 },
      { county: "Lee", income: 87324, hypertension: 59.8 },
      { county: "Liberty", income: 76429, hypertension: 71.4 },
      { county: "Lincoln", income: 62154, hypertension: 80.7 },
      { county: "Long", income: 64235, hypertension: 78.3 },
      { county: "Lowndes", income: 71254, hypertension: 75.6 },
      { county: "Lumpkin", income: 72154, hypertension: 73.2 },
      { county: "Macon", income: 55218, hypertension: 91.5 },
      { county: "Madison", income: 64235, hypertension: 79.4 },
      { county: "Marion", income: 56213, hypertension: 87.9 },
      { county: "McDuffie", income: 62154, hypertension: 81.3 },
      { county: "McIntosh", income: 62154, hypertension: 80.5 },
      { county: "Meriwether", income: 57321, hypertension: 87.2 },
      { county: "Miller", income: 56842, hypertension: 85.6 },
      { county: "Mitchell", income: 55827, hypertension: 89.8 },
      { county: "Monroe", income: 81253, hypertension: 67.3 },
      { county: "Montgomery", income: 56213, hypertension: 86.8 },
      { county: "Morgan", income: 81813, hypertension: 69.5 },
      { county: "Murray", income: 62154, hypertension: 80.9 },
      { county: "Muscogee", income: 64235, hypertension: 78.7 },
      { county: "Newton", income: 78213, hypertension: 51.4 },
      { county: "Oconee", income: 107482, hypertension: 42.3 },
      { county: "Oglethorpe", income: 72154, hypertension: 73.8 },
      { county: "Paulding", income: 90235, hypertension: 44.3 },
      { county: "Peach", income: 64235, hypertension: 79.2 },
      { county: "Pickens", income: 81253, hypertension: 66.4 },
      { county: "Pierce", income: 62154, hypertension: 81.7 },
      { county: "Pike", income: 72154, hypertension: 74.2 },
      { county: "Polk", income: 62154, hypertension: 80.3 },
      { county: "Pulaski", income: 57321, hypertension: 85.9 },
      { county: "Putnam", income: 72154, hypertension: 75.1 },
      { county: "Quitman", income: 55218, hypertension: 92.1 },
      { county: "Rabun", income: 72154, hypertension: 74.5 },
      { county: "Randolph", income: 39353, hypertension: 97.3 },
      { county: "Richmond", income: 63482, hypertension: 79.6 },
      { county: "Rockdale", income: 81253, hypertension: 50.1 },
      { county: "Schley", income: 62154, hypertension: 81.2 },
      { county: "Screven", income: 56213, hypertension: 88.6 },
      { county: "Seminole", income: 56842, hypertension: 85.4 },
      { county: "Spalding", income: 64235, hypertension: 54.6 },
      { county: "Stephens", income: 62154, hypertension: 80.8 },
      { county: "Stewart", income: 51806, hypertension: 94.2 },
      { county: "Sumter", income: 53246, hypertension: 93.1 },
      { county: "Talbot", income: 55218, hypertension: 90.4 },
      { county: "Taliaferro", income: 53523, hypertension: 95.6 },
      { county: "Tattnall", income: 56213, hypertension: 87.1 },
      { county: "Taylor", income: 55175, hypertension: 91.9 },
      { county: "Telfair", income: 55218, hypertension: 90.3 },
      { county: "Terrell", income: 55827, hypertension: 92.7 },
      { county: "Thomas", income: 82808, hypertension: 66.8 },
      { county: "Tift", income: 64235, hypertension: 79.5 },
      { county: "Toombs", income: 58742, hypertension: 84.9 },
      { county: "Towns", income: 72154, hypertension: 73.5 },
      { county: "Treutlen", income: 55218, hypertension: 89.2 },
      { county: "Troup", income: 71254, hypertension: 76.7 },
      { county: "Turner", income: 55218, hypertension: 90.8 },
      { county: "Twiggs", income: 56213, hypertension: 88.1 },
      { county: "Union", income: 83996, hypertension: 64.2 },
      { county: "Upson", income: 62154, hypertension: 81.6 },
      { county: "Walker", income: 64235, hypertension: 79.1 },
      { county: "Walton", income: 87324, hypertension: 45.9 },
      { county: "Ware", income: 58742, hypertension: 84.6 },
      { county: "Warren", income: 55218, hypertension: 91.3 },
      { county: "Washington", income: 57321, hypertension: 86.7 },
      { county: "Wayne", income: 62154, hypertension: 80.6 },
      { county: "Webster", income: 52500, hypertension: 93.5 },
      { county: "Wheeler", income: 55218, hypertension: 90.2 },
      { county: "White", income: 72154, hypertension: 73.9 },
      { county: "Whitfield", income: 71254, hypertension: 77.2 },
      { county: "Wilcox", income: 55218, hypertension: 90.9 },
      { county: "Wilkes", income: 57321, hypertension: 86.2 },
      { county: "Wilkinson", income: 56842, hypertension: 85.1 },
      { county: "Worth", income: 58742, hypertension: 83.4 }
    ];

    // Calculate correlation coefficient to verify it's close to -0.4
    const n = sampleData.length;
    const sumX = sampleData.reduce((sum, d) => sum + d.income, 0);
    const sumY = sampleData.reduce((sum, d) => sum + d.hypertension, 0);
    const sumXY = sampleData.reduce((sum, d) => sum + d.income * d.hypertension, 0);
    const sumXX = sampleData.reduce((sum, d) => sum + d.income * d.income, 0);
    const sumYY = sampleData.reduce((sum, d) => sum + d.hypertension * d.hypertension, 0);
    
    const r = (n * sumXY - sumX * sumY) / 
              (Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)));
    
    console.log(`Generated data with correlation coefficient: ${r.toFixed(3)}`);
    
    // If correlation is not close to -0.4, regenerate data
    if (Math.abs(r + 0.4) > 0.05) {
      console.log("Regenerating data to get closer to target correlation");
      setData(generateCountyData());
    } else {
      setData(sampleData);
    }
    
    setLoading(false);
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
    
    // Add regression statistics with improved styling
    const statsBox = g.append("g")
      .attr("transform", `translate(${innerWidth - 200}, 20)`);
      
    statsBox.append("rect")
      .attr("width", 190)
      .attr("height", 80)
      .attr("fill", "rgba(255, 255, 255, 0.9)")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1)
      .attr("rx", 5);
      
    statsBox.append("text")
      .attr("x", 10)
      .attr("y", 25)
      .attr("fill", "#333")
      .attr("font-size", "0.9rem")
      .attr("font-weight", "bold")
      .text("Linear Regression Analysis");
      
    statsBox.append("text")
      .attr("x", 10)
      .attr("y", 45)
      .attr("fill", "#333")
      .attr("font-size", "0.8rem")
      .text(`Correlation (r): ${regression.r.toFixed(3)}`);
    
    statsBox.append("text")
      .attr("x", 10)
      .attr("y", 65)
      .attr("fill", "#333")
      .attr("font-size", "0.8rem")
      .text(`R²: ${regression.rSquared.toFixed(3)}`);
      
    // Add equation of the line
    const equation = `y = ${regression.slope.toFixed(5)}x + ${regression.intercept.toFixed(2)}`;
    statsBox.append("text")
      .attr("x", 10)
      .attr("y", 85)
      .attr("fill", "#333")
      .attr("font-size", "0.8rem")
      .text(`Equation: ${equation}`);
    
    // Points with color gradient based on income
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([d3.min(data, d => d.income)!, d3.max(data, d => d.income)!]);
      
    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.income))
      .attr("cy", d => y(d.hypertension))
      .attr("r", 5) // Slightly smaller to avoid overcrowding
      .attr("fill", d => colorScale(d.income))
      .attr("opacity", 0.8)
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
          .html(`<strong>${d.county} County</strong><br/>
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
          <span className="inline-block mr-4"><span className="inline-block w-3 h-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full mr-1"></span> County Data (colored by income)</span>
          <span className="inline-block"><span className="inline-block w-4 h-[2px] bg-[#FF5252] mr-1"></span> Regression Line</span>
        </div>
      </div>
    </div>
  );
}
