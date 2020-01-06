var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';

exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const { clientContext } = context;
  const username = clientContext.user ? clientContext.user.user_metadata.full_name : "guest";
  const useremail = clientContext.user ? clientContext.user.email : "guest";
  
  const user = event.queryStringParameters.u;
  run(user, username, useremail).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(u, n, e) {
  let b = u ? u.split(',') : '';
  let doc;
  let response;
  if((e === 'guest' && u === 'guest' && !b[0])) {
      
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

    const U = conn.model('users');
    let email = e !== 'guest' ? e : b[0]
    let user = await U.findOne({ email: email }); 
    console.log('user ', user);
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
    doc = {
      status: 'success',
      message: 'Action complete',
      user: user
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
}