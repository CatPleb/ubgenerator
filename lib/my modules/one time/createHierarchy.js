// Load environment variables from .env
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


var drop_exercises = async function() {
    await mongoose.connection.dropCollection('exercises');
}

var create_new_hierarchy = exports.create_new_hierarchy = async function() {
    await drop_exercises();

    mongoose.connection.dropCollection('hierarchy', function(err, result) {

        // create new
        var mathe = new Hierarchy({ name: 'Mathe' });
        var optimierung = new Hierarchy({ name: 'Optimierung' });
        var algebra = new Hierarchy({ name: 'Algebra' });
        var netzwerke = new Hierarchy({ name: 'Netzwerke' });
        console.log('START FINISHED');

        //relationships
        optimierung.parentId.push(mathe._id);
        algebra.parentId.push(mathe._id);
        netzwerke.parentId.push(optimierung._id);
        console.log('RELATIONSHIPS FINISHED');

        //tags in the subtree
        mathe.subtree_tags = ['Mathe','Optimierung','Algebra','Netzwerke'];
        optimierung.subtree_tags = ['Optimierung','Netzwerke'];
        netzwerke.subtree_tags = ['Netzwerke'];
        algebra.subtree_tags = ['Algebra'];

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
}

//create_new_hierarchy();