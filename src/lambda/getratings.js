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
  let b = m ? m.split(',')[0] : null;
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
    }
    let doc;
    const M = conn.model('fasratings');
    if(b){
      doc = await M.find({ title: b });   
    } else {
      doc = await M.find({});
    }
    
    // const results = await Promise.all(resp);
      const response = {
      statusCode: 200,
      headers: {
        'Content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(doc)
    };
    return response;
}