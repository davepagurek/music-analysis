const ns = 'http://www.w3.org/2000/svg';

const colors = [];
for (let i = 0; i < 25; i++) {
  const degree = (i / 25 * 180 + 200) % 360;
  const saturation = 90;
  const brightness = 60;
  colors.push(`hsl(${degree}, ${saturation}%, ${brightness}%)`)
}

function graph(dataset, options, container) {
  container.classList.add('music-analysis-graph-container');

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', options.width);
  svg.setAttribute('height', options.height);
  svg.classList.add('music-analysis-graph');

  const legend = document.createElement('div');
  legend.classList.add('music-analysis-graph-legend');

  const playTotals = dataset
    .map(artist => artist.data)
    .reduce((accum, current) => accum.map((x, i) => x + current[i]));

  let dataToGraph = dataset;
  if (options.normalize) {
    dataToGraph = dataset.map(artist => Object.assign(
      {},
      artist,
      {data: artist.data.map((x, i) => x / playTotals[i])}));
  }

  const accumulatedTotals = dataset[0].data.map(() => 0);

  const scaleSize = 40;
  const graphHeight = options.height - scaleSize;
  const graphWidth = options.width - scaleSize;

  const getX = (i, data) => Math.round(i / (data.length - 1) * graphWidth);
  const getY = (i, data, accum) => Math.round((1 - accumulatedTotals[i] - accum * data[i]) * graphHeight);

  const legendEntries = [];
  dataToGraph.forEach((artist, i) => {
    const color = colors[Math.pow(i, 7) * 13 % colors.length];
    const path = document.createElementNS(ns, 'path');
    const d =
      artist.data.map((_, i) => {
        const x = getX(i, artist.data);
        const y = getY(i, artist.data, 1);
        const ctrlX = x - options.width / (3 * artist.data.length);
        let prefix;
        if (i === 0) {
          prefix = 'M';
        } else {
          prefix = `C ${getX(i-1, artist.data) + options.width / (3 * artist.data.length)},${getY(i-1, artist.data, 1)},${ctrlX},${y},`;
        }
        return prefix + x + ',' + y;
      }).join(' ') +
      artist.data.map((_, i) => {
        const x = getX(i, artist.data);
        const y = getY(i, artist.data, 0);
        const ctrlX = x + options.width / (3 * artist.data.length);
        let prefix;
        if (i === accumulatedTotals.length - 1) {
          prefix = 'L';
        } else {
          prefix = `C ${(getX(i+1, artist.data) - options.width / (3 * artist.data.length))},${getY(i+1, artist.data, 0)},${ctrlX},${y},`;
        }
        return prefix + x + ',' + y;
      }).reverse().join(' ') +
      ' Z';
    path.setAttribute('d', d);
    path.setAttribute('style', `fill: ${color};`);
    path.classList.add('music-analysis-graph-area');
    svg.appendChild(path);

    const legendEntry = document.createElement('div');
    legendEntry.classList.add('music-analysis-graph-legend-entry');
    legendEntry.setAttribute('style', `color: ${color}`);

    const swatch = document.createElement('div');
    swatch.classList.add('music-analysis-swatch');
    swatch.setAttribute('style', `background-color: ${color}`);
    legendEntry.appendChild(swatch);

    const legendText = document.createElement('span');
    legendText.innerText = artist.label;
    legendEntry.appendChild(legendText);

    legendEntries.unshift(legendEntry);

    [path, legendEntry].forEach(el => el.addEventListener('mouseover', () => {
      legendEntry.classList.add('selected');
      path.classList.add('selected');
    }));
    [path, legendEntry].forEach(el => el.addEventListener('mouseout', () => {
      legendEntry.classList.remove('selected');
      path.classList.remove('selected');
    }));

    accumulatedTotals.forEach((v, i) => accumulatedTotals[i] = v + artist.data[i]);
  });

  accumulatedTotals.forEach((_, i) => {
    const x = getX(i, accumulatedTotals);
    const text = document.createElementNS(ns, 'text');
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${x} ${options.height - scaleSize + 10}) rotate(45)`);
    g.appendChild(text);
    const month = options.date.getMonth() + 1;
    const year = `${options.date.getFullYear()}`.substr(2);
    text.textContent = `${month < 10 ? '0' : ''}${month}/${year}`;
    text.classList.add('music-analysis-x-axis');
    svg.appendChild(g);

    options.date.setMonth(options.date.getMonth() + 1);
  })

  legendEntries.forEach(entry => legend.appendChild(entry));

  container.appendChild(svg);
  container.appendChild(legend);
}

function makeTop25() {
  const top25 = window.data.slice(0, 25);
  const options = {
    normalize: true,
    width: 900,
    height: 500,
    date: new Date(2017, 7, 1)
  };
  graph(top25, options, document.getElementById('top25'));
}

makeTop25();
