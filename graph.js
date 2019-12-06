const ns = 'http://www.w3.org/2000/svg';

window.data.forEach(artist => {
  const total = artist.data.reduce((accum, next) => accum + next);
  const avg = total / artist.data.length;
  const variance = artist.data.reduce((accum, next) => accum + Math.pow(next - avg, 2));
  artist.variance = variance / avg;
  artist.avg = avg;
  artist.total = total;
});

const genreTags = [
  'jazz', 'hip hop', 'disco', 'classical', 'folk', 'dance', 'new wave', 'art pop', 'electropop',
  'punk', 'downtempo', 'alternative rock', 'indie pop', 'indie rock', 'pop rock',
  'metal', 'psychedelic', 'classic rock', 'blues'
];
const genreRegex = {};
genreTags.forEach(genre => {
  if (genre === 'psychedelic') {
    genreRegex[genre] = new RegExp(`\\b${genre}\\b`);
  } else if (genre === 'disco') {
    genreRegex[genre] = new RegExp(`^${genre}\\b`);
  } else {
    genreRegex[genre] = new RegExp(`(?:^| )${genre}\\b`);
  }
});

function inGenre(artist, genresForArtist, genre) {
  if (genre === 'classical') {
    const classical = ['Symphon', 'Philharmon', 'Beethoven', 'Mozart', 'Debussy', 'Symphony', 'Orchestra'];
    return classical.some(n => artist.label.indexOf(n) > -1) ||
      genresForArtist.some(g => g.indexOf('classical') > -1);
  } else {
    return genresForArtist.some(g => genreRegex[genre].test(g));
  }
}

const colors = [];
for (let i = 0; i < 31; i++) {
  const degree = (i / 31 * 220 + 150) % 360;
  const saturation = 90;
  const brightness = 60 - ((31 - i) * 0.6);
  colors.push(`hsl(${degree}, ${saturation}%, ${brightness}%)`)
}

const events = {
  'Kate Bush': {
    '5': 'Licensing deals changed and the albums <em>Hounds of Love,</em> <em>The Sensual World,</em> and <em>The Red Shoes</em> appeared on Google Play Music when I had no idea they existed before.'
  },
  'New Order': {
    '12': 'I don\'t have much data for this month yet so because I listened to a lot of New Order this week, it looks like I just joined a New Order cult.'
  }
};
//const events = {
  //'Arcade Fire': {
    //'1': 'I listened to Arcade Fire\'s <em>Everything Now</em> a fair amount after its release in preparation for seeing them in concert in November.'
  //},
  //'LCD Soundsystem': {
    //'1': 'I listened to LCD Soundsystem\'s <em>American Dream</em> a lot after its release (and continue to this day - I think it\'s the best album from 2017.)'
  //},
  //'Talking Heads': {
    //'4': 'I discovered Talking Heads after looking up LCD Soundsystem\'s influences.'
  //},
  //'Laura Marling': {
    //'10': 'I listened to Laura Marling\'s entire discography a few times while working on my computer graphics final project.'
  //},
  //'Taylor Swift': {
    //'9': 'I turned 22 and remembered that the song <em>22</em> exists, and then kept listening to more Taylor Swift.'
  //},
  //'Mitski': {
    //'13': 'I heard a lot about Mitski\'s <em>Be the Cowboy</em> as it was released and listened to it a lot.'
  //},
  //'Superorganism': {
    //'10': 'I clicked a YouTube recommendation for a Superorganism NPR Tiny Desk concert that I kept seeing and ended up listening to Superorganism\'s eponymous album a lot.'
  //},
  //'classical': {
    //'10': 'I listened to lots of "focus music" when working on my computer graphics final project, and for me, that includes classical music.'
  //},
  //'new wave': {
    //'12': 'As my summer 2018 school term finished, I started trying to fill out my knowledge of 80s music, which appears as a little bubble of New Wave.'
  //}
//}

function dateString(date) {
  const month = date.getMonth() + 1;
    const year = `${date.getFullYear()}`.substr(2);
    return `${month < 10 ? '0' : ''}${month}/${year}`;
}

