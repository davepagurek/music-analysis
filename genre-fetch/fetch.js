// Run with the environment variables CLIENT_ID and CLIENT_SECRET set with your Spotify API data

const SpotifyWebApi = require('spotify-web-api-node');
const data = require('./data');
const fs = require('fs');

const api = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});


data.forEach(artist => {
  const plays = artist.data.reduce((accum, next) => accum + next);
  artist.plays = plays;
});
const artists = data
  .sort((a, b) => b.plays - a.plays)
  .map(a => ({ name: a.label, plays: a.plays, data: a.data }));

const artistGenres = {};

const artistQueue = [...artists];
const next = () => {
  if (artistQueue.length === 0) {
    const json = JSON.stringify(artistGenres, null, 2);
    console.log(json);
    fs.writeFileSync('./genre_data.js', `window.genres = ${json};`);
  } else {
    const artist = artistQueue.shift();
    setTimeout(() => fetchArtistData(artist), 0);
  }
}

const fetchArtistData = (artist) => {
  if (!artist) return next();

  api.searchArtists(artist.name, { limit: 1 }).then((data) => {
    const artistResult = data.body.artists.items[0];
    if (!artistResult) {
      console.log(`${artist.name}: No results`);
      return next();
    }

    const fetchArtistById = () => {
      api.getArtist(artistResult.id).then((artistData) => {
        artistGenres[artist.name] = artistData.body.genres;
        console.log(`${artist.name}: ${JSON.stringify(artistData.body.genres)}`);
        next();
      }, (err) => {
        if (err.message === 'Too Many Requests') {
          console.log('Too many requests. Retrying');
          setTimeout(fetchArtistById, 2000);
        } else {
          console.log(err);
        }
      });
    };
    fetchArtistById();
  }, (err) => {
    if (err.message === 'Too Many Requests') {
      console.log('Too many requests. Retrying');
      setTimeout(() => fetchArtistData(artist), 2000);
    } else if (err.message === 'socket hang up') {
      console.log('Socket error. Retrying');
      setTimeout(() => fetchArtistData(artist), 2000);
    } else {
      console.log(err);
    }
  });
};

api.clientCredentialsGrant().then((data) => {
  api.setAccessToken(data.body.access_token);
  next();
}, (err) => {
  console.log(err);
});
