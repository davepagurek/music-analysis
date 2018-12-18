const ns = 'http://www.w3.org/2000/svg';

window.data.forEach(artist => {
  const total = artist.data.reduce((accum, next) => accum + next);
  const avg = total / artist.data.length;
  const variance = artist.data.reduce((accum, next) => accum + Math.pow(next - avg, 2));
  artist.variance = variance;
  artist.avg = avg;
  artist.total = total;
});

const colors = [];
for (let i = 0; i < 25; i++) {
  const degree = (i / 25 * 180 + 200) % 360;
  const saturation = 90;
  const brightness = 60;
  colors.push(`hsl(${degree}, ${saturation}%, ${brightness}%)`)
}

const events = {
  'Arcade Fire': {
    '08/17': 'Listened to <em>Everything Now</em> after its release'
  },
  'LCD Soundsystem': {
    '09/17': 'Listened to <em>American Dream</em> after its release'
  },
  'Talking Heads': {
    '12/17': 'Discovered Talking Heads after looking up LCD Soundsystem\'s influences'
  },
  'Laura Marling': {
    '06/18': 'Listened to Laura Marling\'s entire discography while working on my computer graphics final project'
  },
  'Taylor Swift': {
    '05/18': 'I turned 22 and remember the song <em>22</em> exists'
  },
  'Mitski': {
    '09/18': 'Listened to <em>Be the Cowboy</em> after its release'
  },
  'Superorganism': {
    '06/18': 'Clicked a YouTube recommendation for a Superorganism NPR Tiny Desk concert and got super into it'
  }
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

    playTotals.forEach((_, i) => playTotals[i] = 1);
  }

  let max = 0;
  playTotals.forEach(v => {
    max = Math.max(max, v);
  });

  const accumulatedTotals = dataset[0].data.map(() => 0);

  const scaleSize = 40;
  const graphHeight = options.height - scaleSize;
  const graphWidth = options.width - scaleSize;

  const getX = (i, data) => Math.round(i / (data.length - 1) * graphWidth);
  const getY = (i, data, accum) => Math.round((max - accumulatedTotals[i] - accum * data[i]) / max * graphHeight);

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

function makeNext25() {
  const next25 = window.data.slice(25, 50);
  next25.sort((a, b) => a.variance/a.total/a.total - b.variance/b.total/b.total);
  const options = {
    normalize: false,
    width: 900,
    height: 500,
    date: new Date(2017, 7, 1)
  };
  graph(next25, options, document.getElementById('next25'));
}

function makeGenres() {
  const genreContainer = document.getElementById('genres');
  const genrePlays = {};
  const genres = [
    'jazz', 'hip hop', 'classical', 'art pop', 'indie pop', 'electropop', 'folk', 'dance',
    'punk', 'new wave', 'downtempo', 'alternative rock', 'indie rock', 'pop rock',
    'metal', 'psychedelic', 'techno', 'disco'
  ];
  const classical = ['Symphony', 'Philharmonic', 'Beethoven', 'Mozart', 'Debussy', 'Symphony', 'Orchestra'];
  genres.forEach(genre => genrePlays[genre] = { label: genre, plays: 0, data: [] });

  window.data.forEach(artist => {
    const genresForArtist = window.genres[artist.label] || [];

    const plays = artist.data.reduce((accum, next) => accum + next);
    genres.forEach(genre => {
      if ((genre !== classical && genresForArtist.some((g => g.indexOf(genre) > -1))) ||
           genre === 'classical' && classical.some(n => artist.label.indexOf(n) > -1)) {
        genrePlays[genre].plays += plays;
        artist.data.forEach((v, i) => {
          genrePlays[genre].data[i] = genrePlays[genre].data[i] || 0;
          genrePlays[genre].data[i] += v;
        })
      }
    });
  });

  const options = {
    normalize: true,
    width: 900,
    height: 500,
    date: new Date(2017, 7, 1)
  };
  const genresOverTime = Object.values(genrePlays).sort((a, b) => b.plays - a.plays);
  graph(genresOverTime, options, genreContainer);

  /*genres
    .filter(genre => genrePlays[genre] >= 10)
    .sort((a, b) => genrePlays[b] - genrePlays[a])
    .forEach(genre => {
      const genreElement = document.createElement('p');
      genreElement.innerText = `${genre}: ${genrePlays[genre]}`;
      genreContainer.appendChild(genreElement);
    });*/
}

makeTop25();
makeNext25();
makeGenres();

console.log(window.data.length);
