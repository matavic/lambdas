var mongoose = require('mongoose');
let conn = null;
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
  }

  const modelo = conn.model('events');
  let doc = await modelo.find({ award: b[0] });   
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