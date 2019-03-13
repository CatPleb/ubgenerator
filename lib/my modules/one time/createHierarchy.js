var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/public');
//var Schema = mongoose.Schema;
//var materializedPlugin = require('mongoose-tree-materialized');

var Hierarchy = require('../../models/hierarchy_model');

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
          })
      });
    });
});