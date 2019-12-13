var mongoose = require('mongoose');
let conn = null;
const uri = 'mongodb+srv://' + process.env.MONGODB_ATLAS_USER + ':' + process.env.MONGODB_ATLAS_PASSWORD + '@vmcluster-my0iu.mongodb.net/' + process.env.MONGODB_ATLAS_DB_NAME + '?retryWrites=true&w=majority';
exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const type = event.queryStringParameters.t;
  const award = event.queryStringParameters.award;
  run(type, award).
    then(res => {
      callback(null, res);
    }).
    catch(error => callback(error));
};

async function run(t, a) {
  let b = t.split(',');
  let c = []
  if (a){
    c = a.split(',');
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
      winnerdata: Object
    }));
  }

  const M = conn.model('awards');
  let consulta = [];
  if (b[0] === 'p' || b[0] === 'n') {

    let consulta1 = await M.aggregate([
      { $project : { _id : 0, fwinner : 1 } },
      { $unwind : '$fwinner' },
      { $group : { _id : '$fwinner', awards : { $sum : 1 } } },
      { $sort : { "awards": -1, "_id": 1 } }
    ]);
    let consulta2 = await M.aggregate([
      { $project : { _id : 0, fnominees : 1 } },
      { $unwind : '$fnominees' },
      { $group : { _id : '$fnominees', nominations : { $sum : 1 } } },
      { $sort : { "nominations": -1, "_id": 1 } }
    ]);

    if (b[0] === 'p') {
      consulta1.forEach((film) => {
        film.nominations = consulta2.find((nominee) => 
          nominee._id === film._id
        ).nominations;
      }); 
      consulta = consulta1;
    }

    if (b[0] === 'n') {
      consulta2.forEach((film) => {
        let resultado = consulta1.find((winner) => 
          winner._id === film._id
        );
        if(resultado)
          film.awards = resultado.awards;
      }); 
      consulta = consulta2;
    }
  }
  else if (b[0] === 'a' && c.length > 0){ 
    let consulta1 = await M.aggregate([
        { $match : { award : c[0] } },
        { $project : { _id : 0, fwinner : 1 } },
        { $unwind : '$fwinner' },
        { $group : { _id : '$fwinner', awards : { $sum : 1 } } },
        { $sort : { "awards": -1, "_id": 1 } }
      ]);

    let consulta2 = await M.aggregate([
        { $match : { award : c[0] } },
        { $project : { _id : 0, fnominees : 1 } },
        { $unwind : '$fnominees' },
        { $group : { _id : '$fnominees', nominations : { $sum : 1 } } },
        { $sort : { "nominations": -1, "_id": 1 } }
      ]);
     
    consulta1.forEach((film) => {
      film.nominations = consulta2.find((nominee) => 
        nominee._id === film._id
      ).nominations
    }); 
    let onlyNominees = [];
    consulta2.forEach((film) => {
      let resultado = consulta1.find((winner) => 
        winner._id === film._id
      );
      if(!resultado)
        onlyNominees.push({_id: film._id, nominations: film.nominations});
    }); 
    consulta = consulta1.concat(consulta2);
  }

  const response = {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(consulta)
  };
  return response;
}