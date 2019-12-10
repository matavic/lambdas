var mongoose = require('mongoose');
var axios = require('axios');
let conn = null;
const apiOMDB = 'http://www.omdbapi.com';
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';

exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const category = event.queryStringParameters.c;
  run(category).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(c) {

    if (conn == null) {
      conn = await mongoose.createConnection(uri, {
        bufferCommands: false,
        bufferMaxEntries: 0
      });
      conn.model('awards', new mongoose.Schema({
        award: String,
        categorycod: String,
        categorytit: String,
        fnominees: Array,
        fwinner: Array,
        pnominees: Array,
        pwinner: Array,
        winnerdata: Object
      }));
    }

    const M = conn.model('awards');
    let doc = await M.find({ categorycod: c });   
    let resp = await doc.map( async function(f){
      if(f.fwinner.length && Object.entries(f.winnerdata).length === 0){
        try {
          const r = await axios.get(apiOMDB, {
            params: {
              apikey: process.env.OMDB_API_KEY,
              t: f.fwinner[0],
              y: '2019'
            }
          });
          f.winnerdata = r.data;
          let res = await M.update({ _id: f._id }, { winnerdata: f.winnerdata });
        } catch (err) {
          console.error(err);
        }
      }
    });

    const results = await Promise.all(resp);

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