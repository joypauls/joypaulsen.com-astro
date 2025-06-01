import * as d3 from "d3";

export function initChart({ containerId }) {
  console.log("initChart called for", containerId); // ✅ should show in console

  const container = document.querySelector(containerId);
  if (!container) {
    console.error("Container not found:", containerId);
    return;
  }

  const width = 500;
  const height = 200;
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };

  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain([-1.2, 1.2]).range([innerHeight, 0]);

  const line = d3.line()
    .x((d, i) => xScale(i))
    .y((d) => yScale(d));

  const phaseShift = (i) => (2 * Math.PI * i) / 3;

  const colors = ["#ef4444", "#3b82f6", "#10b981"];
  const paths = [0, 1, 2].map(i =>
    g.append("path")
      .attr("fill", "none")
      .attr("stroke", colors[i])
      .attr("stroke-width", 2)
  );

  let t = 0;

  function render() {
    const wave = (offset) => {
      return d3.range(0, 100).map((i) => Math.sin((i + t) * 0.1 + offset));
    };

    paths.forEach((path, i) => {
      path.attr("d", line(wave(phaseShift(i))));
    });

    t += 1;
    requestAnimationFrame(render);
  }

  render();
}
