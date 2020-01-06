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
      switch (b) {
        case 'watched':
          user = await L.findOne({ email: searchfor }, { watched: 1, });
          if(user)
            doc = user.watched;
          break;
        case 'watchlist':
          user = await L.findOne({ email: searchfor }, { watchlist: 1, });
          if(user)
            doc = user.watchlist;
          break;
        case 'favorites':
          user = await L.findOne({ email: searchfor }, { favorites: 1, });
          if(user)
            doc = user.favorites;
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