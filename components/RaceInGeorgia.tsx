import dynamic from 'next/dynamic';

// Create a completely client-side only component with NoSSR
const RaceInGeorgiaMapWithNoSSR = dynamic(
  () => import('./RaceInGeorgiaMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-mono text-primary-700">Loading map...</p>
      </div>
    )
  }
);

// This is a server component that renders the client component
export default function RaceInGeorgia() {
  return (
    <div className="w-full h-[500px] flex flex-col bg-white rounded-xl border-l-4 border border-primary-500 shadow-sm overflow-hidden">
      <div className="bg-surface px-8 py-4 border-b border-primary-100">
        <h3 className="text-xl font-mono text-primary-700 font-bold">Black Population by County in Georgia</h3>
        <p className="text-neutral text-medium-contrast">2020 Census Data</p>
      </div>
      <div className="flex-grow relative p-4">
        {/* Static placeholder that will be identical on server and client */}
        <div className="w-full h-full">
          <RaceInGeorgiaMapWithNoSSR />
        </div>
      </div>
    </div>
  );
}

interface CountyRaceData {
  county: string;
  value: number;
}

function RaceInGeorgiaMap() {
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
    const color = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([minValue, maxValue]);

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
    let tooltip = d3.select("#race-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("id", "race-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("padding", "8px")
        .style("box-shadow", "0 2px 10px rgba(0,0,0,0.1)")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("transition", "opacity 0.2s, transform 0.2s")
        .style("opacity", "0")
        .style("z-index", "1000");
    }

    // Tooltip interaction with enhanced styling
    paths
      .on("mousemove", function (event: MouseEvent, d: any) {
        const countyName = d.properties.NAME || "";
        let value = null;
        
        // Find percentage for this county
        const variations = [
          countyName.toLowerCase(),
          countyName.toLowerCase().replace(" county", ""),
          countyName.toLowerCase().replace(" county", "") + " county"
        ];
        
        for (const variant of variations) {
          if (percentByCounty[variant] !== undefined) {
            value = percentByCounty[variant];
            break;
          }
        }
        
        // Get the SVG's position relative to the viewport
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        
        // Calculate position relative to the SVG container
        const mouseX = event.clientX - svgRect.left;
        const mouseY = event.clientY - svgRect.top;
        
        // Position tooltip with offset from cursor
        tooltip
          .style("visibility", "visible")
          .style("left", mouseX + 24 + "px")
          .style("top", mouseY + 12 + "px")
          .style("opacity", "1")
          .style("transform", "translateY(0)");
        
        // Enhanced tooltip content with brand styling
        tooltip.html(value !== null
          ? `<div style='font-family:monospace; font-weight:700; font-size:16px; color:#2c3e50; margin-bottom:4px; border-bottom:1px solid rgba(44,62,80,0.2); padding-bottom:4px;'>${countyName}</div>
             <div style='display:flex; justify-content:space-between; margin-top:6px; align-items:center;'>
               <span style='color:#22223B; font-weight:500;'>Black Population:</span>
               <span style='color:#2c3e50; font-weight:700; font-size:18px;'>${d3.format(".1f")(value)}%</span>
             </div>`
          : `<div style='font-family:monospace; font-weight:700; font-size:16px; color:#2c3e50; margin-bottom:4px; border-bottom:1px solid rgba(44,62,80,0.2); padding-bottom:4px;'>${countyName}</div>
             <div style='color:#888; font-style:italic; margin-top:6px;'>No data available</div>`);
        
        // Highlight the hovered county
        d3.select(this)
          .attr("stroke", "#000")
          .attr("stroke-width", 1.5);
      })
      .on("mouseleave", function () {
        // Hide tooltip
        tooltip
          .style("opacity", "0")
          .style("transform", "translateY(10px)")
          .style("visibility", "hidden");
        
        // Remove highlight
        d3.select(this)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);
      });

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("font-family", "sans-serif")
      .text("Black Population Percentage by County in Georgia");

    // Add a legend
    const legendWidth = 200;
    const legendHeight = 15;
    const legendX = width - legendWidth - 20;
    const legendY = height - 40;

    // Create gradient for legend
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "race-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    // Add color stops to gradient
    linearGradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.1))
      .enter().append("stop")
      .attr("offset", d => d * 100 + "%")
      .attr("stop-color", d => color(minValue + d * (maxValue - minValue)));

    // Draw legend rectangle with gradient
    svg.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#race-gradient)");

    // Add legend labels
    svg.append("text")
      .attr("x", legendX)
      .attr("y", legendY - 5)
      .style("font-size", "10px")
      .style("text-anchor", "start")
      .text(`${minValue.toFixed(1)}%`);

    svg.append("text")
      .attr("x", legendX + legendWidth)
      .attr("y", legendY - 5)
      .style("font-size", "10px")
      .style("text-anchor", "end")
      .text(`${maxValue.toFixed(1)}%`);

  }, [geoJson, countyData, loading, error]);

  return (
    <div className="w-full h-[500px] flex flex-col bg-white rounded-xl border-l-4 border border-primary-500 shadow-sm overflow-hidden">
      <div className="bg-surface px-8 py-4 border-b border-primary-100">
        <h3 className="text-xl font-mono text-primary-700 font-bold">Black Population by County in Georgia</h3>
        <p className="text-neutral text-medium-contrast">2020 Census Data</p>
      </div>
      <div className="flex-grow relative p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-mono text-primary-700">Loading map...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-lg font-mono text-red-500">{error}</p>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full"></svg>
        )}
      </div>
    </div>
  );
}
