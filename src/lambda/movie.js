var axios = require('axios');
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
  let movieResult;
  try {
    movieResult = await axios.get(apiOMDB, {
      params: {
        apikey: 'f1debf90',
        t: m,
        y: '2019'
      }
    });
  } catch (err) {
    console.error(err);
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