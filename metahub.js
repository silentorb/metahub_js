
var MetaHub = (function () {
  'use strict';
  
  // Don't overwrite an existing implementation
  if (typeof Object.getOwnPropertyNames !== "function") {
    Object.getOwnPropertyNames = function (obj) {
      var keys = [];

      // Only iterate the keys if we were given an object, and
      // a special check for null, as typeof null == "object"
      if (typeof obj === "object" && obj !== null) {    
        // Use a standard for in loop
        for (var x in obj) {
          // A for in will iterate over members on the prototype
          // chain as well, but Object.getOwnPropertyNames returns
          // only those directly on the object, so use hasOwnProperty.
          if (obj.hasOwnProperty(x)) {
            keys.push(x);
          }
        }
      }

      return keys;
    }
  }

  Array.remove = function(array, item) {
    // Make sure someone isn't using 'in' to loop through an array
    if (typeof array.indexOf != 'function')
      return;

    var index = array.indexOf(item)
    if (index != -1)
      array.splice(index, 1);
  }
  
  Object.has_properties = function(obj) {   
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) 
        return true;
    }
    return false;
  };
  
  Object.is_array = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }
  
  Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  };

  function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  }

  var MetaHub = {
    extend: function(destination, source, names) {
      var info;
      
      if (typeof source == 'object' || typeof source == 'function') {
        if (names == null)
          names = Object.getOwnPropertyNames(source);
      
        for (var k = 0; k < names.length; ++k) {
          var name = names[k];
          if (source.hasOwnProperty(name)) {
            if (typeof Object.getOwnPropertyDescriptor == 'function') {
              info = Object.getOwnPropertyDescriptor(source, name);
                            
              //              getter / setter
              if (info.get) {
                Object.defineProperty(destination, name, info);
                continue;
              }
            }
            
            if (source[name] === null)
              destination[name] = null;
            else if (Object.is_array(source[name]) && source[name].length == 0)
              destination[name] = [];
            else if (typeof source[name] == 'object' && !Object.has_properties(source[name]))
              destination[name] = {};
            else
              destination[name] = source[name];
          //              else
          //                info.value = source[name];
              
          //              Object.defineProperty(destination, name, info);
          //            }
          }
        }
      }
      return destination;
    },
    // Pseudo GUID
    guid: function () {
      return S4()+S4()+"-"+S4()+"-"+S4();
    },
    clone: function(source, names) {
      var result = {};
      MetaHub.extend(result, source, names);
      return result;
    },
    deep_clone: function(source) {
      return jQuery.extend(true, [], source);
    },
    deep_extend: function(target, source) {
      return jQuery.extend(true, target, source);
    },
    get_connection: function(a, b) {
      for (var x = 0; x < a.internal_connections.length; x++) {
        if (a.internal_connections[x].other === b) {
          return a.internal_connections[x];
        }
      }

      return null;
    }
  };
  
  MetaHub.current_module = MetaHub;
  
  MetaHub.extend_methods = function(destination, source) {
    if (typeof source == 'object' || typeof source == 'function') {
      for (var k in source) {
        if (source.hasOwnProperty(k) && typeof source[k] == 'function') {
          destination[k] = source[k];
        }
      }
    }
    return destination;
  }
  
  MetaHub.get_variables = function(source) {
    var result = {};
    if (typeof source == 'object' || typeof source == 'function') {
      for (var k in source) {
        if (source.hasOwnProperty(k) && typeof source[k] != 'function') {
          result[k] = source[k];
        }
      }
    }
    return result;
  }
    
  MetaHub.metanize = function(target) {
    if (target.is_meta_object)
      return target;
    
    target.original_properties = Object.getOwnPropertyNames(target);
    MetaHub.extend(target, Meta_Object.properties);
    if (typeof target.__proto__ !== 'undefined') {
      target.__proto__ = Meta_Object.methods;
    }
    else {
      MetaHub.extend(target, Meta_Object.methods);
    }
    target.guid = MetaHub.guid();
    return target;
  }

  MetaHub.serialize = function(source){
    if(source.original_properties) {
      var temp = {};
      MetaHub.extend(temp, source, source.original_properties);
      return JSON.stringify(temp);
    //return JSON.stringify(source, source.original_properties);
    }
    else {
      return JSON.stringify(source);
    }
  };
      
  var Meta_Object = MetaHub.Meta_Object = {
    name: 'Meta_Object',
    parent: null,
    children: [],
    subclass: function (name, data) {
      var result = {};
    
      MetaHub.extend_methods(result, this);
      result.name = name;
      result.parent = this;
      this.children.push(result);
      result.children = [];
      result.methods = Object.create(this.methods);
      MetaHub.extend_methods(result.methods, data);
      result.properties = MetaHub.get_variables(data);
      if (!MetaHub.current_module.classes)
        MetaHub.current_module.classes = {};
      MetaHub.current_module.classes[name] = result;
      MetaHub.current_module[name] = result;
    
      return result;
    },
    initialize_properties: function(object) {
      if (this.parent)
        this.parent.initialize_properties(object)
    
      MetaHub.extend(object, this.properties);
    },
    // Due to limititations with Javascript prototypes, there is no easy
    // way to use this hybrid prototype system and override a property
    // with a function.  I could eventually write a deep check of the hierarchy
    // to manually copy the function, but that would be expensive, so for now
    // abstract function stubs should either be dummy functions or left undefined.
    initialize_methods: function(object, types, args) {      
      if (this.methods.hasOwnProperty('initialize')) {
        types.push(this);
      }
       
      return this.initialize_queue(object, types, args);   
    },  
    initialize_queue: function (object, types, args) {
      var temp = types.slice(0);
      for (var x = types.length; x > 0; x--) {
        if (types.length == 0)
          return [];
        
        var type = types.pop();
        type.methods.initialize.apply(object, args);        
        if (object.$pause) {
          return [];
        }        
      }  
 
      return types;
    },
    create: function() {
      var result = this.create_without_initializing();
      // IE < 9 doesn't seem to like overriding toString() 
      // in the list of properties, so override it here.
      result.toString = function() {
        return this.meta_source + ":" + this.guid;
      };
      var parameters = Array.prototype.slice.call(arguments);
      var current = this, types = [], i;
      var chain = [];
      // We need an array that starts with the base parent and works its
      // way to the the current class.
      while (current != null) {
        chain.unshift(current);
        current = current.parent;
      }
      
      // Now use that array to fire each class initialization function
      for (i = 0; i < chain.length; i++) {
        types = chain[i].initialize_methods(result, types, parameters);
      }
      
      if (result.__create_finished !== undefined) {
        if (typeof result.__create_finished == 'function') {
          result.__create_finished(result);
        }
        
        delete result.__create_finished;
      }
      
      return result;
    },
    create_without_initializing: function() {
      var result = Object.create(this.methods);
      this.initialize_properties(result);
      result.type = this;
      result.meta_source = this;
      result.guid = MetaHub.guid();
      return result;
    },
    change_parent: function(target, new_parent, type) {
      var parents = target.get_connections('parent');
      target.connect(new_parent, 'parent', type);
      for (var x = 0; x < parents.length; x++) {
        target.disconnect(parents[x]);
      }
    },
    connect_objects: function(first, other, type) {
      var connection = MetaHub.get_connection(first, other);
      if (connection) {
        if (connection.type != type && type) { 
          connection.type = type;
          return true;
        }
         
        return false;
      }
      
      if (type === 'parent')
        first.parent = other;
      
      connection = Meta_Connection.create(first, other, type);
      first.internal_connections.push(connection);
      return true;
    },
    disconnect_objects: function(first, other) {
      var connection = MetaHub.get_connection(first, other);
      if (connection) {
        var type = connection.type;
        Array.remove(first.internal_connections, connection);
        
        for (var event in other.events) {
          first.unlisten(other, event);
        }
        
        connection.parent = null;
        connection.other = null;
      
        first.invoke('disconnect.' + type, other, first);
          
        if (connection.type === 'parent') {
          var parents = first.get_connections('parent');
          if (parents.length == 0) {
            delete first.parent;
            if (!first.__disconnecting_everything) {
              first.disconnect_all();
            }
          }
          else {
            first.parent = parents[0];
          }
        }
      //          else if (Object.keys(first.internal_connections).length == 0) {
      //            first.disconnect_all();
      //          }
      }   
    },
    get_instance_property: function(name) {
      if (this.properties.hasOwnProperty(name))
        return this.properties[name];
      else if (this.type)
        return this.type.get_instance_property(name);
      
      return null;
    },
    has_property: function(target, name) {
      var x, names = name.split('.');
      for (x = 0; x < names.length; x++) {
        if (!target.hasOwnProperty(names[x]))
          return false;
      
        target = target[names[x]];
      }
    
      return true;
    },
    invoke_binding: function(source, owner, name) {
      if (!owner.events[name])
        return;
      
      var args = Array.prototype.slice.call(arguments, 3);
      var info = owner.events[name], length = info.length;
      for (var x = 0; x < length; ++x) {
        var binding = info[x], listener = binding.listener;
        // Check that listener is not null in case something is 
        // disconnected midloop
        if (listener !== source && listener) {
          binding.method.apply(listener, args);
        }
      }
    },
    is_source: function(meta_object) {  
      var x = 0, source = meta_object.meta_source;
      do {
        if (source == this) {
          return true;
        }
        if (x++ > 100) {
          throw new Error('Infinite Recursion for checking if ' + meta_object.meta_source + ' is a ' + this.name + '.');
        }
      } while (source = source.parent);
      
      return false;
    },
    override: function(name, new_property) {
      this.properties[name] = new_property;
      for (var x = 0; x < this.children.length; x++) {
        this.children[x].override(name, new_property);
      }
    },
    deep_value: function(name, value, source) {
      var x, target = this, names = name.split('.');
      
      for (x = 0; x < names.length - 1; x++) {
        target = target[names[x]];
      }
      
      var property = names[names.length - 1];
      if (value === undefined || value === target[property])
        return target[property];
      
      var old_value = this[property]
      target[property] = value;
      Meta_Object.invoke_binding(source, this, 'change.' + name, value, old_value);
      Meta_Object.invoke_binding(source, this, 'change', name, value, old_value);
      return value;
    },
    value: function(name, value, source) {
      if (value === undefined || value === this[name])
        return this[name];
      
      var old_value = this[name]
      this[name] = value;
      Meta_Object.invoke_binding(source, this, 'change.' + name, value, old_value);
      Meta_Object.invoke_binding(source, this, 'change', name, value, old_value);
      return value;
    },
    value_function: function(owner, name, initial_value) {
      var internal_value = initial_value;
      owner[name] = function(value, source) {
        if (value !== undefined && value !== this[name]) {      
          internal_value = value;
          Meta_Object.invoke_binding(source, owner, 'change.' + name, value);
          Meta_Object.invoke_binding(source, owner, 'change', name, value);
        }        
        return internal_value;
      };      
    },
    properties: {
      is_meta_object: true,
      events: {},
      internal_connections: []
    },
    methods: {
      extend: function(source, names) {
        MetaHub.extend(this, source, names)
      },
      toString: function() {
        return this.meta_source + ":" + this.guid;
      },
      listen: function(other, name, method, one_time) {
        if (other !== this) {
          if (!other.is_meta_object) {      
            this.connect(other);
          }
        }
    
        if (other.events[name] == null)
          other.events[name] = [];      
        
        var event = {
          method: method,
          listener: this
        }
        
        if (one_time) {
          event.method = function() {
            Array.remove(other.events[name], event);
            method.apply(this, Array.prototype.slice.call(arguments));
          }
        }
        
        other.events[name].push(event);
      },
      unlisten: function(other, name) {
        if (other.events[name] == null)
          return;
      
        var list = other.events[name];
        for (var i = list.length - 1; i >= 0; --i) {
          if (list[i].listener === this) {
            list.splice(i, 1);  
          }
        }
      
        if (list.length == 0) {
          delete other.events[name];
        }
      },
      invoke: function(name) {        
        if (!this.events[name])
          return;
      
        var args = Array.prototype.slice.call(arguments, 1);
        var info = this.events[name];
        for (var x = 0; x < info.length; ++ x) {          
          info[x].method.apply(info[x].listener, args);
        }
      },
      gather: function(name) {
        var args = Array.prototype.slice.call(arguments, 1);
        if (!this.events[name])
          return args[0];
      
        var info = this.events[name];
        for (var x = 0; x < info.length; ++ x) {          
          args[0] = info[x].method.apply(info[x].listener, args);
        }        
        return args[0];
      },
      connect:function(other, type, other_type){
        if (other_type == undefined)
          other_type = type;

        if (!other.is_meta_object)
          return;

        // The process_connect function can be added to a Meta_Object
        // to intercept potential connections
        if (typeof this.process_connect == 'function') {
          if (this.process_connect(other, type, other_type) === false) {
            return;
          }
          else if (typeof other.process_connect == 'function') {
            if (other.process_connect(this, other_type, type) === false) {
              return;
            }
          }
        }
        
        if (!Meta_Object.connect_objects(this, other, type, other_type)) {
          return;
        }
        
        Meta_Object.connect_objects(other, this, other_type, type);        

        this.invoke('connect.' + type, other, this);
        other.invoke('connect.' + other_type, this, other);
      },
      disconnect: function(other){
        Meta_Object.disconnect_objects(this, other);
        Meta_Object.disconnect_objects(other, this);
      },
      disconnect_all: function(type) {        
        if (type == undefined) {
          // This is set to prevent repeated calls to disconnect_all.
          this.__disconnecting_everything = true;
          for (var x = this.internal_connections.length - 1; x >= 0; --x) {            
            this.disconnect(this.internal_connections[x].other);
          }
          this.internal_connections = [];
          this.invoke('disconnect-all', this);
        }
        else{
          var connections = this.get_connections(type);
          for (var x = connections.length - 1; x >= 0; --x) {
            this.disconnect(connections[x]);
          }
        }
        
        delete this.__disconnecting_everything;
      },
      is_listening: function(other, name) {
        if (!other.is_meta_object)
          return false;
      
        for(var x in other.events[name]) {
          if (other.events[name][x].listener === this)
            return true;
        }
        return false;
      },
      // This function is long and complicated because it is a heavy hitter both in usefulness
      // and performance cost.
      get_connections: function() {
        var x, filters = Array.prototype.slice.call(arguments);
        var first_filter = filters.shift();

        var result = [];
        if (typeof first_filter == 'string') {          
          for (x = 0; x < this.internal_connections.length; x++) {          
            if (this.internal_connections[x].type == first_filter) {
              result.push(this.internal_connections[x].other);
            }
          }
        }
        else if (typeof first_filter == 'function') {
          for (x = 0; x < this.internal_connections.length; x++) {
            if (first_filter(this.internal_connections[x].other)) {
              result.push(this.internal_connections[x].other);
            }
          }
        }
        
        for (var f = 0; f < filters.length; f++) {
          var filter = filters[f];
          
          if (typeof filter == 'string') {
            for (var x = result.length - 1; x >= 0; x--) {
              if (this.internal_connections[result[x]].type != filter) {
                result.splice(x, 1);
              }
            }           
          }
          else if (typeof filter == 'function') {
            for (var x = result.length - 1; x >= 0; x--) {
              if (!filter(result[x])) {
                result.splice(x, 1);
              }
            }
          }
        }
        
        return result;
      },
      get_connection: function(filter) {
        return this.get_connections(filter)[0];
      },
      define_connection_getter: function(property_name, connection_name) {        
        this[property_name] = function(filter) {
          return this.get_connections(connection_name, filter);
        };
      },
      define_object: function(property_name, connection_name) {    
        var property = {};
        this[property_name] = property;
          
        this.listen(this, 'connect.' + connection_name, function(item) {
          property[item.name] = item;
        });

        this.listen(this, 'disconnect.' + connection_name, function(item) {
          delete property[item];
        });
      },
      optimize_getter: function(property_name, connection_name) {    
        var array = [];
        this[property_name] = array;
          
        this.listen(this, 'connect.' + connection_name, function(item) {
          array.push(item);
        });

        this.listen(this, 'disconnect.' + connection_name, function(item) {
          Array.remove(array, item);
        });
      },
      new_value: function(name, initial_value, process) {
        var self = this
        var internal_value = initial_value;
        Object.defineProperty(this, name, {
          get: function() {
            return internal_value;
          },
          set: function(value) {      
            if (typeof process == 'function') {
              value = process.call(self, value);
            }
    
            if (value != internal_value) {
              internal_value = value;
              Meta_Object.invoke_binding(null, self, 'change.' + name, value, self);
              Meta_Object.invoke_binding(null, self, 'change', name, value, self);
            }
          }    
        }); 
      },
      parent_method: function(method_name) {
        var args = Array.prototype.slice.call(arguments, 1);
        this.meta_source.parent.methods.update.apply(this, args);
      }
    }  
  };
  
  Meta_Object.sub_class = Meta_Object.subclass;
  
  var Meta_Connection = {
    other: null,
    parent: null,
    type: '',
    create: function(parent, other, type){
      var result = MetaHub.clone(Meta_Connection);
      result.parent = parent;
      result.other = other;
      result.type = type;
      return result;
    }
  //    ,
  //    disconnect: function() {
  //      if (this.parent.internal_connections[this.other]) {
  //        if (this.parent)
  //          delete this.parent.internal_connections[this.other];
  //      }
  //      
  //      if (this.other_connection()){
  //        var other = this.other;
  //        var parent = this.parent;
  //        this.parent = null;
  //        this.other = null;
  //        other.disconnect(parent);
  //      }
  //      else {
  //        this.parent = null;
  //        this.other = null;
  //      }
  //    },    
  //    other_connection: function() {
  //      if (!this.other)
  //        return null;
  //      
  //      return this.other.internal_connections[this.parent];
  //    }
  };
  
  var Meta_Value = Meta_Object.subclass('Meta_Value', {
    initialize: function(value) {
      this.internal_value = value;
    }
  });
  
  try {
    Object.defineProperty(Meta_Value.properties, "value", {
      get: function() {
        return this.internal_value;
      },
      set: function(value) {
      
        if (typeof this.constrain == 'function') {
          value = this.constrain(value);
        }
    
        if (value != this.internal_value) {
          this.internal_value = value;
          this.invoke('change', value);
        }
      }    
    });
  }
  catch (exception) {    
  }
  
  MetaHub.Meta_Value = Meta_Value;
  
  var Global;
  if (typeof window != 'undefined')
    Global = window;
  else
    Global = global;  
  
  MetaHub.Global = Global;

  MetaHub.import_members = [ 'Meta_Object', 'Meta_Connection', 'Meta_Value' ];
  
  MetaHub.import_all = function() {
    MetaHub.extend(Global, MetaHub, MetaHub.import_members);
  }

  if (typeof module != 'undefined') {
    module.exports = MetaHub;
  }
  
  MetaHub.node_module = function(local_module, module_function) {
    MetaHub.current_module = {};
    module_function();
    local_module.exports = MetaHub.current_module.classes;
  };
  return MetaHub;
})();