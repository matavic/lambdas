var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';

exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const body = JSON.parse(event.body);
  run(body).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(b) {
  let doc;
  if(b.event === 'signup') {
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
    try {
      const U = conn.model('users');
      let newuser = new U(
        { 
          name: b.user.user_metadata && b.user.user_metadata.full_name ? b.user.user_metadata.full_name : '', 
          email: b.user.email,
          watched: [],
          watchlist: [],
          favorites: [],
          ratings: [],
          votes: []
         }
        );
      let saved = await newuser.save(); 
      doc = {
        status: 'success',
        message: 'New user signup'
      };
      } catch (err) {
        console.error(err);
      }
    } else {
      doc = {
        status: 'undefined',
        message: 'undefined'
      };
    }
  
  // const results = await Promise.all(resp);
  response = {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(doc)
  };
  return response;  
    
}