var express = require('express');
var adminsecured = require('../lib/middleware/adminsecured');
var router = express.Router();

var my = require('../lib/my modules/compile_code');
var util = require('util');

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE);

var Exercises = require('../lib/models/exercises_model');
var Hierarchy = require('../lib/models/hierarchy_model');



var get_tags = function(hierarchy_find_result) {
  tagList = [];
  hierarchy_find_result.forEach(function(tagdic) {
    tagList.push(tagdic.tag);
  });
  return tagList;
};

var two_arrays_same_element = function(arr1, arr2) {
  for (i=0;i<arr1.length;i++) {
    for (j=0;j<arr2.length;j++) {
      if (arr1[i].localeCompare(arr2[j]) == 0) {
        console.log(arr1[i]+' was the same as '+arr2[j]);
        return true;
      }
    }
  }
  return false
};


var shorten = function(arr, num) {
  newarr = []
  arr.forEach((entry) => {
    if (entry != 1) {
      newarr.push(entry);
    }
  });
  return newarr;
}



// function to check for database entries
var syncfindOne = function(tag_name) {
  return new Promise(function(resolve,reject) {
    Hierarchy.findOne({ tag: tag_name }, function(err, res) {
      if (err) reject(err);
      resolve(res);
    });
  });
};

// function to check for database entries
var syncfindOneById = function(tag_id) {
  return new Promise(function(resolve,reject) {
    Hierarchy.findOne({ _id: tag_id }, function(err, res) {
      if (err) reject(err);
      resolve(res);
    });
  });
};


// makes all elements in array unique
function arrayUnique(array) {
  var a = array.concat();
  for(var i=0; i<a.length; ++i) {
      for(var j=i+1; j<a.length; ++j) {
          if(a[i] === a[j])
              a.splice(j--, 1);
      }
  }
  for (i=0;i<a.length;i++) {
    if (a[i] == undefined) {
      a.splice(i--, 1);
    }
  }
  return a;
}


// recursively updates upper tags' subtree_tags to include the new tag
var update_subtree_tags_top = async function(newtagList, parentId) {
  return new Promise(async function(resolve,reject) {
    syncfindOneById(parentId).then((parent) => {
      var updated_tags = [];
      var promise_loop = newtagList.map(async function (newtag) {
        if (parent.subtree_tags.indexOf(newtag) == -1) {
          return parent.subtree_tags.push(newtag);
        }
      });
      Promise.all(promise_loop).then((res) => {
        parent.save((err) => {
          if (err) throw err;
        });
      });
      parent.parentId.forEach(function(parId) {
        updated_tags.concat(update_subtree_tags_top(newtagList, parId));
      });
      resolve(updated_tags);
    }).catch((err) => {
      reject(err+'\nholyshitthisshouldneverhavehappenedomg... see database.js');
    });
  });
};










router.post('/', adminsecured(), async function(req, res, next) {
  var abc = await syncfindOne('Schule');
  console.log(util.inspect(abc, false, null, true))
  console.log(util.inspect(abc.subtree_tags, false, null, true))
  res.render('database/db_index', {});
});

router.post('/overview_tags', adminsecured(), function(req,res,next) {
  res.render('database/overview_tags', {})
});

router.post('/manage_tags', adminsecured(), function(req,res,next) {
  res.render('database/manage_tags', {})
});





// html site for form to create new tag
router.post('/create_tags', adminsecured(), function(req,res,next) {
  Hierarchy.find().then(function(result) {
    //console.log(util.inspect(result, false, null, true))
    tagList = get_tags(result);
    res.render('database/create_tags', {tagList: tagList, create_error: [req.session.error] });
    req.session.error = undefined;
  }).catch(function(err) {
    if (err) throw err;
  });
});








