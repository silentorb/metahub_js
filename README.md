MetaHub
=======

MetaHub is a relational class system.

In traditional programming, references are one way. By default, when an entity references another entity, the target entity is not aware that it is being referenced. For example, if a program stores the path to a particular file that it uses for configuration information, and that file is then moved, the program will not know that the file has moved, nor will it know where the file has moved to.

Now what if the file was aware that a program was looking to it for configuration information? If the file was aware of all the programs pointing at it, then when the file was moved it could notify all of those programs about its new location.

While MetaHub does not solve such issues in the file system, it does solve them in general programming. It provides a mechanism by which objects can easily define bidirectional references (known as "connections") to each other.  When something happens to one of these special objects, it can notify any or all of the objects it is connected to.

This bidirectional approach is very powerful, but it is also not as resource efficient as the traditional one-way method.  Because of that, and the fact that most software is not written bidirectional, MetaHub is designed to easily integrate with more traditional programming so that you can smoothly mix the two.  It is not practical to define everything as a MetaHub connection, and MetaHub itself uses both forms of reference.

In MetaHub, a connection is the bidirectional reference between two objects, while a relationship is the data and rules that define how a particular connection behaves.  Type labels are the core of defining relationships.  When two meta_objects are connected, labels are used to categorize how the two meta_objects relate to each other.  For example:

```javascript

hero.connect(sword, 'equipment', 'wielder');
hero.connect(helmet, 'equipment', 'wielder');
hero.connect(doggie, 'sidekick', 'master');

equipment = hero.get_connections('equipment');
```

Here a sword and a helmet are connected to the hero, while the doggie becomes his sidekick.  In traditional programming this would look like:

```javascript

hero.equipment.push(sword);
sword.wielder = hero;
hero.equipment.push(helment);
helment.wielder = hero;
hero.sidekick = doggie;
doggie.master = hero;

equipment = hero.equipment;
```

Aside from syntax, there is a key difference between these two examples. In the traditional approach, *hero.equipment* and *hero.sidekick* would be separate properties of the hero and have no inherent awareness of each other. With MetaHub's *connect()* method, all of the meta_object's connections are stored in a single list.  This allows MetaHub to streamline and automate certain patterns that programmers normally have to do it manually. This is best demonstrated with how MetaHub handles parent-child relationships.

Parents and Children
------------------------------

By themselves connection labels don't do very much.  They become more useful when code such as an event is attached to particular types of connections. MetaHub's core has special rules for handling one particular connection type, and that is the 'parent' label:

```javascript

// Attach flower
flower.connect(garden, 'parent', 'child');

// Detach flower
garden.disconnect(flower);
```

Here, a flower is connected to a garden as the flower's parent, and then the flower is disconnected from the garden. In MetaHub , when a child is disconnected from its parent and the child has no other parent connections, that child is considered deleted and any remaining connections to that child are disconnected. Thus, the proper way to delete a meta_object is:

```javascript

flower.disconnect_all();
```

###Note:
* disconnect_all() is fired when the last 'parent' connection is disconnected.
* disconnect_all() checks to ensure that it does not cause an infinite loop.
* A meta_object does not need to be connected to a parent. The possibility of MetaHub automatically firing disconnect_all() only happens once a parent-child relationship is established.
* It is common for parent-child relationships to be defined as "a.connect(b, 'parent', 'child')", but MetaHub only considers the 'parent' label.  It is perfectly valid to have connections such as "a.connect(b, 'parent', 'item')".
* Two meta_objects can have multiple connections to each other by using different labels.

Meta_Object
=========

The central unit of MetaHub is the Meta_Object.  Programmers use MetaHub by defining their own Meta_Objects. 

A note on conventions:
---------------------------------
In this documentation capitalization is used to distinguish between classes and instances of that class.  "Meta_Object" refers to a class, while "meta_object" refers to an instance.

This is not an exhaustive list of the MetaHub API but contains the primary methods.

## Static Methods

Meta_Object.subclass (name, properties)
-------------------------------------------------------------------

### Arguments
*name*:
Mostly for internal use in MetaHub.

*properties*:
An array of functions and variables that compose the members of the Meta_Object.

### Returns

The newly defined subclass.

### Description

Creates a new Meta_Object. The new class inherits all of the invoked Meta_Object's members.

### Example

```javascript
var Character = Meta_Object.subclass('Character', {
	health: 12,
	race: 'unknown',
	initialize: function(race) {
		this.race = race;
	},
	injure: function(damage) {
		this.health -= damage;
		if (this.health < 1)
        	this.die(); // Not implemented
	}
});
```

Meta_Object.create (*)
-------------------------------------------------------------------

### Arguments

Accepts any number of arguments.  All of these arguments are passed to the new object's __initialize()__ method and inherited  __initialize()__ methods, if any.
.
### Returns

A new meta_object of the invoked Meta_Object type.

### Description

Creates a new meta_object.  If a meta_object has an initialize method, that method is called when the meta_object is instantiated.  The base Meta_Object initialize method is called first, followed by each child's initialize method.

### Example

```javascript

var monster = Character.create('dragon');
```

## Instance Methods

meta_object.connect (other, type, *other_type)
-------------------------------------------------------------------

### Arguments

*other*: The meta_object to connect to.  If *other* is not a meta_object but is an object, it will be converted to a meta_object.

*type*: A string that categorizes how the other meta_object relates to this meta_object.

*other_type*: A string that categorizes how this meta_object relates to the other meta_object.  If this argument is not specified then it will be set to the same value as *type*.

### Returns

null

### Description

Creates a connection between two meta_objects. Each meta_object contains an internal dictionary of the meta_objects it is connected to.

### Example

```javascript

var flower = Meta_Object.create();
var garden = Meta_Object.create();

garden.connect(flower, 'child', 'parent');
// Now the flower sees the garden as its parent, and the garden sees the flower as its child.

```
meta_object.disconnect (other)
-------------------------------------------------------------------

### Arguments

*other*: The meta_object to disconnect.

### Returns

null

### Description

Removes any connections that exist between the calling meta_object and the target meta_object.

### Example

```javascript

book.disconnect(library);

```
meta_object.listen (other, event, action)
-------------------------------------------------------------------

### Arguments

*other*: The meta_object to listen to  If *other* is not a meta_object but is an object, it will be converted to a meta_object.  If the calling meta_object and other are not already connected, a connection with default labels will be established.

*event*: A string label that determines which event to respond to.

*action*: A function to call when the particular event is fired.
.
### Returns

null

### Description

Listens to the targeted object for a particular event.  Events are fired using meta_object.invoke().  Any arguments passed to invoke() are passed to the listener's _action_ function.  A meta_object can listen to itself.

### Example

```javascript
hero.listen(hero, "connect.sidekick", function(new_sidekick) {
  new_sidekick.feed("bone");
});
```

