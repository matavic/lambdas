var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';
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
  let b = m.split(',');
  if (conn == null) {
    conn = await mongoose.createConnection(uri, {
      bufferCommands: false,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    conn.model('movies', new mongoose.Schema({
      title: String,
      year: String,
      rated: String,
      released: String,
      runtime: String,
      genre: String,
      director: String,
      writer: String,
      actors: String,
      plot: String,
      language: String,
      country: String,
      awards: String,
      poster: String,
      ratings: Array,
      metascore: String,
      imdbrating: String,
      imdbvotes: String,
      imdbid: String,
      type: String,
      dvd: String,
      boxoffice: String,
      production: String,
      website: String,
      response: String,
      thumbnail: String,
      tmdbid: String,
      backdrop: String,
      flag: String,
      flaghd: String,
      budget: Number,
      revenue: Number,
      youtube: String,
      youtubethumbnail: String,
      netflix: String
    }));
  }

  const modelo = conn.model('movies');
  let doc = await modelo.findOne({ title: b[0] });   
  const response = {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(doc)
  };
  return response;
}