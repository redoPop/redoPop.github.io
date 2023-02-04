---
title: "How hls.js estimates bandwidth"
date: 2021-04-23T18:16:00-06:00
feed: true
draft: false
interactive: true
description:
  This post describes how hls.js estimates bandwidth for adaptive bitrate streaming.
  My goal is to shine a little light on ABR configs.
---
{{< style "styles.scss" >}}
{{< html >}}
  <script
    defer
    src="https://cdnjs.cloudflare.com/ajax/libs/d3/6.5.0/d3.min.js"
    integrity="sha512-0XfwGD1nxplHpehcSVI7lY+m/5L37PNHDt+DOc7aLFckwPXjnjeA1oeNbru7YeI4VLs9i+ADnnHEhP69C9CqTA=="
    crossorigin="anonymous"
  ></script>
{{< /html >}}

This post describes how [hls.js](https://github.com/video-dev/hls.js/) estimates bandwidth for adaptive bitrate streaming. My goal is to shine a little light on {{< abbr "adaptive bitrate" >}}ABR{{< /abbr >}} configs.

An {{< abbr "HTTP Live Streaming" >}}HLS{{< /abbr >}} stream provides variants of the same video at higher and lower qualities. The variants are sliced into short video segments, each just a few seconds long:

{{< html >}}
<figure class="Hlsjs-est-vars">
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1600 515" aria-hidden="true">
    <defs>
      <filter id="med" x="0" y="0">
        <feFlood x="1" y="1" height="1" width="1" />
        <feComposite width="6" height="6" />
        <feTile result="a" />
        <feComposite in="SourceGraphic" in2="a" operator="in" />
        <feMorphology operator="dilate" radius="4" />
      </filter>
      <filter id="low" x="0" y="0">
        <feFlood x="4" y="4" height="2" width="2"/>
        <feComposite width="14" height="14"/>
        <feTile result="a"/>
        <feComposite in="SourceGraphic" in2="a" operator="in"/>
        <feMorphology operator="dilate" radius="8"/>
      </filter>
      <clipPath id="clip-box" clipPathUnits="objectBoundingBox">
        <rect x="0" y="0" width="1" height="1" />
      </clipPath>
      <g id="frame">
        <image width="256" height="144" clip-path="url(#clip-box)" />
      </g>
    </defs>
    <g id="canvas">
      <g transform="translate(0, 50)" class="Hlsjs-est-vars__var Hlsjs-est-vars__var--active" data-filter="">
        <text class="Hlsjs-est-vars__text" dominant-baseline="middle" text-anchor="end" y="72" x="190">
          high:
        </text>
      </g>
      <g transform="translate(0, 204)" class="Hlsjs-est-vars__var" data-filter="med">
        <text class="Hlsjs-est-vars__text" dominant-baseline="middle" text-anchor="end" y="72" x="190">
          med:
        </text>
      </g>
      <g transform="translate(0, 358)" class="Hlsjs-est-vars__var" data-filter="low">
        <text class="Hlsjs-est-vars__text" dominant-baseline="middle" text-anchor="end" y="72" x="190">
          low:
        </text>
      </g>
    </g>
    <text class="Hlsjs-est-vars__time" text-anchor="start" y="35" x="220">
      Time:
    </text>
    <text class="Hlsjs-est-vars__time" text-anchor="end" y="35" x="470">
      0:10
    </text>
    <text class="Hlsjs-est-vars__time" text-anchor="end" y="35" x="735">
      0:20
    </text>
    <text class="Hlsjs-est-vars__time" text-anchor="end" y="35" x="1000">
      0:30
    </text>
    <text class="Hlsjs-est-vars__time" text-anchor="end" y="35" x="1265">
      0:40
    </text>
    <text class="Hlsjs-est-vars__time" text-anchor="end" y="35" x="1526">
      0:50
    </text>
<!--
    <line x1="476" x2="476" y1="30" y2="602" stroke="white" stroke-width="4" opacity="0.7" stroke-dasharray="6 4" />
    <line x1="741" x2="741" y1="30" y2="602" stroke="white" stroke-width="4" opacity="0.7" stroke-dasharray="6 4" />
-->
    <script async><![CDATA[
      const cns = tag => document.createElementNS("http://www.w3.org/2000/svg", tag);
      const canvas = document.getElementById('canvas');

      const frameModel = document.getElementById('frame');

      function addFrame(parent, url, origin, filter) {
        const frame = frameModel.cloneNode(true);
        frame.setAttribute('transform', `translate(${origin})`);

        const image = frame.querySelector('image');
        image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
        if (filter) image.setAttribute('filter', `url(#${filter})`)

        parent.appendChild(frame);
      }

      const variants = canvas.querySelectorAll('g.Hlsjs-est-vars__var');

      function setActive(variant) {
        const base = 'Hlsjs-est-vars__var';
        for (g of variants) {
          g.setAttribute('class', `${base} ${g === variant ? `${base}--active` : ''}`);
        }
      }

      for (const g of variants) {
        g.addEventListener('pointerenter', () => setActive(g));
        const filter = g.getAttribute('data-filter');
        for (let i = 1; i < 6; i += 1) {
          addFrame(g, `./${i}.webp`, `${i * 265 - 50},0`, filter);
        }
      }
    ]]></script>
  </svg>
  <figcaption>
    Representation of an HLS resource illustrating video segments for three variants: high, med, and low.
  </figcaption>
</figure>
{{< /html >}}

As the player downloads new video segments, it uses their download times to estimate bandwidth. That information helps it decide whether to switch to a higher or lower quality variant for the next segments it downloads. Put that process on loop and you have ABR: adaptive bitrate streaming.

## The problem
Calculating throughput for a single download is simple: number of bits / number of seconds = bits per second. But how well does an overall average describe the connection at any given point in time during a video stream?

Think of a car traveling at different speeds on a trip: its average speed over the trip may be 60mph, but some of that's spent on highways, some on residential roads, some waiting at intersections. Internet download speeds fluctuate like this too, so streaming video players need to adapt quickly to give viewers the best playback quality their connection can support without stalling.

Each segment in an HLS stream is a single download, so hls.js uses each one to sample the viewer's throughput. Below is a scatter plot showing some of these samples – one for each segment that was downloaded during a short hls.js playback session. I've also plotted a simple rolling average through them:

{{< html >}}
  <figure
    id="fig-1"
    class="Hlsjs-est-chart"
    aria-label="Chart showing per-segment bandwidth estimates with a rolling average"
  ></figure>
{{< /html >}}
{{< module
  "data"="data.js"
  "Chart"="chart.js"
  "{ makeMa }"="utils.js"
>}}
  const fig = new Chart('#fig-1', data);
  const ma = makeMa();
  fig.addDots();
  fig.addLine({
    title: 'Rolling Avg',
    color: '#8bfdd8',
    f: ([bits, secs]) => ma(bits / secs)
  });
  fig.addKey();
{{< /module >}}

I used a browser-simulated mobile connection, so it's fairly stable, but you can see a few dramatic shifts. Some are temporary extremes, and if the player responded to them immediately then it would be switching variants too often.

But notice how flat the rolling average remains throughout all fluctuations. As a view session goes on, that regression effect becomes stronger. If the player relied on an overall average to decide when to switch variant then it would take too long to react to changes in network conditions.

We need another way to average this data, one that gives more weight to recent samples so the player can be more responsive to changes without going overboard.

## Exponentially Weighted Moving Average
Hls.js addresses this problem with an _Exponentially Weighted Moving Average_ (EWMA). The gist of this solution is that samples are given a _half life_ as we collect them, so each sample's impact on the overall average lessens as more data is collected. This makes bandwidth estimates more responsive to changes.

Here's the same sample data with an EWMA added:

{{< html >}}
  <figure
    id="fig-2"
    class="Hlsjs-est-chart"
    aria-label="Chart showing per-segment bandwidth estimates with a standard rolling average and an exponentially weighted moving average"
  ></figure>
{{< /html >}}
{{< module
  "data"="data.js"
  "Chart"="chart.js"
  "{ makeMa, makeEwma }"="utils.js"
>}}
  const fig = new Chart('#fig-2', data);
  const ma = makeMa();
  const ewma = makeEwma();
  fig.addDots();
  fig.addLine({
    title: 'Rolling Avg',
    color: '#8bfdd8',
    f: ([bits, secs]) => ma(bits / secs)
  });
  fig.addLine({
    title: 'EWMA',
    color: '#ff5555',
    f: ([bits, secs]) => ewma(0.5, bits / secs)
  });
  fig.addKey();
{{< /module >}}

The exact value of the half life – the rate of decay for our samples – is an important variable in the EWMA formula, and it's one we can tune to affect the player's responsiveness to changing download speeds.

Another important variable is the passage of time. In the chart above, it's assumed that samples are taken at regular non-specific intervals. But what if playback is interrupted? What about varying segment lengths? Ideally, samples would decay according to their age.

## Adjusted EWMA
To address this, hls.js uses an adjusted weight parameter, _alpha,_ for each sample. First, it generates a base alpha according to the configured half life. Then, for each sample it takes, it uses the timestamp as an exponent to amplify that base alpha.

Here's an interactive chart demonstrating how the half life affects both the base alpha and bandwidth estimates with the time adjustment in place:

{{< html >}}
  <form
    id="fig-3-adjust"
    class="Hlsjs-est-form"
  >
    <label
      class="Hlsjs-est-form__label"
    >Half life:</label>
    <span
      class="Hlsjs-est-form__input"
    >
      <input
        id="fig-3-hlife"
        class="Range Hlsjs-est-form__range"
        type="range"
        min="0"
        max="100"
        value="25"
      />
      <span
        id="fig-3-hlife-val"
      ></span>
    </span>
    <label
      class="Hlsjs-est-form__label"
    >Base &#x03b1;:</label>
    <span
      id="fig-3-alpha"
      class="Hlsjs-est-form__input"
    ></span>
  </form>
  <figure
    id="fig-3"
    class="Hlsjs-est-chart"
    aria-label="Chart showing per-segment bandwidth estimates with a dynamically adjusted exponentially weighted moving average"
  ></figure>
{{< /html >}}
{{< module
  "data"="data.js"
  "Chart"="chart.js"
  "{ baseAlpha, makeAdjEwma }"="utils.js"
>}}
  let line;
  const $ = id => document.getElementById(id)
  const hlInp = $('fig-3-hlife');
  const hlVal = $('fig-3-hlife-val');
  const aVal = $('fig-3-alpha');
  const getHl = () => 100 * (1 - Math.sin(Math.acos(Number(hlInp.value) / 100)));
  const makeF = ewma => ([bits, secs]) => ewma(secs, bits / secs);
  const fig = new Chart('#fig-3', data);
  fig.addDots();
  function redraw() {
    const hl = getHl();
    hlVal.innerText = `(${Math.round(hl * 100) / 100})`;
    const a = baseAlpha(hl);
    aVal.style.backgroundImage = `linear-gradient(90deg, #393a59 ${a * 100}%, transparent ${a * 100}%)`;
    aVal.innerText = Math.round(a * 100) / 100;
    const f = makeF(makeAdjEwma(a));
    if (line) fig.redrawLine({ ...line, f });
    else line = fig.addLine({ title: 'AEWMA', color: '#ff5555', f });
  }
  hlInp.addEventListener('input', redraw);
  redraw();
{{< /module >}}

Notice that a higher alpha slows down the EWMA's responsiveness: it makes the peaks and valleys in the line less extreme.

## Fast and Slow EWMA
It pays to be somewhat pessimistic about network conditions: we should be cautious when new samples suggest that bandwidth is suddenly better, but much more responsive when it seems to be getting worse. In other words, our estimates would ideally combine the qualities of both a higher and lower alpha.

For that reason, hls.js tracks _two_ exponential weighted moving averages:

* _Fast_ – default half life of 3.0
* _Slow_ – default half life of 9.0

{{< html >}}
  <figure
    id="fig-4"
    class="Hlsjs-est-chart"
    aria-label="Chart showing per-segment bandwidth estimates with both Fast and Slow exponentially weighted moving averages"
  ></figure>
{{< /html >}}
{{< module
  "data"="data.js"
  "Chart"="chart.js"
  "{ baseAlpha, makeAdjEwma }"="utils.js"
>}}
  const fig = new Chart('#fig-4', data);
  const slow = makeAdjEwma(baseAlpha(9));
  const fast = makeAdjEwma(baseAlpha(3));
  fig.addDots();
  fig.addLine({
    title: 'Slow',
    color: '#8be9fd',
    f: ([bits, secs]) => slow(secs, bits / secs),
  });
  fig.addLine({
    title: 'Fast',
    color: '#ff5555',
    f: ([bits, secs]) => fast(secs, bits / secs),
  });
  fig.addKey();
{{< /module >}}

Notice how their two lines overlap: the fast line is more responsive, so it has higher peaks and lower valleys; the slow line is less responsive, so it remains flatter overall.

As it takes new samples, hls.js uses the lower of these two outputs as its bandwidth estimate to guide ABR decisions. This gives a final bandwidth estimate that drops quickly and climbs slowly:

{{< html >}}
  <figure
    id="fig-5"
    class="Hlsjs-est-chart"
    aria-label="Chart showing per-segment bandwidth estimates with final hls.js bandwidth estimates"
  ></figure>
{{< /html >}}
{{< module
  "data"="data.js"
  "Chart"="chart.js"
  "{ baseAlpha, makeAdjEwma }"="utils.js"
>}}
  const fig = new Chart('#fig-5', data);
  const fast = makeAdjEwma(baseAlpha(3));
  const slow = makeAdjEwma(baseAlpha(9));
  fig.addDots();
  fig.addLine({
    title: 'min(Fast, Slow)',
    color: '#8bfdd8',
    f: ([bits, secs]) => Math.min(
      fast(secs, bits / secs),
      slow(secs, bits / secs)
    ),
  });
  fig.addKey();
{{< /module >}}

This is exactly what we wanted: an estimate that responds quickly to negative network conditions but is more cautious about interpreting positive extremes.

## Sensible defaults
The final value that's important in hls.js EWMA configurations is the _default bandwidth estimate._ At the start of playback, hls.js doesn't have any segment samples to make intelligent EWMA estimates, so it uses the default estimate to guide ABR until enough samples have been gathered.

Hopefully you can now recognize the configuration options for hls.js bandwidth estimates:

* [`abrEwmaFastVoD`](https://github.com/video-dev/hls.js/blob/v1.0.2/docs/API.md#abrewmafastvod) sets the "fast" half life for VOD playback
* [`abrEwmaFastLive`](https://github.com/video-dev/hls.js/blob/v1.0.2/docs/API.md#abrewmafastlive) sets the "fast" half life for live event streams
* [`abrEwmaSlowVoD`](https://github.com/video-dev/hls.js/blob/v1.0.2/docs/API.md#abrewmaslowvod) sets the "slow" half life for VOD
* [`abrEwmaSlowLive`](https://github.com/video-dev/hls.js/blob/v1.0.2/docs/API.md#abrewmaslowlive) sets the "slow" half life for live
* [`abrEwmaDefaultEstimate`](https://github.com/video-dev/hls.js/blob/v1.0.2/docs/API.md#abrewmadefaultestimate) is the bandwidth value that hls.js uses until it's gathered enough samples to make estimates

It's rare that you'll want to tinker with the half life configurations, but they can be helpful when tuning ABR for specific network profiles.

The default estimate is a more common configuration. If you have a lot of repeat views then a useful technique is to capture the viewer's last bandwidth estimate in web storage and apply it as the default estimate for the next stream, so the viewer can start at a level that better matches their network capabilities.
