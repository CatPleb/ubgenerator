/*
var dotenv = require('dotenv');
var result = dotenv.config();
if (result.error) {
  throw result.error;
}
console.log(result.parsed);
*/

var mongoose = require('mongoose');
//mongoose.connect(process.env.MONGOOSE_ADDRESSE, {useNewUrlParser: true});

var Hierarchy = require('../../models/hierarchy_model');


var getDB = async function() {
  console.log('Starting getDB()');
  database = await Hierarchy.find();
  console.log(database);
  console.log('That was the database.')
  return database;
}

var main = async function() {
  console.log('Lets go!');
  db = await getDB();
  JSONdb = await JSON.stringify(db);
  console.log(JSONdb);
  console.log('RIP')
  process.exit();
}

main();