const STROKE_WIDTH = 3;

export default class Chart {
  width = 640
  height = 360

  constructor(selector, samples) {
    this.data = samples;

    const bps = samples.map(([bits, secs]) => bits / secs);
    const high = Math.max(...bps);
    const low = Math.min(...bps);

    const fig = d3.select(selector);

    const svg = fig
      .append('svg')
      .attr('width', '100%');

    const tip = fig
      .append('div')
      .attr('role', 'tooltip');

    this.lines = [];
    this.chart = svg.append('g');
    this.text = svg.append('g')
      .attr('fill', 'white')
      .attr('font-size', '14')

    const cursor = this.chart.append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', this.height)
      .attr('stroke', 'white');

    const xScale = this.xScale = d3.scaleLinear()
      .domain([1, samples.length])
      .range([0, this.width]);
    const xAxis = d3.axisBottom(xScale);
    const xBox = svg.append('g')
      .attr('aria-label', 'x-axis')
      .attr('transform', `translate(0, ${this.height})`)
      .call(xAxis)
      .node()
      .getBBox();
    this.text.append('text')
      .attr('x', this.width / 2)
      .attr('y', this.height - 6)
      .style('text-anchor', 'middle')
      .text('segment number');

    const yScale = this.yScale = d3.scaleLinear()
      .domain([low - 5e4, high + 1e4])
      .range([this.height, 0]);
    const yFormat = d3.format('.3~s');
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(yFormat);
    const yBox = svg.append('g')
      .attr('aria-label', 'y-axis')
      .call(yAxis)
      .node()
      .getBBox();
    this.text.append('text')
      .attr('y', '-6')
      .style('transform', 'rotate(90deg)')
      .style('text-anchor', 'start')
      .text('bandwidth (bps)');

    svg.attr('viewBox', [
      Math.floor(yBox.x),
      0,
      xBox.width + yBox.width,
      this.height + xBox.height,
    ]);

    const chartNode = this.chart.node();
    svg.on('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const [chartX] = d3.pointer(event, chartNode);

      const lastSegment = Math.round(xScale.invert(chartX));
      const startSegment = Math.max(lastSegment - 3, 0);
      const segments = this.data.slice(startSegment, startSegment + 3)
        .map(([bits, secs], index) => `<b>Segment ${index + startSegment + 1}:</b> ${yFormat(bits / secs)}bps`)
        .reverse();

      const lines = this.lines
        .map(({ title, points }) => `<b>${title}:</b> ${yFormat(points[Math.max(lastSegment - 1, 0)])}bps`);

      const x = xScale(lastSegment);
      cursor
        .attr('x1', x)
        .attr('x2', x)
        .attr('opacity', x > 0 ? '0.4' : '0');

      tip.node().innerHTML = segments.join('<br />') + '<br />' + lines.join('<br />');
    });
  }

  addKey() {
    const { lines, text } = this;
    const key = text.append('g')
      .attr('font-size', '14');

    const addLabel = (label, index, color) => {
      const g = key.append('g');
      g.append('line')
        .attr('x1', -15)
        .attr('x2', -5)
        .attr('y1', 18 * index)
        .attr('y2', 18 * index)
        .attr('stroke', color)
        .attr('stroke-width', 2);
      g.append('text')
        .attr('x', 0)
        .attr('y', 18 * index)
        .attr('dominant-baseline', 'middle')
        .attr('fill', color)
        .text(label);
      return g;
    }

    lines.forEach((data, index) => {
      const { title, color, line, outline } = data;
      const others = lines
        .filter(other => other !== data)
        .map(({ line }) => line);
      const outlineNode = outline.node();

      const g = key.append('g')
        .style('cursor', 'pointer');

      const rect = g.append('rect')
        .attr('fill', 'rgba(0, 0, 0, 0.6)')
        .attr('height', 18)
        .attr('x', -15)
        .attr('y', 18 * index - 18 / 2);

      g.append('line')
        .attr('x1', -15)
        .attr('x2', -5)
        .attr('y1', 18 * index)
        .attr('y2', 18 * index)
        .attr('stroke', color)
        .attr('stroke-width', STROKE_WIDTH);

      g.append('text')
        .attr('x', 0)
        .attr('y', 18 * index)
        .attr('dominant-baseline', 'middle')
        .attr('fill', color)
        .text(title)

      rect.attr('width', g.node().getBBox().width);

      function onMouseOver() {
        outlineNode.parentNode.appendChild(outlineNode);
        others.forEach(other => other.style('opacity', 0.3));
        line.style('stroke-width', STROKE_WIDTH + 1);
      }
      g.on('mouseover', onMouseOver);
      outline.on('mouseover', onMouseOver);

      function onMouseOut() {
        line.style('stroke-width', STROKE_WIDTH);
        others.forEach(other => other.style('opacity', 1));
      }
      g.on('mouseout', onMouseOut);
      outline.on('mouseout', onMouseOut);

      line.style('transition', 'all 0.3s 50ms');
      outline.style('cursor', 'pointer');
    });

    const keyWidth = Math.ceil(key.node().getBBox().width / 2);
    key.style('transform', `translate(calc(50% - ${keyWidth}px), 20px)`);
  }

  addDots() {
    this.chart.selectAll('dot')
      .data(this.data)
      .enter()
      .append('circle')
        .attr('cx', (_, index) => this.xScale(index + 1))
        .attr('cy', ([bits, secs]) => this.yScale(bits / secs))
        .attr('r', 1.5)
        .style('opacity', '0.6')
        .style('fill', 'white');
  }

  addLine({ title, color, f }) {
    const line = this.chart.append('path')
      .datum(this.data)
      .attr('aria-label', title)
      .attr('stroke', color)
      .attr('fill', 'none')
      .attr('stroke-width', STROKE_WIDTH)
      .style('pointer-events', 'none');

    const outline = this.chart.append('path')
      .datum(this.data)
      .attr('aria-hidden', 'true')
      .attr('stroke', 'transparent')
      .attr('fill', 'none')
      .attr('stroke-width', STROKE_WIDTH * 5);

    const obj = { title, color, f, line, outline, points: [] };
    this.redrawLine(obj);
    this.lines.push(obj);
    return obj;
  }

  redrawLine({ f, line, outline, points }) {
    const path = d3.line()
      .curve(d3.curveCardinal)
      .x((_, i) => this.xScale(i + 1))
      .y((d, i) => this.yScale(points[i] = f(d)))
    outline.attr('d', path);
    line.attr('d', path);
  }
}
