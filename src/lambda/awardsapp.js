var mongoose = require('mongoose');
var axios = require('axios');
let conn = null;
const apiOMDB = 'http://www.omdbapi.com';
const apiTMDB = 'https://api.themoviedb.org/3';
const posterBasePath = 'https://image.tmdb.org/t/p/w342';
const smallPosterBasePath = 'https://image.tmdb.org/t/p/w92';
const smallProfileBasePath = 'https://image.tmdb.org/t/p/w45';
const profileBasePath = 'https://image.tmdb.org/t/p/w185';
const peopleCategories = ['actor', 'actress', 'supportingactor', 'supportingactress', 'director', 'screenplay', 'composer'];
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';

exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const award = event.queryStringParameters.a;
  run(award).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(a) {
  let b = a.split(',');
    if (conn == null) {
      conn = await mongoose.createConnection(uri, {
        bufferCommands: false,
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      conn.model('awards', new mongoose.Schema({
        award: String,
        categorycod: String,
        categorytit: String,
        fnominees: Array,
        fwinner: Array,
        pnominees: Array,
        pwinner: Array,
        winnerdata: Object,
        pnomineesdata: Array,
        fnomineesdata: Array
      }));
    }

    const M = conn.model('awards');
    let doc = await M.find({ award: b[0] });   

    let resp = await doc.map( async function(f){

      if(f.fwinner.length && Object.entries(f.winnerdata).length === 0 ){
        try {
          const r = await axios.get(apiOMDB, {
            params: {
              apikey: process.env.OMDB_API_KEY,
              t: f.fwinner[0],
              y: '2019'
            }
          });
          f.winnerdata = r.data;
          let res = await M.update({ _id: f._id }, { winnerdata: f.winnerdata });
        } catch (err) {
          console.error(err);
        }
      }

      if(f.fnominees.length > 0 && f.fnomineesdata.length === 0){
        for(let i=0; i < f.fnominees.length; i++) {
          try {
            let re = await axios.get(apiOMDB, {
              params: {
                apikey: process.env.OMDB_API_KEY,
                t: f.fnominees[i],
                y: '2019'
              }
            });
            f.fnomineesdata.push(re.data);
          } catch (error) {
            console.error(error);
          }
        }

      let movieSearch;
      let movieInfo;
      let movieTrailers;
      for(let j=0; j < f.fnomineesdata.length; j++) {
        try {
            movieSearch = await axios.get(apiTMDB + "/search/movie", {
              params: {
                api_key: process.env.TMDB_API_KEY,
                query: f.fnominees[j],
                primary_release_year: 2019
              }
            });
            if(movieSearch.data.results.length > 0){ 
              if(!f.fnomineesdata[j].Poster || f.fnomineesdata[j].Poster === "") 
                f.fnomineesdata[j].Poster = posterBasePath + movieSearch.data.results[0].poster_path;
              f.fnomineesdata[j].Thumbnail = smallPosterBasePath + movieSearch.data.results[0].poster_path;
              movieInfo = await axios.get(apiTMDB + "/movie/" + movieSearch.data.results[0].id, {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                }
              });
              if(movieInfo.data.production_countries.length > 0)
                f.fnomineesdata[j].Flag = "https://www.countryflags.io/" + movieInfo.data.production_countries[0].iso_3166_1.toLowerCase() + "/shiny/24.png";

              movieTrailers = await axios.get(apiTMDB + "/movie/" + movieSearch.data.results[0].id + "/videos", {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                }
              });
              if(movieTrailers.data.results.length > 0){
                let trailersYoutube = movieTrailers.data.results.filter(t => t.site === "YouTube" && t.type === "Trailer" );
                if(trailersYoutube.length > 0)
                  f.fnomineesdata[j].Youtube = "https://www.youtube.com/watch?v=" + trailersYoutube[0].key;
                else {
                  let teasersYoutube = movieTrailers.data.results.filter(t => t.site === "YouTube");
                  if(teasersYoutube.length > 0)
                    f.fnomineesdata[j].Youtube = "https://www.youtube.com/watch?v=" + teasersYoutube[0].key;
                }
              }
            }
          } catch (errn) {
            console.error(errn);
          }
      }
      let res2 = await M.update({ _id: f._id }, { fnomineesdata: f.fnomineesdata });
    }

    if(f.pnominees.length > 0 && f.pnomineesdata.length === 0 && peopleCategories.includes(f.categorycod)){
      let personSearch;
      for(let k=0; k < f.pnominees.length; k++) {
        try {

          personSearch = await axios.get(apiTMDB + "/search/person", {
            params: {
              api_key: process.env.TMDB_API_KEY,
              query: f.pnominees[k]
            }
          });

          var obj = {};
          if(personSearch.data.results.length > 0){
            if(personSearch.data.results[0].profile_path) {
              obj.Avatar = smallProfileBasePath + personSearch.data.results[0].profile_path;
              obj.Photo = profileBasePath + personSearch.data.results[0].profile_path;
            }
          }
          f.pnomineesdata.push(obj);

        } catch (errnum) {
          console.error(errnum);
        }
      }

      let res3 = await M.update({ _id: f._id }, { pnomineesdata: f.pnomineesdata });
    }

    });
    const results = await Promise.all(resp);
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