var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';
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
      conn.model('news', new mongoose.Schema({
        id: String,
        title: String,
        header: String,
        image: String,
        source: String,
        sourcethumbnail: String,
        type: String,
        link: String,
        time: Number
      }));
    }
    let doc;
    const N = conn.model('news');
    doc = await N.find({}).sort('-time').limit(15);
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