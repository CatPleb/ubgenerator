// Load environment variables from .env
var dotenv = require('dotenv');
var result = dotenv.config();
if (result.error) {
  throw result.error;
}
console.log(result.parsed);

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE);

var Hierarchy = require('../../models/hierarchy_model');

mongoose.connection.dropCollection('hierarchy', function(err, result) {

    // create new
    var mathe = new Hierarchy({ tag: 'Mathe' });
    var optimierung = new Hierarchy({ tag: 'Optimierung' });
    var algebra = new Hierarchy({ tag: 'Algebra' });
    var netzwerke = new Hierarchy({ tag: 'Netzwerke' });
    console.log('START FINISHED');

    //relationships
    optimierung.parentId = mathe._id;
    algebra.parentId = mathe._id;
    netzwerke.parentId = optimierung._id;
    console.log('RELATIONSHIPS FINISHED');

    //save
    mathe.save(function() {
        optimierung.save(function() {
            algebra.save(function() {
                netzwerke.save(function() {
                    console.log('FINISHED');
                    process.exit();
                })
            });
        });
    });
});