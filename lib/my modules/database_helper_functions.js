var my = require('./compile_code');
var util = require('util');

var c_n_h = require('./one time/createHierarchy');

var dotenv = require('dotenv');
var result = dotenv.config();
if (result.error) {
  throw result.error;
}

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGOOSE_ADDRESSE, {useNewUrlParser: true});

var Exercises = require('../models/exercises_model');
var Hierarchy = require('../models/hierarchy_model');


/* FUNCTIONS */
// get all tags and save in req.session (mainly for search.js)
exports.tagList = function(req) {
  return new Promise((resolve) => {
    var taglist = [];
    Hierarchy.find(function(err, docs) {
      for (i=0; i<docs.length; i++) {
        taglist.push(docs[i].name);
      }
      req.session.taglist = taglist;
      resolve();
    });
  });
}

// get all .tag of hierarchy.find() results in array
var get_tags = exports.get_tags = function(hierarchy_find_result) {
  tagList = [];
  hierarchy_find_result.forEach(function(tagdic) {
    tagList.push(tagdic.name);
  });
  return tagList;
};

// checks if 2 arrays have the same element
function two_arrays_same_element(arr1, arr2) {
  for (i=0;i<arr1.length;i++) {
    for (j=0;j<arr2.length;j++) {
      if (arr1[i].localeCompare(arr2[j]) == 0) {
        return true;
      }
    }
  }
  return false
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

// check if tag already exists in collection hierarchy
async function already_exists(tag_name) {
  var tag_pls = await Hierarchy.findOne({name: tag_name});
  if (tag_pls != null) {
    return true;
  }
  return false;
}

// check if new entry creates circle in hierarchy
async function going_to_create_cycle(parent_tags,child_tags) {
  for (i=0;i<child_tags.length;i++) {
    db_child = await Hierarchy.findOne({name:child_tags[i]});
    if (two_arrays_same_element(db_child.subtree_tags,parent_tags)) {
      return true;
    }
  }
  return false;
}

// check if all inputs are valid
async function check_validity_of_input(tag_name,parent_tags,child_tags) {
  // check if all inputed tags exist
  if (await already_exists(tag_name)) {
    return [false,'ERROR: Tag already exists'];
  }
  for (i=0;i<parent_tags.length;i++) {
    if ((parent_tags[i] == null) || (!await already_exists(parent_tags[i]))) {
      return [false,'ERROR: Parent-Tag you selected does not exist anymore'];
    }
  }
  for (i=0;i<child_tags.length;i++) {
    if ((child_tags[i] == null) || (!await already_exists(child_tags[i]))) {
      return [false,'ERROR: Child-Tag you selected does not exist anymore'];
    }
  }
  // check for same tag as parent and child
  if (two_arrays_same_element(parent_tags,child_tags)) {
    return [false,'ERROR: Same tag as parent and child'];
  }
  // check if new entry creates circle in hierarchy
  if (await going_to_create_cycle(parent_tags,child_tags)) {
    return [false,'ERROR: Your input would have created a cycle in the hierarchy!'];
  }
  return [true,];
}

// get parentIds so save in newtag db entry as .parentIds
async function get_parent_ids(parent_tags) {
  parent_ids = [];
  db_parent_objects = await Hierarchy.find({ name: {$in: parent_tags} });
  db_parent_objects.map((parent) => {
    parent_ids.push(parent._id);
  });
  return parent_ids;
}

// add newtag._id as new parentid for all child_tags
async function update_parentIds_for(child_tags, newtag) {
  for (i=0;i<child_tags.length;i++) {
    db_child = await Hierarchy.findOne({name: child_tags[i]});
    db_child.parentId.push(newtag._id);
    await db_child.save().then((res,err) => {
      if (err) {
        throw new Error("ERROR: Couldn't save child db object in update_parentIds_for().\n\n OG error: "+err);
      }
      return;
    })
  }
}

// create subtree_tags for newtag
async function combine_child_subtrees_and_save_subtree_for_newtag(newtag, child_tags) {
  var newsubtree_tags = [newtag.name];
  for (i=0;i<child_tags.length;i++) {
    db_child = await Hierarchy.findOne({name:child_tags[i]});
    newsubtree_tags = newsubtree_tags.concat(db_child.subtree_tags);
  }
  newsubtree_tags = arrayUnique(newsubtree_tags);
  newtag.subtree_tags = newsubtree_tags;
}

// recursively update .subtree_tags for all tags on path to root
async function update_subtree_tags_for_parents(newtag, parent_tags) {
  for (i=0;i<parent_tags.length;i++) {
    var db_parent = await Hierarchy.findOne({name: parent_tags[i]});
    db_parent.subtree_tags = arrayUnique(db_parent.subtree_tags.concat(newtag.subtree_tags));
    await db_parent.save();
    var new_parents = get_tags(await Hierarchy.find({_id: {$in: db_parent.parentId} }));
    await update_subtree_tags_for_parents(newtag, new_parents);
  }
}



exports.check_and_engrave = async function(tag_name, og_parent_tags, og_child_tags) {
  
  var parent_tags = my.convert2array(og_parent_tags);
  var child_tags = my.convert2array(og_child_tags);

  // check if input is valid
  check = await check_validity_of_input(tag_name,parent_tags,child_tags);
  if (!check[0]) {
    return check;
  }
  try {
    var newtag = new Hierarchy({ name: tag_name });

    // get parentIds to save in new tag db entry
    parent_ids = await get_parent_ids(parent_tags);
    newtag.parentId = parent_ids;

    // update parentIds for all child_tags in db
    await update_parentIds_for(child_tags, newtag);

    // create subtree_tags for newtag by combining subtrees of childs
    await combine_child_subtrees_and_save_subtree_for_newtag(newtag, child_tags);

    // recursively update all parent_tags' .subtree_tags
    await update_subtree_tags_for_parents(newtag, parent_tags);

    // save changes in db
    await newtag.save();

    return([true,'all good']);
  } catch(err) {
    return([false,'ERROR: Error while saving tag into database!'
    +'Very bad, inform developer and stop creating new tags!\nOriginal Error: '+err])
  }
}



// go through subtree_tags of deleted_tag and set .parentId to deleted_tags.parentId,
// if it equals deleted_tags._id
async function delete_tag_as_parent(db_delete_tag) {
  var check = false;
  for (i=0;i<db_delete_tag.subtree_tags.length;i++) {
    var db_subtag = await Hierarchy.findOne({ name:db_delete_tag.subtree_tags[i] });
    for (j=0;j<db_subtag.parentId.length;j++) {
      if (db_subtag.parentId[j].equals(db_delete_tag._id)) {
        await db_subtag.parentId.splice(j,1);
        j = j-1;
        check = true;
      }
    }
    if (check == true) {
      db_subtag.parentId = arrayUnique(db_subtag.parentId.concat(db_delete_tag.parentId));
      await db_subtag.save();
      check = false;
    }
  }
}

// recursively delete deleted_tag from all .subtree_tags on path to root
async function delete_tag_in_subtree_tags_for_parents(tag_name, parentIds) {
  for (i=0;i<parentIds.length;i++) {
    var db_parent = await Hierarchy.findOne({ _id: parentIds[i] });
    var ind = db_parent.subtree_tags.indexOf(tag_name)
    if ( ind >= 0 ) {
      db_parent.subtree_tags.splice(ind,1);
      await db_parent.save();
    }
    await delete_tag_in_subtree_tags_for_parents(tag_name, db_parent.parentId);
  }
}



var check_and_kill = exports.check_and_kill = async function(tag_name) {

  if (! await already_exists(tag_name)) {
    return [false,'ERROR: Selected tag does not exist in database.'];
  }

  try{
    db_delete_tag = await Hierarchy.findOne({ name:tag_name });

    // delete tag_name._id as parent for all children of tag_name
    await delete_tag_as_parent(db_delete_tag);

    // delete tag_name in .subtree_tags of tags on path to root (parents)
    await delete_tag_in_subtree_tags_for_parents(tag_name, db_delete_tag.parentId);

    await db_delete_tag.remove();

    return [true,'kill completed'];
  } catch (err) {
    return([false,'ERROR: Error while deleting tag into database!'
    +'Very bad, inform developer and stop deleting tags!\nOriginal Error: '+err])
  }
}