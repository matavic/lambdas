var mongoose = require('mongoose');
let conn = null;
// const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';
const uri = 'mongodb+srv://matavic:8G2AtquEEtpP0Ihk@vmcluster-my0iu.mongodb.net/awardsseason?retryWrites=true&w=majority';
exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  run().
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run() {
  if (conn == null) {
    conn = await mongoose.createConnection(uri, {
      bufferCommands: false,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    conn.model('categories', new mongoose.Schema({
      title: String,
      image: String,
      description: String
    }));
  }

  const modelo = conn.model('categories');
  let doc = await modelo.find();   
  const results = await Promise.all(doc);
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