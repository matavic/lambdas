var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';
exports.handler = function(event, context, callback) {

  if(event.httpMethod === 'OPTIONS') {
    const response = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        "Access-Control-Allow-Methods" : 'GET, POST, OPTIONS, PUT',
        "Access-Control-Allow-Headers": "Authorization, Origin, X-Requested-With, Content-Type, Accept"
      },
      body: JSON.stringify({message: 'You can use CORS'})
    }
    callback(null, response)
    return
  }
  context.callbackWaitsForEmptyEventLoop = false;
  const { clientContext } = context;
  const username = clientContext.user ? clientContext.user.user_metadata.full_name : "guest";
  const useremail = clientContext.user ? clientContext.user.email : "guest";
  
  const action = event.queryStringParameters.a;
  const flag = event.queryStringParameters.f;
  const uemail = event.queryStringParameters.u;
  const item = JSON.parse(event.body);
  run(username, useremail, uemail, action, flag, item).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(u, e, ue, a, f, it) {
  let b = a.split(',');
  let c = f.split(',');
  let uem = ue ? ue.split(',')[0] : '';
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
      fnomineesdata: Array,
      pnomineesdata: Array
    }));
    conn.model('users', new mongoose.Schema({
      name: String,
      email: String,
      watched: Array,
      watchlist: Array,
      favorites: Array,
      ratings: Array,
      votes: Array
    }));
    conn.model('fasratings', new mongoose.Schema({
      id: String,
      title: String,
      rating: String,
      s: mongoose.Schema.Types.Decimal128,
      c: Number,
    }));
  }

    const U = conn.model('users');
    let searchfor = e !== 'guest' ? e : uem;
    let user = await U.findOne({ email: searchfor }); 
    
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
    let re;
    let encontrado;
    try {
      switch (b[0]) {
        case 'watched':
          encontrado = user.watched.findIndex(film => film.Title === it.Title);
          let encontradoWatchlist = user.watchlist.findIndex(film => film.Title === it.Title);
          if(c[0] === 'i' && encontrado !== -1) {
            re = await U.update({ _id: user._id }, { $pull: { watchlist: { Title:  it.Title } } });
            doc = {
              status: 'success',
              message: 'Register not modified'
            };  
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
          } else {
            re = c[0] === 'i' ? await U.update({ _id: user._id }, { $push: { watched: it } }) : await U.update({ _id: user._id }, { $pull: { watched: { Title:  it.Title } } });
            if(c[0] === 'i')
              let wm = await U.update({ _id: user._id }, { $pull: { watchlist: { Title:  it.Title } } });
          }
          break;
        case 'favorites':
          encontrado = user.favorites.findIndex(f => f.Title === it.Title);
          if(c[0] === 'i' && encontrado !== -1) {
            doc = {
              status: 'success',
              message: 'Register not modified'
            };  
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
          } else {
            re = c[0] === 'i' ? await U.update({ _id: user._id }, { $push: { favorites: it } }) : await U.update({ _id: user._id }, { $pull: { favorites: { Title: it.Title } } });
          }  
          break;
        case 'watchlist':
          encontrado = user.watchlist.findIndex(f => f.Title === it.Title);
          if(c[0] === 'i' && encontrado !== -1) {
            doc = {
              status: 'success',
              message: 'Register not modified'
            };  
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
          } else {
            re = c[0] === 'i' ? await U.update({ _id: user._id }, { $push: { watchlist: it } }) : await U.update({ _id: user._id }, { $pull: { watchlist: { Title: it.Title } } });
          }  
          break;
          case 'ratings':
            let oldrating = null;
            let resul;
            encontrado = user.ratings.findIndex(f => f.title === it.title);
            if(encontrado !== -1) {
              oldrating = user.ratings[encontrado].rating;
            }
            const R = conn.model('fasratings');
            let movieRating = await R.findOne({ title: it.title }); 
            if(!movieRating) {
              let newRating = new R(
                { 
                  id: it.id ? it.id : '',
                  title: it.title, 
                  rating: String(it.rating),
                  s: Number(it.rating),
                  c: 1,
                 }
                );
              let saved = await newRating.save(); 
            } else {
              let newS;
              let newR;
              if(encontrado !== -1){
                newS = ( parseFloat(movieRating.s) - parseFloat(oldrating) ) + parseFloat(it.rating);
                newR = String(newS / parseFloat(movieRating.c));
                resul = await movieRating.update( { $set: { s: newS, rating: newR } });
              } else {
                newS = parseFloat(movieRating.s) + parseFloat(it.rating);
                let count = parseFloat(movieRating.c);
                count = count + 1;
                newR = String(newS / count);
                resul = await movieRating.update( { $set: { s: newS, rating: newR, c: count } });
              }
            }
            re = c[0] === 'i' ? await U.update({ _id: user._id }, { $push: { ratings: it } }) : await U.update({ _id: user._id, "ratings.title": it.title }, { $set: { "ratings.$.rating": it.rating } });
            break;
        case 'votes':
          let oldvote = null;
          let resulting;
          let resulting2;
          encontrado = user.votes.findIndex(f => f.award === it.award && f.category === it.category);
          
          if(encontrado !== -1) {
            oldvote = user.votes[encontrado].vote;
          }
          const A = conn.model('awards');
          let catVotes = await A.findOne({ award: it.award, categorytit: it.category });
          let resp = [];
          if(catVotes && catVotes.fnomineesdata.length > 0) {
            let total = 0;
            let ind;
            catVotes.fnomineesdata.forEach(film => total = total + parseFloat(film.nvotes));
            if(encontrado !== -1){
              ind = catVotes.fnomineesdata.findIndex(ct => ct.Title === oldvote);
              if(ind !== -1){
                let fixOldN = parseFloat(catVotes.fnomineesdata[ind].nvotes) - 1;
                let fixOldP = (fixOldN / total) * 100;
                total = total - 1;
                resulting = await A.update( { award: it.award, categorytit: it.category, "fnomineesdata.Title": oldvote }, { $set: { "fnomineesdata.$.nvotes": fixOldN, "fnomineesdata.$.pvotes": fixOldP } });
              } else {
                break;
              }
            }
            let newInd = catVotes.fnomineesdata.findIndex(o => o.Title === it.vote);
            let newN = parseFloat(catVotes.fnomineesdata[newInd].nvotes) + 1;
            total = total + 1;
            let newP = (newN / total) * 100;
            resulting2 = await A.update( { award: it.award, categorytit: it.category, "fnomineesdata.Title": it.vote }, { $set: { "fnomineesdata.$.nvotes": newN, "fnomineesdata.$.pvotes": newP } });
            for(let i = 0; i < catVotes.fnomineesdata.length; i++){
              if(ind !== -1 && i === ind)
                continue;
              if(i === newInd)
                continue;
              resp[i] = await A.update( { award: it.award, categorytit: it.category, "fnomineesdata.Title": catVotes.fnomineesdata[i].Title }, { $set: { "fnomineesdata.$.pvotes": (parseFloat(catVotes.fnomineesdata[i].nvotes) / total) * 100 } });
            }
            const resArray = await Promise.all(resp);
          }
          re = c[0] === 'i' ? await U.update({ _id: user._id }, { $push: { votes: it } }) : await U.update({ _id: user._id, "votes.award": it.award, "votes.category": it.category }, { $set: { "votes.$.vote": it.vote } });
          break;        
        default:
          break;
      }
    } catch (err) {
      console.error(err);
    }
    if(re && re.ok === 1){
      user = await U.findOne({ email: e });
      doc = {
        status: 'success',
        message: 'Action complete',
        user: user
      }
    } else {
      doc = {
        status: 'error',
        message: 'Register not modified'
      };  
    }
    
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