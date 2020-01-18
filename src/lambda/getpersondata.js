var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';
exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const person = event.queryStringParameters.p;
  run(person).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(p) {
  let b = p.split(',');
  if (conn == null) {
    conn = await mongoose.createConnection(uri, {
      bufferCommands: false,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
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

  const modelo = conn.model('persons');
  let doc = await modelo.findOne({ name: b[0] });   
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