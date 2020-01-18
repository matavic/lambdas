var mongoose = require('mongoose');
var axios = require('axios');
const util = require('util');
var YouTube = require('youtube-node');
let conn = null;
const apiOMDB = 'http://www.omdbapi.com';
const apiTMDB = 'https://api.themoviedb.org/3';
const posterBasePath = 'https://image.tmdb.org/t/p/w342';
const backdropBasePath = 'https://image.tmdb.org/t/p/w780';
const smallPosterBasePath = 'https://image.tmdb.org/t/p/w92';
const mediumPosterBasePath1 = 'https://image.tmdb.org/t/p/w154';
const mediumPosterBasePath2 = 'https://image.tmdb.org/t/p/w185';
const smallProfileBasePath = 'https://image.tmdb.org/t/p/w45';
const profileBasePath = 'https://image.tmdb.org/t/p/w185';
const peopleCategories = ['actor', 'actress', 'supportingactor', 'supportingactress', 'director'];
const netflixLinks = [
  { t: 'The Irishman', n: '80175798'},
  { t: 'Marriage Story', n: '80223779'},
  { t: 'The Black Godfather', n: '80173387'},
  { t: 'The Two Popes', n: '80174451'},
  { t: 'Murder Mystery', n: '80242619'},
  { t: 'The Perfect Date', n: '81019888'},
  { t: 'American Factory', n: '81090071'},
  { t: 'The Edge of Democracy', n: '80190535'},
  { t: 'Dolemite is my Name', n: '80182014'},
  { t: 'Atlantics', n: '81082007'},
  { t: 'Rolling Thunder Revue: A Bob Dylan Story by Martin Scorsese', n: '80221016'},
  { t: 'I Lost My Body', n: '81120982'},
  { t: 'La noche de 12 años', n: '80185375'},
  { t: 'Klaus', n: '80183187'},
  { t: 'The Great Hack', n: '80117542'},
  { t: 'See You Yesterday', n: '80216758'},
];
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
    conn.model('events', new mongoose.Schema({
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
    conn.model('persons', new mongoose.Schema({
      tmdbid: String,
      avatar: String,
      photo: String,
      job: String,
      birthday: String,
      name: String,
      placeofbirth: String,
      biography: String,
      filmography: Array,
    }));
  }

    const M = conn.model('events');
    let doc = await M.find({ award: b[0] });   
    let resp = await doc.map( async function(f){
      let winnerInfo = {};
      f.winnerdata = {};
      if(f.fwinner.length > 0 && Object.entries(f.winnerdata).length === 0 ){
        try {
          const r = await axios.get(apiOMDB, {
            params: {
              apikey: process.env.OMDB_API_KEY,
              t: f.fwinner[0],
              y: '2019'
            }
          });
          if(r.data.Title)
            f.winnerdata.Title = r.data.Title;
          if(r.data.Poster)
            f.winnerdata.Poster = r.data.Poster;
          winnerInfo = r.data;
          let res = await M.update({ _id: f._id }, { winnerdata: f.winnerdata });
        } catch (err) {
          console.error(err);
        }
      }
      f.fnomineesdata = [];
      if(f.fnominees.length > 0 && f.fnomineesdata.length === 0){
        
        let nomineesInfo = [];
        for(let i=0; i < f.fnominees.length; i++) {
          let info = {};
          try {
            let re = await axios.get(apiOMDB, {
              params: {
                apikey: process.env.OMDB_API_KEY,
                t: f.fnominees[i],
                y: '2019'
              }
            });
            nomineesInfo.push(re.data);
            if(re.data.Title)
              info.Title = re.data.Title;
            f.fnomineesdata.push(info);
          } catch (error) {
            console.error(error);
          }
        }

      let movieSearch;
      let movieInfo;
      let movieCredits;
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
            if(f.fwinner.length === 0){
              f.fnomineesdata[j].pvotes = 0;
              f.fnomineesdata[j].nvotes = 0;
            }
            if(movieSearch.data.results.length > 0){ 
              if(!nomineesInfo[j].Poster || nomineesInfo[j].Poster === "" || nomineesInfo[j].Poster === "N/A") 
                nomineesInfo[j].Poster = posterBasePath + movieSearch.data.results[0].poster_path;

              nomineesInfo[j].Thumbnail = smallPosterBasePath + movieSearch.data.results[0].poster_path;
              f.fnomineesdata[j].Thumbnail = smallPosterBasePath + movieSearch.data.results[0].poster_path;
              nomineesInfo[j].TMDBId = String(movieSearch.data.results[0].id);
              f.fnomineesdata[j].TMDBId = String(movieSearch.data.results[0].id);

              if(movieSearch.data.results[0].backdrop_path)
                nomineesInfo[j].Backdrop = backdropBasePath + movieSearch.data.results[0].backdrop_path;
                
              if((!nomineesInfo[j].Plot || nomineesInfo[j].Plot === "" || nomineesInfo[j].Plot === "N/A") && movieSearch.data.results[0].overview)  
                nomineesInfo[j].Plot = movieSearch.data.results[0].overview;

              if((!nomineesInfo[j].Title || nomineesInfo[j].Title === "" || nomineesInfo[j].Title === "N/A") && movieSearch.data.results[0].title) {
                nomineesInfo[j].Title = movieSearch.data.results[0].title;
                f.fnomineesdata[j].Title = movieSearch.data.results[0].title;
              }

              if((!nomineesInfo[j].Year || nomineesInfo[j].Year === "" || nomineesInfo[j].Year === "N/A") && movieSearch.data.results[0].release_date) {
                nomineesInfo[j].Year = movieSearch.data.results[0].release_date.slice(0,4);
                nomineesInfo[j].Released = movieSearch.data.results[0].release_date;
              }

              movieInfo = await axios.get(apiTMDB + "/movie/" + movieSearch.data.results[0].id, {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                }
              });

              if(movieInfo.data.production_countries.length > 0) {
                nomineesInfo[j].Flag = "https://www.countryflags.io/" + movieInfo.data.production_countries[0].iso_3166_1.toLowerCase() + "/shiny/24.png";
                f.fnomineesdata[j].Flag = "https://www.countryflags.io/" + movieInfo.data.production_countries[0].iso_3166_1.toLowerCase() + "/shiny/24.png";
                nomineesInfo[j].FlagHD = "https://www.countryflags.io/" + movieInfo.data.production_countries[0].iso_3166_1.toLowerCase() + "/shiny/64.png";
                if((!nomineesInfo[j].Country || nomineesInfo[j].Country === "" || nomineesInfo[j].Country === "N/A")){
                  nomineesInfo[j].Country = movieInfo.data.production_countries.map(mov => mov.name).join(', ');
                }  
              }

              if(movieInfo.data.production_companies.length > 0) {
                if((!nomineesInfo[j].Production || nomineesInfo[j].Production === "") || nomineesInfo[j].Production === "N/A"){
                  nomineesInfo[j].Production = movieInfo.data.production_companies.map(movi => movi.name).join(', ');
                }  
              }

              if(movieInfo.data.genres.length > 0) {
                if((!nomineesInfo[j].Genre || nomineesInfo[j].Genre === "") || nomineesInfo[j].Genre === "N/A"){
                  nomineesInfo[j].Genre = movieInfo.data.genres.map(movie => movie.name).join(', ');
                }  
              }

              if(movieInfo.data.spoken_languages.length > 0) {
                if((!nomineesInfo[j].Language || nomineesInfo[j].Language === "") || nomineesInfo[j].Language === "N/A"){
                  nomineesInfo[j].Language = movieInfo.data.spoken_languages.map(l => l.name).join(', ');
                }  
              }

              if((!nomineesInfo[j].Runtime || nomineesInfo[j].Runtime === "" || nomineesInfo[j].Runtime === "N/A") && movieInfo.data.runtime)  
                nomineesInfo[j].Runtime = movieInfo.data.runtime;  

              if((!nomineesInfo[j].Website || nomineesInfo[j].Website === "" || nomineesInfo[j].Website === "N/A") && movieInfo.data.homepage)  
                nomineesInfo[j].Website = movieInfo.data.homepage;  

              if(movieInfo.data.tagline && movieInfo.data.tagline !== "")  
                nomineesInfo[j].TagLine = movieInfo.data.tagline; 

              if(movieInfo.data.budget && movieInfo.data.budget !== 0)  
                nomineesInfo[j].Budget = movieInfo.data.budget;  

              if(movieInfo.data.revenue && movieInfo.data.revenue !== 0)  
                nomineesInfo[j].Revenue = movieInfo.data.revenue;  

              if((!nomineesInfo[j].Actors || nomineesInfo[j].Actors === "" || nomineesInfo[j].Actors === "N/A"
                  || !nomineesInfo[j].Director || nomineesInfo[j].Director === "" || nomineesInfo[j].Director === "N/A")) {
                  movieCredits = await axios.get(apiTMDB + "/movie/" + movieSearch.data.results[0].id + "/credits", {
                    params: {
                      api_key: process.env.TMDB_API_KEY,
                    }
                  });

                  if(movieCredits.data.cast.length > 0){
                    nomineesInfo[j].Actors = movieCredits.data.cast.map(a => a.name).slice(0, 6).join(', ');
                  }

                  if(movieCredits.data.crew.length > 0){
                    movieCredits.data.crew.forEach(cr => {
                      if(cr.job === "Director")
                        nomineesInfo[j].Director = cr.name;

                      if(cr.job === "Screenplay" || cr.job === "Writer")
                        nomineesInfo[j].Writer = cr.name;
                    });
                  }
              }

              movieTrailers = await axios.get(apiTMDB + "/movie/" + movieSearch.data.results[0].id + "/videos", {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                }
              });
              if(movieTrailers.data.results.length > 0){
                
                let trailersYoutube = movieTrailers.data.results.filter(t => t.site === "YouTube" && t.type === "Trailer" );
                let youTube = new YouTube();
                youTube.setKey(process.env.YOUTUBE_API_KEY);
                const youtubePromise = util.promisify(youTube.getById);
                let respt;
                if(trailersYoutube.length > 0) {
                  nomineesInfo[j].Youtube = "https://www.youtube.com/watch?v=" + trailersYoutube[0].key;
                  f.fnomineesdata[j].Youtube = "https://www.youtube.com/watch?v=" + trailersYoutube[0].key;
                  respt = await youtubePromise(trailersYoutube[0].key);
                  if(respt.items[0].snippet.thumbnails.standard)
                    nomineesInfo[j].YoutubeThumbnail = respt.items[0].snippet.thumbnails.standard.url
                  else if(respt.items[0].snippet.thumbnails.default)
                    nomineesInfo[j].YoutubeThumbnail = respt.items[0].snippet.thumbnails.default.url
                } else {
                  let teasersYoutube = movieTrailers.data.results.filter(t => t.site === "YouTube");
                  if(teasersYoutube.length > 0) {
                    nomineesInfo[j].Youtube = "https://www.youtube.com/watch?v=" + teasersYoutube[0].key;
                    f.fnomineesdata[j].Youtube = "https://www.youtube.com/watch?v=" + teasersYoutube[0].key;
                    respt = await youtubePromise(teasersYoutube[0].key);
                    if(respt.items[0].snippet.thumbnails.standard)
                      nomineesInfo[j].YoutubeThumbnail = respt.items[0].snippet.thumbnails.standard.url
                    else if(respt.items[0].snippet.thumbnails.default)
                      nomineesInfo[j].YoutubeThumbnail = respt.items[0].snippet.thumbnails.default.url
                  }
                }
              }

              let netflixEncontrado = netflixLinks.find(lix => lix.t === nomineesInfo[j].Title);
              if(netflixEncontrado && netflixEncontrado.t){
                nomineesInfo[j].Netflix = 'https://www.netflix.com/title/' + netflixEncontrado.n;
                f.fnomineesdata[j].Netflix = 'https://www.netflix.com/title/' + netflixEncontrado.n;
              }

            }
          } catch (errn) {
            console.error(errn);
          }
      }
      let res2 = await M.update({ _id: f._id }, { fnomineesdata: f.fnomineesdata });
      let resp3 = [];
      const F = conn.model('movies');
      nomineesInfo.forEach(async(nomi, index) => {
        try {
          let nm = {};
          Object.entries(nomi).forEach(([key, value]) => {
            nm[key.toLowerCase()] = value;     
          });
          resp3[index] = await F.findOneAndUpdate({ title: nomi.Title }, nm, { upsert: true, new: true});
        } catch (errror) {
          console.error(errror);
        }
        });
      }
      
    f.pnomineesdata = [];
    if(f.pnominees.length > 0 && f.pnomineesdata.length === 0 && peopleCategories.includes(f.categorycod)){
      let personSearch;
      let personDetails;
      let personCredits;
      let personNomineesInfo = [];
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

            obj.TMDBId = personSearch.data.results[0].id;
          
            personDetails = await axios.get(apiTMDB + "/person/" + personSearch.data.results[0].id, {
              params: {
                api_key: process.env.TMDB_API_KEY,
              }
            });

            if(personDetails.data.known_for_department) {
              if(personDetails.data.known_for_department === "Acting" || personDetails.data.known_for_department === "Actors"){
                if(personDetails.data.gender && personDetails.data.gender == 2)
                  obj.Job = "Actor";

                if(personDetails.data.gender && personDetails.data.gender == 1)
                  obj.Job = "Actress";
              }
              if(personDetails.data.known_for_department === "Writing")
                  obj.Job = "Writer";

              if(personDetails.data.known_for_department === "Directing")
                  obj.Job = "Director";
            }

            if(personDetails.data.birthday) {
              obj.Birthday = personDetails.data.birthday;
            }

            if(personDetails.data.name) {
              obj.Name = personDetails.data.name;
            }

            if(personDetails.data.place_of_birth) {
              obj.PlaceOfBirth = personDetails.data.place_of_birth;
            }

            if(personDetails.data.biography) {
              obj.Biography = personDetails.data.biography;
            }

            personCredits = await axios.get(apiTMDB + "/person/" + personSearch.data.results[0].id + "/movie_credits", {
              params: {
                api_key: process.env.TMDB_API_KEY,
              }
            });

            if(personDetails.data.known_for_department && (personDetails.data.known_for_department === "Acting" || personDetails.data.known_for_department === "Actors") && personCredits.data.cast.length > 0){
              let filmography = personCredits.data.cast.filter(r => r.poster_path && (r.character !== "Himself" || r.character !== "Herself"));
              let filmo = filmography.map(film => {
                return {
                  Year: film.release_date ? Number(film.release_date.slice(0,4)) : null,
                  Title: film.title ? film.title : null,
                  Plot: film.overview ? film.overview : null,
                  Poster1: mediumPosterBasePath1 + film.poster_path,
                  Poster2: mediumPosterBasePath2 + film.poster_path,
                };
              });
              let hash = {};
              filmo = filmo.filter(function(c) {
                let pexists = !hash[c.Title] || false;
                hash[c.Title] = true;
                return pexists;
              });
              filmo.sort(function(a, b) { 
                return b.Year - a.Year;
                })
              obj.Filmography = filmo;
            } else if (personDetails.data.known_for_department && (personDetails.data.known_for_department === "Directing" || personDetails.data.known_for_department === "Writing") && personCredits.data.crew.length > 0){
              let filmography = personCredits.data.crew.filter(r => r.poster_path && (r.job === "Director" || r.job === "Screenplay"));
              let filmo = filmography.map(film => {
                return {
                  Year: film.release_date ? Number(film.release_date.slice(0,4)) : null,
                  Title: film.title ? film.title : null,
                  Plot: film.overview ? film.overview : null,
                  Poster1: mediumPosterBasePath1 + film.poster_path,
                  Poster2: mediumPosterBasePath2 + film.poster_path,
                };
              });
              let hash = {};
              filmo = filmo.filter(function(c) {
                let pexists = !hash[c.Title] || false;
                hash[c.Title] = true;
                return pexists;
              });
              filmo.sort(function(a, b) { 
                return b.Year - a.Year;
                })
              obj.Filmography = filmo;
            }
          }
          let objpndata = {};
          objpndata.Name = obj.Name;
          objpndata.Avatar = obj.Avatar;
          f.pnomineesdata.push(objpndata);
          personNomineesInfo.push(obj);

        } catch (errnum) {
          console.error(errnum);
        }
      }

      let res3 = await M.update({ _id: f._id }, { pnomineesdata: f.pnomineesdata });
      let resp4 = [];
      const P = conn.model('persons');
      personNomineesInfo.forEach(async(per, index) => {
        try {
          let np = {};
          Object.entries(per).forEach(([key, value]) => {
            np[key.toLowerCase()] = value;     
          });
          resp4[index] = await P.findOneAndUpdate({ name: per.Name }, np, { upsert: true, new: true});
        } catch (errror) {
          console.error(errror);
        }
        });
    }
    
    });

    const results = await Promise.all(resp);
    const response = {
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