MetaHub.import_all(); 

var fired = false;

function fire() {
  fired = true;
}

function test_fire(target, event) {
  fired = false;
  var object = Meta_Object.create();
  object.listen(target, event, fire);
}

var A = Meta_Object.sub_class('A', {
  initialize: function(action) {
    if (action)
      action('A');
  },
  method: function() {
    return 'a';
  },
  property: 25,
  future_method: 'empty'
});

var B = A.sub_class('B', {
  initialize: function(action) {
    if (action)
      action('B');
  },
  property: 50,
  own_method: function() {
    return 'b';
  },
  future_method: function() {
    return 'b';
  }
});

$(function(){
     
  test("MetaHub.extend", function() {    
    var common = {};
    var source = {
      nothing: null,
      common: common
    };
    
    var target = { };

    MetaHub.extend(target, source);
    equal(target.nothing, null, "target.nothing is null");
    notStrictEqual(source.common, target.common, "MetaHub.extend should clone property objects");    
  });
  
  test("Meta_Object.inheritance", function() {
    var order_check = [];
    function order(name) {
      order_check.push(name);
    }
    var b = B.create(order);
    ok(b.method, 'Object b inherits methods from parent class A');
    ok(b.own_method, 'Object b gains methods from class B');
    ok(order_check[0] == 'A' && order_check[1] == 'B', 'Initialize functions are firing in the correct order.');
//    ok(typeof b.future_method == 'function', 'Object b successfully replaced a property with a function');
  });
  
  test("Meta_Object.connections", function() {    
    var parent = Meta_Object.create();
    var child = Meta_Object.create();

    parent.connect(child, 'child', 'parent');
    
    notEqual(parent.internal_connections, null, "Parent should have a connection list.");    
    equal(Object.size(parent.internal_connections), 1, "Parent should have one connection.");
    //    equal(parent.connection(child).type, 'child', 'Parent connection type should be "child"');
    equal(parent.get_connections('child').length, 1, "Parent should have one child.");
    
    test_fire(parent, 'disconnect.child');
    parent.disconnect(child);
    
    ok(fired, "disconnect.child was fired")
    equal(parent.get_connections('children').length, 0, 'Parent should have no more children');
    equal(child.parent, null, "child should have no parent"); 
  });
  
  test("MetaHub.disconnect_all", function() {    
    var a = Meta_Object.create();
    fired = false;
    a.listen(a, 'disconnect-all', function() {
      fired = true;
    });
    
    a.disconnect(a);
    equal(fired, false, 'Meta_Object ignores disconnect-all when disconnecting self');
  });
    
  test("MetaHub - complex disconnect", function() {    
    var a = Meta_Object.create();
    var b = Meta_Object.create();
    var c = Meta_Object.create();

    a.connect(b, 'letter');
    a.connect(c, 'letter');
    c.listen(c, 'disconnect.letter', function() {
      b.disconnect(a);
    });
    
    c.disconnect_all();
    equal(a.internal_connections.length, 0, 'a has no connections');
    equal(b.internal_connections.length, 0, 'b has no connections');
    equal(c.internal_connections.length, 0, 'c has no connections');
  });
  
  //  test("Metal_Object.connections - Change type name", function() {    
  //    var first = Meta_Object.create();
  //    var second = Meta_Object.create();
  //    first.connect(second, 'first', 'second');
  //    first.connect(second, 'a', 'b');
  ////    equal(first.connection(second).type, 'a', 'First connection was properly modified');
  ////    equal(second.connection(first).type, 'b', 'Second connection was properly modified');
  //  });
    
  test("Metal_Object - Queries", function() {    
    var first = Meta_Object.create();
    var second = Meta_Object.create();
    first.connect(second, 'item', 'b');
    first.define_connection_getter("items", "item");
    first.define_connection_getter("bananas", "item");
    deepEqual(first.items()[0], second, "Generated Query returned connected item");
    deepEqual(first.bananas()[0], second, "Generated Query did not return connected item");
  });
      
  test("MetaHub - listen", function() {    
    var first = Meta_Object.create();
    var second = Meta_Object.create();
    first.connect(second, 'first', 'second');
    fired = false;
    first.listen(second, 'do-something', function() {
      fired = true;
    });
    
    first.disconnect(second);
    second.invoke('do-something');
    equal(fired, false, "Disconnect did not leave hanging events.");
  });

  test("Metal_Object.create", function() {
    var finished = false;
    var Test_Object = Meta_Object.sub_class('Test_Object', {
      initialize: function(action) {
        this.__create_finished = action;
      }
    });
    
    Test_Object.create(function() {
      finished = true;
    });
    
    equal(finished, true, "Passed finished method was called.")
  });
});
