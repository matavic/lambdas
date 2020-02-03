var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';
exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  run().
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run() {
    if (conn == null) {
      conn = await mongoose.createConnection(uri, {
        bufferCommands: false,
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      conn.model('fasratings', new mongoose.Schema({
        id: String,
        title: String,
        rating: String,
        s: mongoose.Schema.Types.Decimal128,
        c: Number
      }));
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
    let doc;
    const F = conn.model('fasratings');
    doc = await F.find({}).sort('ratings').limit(50);
    const M = conn.model('movies');
    let movieResp = [];
    let movies = [];
    let resp = await doc.map( async function(f, index){
      movieResp[index] = await M.findOne({ title: f.title });
      if(movieResp[index]){
        movies.push({
          title: f.title,
          rating: f.rating.slice(0,3),
          c: f.c,
          thumbnail: movieResp[index].thumbnail ? movieResp[index].thumbnail : null,
          flag: movieResp[index].flag ? movieResp[index].flag : null,
          genre: movieResp[index].genre ? movieResp[index].genre : null,
          director: movieResp[index].director ? movieResp[index].director : null,
          actors: movieResp[index].actors ? movieResp[index].actors : null
        });
      }
    });
    const results = await Promise.all(resp);
    movies.sort(function(a, b) {
      return b["rating"] - a["rating"] || b["c"] - a["c"];
  });
    const response = {
      statusCode: 200,
      headers: {
        'Content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(movies)
    };
    return response;
}