// --- Load data and set up ---
const svg = d3.select("#series");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 30, right: 40, bottom: 40, left: 60 };

const tooltip = d3.select("#tooltip");
let currentRegion = "US";
let currentMetric = "anomaly";

// --- Scales and axes ---
const x = d3.scaleTime().range([margin.left, width - margin.right]);
const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);
const color = d3.scaleOrdinal()
  .domain(["Global", "US", "Europe", "Arctic", "Tropics"])
  .range(["#3b82f6", "#ef4444", "#10b981", "#a855f7", "#f59e0b"]);

const xAxis = svg.append("g")
  .attr("transform", `translate(0,${height - margin.bottom})`);
const yAxis = svg.append("g")
  .attr("transform", `translate(${margin.left},0)`);

// --- Load CSV ---
d3.csv("data/regional_timeseries.csv", d3.autoType).then(data => {
  data.forEach(d => d.date = new Date(d.date));

  // Initialize
  updateSeries(data);

  // Handle region buttons
  d3.selectAll(".regions button").on("click", (event) => {
    currentRegion = event.currentTarget.dataset.region;
    updateSeries(data);
  });

  // Handle metric change
  d3.select("#metric").on("change", (event) => {
    currentMetric = event.target.value;
    updateSeries(data);
  });
});

// --- Update function for line chart ---
function updateSeries(data) {
  const filtered = data.filter(d => d.region === currentRegion);
  const xExtent = d3.extent(filtered, d => d.date);
  const yExtent = d3.extent(filtered, d => d[currentMetric]);

  x.domain(xExtent);
  y.domain([yExtent[0] - 0.2, yExtent[1] + 0.2]);

  xAxis.call(d3.axisBottom(x).ticks(8));
  yAxis.call(d3.axisLeft(y).ticks(6));

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d[currentMetric]))
    .curve(d3.curveMonotoneX);

  const linePath = svg.selectAll(".line").data([filtered]);
  linePath.join("path")
    .attr("class", "line")
    .attr("stroke", color(currentRegion))
    .attr("stroke-width", 2.5)
    .attr("fill", "none")
    .transition().duration(600)
    .attr("d", line);

  svg.selectAll(".region-label").data([currentRegion])
    .join("text")
    .attr("class", "region-label")
    .attr("x", width - 100)
    .attr("y", margin.top + 10)
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .attr("fill", color(currentRegion))
    .text(currentRegion);

  d3.select("#series-legend").html(
    `<span style="color:${color(currentRegion)}">■</span> ${currentRegion} (${currentMetric})`
  );
}

// Load CSV
d3.csv("data/us_regional_future.csv", d3.autoType).then(data => {
  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.temp_increase) + 0.5])
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([2, d3.max(data, d => d.temp_increase)]);

  // Group data by region
  const regions = d3.groups(data, d => d.region);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Line generator
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.temp_increase))
    .curve(d3.curveMonotoneX);

  // Draw all region lines
  svg.selectAll(".line")
    .data(regions)
    .join("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", d => color(d[1][d[1].length - 1].temp_increase))
    .attr("stroke-width", 3)
    .attr("d", d => line(d[1]));

  // Threshold lines
  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", y(2))
    .attr("y2", y(2))
    .attr("stroke", "#666")
    .attr("stroke-dasharray", "4 4");

  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", y(4))
    .attr("y2", y(4))
    .attr("stroke", "#666")
    .attr("stroke-dasharray", "4 4");

  svg.append("text")
    .attr("x", width - margin.right - 10)
    .attr("y", y(2) - 6)
    .attr("text-anchor", "end")
    .attr("fill", "#666")
    .text("2°C threshold");

  svg.append("text")
    .attr("x", width - margin.right - 10)
    .attr("y", y(4) - 6)
    .attr("text-anchor", "end")
    .attr("fill", "#666")
    .text("4°C threshold");

  // Year marker line (2100)
  svg.append("line")
    .attr("x1", x(2100))
    .attr("x2", x(2100))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#2563eb")
    .attr("stroke-dasharray", "3 3");

  // End labels
  svg.selectAll(".end-label")
    .data(regions)
    .join("text")
    .attr("class", "end-label")
    .attr("x", x(2100) + 8)
    .attr("y", d => y(d[1][d[1].length - 1].temp_increase))
    .attr("alignment-baseline", "middle")
    .attr("font-weight", "bold")
    .attr("fill", d => color(d[1][d[1].length - 1].temp_increase))
    .text(d => `${d[0]} (${d[1][d[1].length - 1].temp_increase.toFixed(1)}°C)`);

  // Axes labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text("Year");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text("Temperature Increase (°C)");
});