// check if input is valid and if so, create new tag in database, set relationships
router.post('/engrave_new_tag', adminsecured(), async function(req,res,next) {

  // check if tag already exists
  var tag_pls = await syncfindOne(req.body.tag_name);
  if (tag_pls != null) {
    req.session.error = 'ERROR: Tag already exists';
    res.redirect(307, '/database/create_tags');
    return;
  }

  console.log('Someone tries to add a new tag: '+req.body.tag_name);
  console.log('Parent tags: '+util.inspect(req.body.parent_tags, false, null, true));
  console.log('Child tags: '+util.inspect(req.body.child_tags, false, null, true));

  parent_tags = my.convert2array(req.body.parent_tags);
  child_tags = my.convert2array(req.body.child_tags);

  Hierarchy.find().then(async function(result) {
    tagList = get_tags(result);

    // check if any parent tag is also child tag => error
    if (two_arrays_same_element(parent_tags,child_tags)) {
      console.log('PARENT EQUALED CHILD OMG OMG');
      res.render('database/create_tags', {tagList: tagList,
        create_error: 'ERROR: No tag can be parent and child at the same time',})
      return;
    }

    var newtag = new Hierarchy({ tag: req.body.tag_name });

    // get parentIds to save in new tag db entry
    var promises_parent = parent_tags.map(async function(p_tag) {
      return Hierarchy.findOne({ tag: p_tag})
        .then((db_parent_tag) => {
          //console.log(util.inspect(db_parent_tag, false, null, true))
          newtag.parentId.push(db_parent_tag._id);
          return 1;
        }).catch((err) => {
          console.log('ERROR: STARTED SOMETHING I SHOULDNT START');
          return 'ERROR: parent tag '+p_tag+' was not found in hierarchy!';
        });
    });

    // check if all child_tags are valid/existing
    var promises_child1 = child_tags.map(async function(c_tag) {
      return Hierarchy.findOne({ tag: c_tag })
      .then((db_child_tag) => {
        return 1;
      }).catch((err) => {
        return 'ERROR: child tag '+c_tag+' was not found in hierarchy!';
      });
    });

    //update parentIds for those child_tags
    var promises_child2 = child_tags.map(async function(c_tag) {
      return Hierarchy.findOne({ tag: c_tag })
      .then((db_child_tag) => {
        console.log('Updating child >'+db_child_tag.tag+'< with new parent >'+newtag.tag+'<');
        db_child_tag.parentId.push(newtag._id);
        db_child_tag.save(function(err) {
          if (err) {
            console.log(err);
            return err;
          }
        });
        return 1;
      });
    });

    //to only render once, we execute promises one after another (like sync code)
    Promise.all(promises_parent).then((trutha) => {
      trutha = shorten(trutha);
      return trutha;
    }).then((trutha) => {
      Promise.all(promises_child1).then((trutha2) => {
        trutha2 = shorten(trutha2);
        return trutha.concat(trutha2);
      }).then((trutha) => {
        if (!trutha.some(isNaN)) {          // some error in the first 2 lines -> abort the db_save

          Promise.all(promises_child2).then((trutha2) => {
            trutha2 = shorten(trutha2);
            return trutha2;
          }).then((trutha) => {
            if (trutha.some(isNaN)) {
              req.session.error = trutha;
              res.redirect(307,'/database/create_tags');
            } else {

              // concatenate all child subtree_tags for new tag
              var promise_subtree_children = child_tags.map(async function(child_tag) {
                var c_t = await syncfindOne(child_tag);
                return c_t.subtree_tags;
              })

              Promise.all(promise_subtree_children).then((subtree_tag_doubleList) => {
                var newtag_subtree_tags = [];
                var promise_helper = subtree_tag_doubleList.map(async function(subtree_tags) {
                  return arrayUnique(newtag_subtree_tags.concat(subtree_tags));
                });

                Promise.all(promise_helper).then(async function(finished_subtree_tags) {

                  var stree = await new Promise(function(resolve,reject) {
                    var lastarray = [newtag.tag];
                    for (i=0;i<finished_subtree_tags.length;i++) {
                      lastarray = lastarray.concat(finished_subtree_tags[i]);
                    }
                    resolve(arrayUnique(lastarray));
                  });
                  newtag.subtree_tags = stree;

                  
                  // update subtree_tags in all upper relationships
                  var promises_subtree_update = newtag.parentId.map(async function(parId) {
                    return update_subtree_tags_top(stree,parId);
                  });

                  // if pointers of new tag got done without errors, update subtree_tags of all tags of paths to the root
                  Promise.all(promises_subtree_update).then((result) => {


                    newtag.save(function(err) {
                      if (err) {
                        console.log('\nERROR: Could not create tag >'+newtag+'<\n');
                      } else {
                        console.log('FINISHED good');
                        req.session.error = ['Tag created succesfully, database updated.'];
                        res.redirect(307,'/database/create_tags');
                      }
                    });
                  }); 
                })
              });
            }
          });

        } else {
          console.log('Some error in the db checks.');
          req.session.error = trutha;
          res.redirect(307,'/database/create_tags');
        }
      });
    });
      
    
    
  }).catch(function(err) {
    if (err) throw err;
  });
});

router.post('/delete_tags', adminsecured(), function(req,res,next) {
  res.render('database/delete_tags', {})
});


module.exports = router;