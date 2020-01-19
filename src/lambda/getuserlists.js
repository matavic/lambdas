var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';

exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { clientContext } = context;
  const username = clientContext.user ? clientContext.user.user_metadata.full_name : "guest";
  const useremail = clientContext.user ? clientContext.user.email : "guest";

  const uemail = event.queryStringParameters.u;
  const list = event.queryStringParameters.l;
  run(list, uemail, username, useremail).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(l, ue, u, e) {
  let b = l ? l.split(',')[0] : null;
  let uem = ue ? ue.split(',')[0] : '';
    if (conn == null) {
      conn = await mongoose.createConnection(uri, {
        bufferCommands: false,
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      conn.model('users', new mongoose.Schema({
        name: String,
        email: String,
        watched: Array,
        watchlist: Array,
        favorites: Array,
        ratings: Array,
        votes: Array
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
        tagline: String,
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
    let response;
    if((e === 'guest' && u === 'guest' && !uem)) {
        
      doc = {
        status: 'error',
        message: 'Forbidden'
      };
      response = {
        statusCode: 403,
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          "Access-Control-Allow-Methods" : 'GET, POST, OPTIONS, PUT',
          "Access-Control-Allow-Headers": "Authorization"
        },
        body: JSON.stringify(doc)
      };
      return response;
    }

    const L = conn.model('users');
    let searchfor = e !== 'guest' ? e : uem;
    let user;
    if(b){
      let movies = [];
      const M = conn.model('movies');
      switch (b) {
        case 'watched':
          user = await L.findOne({ email: searchfor }, { watched: 1, });
          if(user){
            let movieResp = [];
            user.watched.forEach(async(m, index) => {
              movieResp[index] = await M.findOne({ title: m });
              if(movieResp[index]){
                movies.push({
                  Id: movieResp[index].tmdbid ? movieResp[index].tmdbid : null,
                  Title: movieResp[index].title ? movieResp[index].title : null,
                  Poster: movieResp[index].poster ? movieResp[index].poster : null,
                });
              }
            });
          }
          doc = movies;
          break;
        case 'watchlist':
          user = await L.findOne({ email: searchfor }, { watchlist: 1, });
          if(user){
            let movieResp = [];
            user.watchlist.forEach(async(m, index) => {
              movieResp[index] = await M.findOne({ title: m });
              if(movieResp[index]){
                movies.push({
                  Id: movieResp[index].tmdbid ? movieResp[index].tmdbid : null,
                  Title: movieResp[index].title ? movieResp[index].title : null,
                  Poster: movieResp[index].poster ? movieResp[index].poster : null,
                  Plot: movieResp[index].plot ? movieResp[index].plot : null,
                  Flag: movieResp[index].flag ? movieResp[index].flag : null,
                  Tagline: movieResp[index].tagline ? movieResp[index].tagline : null,
                  Youtube: movieResp[index].youtube ? movieResp[index].youtube : null,
                  Netflix: movieResp[index].netflix ? movieResp[index].netflix : null,
                });
              }
            });
          }
          doc = movies;
          break;
        case 'favorites':
          user = await L.findOne({ email: searchfor }, { favorites: 1, });
          if(user){
            let movieResp = [];
            user.favorites.forEach(async(m, index) => {
              movieResp[index] = await M.findOne({ title: m });
              if(movieResp[index]){
                movies.push({
                  Id: movieResp[index].tmdbid ? movieResp[index].tmdbid : null,
                  Title: movieResp[index].title ? movieResp[index].title : null,
                  Poster: movieResp[index].poster ? movieResp[index].poster : null,
                });
              }
            });
          }
          doc = movies;
          break;
        default:
          break;
      }
    } else {
      user = await L.findOne({ email: searchfor });
    }
    if(!user) {
      doc = {
        status: 'error',
        message: 'User not found'
      };
      response = {
        statusCode: 404,
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          "Access-Control-Allow-Methods" : 'GET, POST, OPTIONS, PUT',
          "Access-Control-Allow-Headers": "Authorization"
        },
        body: JSON.stringify(doc)
      };
      return response;  
    }
    
    // const results = await Promise.all(resp);
      response = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        "Access-Control-Allow-Methods" : 'GET, POST, OPTIONS, PUT',
        "Access-Control-Allow-Headers": "Authorization"
      },
      body: JSON.stringify(doc)
    };
    return response;
}