/**
Homepage-specific JS.
*/

const rand = max => Math.random() * max;

function drawCloud(context, { x, y, scale, color }) {
  context.beginPath();

  context.fillStyle = `rgb(${[
    Math.floor(color * 0.4),
    Math.floor(color * 0.3),
    color,
  ].join(',')})`;

  context.arc(
    x, y,
    (30 * scale), 0,
    2 * Math.PI
  );

  context.arc(
    x + (80 * scale), y - (25 * scale),
    (30 * scale), 0,
    2 * Math.PI
  );

  context.closePath();

  context.arc(
    x + (32 * scale), y - (35 * scale),
    (35 * scale), 0,
    2 * Math.PI
  );

  context.arc(
    x + (105 * scale), y,
    (30 * scale), 0,
    2 * Math.PI
  );

  context.fillRect(
    x, y - (10 * scale),
    (105 * scale), (40 * scale)
  );

  context.fill();
}

function generateClouds(skyWidth, skyHeight) {
  const clouds = [],
        cloudFactor = Math.floor(skyWidth / 160),
        cloudCount = Math.min(cloudFactor, 4),
        colSize = Math.ceil(skyWidth / cloudCount);

  for (let i = 0; i < cloudCount; i++) {
    clouds.push({
      x: colSize * i + rand(colSize),
      y: 50 + rand(Math.min(skyHeight, 300)),
      scale: rand(i / cloudCount + cloudCount / 3) + 0.8,
    });
  }

  return clouds
    .sort(({ scale: a }, { scale: b }) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .map((cloud, index) => Object.assign(cloud, {
      color: 60 + Math.floor(index * (40 / cloudCount)),
    }));
}

const nudgeClouds = (clouds, skyWidth) => clouds.forEach((cloud) => {
  cloud.x += 0.15 * (cloud.scale * 1.4);
  if (cloud.x > skyWidth + 30 * cloud.scale) {
    cloud.x = 0 - 135 * cloud.scale;
  }
});

function startRenderLoop(callback) {
  let previousTime = 0;

  function renderLoop(currentTime) {
    if (currentTime - previousTime > 24) {
      callback();
      previousTime = currentTime;
    }

    requestAnimationFrame(renderLoop);
  }

  renderLoop();
}

function watchViewport(callback) {
  const viewport = {};
  let sizeTimeout;

  function determineSize() {
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;
  }

  function resize() {
    determineSize();
    if (sizeTimeout) clearTimeout(sizeTimeout);
    sizeTimeout = setTimeout(callback, 100, viewport);
  };

  window.addEventListener('resize', resize, false);
  determineSize();

  callback(viewport);
  return viewport;
}

{
  const canvas = document.getElementById('clouds');
  const context = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const viewport = watchViewport(({ width, height }) => {
    canvas.width = width;
    canvas.height = height;
  });

  const clouds = generateClouds(viewport.width, viewport.height);
  const initialWidth = viewport.width;

  startRenderLoop(() => {
    const skyWidth = Math.max(initialWidth, viewport.width);
    if (!reduceMotion) nudgeClouds(clouds, skyWidth);

    context.canvas.width = viewport.width;
    context.canvas.height = viewport.height;

    context.clearRect(0, 0, viewport.width, viewport.height);
    clouds.forEach(cloud => drawCloud(context, cloud));
  });
}
