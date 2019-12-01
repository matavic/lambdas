var mongoose = require('mongoose');

let conn = null;

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
        bufferMaxEntries: 0
      });
      conn.model('awards', new mongoose.Schema({
        awards: String,
        category: String,
        fnominees: Array,
        fwinner: Array,
        pnominees: Array,
        pwinner: Array
      }));
    }

    const M = conn.model('awards');

    const doc = await M.find();
    const response = {
      statusCode: 200,
      body: JSON.stringify(doc)
    };
    return response;
}