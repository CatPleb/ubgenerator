var Exercises = require('./exercises_model');


module.exports = function Cart(oldCart) {
  this.items = oldCart.items || {};
  this.totalQty = oldCart.totalQty || 0;

  this.add = function(item, id) {
    var storedItem = this.items[id];
    if (!storedItem) {
      storedItem = this.items[id] = {item: item};
      this.totalQty++;
    } else {
      return false;
    }
  };

  this.remove = function(id) {
    var storedItem = this.items[id];
    if (storedItem) {
      delete this.items[id];
      this.totalQty--;
    } else {
      return false;
    }
  }

  this.generateArray = async function() {
    var arr = [];
    for (var id in this.items) {
      db_exercise = await Exercises.findOne({ public_id: id});
      arr.push({
        public_id: db_exercise.public_id,
        name: db_exercise.name,
        packages: db_exercise.packages,
        code: db_exercise.code,
        png: db_exercise.png,
        tags: db_exercise.tags,
      });
    }
    return arr;
  };
};