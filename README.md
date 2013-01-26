MetaHub
=======

MetaHub is a relational class system.

In traditional programming, references are one way. By default, when an entity references another entity, the target entity is not aware that it is being referenced. For example, if a program stores the path to a particular file that it uses for configuration information, and that file is then moved, the program will not know that the file has moved, nor will it know where the file has moved to.

Now what if the file was aware that a program was looking to it for configuration information? If the file was aware of all the programs pointing at it, then when the file was moved it could notify all of those programs about its new location.

While MetaHub does not solve such issues in the file system, it does solve them in general programming. It provides a mechanism by which objects can easily define bidirectional references (known as "connections" or "relationships") to each other.  When something happens to one of these special objects, it can notify any or all of the objects it is connected to.

This bidirectional approach is very powerful, but it is also not as resource efficient as the traditional one-way approach.  Because of that, and the fact that most software is not written bidirectional, MetaHub is designed to easily integrate with more traditional programming so that you can smoothly mix the two.  It's not practical to define everything as a Meta_Connection.

When two meta_objects are connected, labels are used to categorize how the two meta_objects relate to each other.

```javascript

hero.connect(sword, 'equipment', 'wielder');
hero.connect(helmet, 'equipment', 'wielder');
hero.connect(doggie, 'sidekick', 'master');
```

In this example, a sword and a helmet are connected to the hero, while the doggie is set to be his sidekick.  In traditional programming, this would look like:

```javascript

hero.equipment.push(sword);
sword.wielder = hero;
hero.equipment.push(helment);
helment.wielder = hero;
hero.sidekick = doggie;
doggie.master = hero;
```



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
.
### Returns

null

### Description

Creates a connection between two meta_objects. Each meta_object contains an internal dictionary of the meta_objects it is connected to. These connections can be queried based on their connection types.

### Example

```javascript

var flower = Meta_Object.create();
var garden = Meta_Object.create();

garden.connect(flower, 'child', 'parent');
// Now the flower sees the garden as its parent, and the garden sees the flower as its child.

```

