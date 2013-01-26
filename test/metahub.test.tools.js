MetaHub.Meta_Object.initialize = function(object) {
  var args = Array.prototype.slice.call(arguments);  
  args.shift();
  this.properties.initialize.apply(object, args);
}