function graph(dataset, options, container, eventContainer) {
  container.classList.add('music-analysis-graph-container');

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', options.width);
  svg.setAttribute('height', options.height);
  svg.classList.add('music-analysis-graph');

  const legend = document.createElement('div');
  legend.classList.add('music-analysis-graph-legend');

  const eventsToShow = [];

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
    legendText.innerText = `${artist.label} (${artist.total})`;
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

    if (events[artist.label]) {
      Object.keys(events[artist.label]).sort().forEach(idx => {
        const i = parseInt(idx, 10);

        const x = getX(i, accumulatedTotals);
        const y = (getY(i, artist.data, 0) + getY(i, artist.data, 1)) / 2;
        eventsToShow.push({
          event: events[artist.label][idx],
          x,
          y
        });
      });
    }

    accumulatedTotals.forEach((v, i) => accumulatedTotals[i] = v + artist.data[i]);
  });

  accumulatedTotals.forEach((_, i) => {
    const x = getX(i, accumulatedTotals);
    const text = document.createElementNS(ns, 'text');
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${x} ${options.height - scaleSize + 10}) rotate(45)`);
    g.appendChild(text);
    text.textContent = dateString(options.date);
    text.classList.add('music-analysis-x-axis');
    svg.appendChild(g);

    options.date.setMonth(options.date.getMonth() + 1);
  })

  eventsToShow
    .sort((a, b) => ((a.x)*options.height+a.y) - (b.x*options.height+b.y))
    .forEach((e, i) => {
      const label = document.createElementNS(ns, 'text');
      label.textContent = i+1;
      label.setAttribute('x', e.x);
      label.setAttribute('y', e.y);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.classList.add('music-analysis-label');

      const bg = document.createElementNS(ns, 'circle');
      bg.setAttribute('cx', e.x);
      bg.setAttribute('cy', e.y);
      bg.setAttribute('r', 10);
      bg.setAttribute(
        'style',
        'fill: #FFF; stroke: #000; stroke-width: 1; pointer-events: none'
      );

      svg.appendChild(bg);
      svg.appendChild(label);

      const eventText = document.createElement('li');
      eventText.innerHTML = e.event;
      eventContainer.appendChild(eventText);
    });

  legendEntries.forEach(entry => legend.appendChild(entry));

  container.appendChild(svg);
  container.appendChild(legend);
}

function table(columns, headers, columnWidth, element) {
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    const cell = document.createElement('th');
    cell.setAttribute('colspan', columnWidth);
    cell.innerText = header;
    headerRow.appendChild(cell);
  });
  element.appendChild(headerRow);

  const numRows = columns[0].length;
  for (let i = 0; i < numRows; i++) {
    const row = document.createElement('tr');
    columns.forEach(column => {
      column[i].forEach((v, n) => {
        const cell = document.createElement('td');
        cell.innerText = v;
        row.appendChild(cell);
      });
    });
    element.appendChild(row);
  }
}

function makeTop25() {
  const top25 = window.data.slice(0, 25).reverse();
  const options = {
    normalize: true,
    width: 900,
    height: 500,
    date: new Date(2018, 11, 15)
  };
  console.log(options.date);
  graph(top25, options, document.getElementById('top25'), document.getElementById('top25events'));
}

function makeNext25() {
  const next25 = window.data.slice(25, 50).reverse();
  next25.sort((a, b) => a.variance/a.total/a.total - b.variance/b.total/b.total);
  const options = {
    normalize: false,
    width: 900,
    height: 500,
    date: new Date(2018, 11, 15)
  };
  graph(next25, options, document.getElementById('next25'), document.getElementById('next25events'));
}

function makeGenres() {
  const genreContainer = document.getElementById('genres');
  const genreEvents = document.getElementById('genreEvents');
  const genrePlays = {};
  genreTags.forEach(genre => genrePlays[genre] = { label: genre, total: 0, data: [] });

  window.data.forEach(artist => {
    const genresForArtist = window.genres[artist.label] || [];

    const plays = artist.data.reduce((accum, next) => accum + next);
    genreTags.forEach(genre => {
      if (inGenre(artist, genresForArtist, genre)) {
        genrePlays[genre].total += plays;
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
    date: new Date(2018, 12, 15)
  };
  const genresOverTime = Object.values(genrePlays).sort((a, b) => a.total - b.total);
  graph(genresOverTime, options, genreContainer, genreEvents);
}

function makeCoop() {
  const coopMonths = [4,5,6,7];
  const artistPlays = window.data.map(artist => {
    let playsOnCoop = 0;
    let playsAtSchool = 0;
    artist.data.forEach((v, i) => {
      if (coopMonths.indexOf(i) > -1) {
        playsOnCoop += v;
      } else {
        playsAtSchool += v;
      }
    });

    return { label: artist.label, playsOnCoop, playsAtSchool };
  });

  const coopColumn = artistPlays.sort((a, b) => b.playsOnCoop - a.playsOnCoop).slice(0,15);
  const schoolColumn = artistPlays.sort((a, b) => b.playsAtSchool - a.playsAtSchool).slice(0,15);
  table(
    [
      coopColumn.map(a => [a.label, a.playsOnCoop]),
      schoolColumn.map(a => [a.label, a.playsAtSchool]),
    ],
    ['Artists on Summer Terms', 'Artists on School Terms'],
    2,
    document.getElementById('coop')
  );

  const mostCoop = artistPlays
    .filter(a => a.playsOnCoop > 5 && a.playsAtSchool > 5)
    .sort((a, b) => b.playsOnCoop/b.playsAtSchool - a.playsOnCoop/a.playsAtSchool)
    .slice(0,10);

  const mostSchool = artistPlays
    .filter(a => a.playsOnCoop > 5 && a.playsAtSchool > 5)
    .sort((a, b) => b.playsAtSchool/b.playsOnCoop - a.playsAtSchool/a.playsOnCoop)
    .slice(0,10);

  table(
    [mostCoop.map(a => [a.label, (a.playsOnCoop/a.playsAtSchool).toFixed(2)])],
    ['Artists Skewed to Summer', 'Summer / School'],
    1,
    document.getElementById('mostcoop')
  );

  table(
    [mostSchool.map(a => [a.label, (a.playsOnCoop/a.playsAtSchool).toFixed(2)])],
    ['Artists Skewed to School', 'Summer / School'],
    1,
    document.getElementById('mostschool')
  );
}

function makeTopGenres() {
  const genrePlays = {};
  const artistsUsed = {};
  genreTags.forEach(genre => genrePlays[genre] = 0);

  const topForGenres = genreTags.map(genre => {
    const top = window.data
      .filter(artist => {
        const genresForArtist = window.genres[artist.label] || [];
        const ok = inGenre(artist, genresForArtist, genre);

        if (ok) {
          genrePlays[genre] += artist.total;
        }

        return ok && !artistsUsed[artist.label];
      })
      .sort((a, b) => b.total - a.total)[0];
    artistsUsed[top.label] = true;

    return [genre, `${top.label} (${top.total})`, genrePlays[genre]];
  }).sort((a, b) => genrePlays[b[0]] - genrePlays[a[0]]);

  const genreColumn = [];
  const artistColumn = [];
  const playsColumn = [];
  topForGenres.forEach(row => {
    genreColumn.push([row[0]]);
    artistColumn.push([row[1]]);
    playsColumn.push([row[2]]);
  });

  table(
    [
      genreColumn,
      artistColumn,
      playsColumn
    ],
    ['Genre', 'Representative Artist (Artist Plays)', 'Total Plays'],
    1,
    document.getElementById('topgenres')
  );
}

makeTop25();
makeNext25();
makeGenres();
makeCoop();
makeTopGenres();

//const genreSet = new Set();
//Object.keys(window.genres).forEach(g => genreSet.add(...window.genres[g]));
//const allGenres = [...genreSet];

//console.log(allGenres.sort((a, b) => b.split(' ').length - a.split(' ').length).slice(0, 20));
//console.log(allGenres.sort((a, b) => b.length - a.length).slice(0,50));
//console.log(allGenres.sort((a, b) => a.length - b.length).slice(0,50));
