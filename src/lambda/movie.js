var axios = require('axios');
const util = require('util');
var YouTube = require('youtube-node');
const apiOMDB = 'http://www.omdbapi.com';

exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const movie = event.queryStringParameters.m;
  run(movie).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(m) {
  let youTube = new YouTube();
  youTube.setKey(process.env.YOUTUBE_API_KEY);
  const youtubePromise = util.promisify(youTube.search);
  let movieResult;
  try {
    movieResult = await axios.get(apiOMDB, {
      params: {
        apikey: process.env.OMDB_API_KEY,
        t: m,
        y: '2019'
      }
    });
  } catch (err) {
    console.error(err);
  }
  let movieTrailer;
  if(movieResult) {
    try {
      movieTrailer = await youtubePromise(m + ' trailer', 1);
      movieResult.data.Youtube = 'https://www.youtube.com/watch?v=' + movieTrailer.items[0].id.videoId;
    } catch (e) {
    console.error(e);
    }
  }
  const response = {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(movieResult.data)
  };
    
  return response;
}