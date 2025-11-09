import { positionTooltip, hideTooltip } from './helper.js';

export function createScenarioComparison(data) {

    // --- 1. Setup ---
    const margin = { top: 40, right: 60, bottom: 40, left: 100 };
    const width = 1200 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#scenario-dumbbell-plot")
        .attr("viewBox", `0 0 1200 400`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- 2. Process Data ---
    // Group the data by region
    // This turns our 8 data points into 4 groups
    const dataByRegion = d3.group(data, d => d.region);
    const regions = Array.from(dataByRegion.keys());

    // --- 3. Scales ---
    const yScale = d3.scaleBand()
        .domain(regions)
        .range([0, height])
        .padding(0.4); // More padding for dumbbell plots

    const [minTemp, maxTemp] = d3.extent(data, d => d.july_temp_c);
    const xScale = d3.scaleLinear()
        .domain([minTemp - 1, maxTemp + 1]) // Add padding
        .range([0, width])
        .nice();

    const scenarioColors = d3.scaleOrdinal()
        .domain(['ssp245', 'ssp585'])
        .range(['#4e79a7', '#e15759']); // Blue, Red

    // --- 4. Axes ---
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d.toFixed(0)}°C`))
        .selectAll("text")
        .style("font-size", "12px");

    svg.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "14px");

    // Add X-axis grid lines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisBottom(xScale).tickSize(height).tickFormat(''))
        .selectAll("line")
        .style("stroke", "#eee")
        .style("stroke-dasharray", "2 2");

    // --- 5. Draw the Dumbbells ---

    // Create a group for each region
    const groups = svg.selectAll(".dumbbell-group")
        .data(dataByRegion)
        .join("g")
        .attr("class", "dumbbell-group")
        .attr("transform", d => `translate(0, ${yScale(d[0])})`); // d[0] is the region name

    // Draw the connecting line
    groups.append("line")
        .attr("x1", d => xScale(d[1].find(item => item.scenario === 'ssp245').july_temp_c))
        .attr("x2", d => xScale(d[1].find(item => item.scenario === 'ssp585').july_temp_c))
        .attr("y1", yScale.bandwidth() / 2)
        .attr("y2", yScale.bandwidth() / 2)
        .attr("stroke", "#cccccc")
        .attr("stroke-width", 2);

    // Draw the circles (dots)
    groups.selectAll("circle")
        .data(d => d[1]) // d[1] is the array of 2 data points (ssp245, ssp585)
        .join("circle")
        .attr("cx", d => xScale(d.july_temp_c))
        .attr("cy", yScale.bandwidth() / 2)
        .attr("r", 8)
        .attr("fill", d => scenarioColors(d.scenario))
        .on("mouseover", function (event, d) {
            d3.select(this).attr("r", 10);
            const tooltip = d3.select("#tooltip").classed("visible", true);
            tooltip.html(`
                <strong>${d.region} (${d.scenario})</strong><br/>
                Year: ${d.year}<br/>
                Temp: <strong>${d.july_temp_c.toFixed(2)}°C</strong>
            `);
            positionTooltip(event, tooltip);
        })
        .on("mouseout", function () {
            d3.select(this).attr("r", 8);
            hideTooltip();
        });

    // --- 6. Add a Legend ---
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 200}, ${-margin.top + 10})`);

    legend.selectAll(".legend-item")
        .data(['ssp245', 'ssp585'])
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`)
        .call(g => {
            g.append("circle")
                .attr("cx", 0)
                .attr("cy", 5)
                .attr("r", 6)
                .attr("fill", d => scenarioColors(d));
            g.append("text")
                .attr("x", 15)
                .attr("y", 10)
                .text(d => d === 'ssp245' ? 'Medium Emission Future' : 'High Emission Future')
                .style("font-size", "12px")
                .style("font-family", "sans-serif");
        });
}