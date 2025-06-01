// import * as d3 from "d3";

// export function initChart({ containerId }) {
//   const container = document.querySelector(containerId);
//   if (!container) return;

//   const svg = d3.select(container)
//     .append("svg")
//     .attr("width", 300)
//     .attr("height", 150);

//   svg.append("circle")
//     .attr("cx", 150)
//     .attr("cy", 75)
//     .attr("r", 50)
//     .style("fill", "steelblue");
// }


import * as d3 from "d3";

const SAMPLE_SIZE = 200;
const BINS = 10;
const MU = 0;
const SIGMA = 1;
const MAX_DEVIATE = 2.5 * SIGMA;

const BAR_PADDING = 1;
const WIDTH = 200;
const DIMENSIONS = {
  width: WIDTH,
  height: WIDTH * 0.35,
  margin: { top: 10, right: 10, bottom: 0, left: 10 },
};
DIMENSIONS.boundedWidth = DIMENSIONS.width - DIMENSIONS.margin.left - DIMENSIONS.margin.right;
DIMENSIONS.boundedHeight = DIMENSIONS.height - DIMENSIONS.margin.top - DIMENSIONS.margin.bottom;

const xScale = d3.scaleLinear()
  .domain([-MAX_DEVIATE, MAX_DEVIATE])
  .range([0, DIMENSIONS.boundedWidth]);

const THRESHOLDS = d3.range(-MAX_DEVIATE, MAX_DEVIATE, (2 * MAX_DEVIATE) / BINS);
const valueAccessor = d => d.value;
const yAccessor = d => d3.max([d.length, 1]);

function generateData(n = SAMPLE_SIZE, clip = true) {
  let gen = d3.randomNormal(MU, SIGMA);
  return Array.from({ length: n }, (_, i) => {
    let sample = gen();
    let bound = (i < 1 || i > n - 2) ? SIGMA : MAX_DEVIATE;
    if (clip) sample = Math.max(Math.min(sample, bound), -bound);
    return { index: i, value: sample };
  });
}

function initChart({containerId}) {
  const container = document.querySelector(containerId);
  if (!container) return;
  const wrapper = d3.select(container)
    .append("svg")
    .attr("width", DIMENSIONS.width)
    .attr("height", DIMENSIONS.height)
    .attr("id", "chart");

  wrapper.append("g")
    .style("transform", `translate(${DIMENSIONS.margin.left}px, ${DIMENSIONS.margin.top}px)`)
    .attr("id", "chart-bounds")
    .append("g")
    .attr("id", "chart-bins");

  drawChart();
  setInterval(updateChart, 2000);
}

function drawChart() {
  const data = generateData();
  const bins = d3.bin().domain(xScale.domain()).value(valueAccessor).thresholds(THRESHOLDS)(data);
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(bins, yAccessor)])
    .range([DIMENSIONS.boundedHeight, 0]);

  const binsGroup = d3.select("#chart-bins");
  const binGroups = binsGroup.selectAll("rect").data(bins).join("g");

  binGroups.append("rect")
    .attr("x", d => xScale(d.x0) + BAR_PADDING / 2)
    .attr("y", d => yScale(yAccessor(d)))
    .attr("width", d => d3.max([0, xScale(d.x1) - xScale(d.x0) - BAR_PADDING]))
    .attr("height", d => DIMENSIONS.boundedHeight - yScale(yAccessor(d)));
}

function updateChart() {
  const data = generateData();
  const bins = d3.bin().domain(xScale.domain()).value(valueAccessor).thresholds(THRESHOLDS)(data);
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(bins, yAccessor)])
    .range([DIMENSIONS.boundedHeight, 0]);

  d3.select("#chart-bins")
    .selectAll("rect")
    .data(bins)
    .transition()
    .duration(500)
    .ease(d3.easeBackOut.overshoot(1.3))
    .attr("y", d => yScale(yAccessor(d)))
    .attr("height", d => DIMENSIONS.boundedHeight - yScale(yAccessor(d)));
}

export { initChart };
