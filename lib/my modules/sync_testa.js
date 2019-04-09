var dotenv = require('dotenv');
var result = dotenv.config();
if (result.error) {
  throw result.error;
}

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE, {useNewUrlParser: true});

var Exercises = require('../models/exercises_model');
var Hierarchy = require('../models/hierarchy_model');



async function rec(num, arr) {
  if (num <= 0) return 0;
  console.log(num);
  var promise_arr = arr.map(async function(ent) {
    var promise_h = Hierarchy.find();
    res = await promise_h;
    await rec(num-1,arr);
  });
  await Promise.all(promise_arr).then(() => {
    return true;
  });
}

async function stuffa() {
  arr = [0,1];
  await rec(5,arr)
  console.log('done');
}

stuffa();

/*
async function stuffa() {
  console.log('start');

  var arr = [0,1,2,3,4,5,6];

  var promise_arr = arr.map((ent) => {
    fn(ent);
    return Hierarchy.find().then((res) =>{
      console.log('Hierachy: '+ent);
      return true;
    });
  });

  await Promise.all(promise_arr).then((res) => {
    console.log(res);
  });

  console.log('omg');
  Hierarchy.find().then((res) => {
    console.log(promise_arr);
  })
  console.log('done');
}

stuffa(); */