var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';

exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const search = event.queryStringParameters.t;
  run(search).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(s) {
  let b = s.split(',');
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
        pnomineesdata: Array,
        fnomineesdata: Array
      }));
    }

    const M = conn.model('awards');
    let doc = await M.find({ $or: [
        { fnominees: { $elemMatch : { $regex: b[0], $options: "i" }}},
        { pnominees: { $elemMatch : { $regex: b[0], $options: "i" }}}
      ]});   
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