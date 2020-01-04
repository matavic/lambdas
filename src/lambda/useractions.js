var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';

exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const { clientContext } = context;
  const username = clientContext.user ? clientContext.user.user_metadata.full_name : "guest";
  const useremail = clientContext.user ? clientContext.user.email : "guest";
  console.log('user', clientContext.user);
  console.log('name', username);
  console.log('email', useremail);
  
  const action = event.queryStringParameters.a;
  const flag = event.queryStringParameters.f;
  const item = JSON.parse(event.body);
  console.log('item', useremail);
  run(username, useremail, action, flag, item).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(u, e, a, f, it) {
  let b = a.split(',');
  let doc;
  let response;
  if((e === 'guest' && u === 'guest')) {
      
    doc = {
      status: 'error',
      message: 'Forbidden'
    };
    response = {
      statusCode: 403,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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
      favorite: Array,
      ratings: Array,
      votes: Array
    }));
  }

    const M = conn.model('awards');
    const U = conn.model('users');

    let user = await U.findOne({ email: e }); 
    console.log('it ', it);
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
        },
        body: JSON.stringify(doc)
      };
      return response;  
    }
    let re;
    switch (a) {
      case 'watched':
        re = f === 'i' ? await U.update({ _id: user._id }, { $push: { watched: it } }) : await U.update({ _id: user._id }, { $pull: { watched: { title:  it.title } } });
        break;
      case 'favorite':
        re = f === 'i' ? await U.update({ _id: user._id }, { $push: { favorite: it } }) : await U.update({ _id: user._id }, { $pull: { favorite: { title: it.title } } });
        break;
      case 'watchlist':
        re = f === 'i' ? await U.update({ _id: user._id }, { $push: { watchlist: it } }) : await U.update({ _id: user._id }, { $pull: { watchlist: { title: it.title } } });
        break;
    
      default:
        break;
    }
    // const results = await Promise.all(resp);
    doc = {
      status: 'success',
      message: 'Action complete'
    };
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