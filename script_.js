console.log("Testing script.js - it works!");
d3.csv("/test.csv")
  .then(data => {
    try {
      // Filter data for Punggol
      const punggolData = data.filter(d => d.town && d.town.toUpperCase() === "PUNGGOL");

      // Parse year and resale price
      punggolData.forEach(d => {
        if (d.month) {
          d.year = new Date(d.month).getFullYear();
        } else {
          console.warn("Missing 'month' value for record:", d);
        }
        if (d.resale_price) {
          d.resale_price = +d.resale_price;
        } else {
          console.warn("Missing 'resale_price' value for record:", d);
        }
      });

      console.log("Filtered and parsed data for Punggol:", punggolData);

      // Group data by year and flat type
      const groupedData = d3.group(punggolData, d => d.year, d => d.flat_type);

      // Prepare data for the chart
      const chartData = [];
      for (const [year, flats] of groupedData) {
        for (const [type, records] of flats) {
          const avgPrice = d3.mean(records, d => d.resale_price);
          chartData.push({ year: +year, type, avgPrice });
        }
      }

      // Set up chart dimensions
      const margin = { top: 20, right: 30, bottom: 50, left: 60 };
      const width = 800 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      // Set up scales
      const xScale = d3.scaleLinear()
        .domain(d3.extent(chartData, d => d.year))
        .range([0, width])
        .nice();

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.avgPrice)])
        .range([height, 0])
        .nice();

      const colorScale = d3.scaleOrdinal()
        .domain([...new Set(chartData.map(d => d.type))])
        .range(d3.schemeCategory10);

      // Add axes
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

      g.append("g")
        .call(d3.axisLeft(yScale));

      // Line generator
      const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.avgPrice));

      // Group data by flat type and draw lines
      const flatTypes = d3.group(chartData, d => d.type);

      for (const [type, values] of flatTypes) {
        g.append("path")
          .datum(values)
          .attr("fill", "none")
          .attr("stroke", colorScale(type))
          .attr("stroke-width", 2)
          .attr("d", line);
      }

      // Add legend
      const legend = g.selectAll(".legend")
        .data(Array.from(flatTypes.keys()))
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width - 100},${i * 20})`);

      legend.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => colorScale(d));

      legend.append("text")
        .text(d => d)
        .attr("x", 15)
        .attr("y", 10);

      // Tooltip for interactivity
      const tooltip = d3.select("#tooltip");
      g.selectAll("path")
        .on("mouseover", function (event, d) {
          const [x, y] = d3.pointer(event);
          tooltip.style("display", "block")
            .html(`Type: ${d.type}<br>Year: ${xScale.invert(x).toFixed(0)}<br>Price: $${yScale.invert(y).toFixed(2)}`)
            .style("left", `${event.pageX + 5}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
        });
    } catch (processingError) {
      console.error("Error during data processing:", processingError);
    }
  })
  .catch(fetchError => {
    console.error("Error loading the CSV file:", fetchError);
    alert("Failed to load data. Please ensure the CSV file is correctly placed and accessible.");
  });
