(function ($hx_exports) { "use strict";
$hx_exports.schema = $hx_exports.schema || {};
$hx_exports.parser = $hx_exports.parser || {};
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var EReg = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
};
EReg.__name__ = ["EReg"];
EReg.prototype = {
	match: function(s) {
		if(this.r.global) this.r.lastIndex = 0;
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) return this.r.m[n]; else throw "EReg::matched";
	}
	,matchSub: function(s,pos,len) {
		if(len == null) len = -1;
		if(this.r.global) {
			this.r.lastIndex = pos;
			this.r.m = this.r.exec(len < 0?s:HxOverrides.substr(s,0,pos + len));
			var b = this.r.m != null;
			if(b) this.r.s = s;
			return b;
		} else {
			var b1 = this.match(len < 0?HxOverrides.substr(s,pos,null):HxOverrides.substr(s,pos,len));
			if(b1) {
				this.r.s = s;
				this.r.m.index += pos;
			}
			return b1;
		}
	}
	,replace: function(s,by) {
		return s.replace(this.r,by);
	}
	,__class__: EReg
};
var Hub = $hx_exports.Hub = function() {
	this.nodes = new Array();
	this.nodes.push(null);
	this.root_scope_definition = new code.Scope_Definition(null,this);
	this.root_scope = new code.Scope(this,this.root_scope_definition);
	this.schema = new schema.Schema();
	this.create_functions();
};
Hub.__name__ = ["Hub"];
Hub.prototype = {
	load_parser: function() {
		var boot_definition = new parser.Definition();
		boot_definition.load_parser_schema();
		var context = new parser.Bootstrap(boot_definition);
		var result = context.parse("start = trim @(statement, newlines, 0, 0) final_trim\r\n\r\nnone = /&*/\r\nws = /\\s+/\r\ntrim = /\\s*/\r\nfinal_trim = /\\s*/\r\nnewlines = /(\\s*\\n)+\\s*/\r\ncomma_or_newline = /\\s*((\\s*\\n)+|,)\\s*/\r\ndot = \".\"\r\n\r\nid = /[a-zA-Z0-9_]+/\r\n\r\npath = @(id, dot, 2, 0)\r\n\r\npath_or_id = @(id, dot, 1, 0)\r\n\r\nreference = path_or_id @(method, none, 0, 0)\r\n\r\nmethod = \":\" id\r\n\r\nstatement =\r\n    create_symbol\r\n  | set_values\r\n  | trellis_scope\r\n  | create_constraint\r\n\r\ncreate_symbol = \"let\" ws id trim \"=\" trim expression\r\n\r\ncreate_constraint = path trim \"=\" trim expression\r\n\r\nexpression =\r\n    @(expression_part, operation_separator, 1, 0)\r\n\r\noperation_separator = trim operator trim\r\n\r\nexpression_part =\r\n    value\r\n  | create_node\r\n  | reference\r\n\r\nstring = ('\"' /[^\"]*/ '\"') | (\"'\" /[^']*/ \"'\")\r\nbool = \"true\" | \"false\"\r\nint = /-?[0-9]+/\r\nfloat = /-?([0-9]*\\.)?[0-9]+f?/\r\noperator = '+' | '-' | '/' | '*' | '%'\r\n\r\nvalue = string | bool | int | float\r\n\r\ndummy = \"@&^%\"\r\n\r\ncreate_node = \"new\" ws id trim @(set_property_block, dummy, 0, 1)\r\n\r\nset_property_block = \"{\" trim @(set_property, comma_or_newline, 1, 0) trim \"}\"\r\n\r\nset_property = id trim \":\" trim expression\r\n\r\nset_values = \"set\" ws path_or_id trim set_property_block\r\n\r\ntrellis_scope = id trim constraint_block\r\n\r\nconstraint_block = \"(\" trim @(constraint, comma_or_newline, 1, 0) trim \")\"\r\n\r\nconstraint = id trim \"=\" trim expression",false);
		this.parser_definition = new parser.Definition();
		this.parser_definition.load(result.get_data());
	}
	,create_node: function(trellis) {
		var node = new engine.Node(this,this.nodes.length,trellis);
		this.nodes.push(node);
		return node;
	}
	,get_node: function(id) {
		if(id < 0 || id >= this.nodes.length) throw new Error("There is no node with an id of " + id + ".");
		return this.nodes[id];
	}
	,get_node_count: function() {
		return this.nodes.length - 1;
	}
	,load_schema_from_file: function(url) {
		var data = Utility.load_json(url);
		this.schema.load_trellises(data.trellises);
	}
	,run_data: function(source) {
		var coder = new code.Coder(this);
		var expression = coder.convert(source,this.root_scope_definition);
		expression.resolve(this.root_scope);
	}
	,run_code: function(code) {
		var result = this.parse_code(code);
		if(!result.success) throw new Error("Error parsing code.");
		var match = result;
		this.run_data(match.get_data());
	}
	,parse_code: function(code) {
		if(this.parser_definition == null) this.load_parser();
		var context = new parser.MetaHub_Context(this.parser_definition);
		var without_comments = Hub.remove_comments.replace(code,"");
		return context.parse(without_comments);
	}
	,create_functions: function() {
		var functions = "{\r\n  \"trellises\": {\r\n    \"string\": {\r\n      \"properties\": {\r\n        \"output\": {\r\n          \"type\": \"string\"\r\n        }\r\n      }\r\n    },\r\n    \"int\": {\r\n      \"properties\": {\r\n        \"output\": {\r\n          \"type\": \"int\"\r\n        }\r\n      }\r\n    },\r\n    \"function\": {},\r\n    \"sum\": {\r\n      \"parent\": \"function\",\r\n      \"properties\": {\r\n        \"output\": {\r\n          \"type\": \"int\",\r\n          \"multiple\": \"true\"\r\n        },\r\n        \"input\": {\r\n          \"type\": \"int\",\r\n          \"multiple\": \"true\"\r\n        }\r\n      }\r\n    },\r\n    \"subtract\": {\r\n      \"parent\": \"function\",\r\n      \"properties\": {\r\n        \"output\": {\r\n          \"type\": \"int\",\r\n          \"multiple\": \"true\"\r\n        },\r\n        \"input\": {\r\n          \"type\": \"int\",\r\n          \"multiple\": \"true\"\r\n        }\r\n      }\r\n    },\r\n    \"count\": {\r\n      \"parent\": \"function\",\r\n      \"properties\": {\r\n        \"output\": {\r\n          \"type\": \"int\",\r\n          \"multiple\": \"true\"\r\n        },\r\n        \"input\": {\r\n          \"type\": \"int\",\r\n          \"multiple\": \"true\"\r\n        }\r\n      }\r\n    }\r\n  }\r\n}";
		var data = JSON.parse(functions);
		this.schema.load_trellises(data.trellises);
	}
	,__class__: Hub
};
var HxOverrides = function() { };
HxOverrides.__name__ = ["HxOverrides"];
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Lambda = function() { };
Lambda.__name__ = ["Lambda"];
Lambda.array = function(it) {
	var a = new Array();
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var i = $it0.next();
		a.push(i);
	}
	return a;
};
Lambda.map = function(it,f) {
	var l = new List();
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		l.add(f(x));
	}
	return l;
};
Lambda.filter = function(it,f) {
	var l = new List();
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		if(f(x)) l.add(x);
	}
	return l;
};
var List = function() {
	this.length = 0;
};
List.__name__ = ["List"];
List.prototype = {
	add: function(item) {
		var x = [item];
		if(this.h == null) this.h = x; else this.q[1] = x;
		this.q = x;
		this.length++;
	}
	,push: function(item) {
		var x = [item,this.h];
		this.h = x;
		if(this.q == null) this.q = x;
		this.length++;
	}
	,first: function() {
		if(this.h == null) return null; else return this.h[0];
	}
	,iterator: function() {
		return { h : this.h, hasNext : function() {
			return this.h != null;
		}, next : function() {
			if(this.h == null) return null;
			var x = this.h[0];
			this.h = this.h[1];
			return x;
		}};
	}
	,__class__: List
};
var Main = function() { };
Main.__name__ = ["Main"];
Main.main = function() {
	if (haxe.Log) haxe.Log.trace = function(data, info)
  {
  if (info.customParams && info.customParams.length > 0)
    console.log.apply(this, [data].concat(info.customParams))
  else
    console.log(data)

  }
};
Main.prototype = {
	__class__: Main
};
var IMap = function() { };
IMap.__name__ = ["IMap"];
var Reflect = function() { };
Reflect.__name__ = ["Reflect"];
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		return null;
	}
};
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) a.push(f);
		}
	}
	return a;
};
var Std = function() { };
Std.__name__ = ["Std"];
Std.string = function(s) {
	return js.Boot.__string_rec(s,"");
};
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
var StringBuf = function() {
	this.b = "";
};
StringBuf.__name__ = ["StringBuf"];
StringBuf.prototype = {
	__class__: StringBuf
};
var Type = function() { };
Type.__name__ = ["Type"];
Type.getClass = function(o) {
	if(o == null) return null;
	if((o instanceof Array) && o.__enum__ == null) return Array; else return o.__class__;
};
Type.getClassName = function(c) {
	var a = c.__name__;
	return a.join(".");
};
var Utility = function() { };
Utility.__name__ = ["Utility"];
Utility.load_json = function(url) {
	var json;
	json = js.Node.require("fs").readFileSync(url,{ encoding : "ascii"});
	return JSON.parse(json);
};
var code = {};
code.Coder = function(hub) {
	this.hub = hub;
};
code.Coder.__name__ = ["code","Coder"];
code.Coder.get_type = function(value) {
	if(((value | 0) === value)) return 1;
	if(typeof(value) == "number") return 5;
	if(typeof(value) == "boolean") return 6;
	if(typeof(value) == "string") return 2;
	throw new Error("Could not find type.");
};
code.Coder.prototype = {
	convert: function(source,scope_definition) {
		var _g = source.type;
		switch(_g) {
		case "block":
			return this.create_block(source,scope_definition);
		case "constraint":
			return this.constraint(source,scope_definition);
		case "node":
			return this.create_node(source,scope_definition);
		case "symbol":
			return this.create_symbol(source,scope_definition);
		case "literal":
			return this.create_literal(source,scope_definition);
		case "reference":
			return this.create_reference(source,scope_definition);
		case "function":
			return this.function_expression(source,scope_definition);
		case "set":
			return this.set(source,scope_definition);
		case "trellis_scope":
			return this.trellis_scope(source,scope_definition);
		}
		throw new Error("Invalid block: " + Std.string(source.type));
	}
	,constraint: function(source,scope_definition) {
		var expression = this.convert(source.expression,scope_definition);
		if(scope_definition._this.get_layer() == code.Layer.schema) {
			var reference = this.path_to_schema_reference(source.path,scope_definition);
			return new code.expressions.Create_Constraint(reference,expression);
		} else {
			var reference1 = this.path_to_engine_reference(source.path,scope_definition);
			return new code.expressions.Create_Constraint(reference1,expression);
		}
	}
	,create_block: function(source,scope_definition) {
		var new_scope_definition = new code.Scope_Definition(scope_definition);
		var block = new code.expressions.Block(new_scope_definition);
		var _g = 0;
		var _g1 = Reflect.fields(source.expressions);
		while(_g < _g1.length) {
			var e = _g1[_g];
			++_g;
			var child = Reflect.field(source.expressions,e);
			block.expressions.push(this.convert(child,new_scope_definition));
		}
		return block;
	}
	,create_literal: function(source,scope_definition) {
		var type = code.Coder.get_type(source.value);
		return new code.expressions.Literal(source.value,new code.Type_Reference(type));
	}
	,create_node: function(source,scope_definition) {
		var trellis = this.hub.schema.get_trellis(source.trellis);
		var result = new code.expressions.Create_Node(trellis);
		if(source.set != null) {
			var _g = 0;
			var _g1 = Reflect.fields(source.set);
			while(_g < _g1.length) {
				var key = _g1[_g];
				++_g;
				var property = trellis.get_property(key);
				var v = this.convert(Reflect.field(source.set,key),scope_definition);
				result.assignments.set(property.id,v);
				v;
			}
		}
		return result;
	}
	,path_to_engine_reference: function(path,scope_definition) {
		var symbol = scope_definition.find(path[0]);
		return symbol.create_reference(this.extract_path(path));
	}
	,extract_path: function(path) {
		var result = new Array();
		var _g1 = 1;
		var _g = path.length;
		while(_g1 < _g) {
			var i = _g1++;
			result.push(path[i]);
		}
		return result;
	}
	,path_to_schema_reference: function(path,scope_definition) {
		var symbol = scope_definition.find(path[0]);
		return symbol.create_reference(this.extract_path(path));
	}
	,create_reference: function(source,scope_definition) {
		if(scope_definition._this != null && scope_definition._this.get_layer() == code.Layer.schema) {
			var reference = this.path_to_schema_reference(source.path,scope_definition);
			return new code.expressions.Expression_Reference(reference);
		} else {
			var reference1 = this.path_to_engine_reference(source.path,scope_definition);
			return new code.expressions.Expression_Reference(reference1);
		}
	}
	,create_symbol: function(source,scope_definition) {
		var expression = this.convert(source.expression,scope_definition);
		var symbol = scope_definition.add_symbol(source.name,expression.type);
		return new code.expressions.Create_Symbol(symbol,expression);
	}
	,function_expression: function(source,scope_definition) {
		var _g = this;
		var trellis = this.hub.schema.get_trellis(source.name);
		var expressions = source.inputs;
		var inputs = Lambda.array(Lambda.map(expressions,function(e) {
			return _g.convert(e,scope_definition);
		}));
		return new code.expressions.Function_Call(trellis,inputs);
	}
	,set: function(source,scope_definition) {
		var reference = scope_definition.find(source.path);
		var trellis = reference.get_trellis();
		var result = new code.expressions.Set(reference);
		var _g = 0;
		var _g1 = Reflect.fields(source.assignments);
		while(_g < _g1.length) {
			var e = _g1[_g];
			++_g;
			var assignment = Reflect.field(source.assignments,e);
			var property = trellis.get_property(e);
			result.add_assignment(property.id,this.convert(assignment,scope_definition));
		}
		return result;
	}
	,trellis_scope: function(source,scope_definition) {
		var new_scope_definition = new code.Scope_Definition(scope_definition);
		var trellis = this.hub.schema.get_trellis(source.path);
		new_scope_definition._this = new code.symbols.Trellis_Symbol(trellis);
		var statements = new Array();
		var _g = 0;
		var _g1 = Reflect.fields(source.statements);
		while(_g < _g1.length) {
			var i = _g1[_g];
			++_g;
			var statement = Reflect.field(source.statements,i);
			statements.push(this.convert(statement,new_scope_definition));
		}
		return new code.expressions.Trellis_Scope(trellis,statements,new_scope_definition);
	}
	,__class__: code.Coder
};
code.Functions = { __ename__ : true, __constructs__ : ["none","sum","subtract"] };
code.Functions.none = ["none",0];
code.Functions.none.__enum__ = code.Functions;
code.Functions.sum = ["sum",1];
code.Functions.sum.__enum__ = code.Functions;
code.Functions.subtract = ["subtract",2];
code.Functions.subtract.__enum__ = code.Functions;
code.Function_Calls = function() { };
code.Function_Calls.__name__ = ["code","Function_Calls"];
code.Function_Calls.call = function(id,args,type) {
	if(!Object.prototype.hasOwnProperty.call(code.Function_Calls,id)) throw new Error("Invalid function name " + id + ".");
	var func = Reflect.field(code.Function_Calls,id);
	return func.apply(code.Function_Calls,[args]);
};
code.Function_Calls.sum = function(args) {
	var total = 0;
	var $it0 = $iterator(args)();
	while( $it0.hasNext() ) {
		var arg = $it0.next();
		var value = arg;
		total += value;
	}
	return total;
};
code.Function_Calls.subtract = function(args) {
	var total = 0;
	var numbers = args.first();
	var i = 0;
	var $it0 = $iterator(numbers)();
	while( $it0.hasNext() ) {
		var arg = $it0.next();
		var value = arg;
		if(i == 0) {
			i = 1;
			total = value;
		} else total -= value;
	}
	return total;
};
code.Function_Calls.count = function(args) {
	var result = args.first()[0].length;
	haxe.Log.trace("count",{ fileName : "Functions.hx", lineNumber : 66, className : "code.Function_Calls", methodName : "count", customParams : [result]});
	return result;
};
code.Layer = { __ename__ : true, __constructs__ : ["schema","engine"] };
code.Layer.schema = ["schema",0];
code.Layer.schema.__enum__ = code.Layer;
code.Layer.engine = ["engine",1];
code.Layer.engine.__enum__ = code.Layer;
code.Scope = function(hub,definition,parent) {
	this.hub = hub;
	this.definition = definition;
	this.parent = parent;
	var length = definition.size();
	var this1;
	this1 = new Array(length);
	this.values = this1;
};
code.Scope.__name__ = ["code","Scope"];
code.Scope.prototype = {
	set_value: function(index,value) {
		var val = value;
		this.values[index] = val;
	}
	,__class__: code.Scope
};
code.Scope_Definition = function(parent,hub) {
	this.depth = 0;
	this.symbols = new haxe.ds.StringMap();
	this.types = new Array();
	this.parent = parent;
	if(parent != null) {
		this.hub = parent.hub;
		this.depth = parent.depth + 1;
		this._this = parent._this;
	} else this.hub = hub;
};
code.Scope_Definition.__name__ = ["code","Scope_Definition"];
code.Scope_Definition.prototype = {
	add_symbol: function(name,type) {
		var symbol = new code.symbols.Local_Symbol(type,this,this.types.length,name);
		this.types.push(symbol);
		this.symbols.set(name,symbol);
		symbol;
		return symbol;
	}
	,_find: function(name) {
		if(this.symbols.exists(name)) return this.symbols.get(name);
		if(this.parent == null) return null;
		return this.parent._find(name);
	}
	,find: function(name) {
		if(this.symbols.exists(name)) return this.symbols.get(name);
		var result = null;
		if(this.parent != null) result = this.parent._find(name);
		if(result == null) {
			if(this._this != null) return this._this.get_context_symbol(name);
		}
		if(result == null && this.hub.schema.trellis_keys.exists(name)) result = new code.symbols.Trellis_Symbol(this.hub.schema.trellis_keys.get(name));
		if(result == null) throw new Error("Could not find symbol: " + name + ".");
		return result;
	}
	,get_symbol_by_name: function(name) {
		return this.symbols.get(name);
	}
	,get_symbol_by_index: function(index) {
		return this.types[index];
	}
	,size: function() {
		return this.types.length;
	}
	,__class__: code.Scope_Definition
};
code.This = function() { };
code.This.__name__ = ["code","This"];
code.This.prototype = {
	__class__: code.This
};
code.Type_Reference = function(type,trellis) {
	this.type = type;
	this.trellis = trellis;
};
code.Type_Reference.__name__ = ["code","Type_Reference"];
code.Type_Reference.create_from_string = function(name) {
	var type_id = Reflect.field(schema.Types,name);
	return new code.Type_Reference(type_id);
};
code.Type_Reference.prototype = {
	__class__: code.Type_Reference
};
code.expressions = {};
code.expressions.Expression = function() { };
code.expressions.Expression.__name__ = ["code","expressions","Expression"];
code.expressions.Expression.prototype = {
	__class__: code.expressions.Expression
};
code.expressions.Block = function(scope_definition) {
	this.type = new code.Type_Reference(0);
	this.expressions = new Array();
	this.scope_definition = scope_definition;
};
code.expressions.Block.__name__ = ["code","expressions","Block"];
code.expressions.Block.__interfaces__ = [code.expressions.Expression];
code.expressions.Block.prototype = {
	resolve: function(scope) {
		var scope1 = new code.Scope(scope.hub,this.scope_definition,scope);
		var _g = 0;
		var _g1 = this.expressions;
		while(_g < _g1.length) {
			var e = _g1[_g];
			++_g;
			e.resolve(scope1);
		}
		return null;
	}
	,to_port: function(scope) {
		return null;
	}
	,__class__: code.expressions.Block
};
code.expressions.Create_Constraint = function(reference,expression) {
	this.reference = reference;
	this.expression = expression;
};
code.expressions.Create_Constraint.__name__ = ["code","expressions","Create_Constraint"];
code.expressions.Create_Constraint.__interfaces__ = [code.expressions.Expression];
code.expressions.Create_Constraint.prototype = {
	resolve: function(scope) {
		haxe.Log.trace("constraint",{ fileName : "Create_Constraint.hx", lineNumber : 20, className : "code.expressions.Create_Constraint", methodName : "resolve", customParams : [Type.getClassName(Type.getClass(this.reference))]});
		var other_port = this.expression.to_port(scope);
		if(this.reference.get_layer() == code.Layer.schema) {
			var property_reference = this.reference;
			var port = property_reference.get_port(scope);
			port.add_dependency(other_port);
			return null;
		} else {
		}
		throw new Error("Not implemented yet.");
	}
	,to_port: function(scope) {
		return null;
	}
	,__class__: code.expressions.Create_Constraint
};
code.expressions.Create_Node = function(trellis) {
	this.assignments = new haxe.ds.IntMap();
	this.trellis = trellis;
	this.type = new code.Type_Reference(3,trellis);
};
code.expressions.Create_Node.__name__ = ["code","expressions","Create_Node"];
code.expressions.Create_Node.__interfaces__ = [code.expressions.Expression];
code.expressions.Create_Node.prototype = {
	resolve: function(scope) {
		haxe.Log.trace("create node",{ fileName : "Create_Node.hx", lineNumber : 18, className : "code.expressions.Create_Node", methodName : "resolve", customParams : [this.trellis.name]});
		var node = scope.hub.create_node(this.trellis);
		var $it0 = this.assignments.keys();
		while( $it0.hasNext() ) {
			var i = $it0.next();
			var expression = this.assignments.get(i);
			node.set_value(i,expression.resolve(scope));
		}
		return node.id;
	}
	,to_port: function(scope) {
		return null;
	}
	,__class__: code.expressions.Create_Node
};
code.expressions.Create_Symbol = function(symbol,expression) {
	this.symbol = symbol;
	this.expression = expression;
	this.type = expression.type;
};
code.expressions.Create_Symbol.__name__ = ["code","expressions","Create_Symbol"];
code.expressions.Create_Symbol.__interfaces__ = [code.expressions.Expression];
code.expressions.Create_Symbol.prototype = {
	resolve: function(scope) {
		var value = this.expression.resolve(scope);
		scope.set_value(this.symbol.index,value);
		return value;
	}
	,to_port: function(scope) {
		return null;
	}
	,__class__: code.expressions.Create_Symbol
};
code.expressions.Expression_Reference = function(reference) {
	this.reference = reference;
};
code.expressions.Expression_Reference.__name__ = ["code","expressions","Expression_Reference"];
code.expressions.Expression_Reference.__interfaces__ = [code.expressions.Expression];
code.expressions.Expression_Reference.prototype = {
	resolve: function(scope) {
		return this.reference.resolve(scope).id;
	}
	,to_port: function(scope) {
		return this.reference.get_port(scope);
	}
	,__class__: code.expressions.Expression_Reference
};
code.expressions.Function_Call = function(trellis,inputs) {
	this.trellis = trellis;
	this.inputs = inputs;
};
code.expressions.Function_Call.__name__ = ["code","expressions","Function_Call"];
code.expressions.Function_Call.__interfaces__ = [code.expressions.Expression];
code.expressions.Function_Call.prototype = {
	resolve: function(scope) {
		throw new Error("Code not written for imperative function calls.");
	}
	,to_port: function(scope) {
		var node = scope.hub.create_node(this.trellis);
		var expressions = this.inputs;
		var ports = node.get_inputs();
		var target = null;
		var _g1 = 0;
		var _g = expressions.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(i < ports.length) target = ports[i];
			var source = expressions[i].to_port(scope);
			target.add_dependency(source);
		}
		var output = node.get_port(0);
		return output;
	}
	,__class__: code.expressions.Function_Call
};
code.expressions.Literal = function(value,type) {
	this.value = value;
	this.type = type;
};
code.expressions.Literal.__name__ = ["code","expressions","Literal"];
code.expressions.Literal.__interfaces__ = [code.expressions.Expression];
code.expressions.Literal.get_type_string = function(id) {
	var fields = Reflect.fields(schema.Types);
	var index = id;
	return fields[index + 1];
};
code.expressions.Literal.prototype = {
	resolve: function(scope) {
		return this.value;
	}
	,to_port: function(scope) {
		var trellis = scope.hub.schema.get_trellis(code.expressions.Literal.get_type_string(this.type.type));
		var node = scope.hub.create_node(trellis);
		var port = node.get_port(0);
		port.set_value(this.value);
		return port;
	}
	,__class__: code.expressions.Literal
};
code.expressions.Assignment = function(index,expression) {
	this.index = index;
	this.expression = expression;
};
code.expressions.Assignment.__name__ = ["code","expressions","Assignment"];
code.expressions.Assignment.prototype = {
	apply: function(node,scope) {
		node.set_value(this.index,this.expression.resolve(scope));
	}
	,__class__: code.expressions.Assignment
};
code.expressions.Set = function(reference) {
	this.assignments = new Array();
	this.reference = reference;
};
code.expressions.Set.__name__ = ["code","expressions","Set"];
code.expressions.Set.__interfaces__ = [code.expressions.Expression];
code.expressions.Set.prototype = {
	add_assignment: function(index,expression) {
		this.assignments.push(new code.expressions.Assignment(index,expression));
	}
	,resolve: function(scope) {
		var node = this.reference.get_node(scope);
		var _g = 0;
		var _g1 = this.assignments;
		while(_g < _g1.length) {
			var assignment = _g1[_g];
			++_g;
			assignment.apply(node,scope);
		}
		return null;
	}
	,to_port: function(scope) {
		return null;
	}
	,__class__: code.expressions.Set
};
code.expressions.Trellis_Scope = function(trellis,expressions,scope_definition) {
	this.trellis = trellis;
	this.expressions = expressions;
	this.scope_definition = scope_definition;
};
code.expressions.Trellis_Scope.__name__ = ["code","expressions","Trellis_Scope"];
code.expressions.Trellis_Scope.__interfaces__ = [code.expressions.Expression];
code.expressions.Trellis_Scope.prototype = {
	resolve: function(scope) {
		var new_scope = new code.Scope(scope.hub,this.scope_definition,scope);
		var _g = 0;
		var _g1 = this.expressions;
		while(_g < _g1.length) {
			var expression = _g1[_g];
			++_g;
			expression.resolve(new_scope);
		}
		return null;
	}
	,to_port: function(scope) {
		return null;
	}
	,__class__: code.expressions.Trellis_Scope
};
code.references = {};
code.references.Reference = function(symbol,chain) {
	this.symbol = symbol;
	this.chain = chain;
};
code.references.Reference.__name__ = ["code","references","Reference"];
code.references.Reference.prototype = {
	get_port: function(scope) {
		throw new Error("Abstract class.  Not implemented.");
	}
	,get_layer: function() {
		return this.symbol.get_layer();
	}
	,resolve: function(scope) {
		throw new Error("Not implemented yet.");
	}
	,__class__: code.references.Reference
};
code.references.Node_Reference = function(symbol,chain) {
	code.references.Reference.call(this,symbol,chain);
};
code.references.Node_Reference.__name__ = ["code","references","Node_Reference"];
code.references.Node_Reference.__super__ = code.references.Reference;
code.references.Node_Reference.prototype = $extend(code.references.Reference.prototype,{
	get_port: function(scope) {
		throw new Error("Not implemented yet.");
	}
	,resolve: function(scope) {
		return this.get_node(scope);
	}
	,get_node: function(scope) {
		var id = this.symbol.resolve(scope);
		var node = scope.hub.nodes[id];
		var nodes = scope.hub.nodes;
		var length = this.chain.length - 1;
		var _g = 0;
		while(_g < length) {
			var i = _g++;
			var id1 = node.get_value(this.chain[i].id);
			node = nodes[id1];
		}
		return node;
	}
	,__class__: code.references.Node_Reference
});
code.references.Port_Reference = function(symbol,chain) {
	code.references.Reference.call(this,symbol,chain);
};
code.references.Port_Reference.__name__ = ["code","references","Port_Reference"];
code.references.Port_Reference.__super__ = code.references.Reference;
code.references.Port_Reference.prototype = $extend(code.references.Reference.prototype,{
	get_port: function(scope) {
		throw new Error("Not implemented yet.");
	}
	,resolve: function(scope) {
		throw new Error("Not implemented yet.");
	}
	,__class__: code.references.Port_Reference
});
code.references.Property_Reference = function(symbol,chain) {
	code.references.Reference.call(this,symbol,chain);
};
code.references.Property_Reference.__name__ = ["code","references","Property_Reference"];
code.references.Property_Reference.__super__ = code.references.Reference;
code.references.Property_Reference.prototype = $extend(code.references.Reference.prototype,{
	resolve: function(scope) {
		throw new Error("Not implemented yet.");
	}
	,get_port: function(scope) {
		var property = this.get_property(scope);
		var origin_chain = this.create_chain_to_origin(scope);
		var port = new schema.Property_Port(property,origin_chain);
		property.ports.push(port);
		return port;
	}
	,get_property: function(scope) {
		if(this.chain.length == 0) {
			var property_symbol = this.symbol;
			return property_symbol.get_property();
		}
		return this.chain[this.chain.length - 1];
	}
	,create_chain_to_origin: function(scope) {
		if(this.chain.length > 0) {
			var property_symbol = this.symbol;
			var property = property_symbol.get_property();
			var full_chain = [property].concat(this.chain);
			return schema.Property_Chain_Helper.flip(full_chain);
		}
		var _this = scope.definition._this;
		if(_this != null && _this.get_trellis() == this.symbol.get_parent_trellis()) return [];
		throw new Error("Not implemented");
	}
	,__class__: code.references.Property_Reference
});
code.references.Trellis_Reference = function(symbol,chain) {
	code.references.Reference.call(this,symbol,chain);
};
code.references.Trellis_Reference.__name__ = ["code","references","Trellis_Reference"];
code.references.Trellis_Reference.__super__ = code.references.Reference;
code.references.Trellis_Reference.prototype = $extend(code.references.Reference.prototype,{
	get_port: function(scope) {
		throw new Error("Not implemented yet.");
	}
	,resolve: function(scope) {
		throw new Error("Not implemented yet.");
	}
	,__class__: code.references.Trellis_Reference
});
code.symbols = {};
code.symbols.Symbol = function() { };
code.symbols.Symbol.__name__ = ["code","symbols","Symbol"];
code.symbols.Symbol.prototype = {
	__class__: code.symbols.Symbol
};
code.symbols.ISchema_Symbol = function() { };
code.symbols.ISchema_Symbol.__name__ = ["code","symbols","ISchema_Symbol"];
code.symbols.ISchema_Symbol.__interfaces__ = [code.symbols.Symbol];
code.symbols.ISchema_Symbol.prototype = {
	__class__: code.symbols.ISchema_Symbol
};
code.symbols.Local_Symbol = function(type,scope_definition,index,name) {
	this.type = type;
	this.scope_definition = scope_definition;
	this.index = index;
	this.name = name;
};
code.symbols.Local_Symbol.__name__ = ["code","symbols","Local_Symbol"];
code.symbols.Local_Symbol.__interfaces__ = [code.symbols.Symbol];
code.symbols.Local_Symbol.prototype = {
	get_node: function(scope) {
		var id = this.resolve(scope);
		return scope.hub.nodes[id];
	}
	,get_trellis: function() {
		return this.type.trellis;
	}
	,get_layer: function() {
		return code.Layer.engine;
	}
	,resolve: function(scope) {
		if(this.scope_definition.depth == scope.definition.depth) return scope.values[this.index];
		if(scope.parent == null) throw new Error("Could not find scope for symbol: " + this.name + ".");
		return this.resolve(scope.parent);
	}
	,get_port: function(scope,path) {
		var node = this.get_node2(scope,path);
		return node.get_port(path[path.length - 1].id);
	}
	,get_node2: function(scope,path) {
		var node = this.get_node(scope);
		var nodes = scope.hub.nodes;
		var i = 0;
		var length = path.length - 1;
		while(i < length) {
			var id = node.get_value(path[i].id);
			node = nodes[id];
			++i;
		}
		return node;
	}
	,create_reference: function(path) {
		var trellis = this.get_trellis();
		var chain = schema.Property_Chain_Helper.from_string(path,trellis);
		if(chain.length == 0) {
			if(this.type.type == 3) return new code.references.Node_Reference(this,chain);
			return new code.references.Port_Reference(this,chain);
		} else {
			haxe.Log.trace(chain,{ fileName : "Local_Symbol.hx", lineNumber : 77, className : "code.symbols.Local_Symbol", methodName : "create_reference"});
			var last_property = chain[chain.length - 1];
			if(last_property.other_trellis == null) return new code.references.Node_Reference(this,chain);
			return new code.references.Port_Reference(this,chain);
		}
	}
	,__class__: code.symbols.Local_Symbol
};
code.symbols.Property_Symbol = function(property) {
	this.property = property;
};
code.symbols.Property_Symbol.__name__ = ["code","symbols","Property_Symbol"];
code.symbols.Property_Symbol.__interfaces__ = [code.symbols.ISchema_Symbol];
code.symbols.Property_Symbol.prototype = {
	get_port: function(scope,path) {
		throw new Error("Not supported");
	}
	,resolve: function(scope) {
		return null;
	}
	,get_layer: function() {
		return code.Layer.schema;
	}
	,get_trellis: function() {
		return this.property.other_trellis;
	}
	,get_parent_trellis: function() {
		return this.property.trellis;
	}
	,get_property: function() {
		return this.property;
	}
	,create_reference: function(path) {
		var trellis = this.get_trellis();
		var chain = schema.Property_Chain_Helper.from_string(path,trellis);
		if(chain.length == 0) {
			if(this.property.type == 3) return new code.references.Trellis_Reference(this,chain);
			return new code.references.Property_Reference(this,chain);
		} else {
			var last_property = chain[chain.length - 1];
			if(last_property.other_trellis == null) return new code.references.Property_Reference(this,chain);
			return new code.references.Trellis_Reference(this,chain);
		}
	}
	,__class__: code.symbols.Property_Symbol
};
code.symbols.Trellis_Symbol = function(trellis) {
	this.trellis = trellis;
};
code.symbols.Trellis_Symbol.__name__ = ["code","symbols","Trellis_Symbol"];
code.symbols.Trellis_Symbol.__interfaces__ = [code.This,code.symbols.ISchema_Symbol];
code.symbols.Trellis_Symbol.prototype = {
	get_trellis: function() {
		return this.trellis;
	}
	,get_parent_trellis: function() {
		return this.trellis;
	}
	,get_port: function(scope,path) {
		throw new Error("Not supported");
	}
	,resolve: function(scope) {
		return null;
	}
	,get_context_symbol: function(name) {
		var property = this.trellis.get_property(name);
		if(property == null) return null;
		return new code.symbols.Property_Symbol(property);
	}
	,get_layer: function() {
		return code.Layer.schema;
	}
	,create_reference: function(path) {
		var trellis = this.symbol.get_trellis();
		var chain = schema.Property_Chain_Helper.from_string(path,trellis);
		var last_property = chain[chain.length - 1];
		if(last_property.other_trellis == null) return new code.references.Trellis_Reference(this.symbol,chain);
		return new code.references.Property_Reference(this.symbol,chain);
	}
	,__class__: code.symbols.Trellis_Symbol
};
var engine = {};
engine.IPort = function() { };
engine.IPort.__name__ = ["engine","IPort"];
engine.IPort.prototype = {
	__class__: engine.IPort
};
engine.Base_Port = function(node,hub,property,value) {
	this.on_change = new Array();
	this.dependents = new Array();
	this.dependencies = new Array();
	this.parent = node;
	this.hub = hub;
	this.property = property;
	this._value = value;
};
engine.Base_Port.__name__ = ["engine","Base_Port"];
engine.Base_Port.__interfaces__ = [engine.IPort];
engine.Base_Port.prototype = {
	add_dependency: function(other) {
		this.dependencies.push(other);
		other.dependents.push(this);
	}
	,get_index: function() {
		return this.property.id;
	}
	,get_other_node: function() {
		var node_id = this._value;
		return this.hub.get_node(node_id);
	}
	,get_value: function(context) {
		return this._value;
	}
	,set_value: function(new_value,context) {
		if(!this.property.multiple && this._value == new_value) return this._value;
		this._value = new_value;
		if(this.property.type == 3) {
			if(this.property.other_property.type == 4) {
				var other_node = this.get_other_node();
				var other_port = other_node.get_port(this.property.other_property.id);
				other_port.add_value(this.parent.id);
			} else {
			}
		}
		if(this.dependents != null && this.dependents.length > 0) this.update_dependents(context);
		if(this.property.ports != null && this.property.ports.length > 0) this.update_property_dependents();
		if(this.on_change != null && this.on_change.length > 0) {
			var _g = 0;
			var _g1 = this.on_change;
			while(_g < _g1.length) {
				var action = _g1[_g];
				++_g;
				action(this,this._value,context);
			}
		}
		return this._value;
	}
	,get_type: function() {
		return this.property.type;
	}
	,update_dependents: function(context) {
		var _g = 0;
		var _g1 = this.dependents;
		while(_g < _g1.length) {
			var other = _g1[_g];
			++_g;
			other.set_value(this._value,context);
		}
	}
	,update_property_dependents: function() {
		var _g = 0;
		var _g1 = this.property.ports;
		while(_g < _g1.length) {
			var port = _g1[_g];
			++_g;
			var context = new engine.Context(port,this.parent);
			port.enter(this._value,context);
		}
	}
	,__class__: engine.Base_Port
};
engine.Context = function(property_port,entry_node) {
	this.property_port = property_port;
	this.entry_node = entry_node;
};
engine.Context.__name__ = ["engine","Context"];
engine.Context.prototype = {
	__class__: engine.Context
};
engine.INode = function() { };
engine.INode.__name__ = ["engine","INode"];
engine.INode.prototype = {
	__class__: engine.INode
};
engine.List_Port = function(node,hub,property,value) {
	if(value == null) value = new Array();
	engine.Base_Port.call(this,node,hub,property,value);
};
engine.List_Port.__name__ = ["engine","List_Port"];
engine.List_Port.__super__ = engine.Base_Port;
engine.List_Port.prototype = $extend(engine.Base_Port.prototype,{
	get_array: function() {
		return this._value;
	}
	,get_value_at: function(index) {
		return this._value[index];
	}
	,set_value_at: function(new_value,index) {
		return this._value[index] = new_value;
	}
	,add_value: function(new_value) {
		this._value.push(new_value);
		haxe.Log.trace("list changed.",{ fileName : "List_Port.hx", lineNumber : 31, className : "engine.List_Port", methodName : "add_value"});
		this.update_property_dependents();
	}
	,set_value: function(new_value,context) {
		throw new Error("Not supported.");
	}
	,__class__: engine.List_Port
});
engine.Node = function(hub,id,trellis) {
	this.ports = new Array();
	this.values = new Array();
	this.hub = hub;
	this.id = id;
	this.trellis = trellis;
	var _g = 0;
	var _g1 = trellis.properties;
	while(_g < _g1.length) {
		var property = _g1[_g];
		++_g;
		this.values.push(property.get_default());
		var port;
		if(property.type == 4) port = new engine.List_Port(this,hub,property); else port = new engine.Port(this,hub,property,property.get_default());
		this.ports.push(port);
	}
	if(trellis.is_a(hub.schema.get_trellis("function"))) this.initialize_function();
};
engine.Node.__name__ = ["engine","Node"];
engine.Node.__interfaces__ = [engine.INode];
engine.Node.prototype = {
	get_port_count: function() {
		return this.ports.length;
	}
	,initialize_function: function() {
		var inputs = this.get_inputs();
		var _g = 0;
		while(_g < inputs.length) {
			var i = inputs[_g];
			++_g;
			var input = i;
			input.on_change.push($bind(this,this.run_function));
		}
	}
	,run_function: function(input,value,context) {
		var args = this.get_input_values(context);
		var result = code.Function_Calls.call(this.trellis.name,args,this.ports[0].get_type());
		this.ports[0].set_value(result,context);
	}
	,get_inputs: function() {
		var result = new Array();
		var _g = 0;
		var _g1 = this.trellis.properties;
		while(_g < _g1.length) {
			var property = _g1[_g];
			++_g;
			if(property.name != "output") result.push(this.get_port(property.id));
		}
		return result;
	}
	,get_port: function(index) {
		if(index < 0 && index >= this.ports.length || this.ports[index] == null) throw new Error("Node " + this.trellis.name + " does not have a property index of " + index + ".");
		return this.ports[index];
	}
	,get_port_by_name: function(name) {
		var property = this.trellis.get_property(name);
		return this.get_port(property.id);
	}
	,get_port_from_chain: function(chain) {
		if(chain.length == 0) throw new Error("Cannot follow empty property chain.");
		var current_node = this;
		var i = 0;
		var _g = 0;
		while(_g < chain.length) {
			var link = chain[_g];
			++_g;
			var port = current_node.get_port(link.id);
			if(link.type == 3) {
				var reference = port;
				current_node = reference.get_other_node();
			} else {
				if(i < chain.length - 1) throw new Error("Invalid chain. " + link.fullname() + " is not a reference.");
				return current_node.get_port(link.id);
			}
			++i;
		}
		throw new Error("Could not follow chain");
	}
	,get_value: function(index) {
		var port = this.get_port(index);
		return port.get_value();
	}
	,get_value_by_name: function(name) {
		var property = this.trellis.get_property(name);
		var port = this.ports[property.id];
		return port.get_value();
	}
	,set_value: function(index,value) {
		var port = this.ports[index];
		port.set_value(value);
	}
	,get_input_values: function(context) {
		var result = new List();
		var _g1 = 1;
		var _g = this.ports.length;
		while(_g1 < _g) {
			var i = _g1++;
			var port = this.get_port(i);
			var value = port.dependencies.map(function(d) {
				return d.get_value(context);
			});
			result.push(value);
		}
		return result;
	}
	,add_list_value: function(index,value) {
		var port = this.ports[index];
		port.add_value(value);
	}
	,__class__: engine.Node
};
engine.Port = function(node,hub,property,value) {
	engine.Base_Port.call(this,node,hub,property,value);
};
engine.Port.__name__ = ["engine","Port"];
engine.Port.__super__ = engine.Base_Port;
engine.Port.prototype = $extend(engine.Base_Port.prototype,{
	__class__: engine.Port
});
var haxe = {};
haxe.Json = function() { };
haxe.Json.__name__ = ["haxe","Json"];
haxe.Json.stringify = function(obj,replacer,insertion) {
	return JSON.stringify(obj,replacer,insertion);
};
haxe.Json.parse = function(jsonString) {
	return JSON.parse(jsonString);
};
haxe.Log = function() { };
haxe.Log.__name__ = ["haxe","Log"];
haxe.Log.trace = function(v,infos) {
	js.Boot.__trace(v,infos);
};
haxe.ds = {};
haxe.ds.IntMap = function() {
	this.h = { };
};
haxe.ds.IntMap.__name__ = ["haxe","ds","IntMap"];
haxe.ds.IntMap.__interfaces__ = [IMap];
haxe.ds.IntMap.prototype = {
	set: function(key,value) {
		this.h[key] = value;
	}
	,get: function(key) {
		return this.h[key];
	}
	,keys: function() {
		var a = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) a.push(key | 0);
		}
		return HxOverrides.iter(a);
	}
	,__class__: haxe.ds.IntMap
};
haxe.ds.StringMap = function() {
	this.h = { };
};
haxe.ds.StringMap.__name__ = ["haxe","ds","StringMap"];
haxe.ds.StringMap.__interfaces__ = [IMap];
haxe.ds.StringMap.prototype = {
	set: function(key,value) {
		this.h["$" + key] = value;
	}
	,get: function(key) {
		return this.h["$" + key];
	}
	,exists: function(key) {
		return this.h.hasOwnProperty("$" + key);
	}
	,__class__: haxe.ds.StringMap
};
haxe.io = {};
haxe.io.Bytes = function(length,b) {
	this.length = length;
	this.b = b;
};
haxe.io.Bytes.__name__ = ["haxe","io","Bytes"];
haxe.io.Bytes.alloc = function(length) {
	return new haxe.io.Bytes(length,new Buffer(length));
};
haxe.io.Bytes.ofString = function(s) {
	var nb = new Buffer(s,"utf8");
	return new haxe.io.Bytes(nb.length,nb);
};
haxe.io.Bytes.ofData = function(b) {
	return new haxe.io.Bytes(b.length,b);
};
haxe.io.Bytes.prototype = {
	get: function(pos) {
		return this.b[pos];
	}
	,set: function(pos,v) {
		this.b[pos] = v;
	}
	,blit: function(pos,src,srcpos,len) {
		if(pos < 0 || srcpos < 0 || len < 0 || pos + len > this.length || srcpos + len > src.length) throw haxe.io.Error.OutsideBounds;
		src.b.copy(this.b,pos,srcpos,srcpos + len);
	}
	,sub: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw haxe.io.Error.OutsideBounds;
		var nb = new Buffer(len);
		var slice = this.b.slice(pos,pos + len);
		slice.copy(nb,0,0,len);
		return new haxe.io.Bytes(len,nb);
	}
	,compare: function(other) {
		var b1 = this.b;
		var b2 = other.b;
		var len;
		if(this.length < other.length) len = this.length; else len = other.length;
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			if(b1[i] != b2[i]) return b1[i] - b2[i];
		}
		return this.length - other.length;
	}
	,readString: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw haxe.io.Error.OutsideBounds;
		var s = "";
		var b = this.b;
		var fcc = String.fromCharCode;
		var i = pos;
		var max = pos + len;
		while(i < max) {
			var c = b[i++];
			if(c < 128) {
				if(c == 0) break;
				s += fcc(c);
			} else if(c < 224) s += fcc((c & 63) << 6 | b[i++] & 127); else if(c < 240) {
				var c2 = b[i++];
				s += fcc((c & 31) << 12 | (c2 & 127) << 6 | b[i++] & 127);
			} else {
				var c21 = b[i++];
				var c3 = b[i++];
				s += fcc((c & 15) << 18 | (c21 & 127) << 12 | c3 << 6 & 127 | b[i++] & 127);
			}
		}
		return s;
	}
	,toString: function() {
		return this.readString(0,this.length);
	}
	,toHex: function() {
		var s = new StringBuf();
		var chars = [];
		var str = "0123456789abcdef";
		var _g1 = 0;
		var _g = str.length;
		while(_g1 < _g) {
			var i = _g1++;
			chars.push(HxOverrides.cca(str,i));
		}
		var _g11 = 0;
		var _g2 = this.length;
		while(_g11 < _g2) {
			var i1 = _g11++;
			var c = this.b[i1];
			s.b += String.fromCharCode(chars[c >> 4]);
			s.b += String.fromCharCode(chars[c & 15]);
		}
		return s.b;
	}
	,getData: function() {
		return this.b;
	}
	,__class__: haxe.io.Bytes
};
haxe.io.BytesBuffer = function() {
	this.b = new Array();
};
haxe.io.BytesBuffer.__name__ = ["haxe","io","BytesBuffer"];
haxe.io.BytesBuffer.prototype = {
	addByte: function($byte) {
		this.b.push($byte);
	}
	,add: function(src) {
		var b1 = this.b;
		var b2 = src.b;
		var _g1 = 0;
		var _g = src.length;
		while(_g1 < _g) {
			var i = _g1++;
			this.b.push(b2[i]);
		}
	}
	,addBytes: function(src,pos,len) {
		if(pos < 0 || len < 0 || pos + len > src.length) throw haxe.io.Error.OutsideBounds;
		var b1 = this.b;
		var b2 = src.b;
		var _g1 = pos;
		var _g = pos + len;
		while(_g1 < _g) {
			var i = _g1++;
			this.b.push(b2[i]);
		}
	}
	,getBytes: function() {
		var nb = new Buffer(this.b);
		var bytes = new haxe.io.Bytes(nb.length,nb);
		this.b = null;
		return bytes;
	}
	,__class__: haxe.io.BytesBuffer
};
haxe.io.Eof = function() { };
haxe.io.Eof.__name__ = ["haxe","io","Eof"];
haxe.io.Eof.prototype = {
	toString: function() {
		return "Eof";
	}
	,__class__: haxe.io.Eof
};
haxe.io.Error = { __ename__ : true, __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] };
haxe.io.Error.Blocked = ["Blocked",0];
haxe.io.Error.Blocked.__enum__ = haxe.io.Error;
haxe.io.Error.Overflow = ["Overflow",1];
haxe.io.Error.Overflow.__enum__ = haxe.io.Error;
haxe.io.Error.OutsideBounds = ["OutsideBounds",2];
haxe.io.Error.OutsideBounds.__enum__ = haxe.io.Error;
haxe.io.Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe.io.Error; return $x; };
haxe.io.Output = function() { };
haxe.io.Output.__name__ = ["haxe","io","Output"];
var js = {};
js.Boot = function() { };
js.Boot.__name__ = ["js","Boot"];
js.Boot.__unhtml = function(s) {
	return s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
};
js.Boot.__trace = function(v,i) {
	var msg;
	if(i != null) msg = i.fileName + ":" + i.lineNumber + ": "; else msg = "";
	msg += js.Boot.__string_rec(v,"");
	if(i != null && i.customParams != null) {
		var _g = 0;
		var _g1 = i.customParams;
		while(_g < _g1.length) {
			var v1 = _g1[_g];
			++_g;
			msg += "," + js.Boot.__string_rec(v1,"");
		}
	}
	var d;
	if(typeof(document) != "undefined" && (d = document.getElementById("haxe:trace")) != null) d.innerHTML += js.Boot.__unhtml(msg) + "<br/>"; else if(typeof console != "undefined" && console.log != null) console.log(msg);
};
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				return str + ")";
			}
			var l = o.length;
			var i1;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js.Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str2 = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str2.length != 2) str2 += ", \n";
		str2 += s + k + " : " + js.Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str2 += "\n" + s + "}";
		return str2;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
js.NodeC = function() { };
js.NodeC.__name__ = ["js","NodeC"];
js.Node = function() { };
js.Node.__name__ = ["js","Node"];
js.Node.get_assert = function() {
	return js.Node.require("assert");
};
js.Node.get_child_process = function() {
	return js.Node.require("child_process");
};
js.Node.get_cluster = function() {
	return js.Node.require("cluster");
};
js.Node.get_crypto = function() {
	return js.Node.require("crypto");
};
js.Node.get_dgram = function() {
	return js.Node.require("dgram");
};
js.Node.get_dns = function() {
	return js.Node.require("dns");
};
js.Node.get_fs = function() {
	return js.Node.require("fs");
};
js.Node.get_http = function() {
	return js.Node.require("http");
};
js.Node.get_https = function() {
	return js.Node.require("https");
};
js.Node.get_net = function() {
	return js.Node.require("net");
};
js.Node.get_os = function() {
	return js.Node.require("os");
};
js.Node.get_path = function() {
	return js.Node.require("path");
};
js.Node.get_querystring = function() {
	return js.Node.require("querystring");
};
js.Node.get_repl = function() {
	return js.Node.require("repl");
};
js.Node.get_tls = function() {
	return js.Node.require("tls");
};
js.Node.get_url = function() {
	return js.Node.require("url");
};
js.Node.get_util = function() {
	return js.Node.require("util");
};
js.Node.get_vm = function() {
	return js.Node.require("vm");
};
js.Node.get_zlib = function() {
	return js.Node.require("zlib");
};
js.Node.get___filename = function() {
	return __filename;
};
js.Node.get___dirname = function() {
	return __dirname;
};
js.Node.get_json = function() {
	return JSON;
};
js.Node.newSocket = function(options) {
	return new js.Node.net.Socket(options);
};
var metahub = {};
metahub.Macros = function() { };
metahub.Macros.__name__ = ["metahub","Macros"];
var parser = {};
parser.Context = $hx_exports.parser.Context = function(definition) {
	this.draw_offsets = false;
	this.debug = false;
	this.definition = definition;
};
parser.Context.__name__ = ["parser","Context"];
parser.Context.prototype = {
	parse: function(text,silent) {
		if(silent == null) silent = true;
		this.text = text;
		if(this.definition.patterns.length == 0) throw new Error("Unable to parse; definition does not have any patterns.");
		var result = this.definition.patterns[0].test(new parser.Position(this),0);
		if(result.success) {
			var match = result;
			var offset = match.start.move(match.length);
			if(offset.get_offset() < text.length) {
				result.success = false;
				if(!silent) throw new Error("Could not find match at " + offset.get_coordinate_string() + " [" + (function($this) {
					var $r;
					var pos = offset.get_offset();
					$r = HxOverrides.substr(text,pos,null);
					return $r;
				}(this)) + "]");
			}
		}
		return result;
	}
	,perform_action: function(name,data,match) {
		return null;
	}
	,rewind: function(messages) {
		var previous = this.last_success;
		if(previous == null) {
			messages.push("Could not find previous text match.");
			return null;
		}
		var repetition = previous.get_repetition(messages);
		var i = 0;
		while(repetition == null) {
			previous = previous.last_success;
			if(previous == null) {
				messages.push("Could not find previous text match with repetition.");
				return null;
			}
			repetition = previous.get_repetition(messages);
			if(i++ > 20) throw new Error("Infinite loop looking for previous repetition.");
		}
		var pattern = repetition.pattern;
		if(repetition.matches.length > pattern.min) {
			repetition.matches.pop();
			messages.push("rewinding " + pattern.name + " " + previous.start.get_coordinate_string());
			repetition.children.pop();
			return previous.start;
		}
		messages.push("cannot rewind " + pattern.name + ", No other rewind options.");
		return null;
	}
	,__class__: parser.Context
};
parser.Bootstrap = $hx_exports.parser.Bootstrap = function(definition) {
	parser.Context.call(this,definition);
};
parser.Bootstrap.__name__ = ["parser","Bootstrap"];
parser.Bootstrap.__super__ = parser.Context;
parser.Bootstrap.prototype = $extend(parser.Context.prototype,{
	perform_action: function(name,data,match) {
		if(name == null) return data;
		switch(name) {
		case "group":
			return this.group(data);
		case "and_group":
			return this.and_group(data);
		case "or":
			return this.or_group(data);
		case "literal":
			return this.literal(data);
		case "pattern":
			return this.pattern(data,match);
		case "start":
			return this.start(data);
		case "repetition":
			return this.repetition(data);
		case "reference":
			return this.reference(data);
		case "regex":
			return this.regex(data);
		case "rule":
			return this.rule(data);
		default:
			throw new Error("Invalid parser method: " + name + ".");
		}
	}
	,literal: function(data) {
		return data[1];
	}
	,regex: function(data) {
		return { type : "regex", text : data[1]};
	}
	,reference: function(data) {
		return { type : "reference", name : data};
	}
	,and_group: function(data) {
		return { type : "and", patterns : data};
	}
	,group: function(data) {
		return data[2];
	}
	,or_group: function(data) {
		return { type : "or", patterns : data};
	}
	,pattern: function(data,match) {
		var value = data;
		var w = value.length;
		if(data.length == 0) return null; else if(data.length == 1) return data[0]; else return { type : "and", patterns : data};
	}
	,repetition: function(data) {
		var settings = data[1];
		var result = { type : "repetition", pattern : { type : "reference", name : settings[0]}, divider : { type : "reference", name : settings[1]}};
		if(settings.length > 2) {
			result.min = settings[2];
			if(settings.length > 3) result.max = settings[3];
		}
		return result;
	}
	,rule: function(data) {
		var value = data[4];
		return { name : data[0], value : value != null && value.length == 1?value[0]:value};
	}
	,start: function(data) {
		var map = { };
		var _g = 0;
		var _g1 = Reflect.fields(data);
		while(_g < _g1.length) {
			var index = _g1[_g];
			++_g;
			var item = Reflect.field(data,index);
			map[item.name] = item.value;
		}
		return map;
	}
	,__class__: parser.Bootstrap
});
parser.Definition = $hx_exports.parser.Definition = function() {
	this.pattern_keys = new haxe.ds.StringMap();
	this.patterns = new Array();
};
parser.Definition.__name__ = ["parser","Definition"];
parser.Definition.prototype = {
	load: function(source) {
		var _g = 0;
		var _g1 = Reflect.fields(source);
		while(_g < _g1.length) {
			var key = _g1[_g];
			++_g;
			var pattern = this.create_pattern(Reflect.field(source,key),true);
			pattern.name = key;
			this.pattern_keys.set(key,pattern);
			pattern;
			this.patterns.push(pattern);
		}
		var _g2 = 0;
		var _g11 = Reflect.fields(source);
		while(_g2 < _g11.length) {
			var key1 = _g11[_g2];
			++_g2;
			this.initialize_pattern(Reflect.field(source,key1),this.pattern_keys.get(key1),true);
		}
	}
	,__create_pattern: function(source) {
		if(typeof(source) == "string") return new parser.Literal(source);
		var _g = source.type;
		switch(_g) {
		case "reference":
			if(!(function($this) {
				var $r;
				var key = source.name;
				$r = $this.pattern_keys.exists(key);
				return $r;
			}(this))) throw new Error("There is no pattern named: " + Std.string(source.name));
			if(Object.prototype.hasOwnProperty.call(source,"action")) return new parser.Wrapper((function($this) {
				var $r;
				var key1 = source.name;
				$r = $this.pattern_keys.get(key1);
				return $r;
			}(this)),source.action); else {
				var key2 = source.name;
				return this.pattern_keys.get(key2);
			}
			break;
		case "regex":
			return new parser.Regex(source.text);
		case "and":
			return new parser.Group_And();
		case "or":
			return new parser.Group_Or();
		case "repetition":
			return new parser.Repetition();
		}
		haxe.Log.trace(source,{ fileName : "Definition.hx", lineNumber : 55, className : "parser.Definition", methodName : "__create_pattern"});
		throw new Error("Invalid parser pattern type: " + Std.string(source.type) + ".");
	}
	,create_pattern: function(source,root) {
		if(root == null) root = false;
		if(root && source.type == "reference") return new parser.Wrapper(null,null);
		var pattern = this.__create_pattern(source);
		if(pattern.type == null) if(source.type != null) pattern.type = source.type; else pattern.type = "literal";
		if(Object.prototype.hasOwnProperty.call(source,"backtrack")) pattern.backtrack = source.backtrack;
		return pattern;
	}
	,initialize_pattern: function(source,pattern,root) {
		if(root == null) root = false;
		if(root && source.type == "reference") {
			if(!(function($this) {
				var $r;
				var key = source.name;
				$r = $this.pattern_keys.exists(key);
				return $r;
			}(this))) throw new Error("There is no pattern named: " + Std.string(source.name));
			var wrapper = pattern;
			var key1 = source.name;
			wrapper.pattern = this.pattern_keys.get(key1);
			if(Object.prototype.hasOwnProperty.call(source,"action")) wrapper.action = source.action;
			return;
		}
		if(source.type == "and" || source.type == "or") {
			var group = pattern;
			if(Object.prototype.hasOwnProperty.call(source,"action")) group.action = source.action;
			var _g = 0;
			var _g1 = Reflect.fields(source.patterns);
			while(_g < _g1.length) {
				var key2 = _g1[_g];
				++_g;
				var child = Reflect.field(source.patterns,key2);
				var child_pattern = this.create_pattern(child);
				if(child_pattern == null) throw new Error("Null child pattern!");
				this.initialize_pattern(child,child_pattern);
				group.patterns.push(child_pattern);
			}
		} else if(source.type == "repetition") {
			var repetition = pattern;
			repetition.pattern = this.create_pattern(source.pattern);
			this.initialize_pattern(source.pattern,repetition.pattern);
			repetition.divider = this.create_pattern(source.divider);
			this.initialize_pattern(source.divider,repetition.divider);
			if(Object.prototype.hasOwnProperty.call(source,"min")) repetition.min = source.min;
			if(Object.prototype.hasOwnProperty.call(source,"max")) repetition.min = source.max;
			if(Object.prototype.hasOwnProperty.call(source,"action")) repetition.action = source.action;
		}
	}
	,load_parser_schema: function() {
		var data = "{\r\n  \"start\": {\r\n    \"type\": \"repetition\",\r\n    \"action\": \"start\",\r\n    \"pattern\": {\r\n      \"type\": \"reference\",\r\n      \"name\": \"rule\"\r\n    },\r\n    \"divider\": {\r\n      \"type\": \"reference\",\r\n      \"name\": \"whitespace\"\r\n    }\r\n  },\r\n\r\n  \"id\": {\r\n    \"type\": \"regex\",\r\n    \"text\": \"[a-zA-Z0-9_]+\"\r\n  },\r\n\r\n  \"whitespace\": {\r\n    \"type\": \"regex\",\r\n    \"text\": \"\\\\s+\"\r\n  },\r\n\r\n  \"trim\": {\r\n    \"type\": \"regex\",\r\n    \"text\": \"\\\\s*\"\r\n  },\r\n\r\n  \"comma\": {\r\n    \"type\": \"regex\",\r\n    \"text\": \"[ \\\\r\\\\n]*,[ \\\\r\\\\n]*\"\r\n  },\r\n\r\n  \"semicolon\": {\r\n    \"type\": \"regex\",\r\n    \"text\": \"[ \\\\r\\\\n]*;[ \\\\r\\\\n]*\"\r\n  },\r\n\r\n  \"literal\": {\r\n    \"type\": \"and\",\r\n    \"action\": \"literal\",\r\n    \"patterns\": [\r\n      \"\\\"\",\r\n      {\r\n        \"type\": \"regex\",\r\n        \"text\": \"([^\\\"]|\\\\\\\\\\\")+\"\r\n      },\r\n      \"\\\"\"\r\n    ]\r\n  },\r\n\r\n  \"literal_single_quote\": {\r\n    \"type\": \"and\",\r\n    \"action\": \"literal\",\r\n    \"patterns\": [\r\n      \"'\",\r\n      {\r\n        \"type\": \"regex\",\r\n        \"text\": \"([^']|\\\\\\\\')+\"\r\n      },\r\n      \"'\"\r\n    ]\r\n  },\r\n\r\n  \"regex\": {\r\n    \"type\": \"and\",\r\n    \"action\": \"regex\",\r\n    \"patterns\": [\r\n      \"/\",\r\n      {\r\n        \"type\": \"regex\",\r\n        \"text\": \"([^/]|\\\\\\\\/)+\"\r\n      },\r\n      \"/\"\r\n    ]\r\n  },\r\n\r\n  \"reference\": {\r\n    \"type\": \"reference\",\r\n    \"name\": \"id\",\r\n    \"action\": \"reference\"\r\n  },\r\n\r\n  \"repetition\": {\r\n    \"type\": \"and\",\r\n    \"action\": \"repetition\",\r\n    \"patterns\": [\r\n      \"@(\",\r\n      {\r\n        \"type\": \"repetition\",\r\n        \"pattern\": {\r\n          \"type\": \"reference\",\r\n          \"name\": \"id\"\r\n        },\r\n        \"divider\": {\r\n          \"type\": \"reference\",\r\n          \"name\": \"comma\"\r\n        }\r\n      },\r\n      \")\"\r\n    ]\r\n  },\r\n\r\n  \"rule\": {\r\n    \"type\": \"and\",\r\n    \"action\": \"rule\",\r\n    \"backtrack\": true,\r\n    \"patterns\": [\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"id\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"trim\"\r\n      },\r\n      \"=\",\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"trim\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"patterns\"\r\n      }\r\n    ]\r\n  },\r\n\r\n  \"patterns\": {\r\n    \"type\": \"repetition\",\r\n    \"action\": \"pattern\",\r\n    \"pattern\": {\r\n      \"type\": \"reference\",\r\n      \"name\": \"pattern\"\r\n    },\r\n    \"divider\": {\r\n      \"type\": \"reference\",\r\n      \"name\": \"whitespace\"\r\n    }\r\n  },\r\n\r\n  \"pattern\": {\r\n    \"type\": \"or\",\r\n    \"patterns\": [\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"or\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"group\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"repetition\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"reference\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"literal\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"regex\"\r\n      }\r\n    ]\r\n  },\r\n\r\n  \"or_divider\": {\r\n    \"type\": \"and\",\r\n    \"patterns\": [\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"trim\"\r\n      },\r\n      \"|\",\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"trim\"\r\n      }\r\n    ]\r\n  },\r\n\r\n  \"or\": {\r\n    \"type\": \"repetition\",\r\n    \"action\": \"or\",\r\n    \"min\": 2,\r\n    \"pattern\": {\r\n      \"type\": \"reference\",\r\n      \"name\": \"sub_patterns\"\r\n    },\r\n    \"divider\": {\r\n      \"type\": \"reference\",\r\n      \"name\": \"or_divider\"\r\n    }\r\n  },\r\n\r\n  \"sub_patterns\": {\r\n    \"type\": \"repetition\",\r\n    \"action\": \"pattern\",\r\n    \"pattern\": {\r\n      \"type\": \"reference\",\r\n      \"name\": \"sub_pattern\"\r\n    },\r\n    \"divider\": {\r\n      \"type\": \"reference\",\r\n      \"name\": \"whitespace\"\r\n    }\r\n  },\r\n\r\n  \"sub_pattern\": {\r\n    \"type\": \"or\",\r\n    \"patterns\": [\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"group\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"repetition\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"reference\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"literal\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"literal_single_quote\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"regex\"\r\n      }\r\n    ]\r\n  },\r\n\r\n  \"group\": {\r\n    \"type\": \"and\",\r\n    \"action\": \"group\",\r\n    \"patterns\": [\r\n      \"(\",\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"trim\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"sub_patterns\"\r\n      },\r\n      {\r\n        \"type\": \"reference\",\r\n        \"name\": \"trim\"\r\n      },\r\n      \")\"\r\n    ]\r\n  }\r\n}";
		this.load(JSON.parse(data));
	}
	,__class__: parser.Definition
};
parser.Result = function() { };
parser.Result.__name__ = ["parser","Result"];
parser.Result.prototype = {
	debug_info: function() {
		return "";
	}
	,__class__: parser.Result
};
parser.Failure = function(pattern,start,children) {
	this.pattern = pattern;
	this.start = start;
	this.success = false;
	if(children != null) this.children = children; else this.children = new Array();
};
parser.Failure.__name__ = ["parser","Failure"];
parser.Failure.__super__ = parser.Result;
parser.Failure.prototype = $extend(parser.Result.prototype,{
	__class__: parser.Failure
});
parser.Pattern = function() {
	this.backtrack = false;
};
parser.Pattern.__name__ = ["parser","Pattern"];
parser.Pattern.prototype = {
	test: function(position,depth) {
		var result = this.__test__(position,depth);
		if(!result.success && this.backtrack) {
			var previous = position.context.last_success;
			var messages = new Array();
			var new_position = previous.start.context.rewind(messages);
			if(previous.messages != null) previous.messages = previous.messages.concat(messages); else previous.messages = messages;
			if(new_position == null) return result;
			return this.__test__(new_position,depth);
		}
		return result;
	}
	,__test__: function(position,depth) {
		throw new Error("__test__ is an abstract function");
	}
	,debug_info: function() {
		return "";
	}
	,failure: function(position,children) {
		return new parser.Failure(this,position,children);
	}
	,success: function(position,length,children,matches) {
		return new parser.Match(this,position,length,children,matches);
	}
	,get_data: function(match) {
		return null;
	}
	,__class__: parser.Pattern
};
parser.Group = function() {
	this.patterns = new Array();
	parser.Pattern.call(this);
};
parser.Group.__name__ = ["parser","Group"];
parser.Group.__super__ = parser.Pattern;
parser.Group.prototype = $extend(parser.Pattern.prototype,{
	__class__: parser.Group
});
parser.Group_And = function() {
	parser.Group.call(this);
};
parser.Group_And.__name__ = ["parser","Group_And"];
parser.Group_And.__super__ = parser.Group;
parser.Group_And.prototype = $extend(parser.Group.prototype,{
	__test__: function(start,depth) {
		var length = 0;
		var position = start;
		var info_items = new Array();
		var matches = new Array();
		var _g = 0;
		var _g1 = this.patterns;
		while(_g < _g1.length) {
			var pattern = _g1[_g];
			++_g;
			var result = pattern.test(position,depth + 1);
			info_items.push(result);
			if(!result.success) return this.failure(start,info_items);
			var match = result;
			matches.push(match);
			position = position.move(match.length);
			length += match.length;
		}
		return this.success(start,length,info_items,matches);
	}
	,get_data: function(match) {
		var result = new Array();
		var _g = 0;
		var _g1 = match.matches;
		while(_g < _g1.length) {
			var child = _g1[_g];
			++_g;
			result.push(child.get_data());
		}
		return result;
	}
	,__class__: parser.Group_And
});
parser.Group_Or = function() {
	parser.Group.call(this);
};
parser.Group_Or.__name__ = ["parser","Group_Or"];
parser.Group_Or.__super__ = parser.Group;
parser.Group_Or.prototype = $extend(parser.Group.prototype,{
	__test__: function(position,depth) {
		var info_items = new Array();
		var _g = 0;
		var _g1 = this.patterns;
		while(_g < _g1.length) {
			var pattern = _g1[_g];
			++_g;
			var result = pattern.test(position,depth + 1);
			info_items.push(result);
			if(result.success) {
				var match = result;
				return this.success(position,match.length,info_items,[match]);
			}
		}
		return this.failure(position,info_items);
	}
	,get_data: function(match) {
		return match.matches[0].get_data();
	}
	,__class__: parser.Group_Or
});
parser.Literal = function(text) {
	parser.Pattern.call(this);
	this.text = text;
};
parser.Literal.__name__ = ["parser","Literal"];
parser.Literal.__super__ = parser.Pattern;
parser.Literal.prototype = $extend(parser.Pattern.prototype,{
	__test__: function(start,depth) {
		if((function($this) {
			var $r;
			var pos = start.get_offset();
			$r = HxOverrides.substr(start.context.text,pos,$this.text.length);
			return $r;
		}(this)) == this.text) return this.success(start,this.text.length);
		return this.failure(start);
	}
	,get_data: function(match) {
		return this.text;
	}
	,__class__: parser.Literal
});
parser.Match = function(pattern,start,length,children,matches) {
	if(length == null) length = 0;
	this.pattern = pattern;
	this.start = start;
	this.length = length;
	this.success = true;
	if(pattern.type == "regex" || pattern.type == "literal") {
		this.last_success = start.context.last_success;
		start.context.last_success = this;
	}
	if(children != null) this.children = children; else this.children = new Array();
	if(matches != null) {
		this.matches = matches;
		var _g = 0;
		while(_g < matches.length) {
			var match = matches[_g];
			++_g;
			match.parent = this;
		}
	} else this.matches = new Array();
};
parser.Match.__name__ = ["parser","Match"];
parser.Match.__super__ = parser.Result;
parser.Match.prototype = $extend(parser.Result.prototype,{
	debug_info: function() {
		var pos = this.start.get_offset();
		return HxOverrides.substr(this.start.context.text,pos,this.length);
	}
	,get_data: function() {
		var data = this.pattern.get_data(this);
		return this.start.context.perform_action(this.pattern.action,data,this);
	}
	,get_repetition: function(messages) {
		if(this.parent == null) {
			messages.push("Parent of " + this.pattern.name + " is null.");
			return null;
		}
		if(this.parent.pattern.type == "repetition") return this.parent;
		messages.push("Trying parent of " + this.pattern.name + ".");
		return this.parent.get_repetition(messages);
	}
	,__class__: parser.Match
});
parser.MetaHub_Context = $hx_exports.parser.MetaHub_Context = function(definition) {
	parser.Context.call(this,definition);
};
parser.MetaHub_Context.__name__ = ["parser","MetaHub_Context"];
parser.MetaHub_Context.start = function(data) {
	return { type : "block", expressions : data[1]};
};
parser.MetaHub_Context.create_symbol = function(data) {
	return { type : "symbol", name : data[2], expression : data[6]};
};
parser.MetaHub_Context.expression = function(data,match) {
	if(data.length < 2) return data[0];
	var rep_match = match;
	var operator = rep_match.dividers[0].matches[1].get_data();
	var operators = { '+' : "sum", '-' : "subtract"};
	return { type : "function", name : Reflect.field(operators,operator), inputs : data};
};
parser.MetaHub_Context.method = function(data) {
	return { type : "function", name : data[1], inputs : []};
};
parser.MetaHub_Context.create_constraint = function(data) {
	return { type : "specific_constraint", path : data[0], expression : data[4]};
};
parser.MetaHub_Context.create_node = function(data) {
	var result = { type : "node", trellis : data[2]};
	if(data[4] != null && data[4].length > 0) result.set = data[4][0];
	return result;
};
parser.MetaHub_Context.reference = function(data) {
	var reference = { type : "reference", path : data[0]};
	var methods = data[1];
	if(methods.length > 0) {
		var method = methods[0];
		method.inputs.unshift(reference);
		return method;
	} else return reference;
};
parser.MetaHub_Context.set_property_block = function(data) {
	var result = { };
	var items = data[2];
	var _g = 0;
	while(_g < items.length) {
		var item = items[_g];
		++_g;
		result[item[0]] = item[1];
	}
	return result;
};
parser.MetaHub_Context.set_property = function(data) {
	return [data[0],data[4]];
};
parser.MetaHub_Context.set_values = function(data) {
	return { type : "set", path : data[2], assignments : data[4]};
};
parser.MetaHub_Context.value = function(data) {
	return { type : "literal", value : data};
};
parser.MetaHub_Context.trellis_scope = function(data) {
	return { type : "trellis_scope", path : [data[0]], statements : data[2]};
};
parser.MetaHub_Context.constraint_block = function(data) {
	return data[2];
};
parser.MetaHub_Context.constraint = function(data) {
	return { type : "constraint", path : [data[0]], expression : data[4]};
};
parser.MetaHub_Context.__super__ = parser.Context;
parser.MetaHub_Context.prototype = $extend(parser.Context.prototype,{
	perform_action: function(name,data,match) {
		var name1 = match.pattern.name;
		switch(name1) {
		case "start":
			return parser.MetaHub_Context.start(data);
		case "create_symbol":
			return parser.MetaHub_Context.create_symbol(data);
		case "create_node":
			return parser.MetaHub_Context.create_node(data);
		case "create_constraint":
			return parser.MetaHub_Context.create_constraint(data);
		case "expression":
			return parser.MetaHub_Context.expression(data,match);
		case "method":
			return parser.MetaHub_Context.method(data);
		case "reference":
			return parser.MetaHub_Context.reference(data);
		case "set_property_block":
			return parser.MetaHub_Context.set_property_block(data);
		case "set_property":
			return parser.MetaHub_Context.set_property(data);
		case "set_values":
			return parser.MetaHub_Context.set_values(data);
		case "trellis_scope":
			return parser.MetaHub_Context.trellis_scope(data);
		case "constraint_block":
			return parser.MetaHub_Context.constraint_block(data);
		case "constraint":
			return parser.MetaHub_Context.constraint(data);
		case "string":
			return data[1];
		case "int":
			return Std.parseInt(data);
		case "value":
			return parser.MetaHub_Context.value(data);
		}
		return data;
	}
	,__class__: parser.MetaHub_Context
});
parser.Position = function(context,offset,y,x) {
	if(x == null) x = 1;
	if(y == null) y = 1;
	if(offset == null) offset = 0;
	this.context = context;
	this.offset = offset;
	this.y = y;
	this.x = x;
};
parser.Position.__name__ = ["parser","Position"];
parser.Position.pad = function(depth) {
	var result = "";
	var i = 0;
	while(i++ < depth) result += "  ";
	return result;
};
parser.Position.prototype = {
	get_offset: function() {
		return this.offset;
	}
	,get_coordinate_string: function() {
		return this.y + ":" + this.x + (this.context.draw_offsets?" " + this.offset:"");
	}
	,move: function(modifier) {
		if(modifier == 0) return this;
		var position = new parser.Position(this.context,this.offset,this.y,this.x);
		var i = 0;
		if(modifier > 0) do if(this.context.text.charAt(this.offset + i) == "\n") {
			++position.y;
			position.x = 1;
		} else ++position.x; while(++i < modifier);
		position.offset += modifier;
		return position;
	}
	,__class__: parser.Position
};
parser.Regex = function(text) {
	parser.Pattern.call(this);
	if(text.charAt(0) != "^") text = "^" + text;
	this.regex = new EReg(text,"");
	this.text = text;
};
parser.Regex.__name__ = ["parser","Regex"];
parser.Regex.__super__ = parser.Pattern;
parser.Regex.prototype = $extend(parser.Pattern.prototype,{
	__test__: function(start,depth) {
		if(!this.regex.matchSub(start.context.text,start.get_offset())) return this.failure(start);
		var match = this.regex.matched(0);
		return this.success(start,match.length);
	}
	,get_data: function(match) {
		var start = match.start;
		this.regex.matchSub(start.context.text,start.get_offset());
		return this.regex.matched(0);
	}
	,__class__: parser.Regex
});
parser.Repetition = function(min,max) {
	if(max == null) max = 0;
	if(min == null) min = 1;
	parser.Pattern.call(this);
	this.min = min;
	this.max = max;
};
parser.Repetition.__name__ = ["parser","Repetition"];
parser.Repetition.__super__ = parser.Pattern;
parser.Repetition.prototype = $extend(parser.Pattern.prototype,{
	__test__: function(start,depth) {
		var context = start.context;
		var position = start;
		var step = 0;
		var matches = new Array();
		var last_divider_length = 0;
		var length = 0;
		var info_items = new Array();
		var dividers = new Array();
		do {
			var result = this.pattern.test(position,depth + 1);
			info_items.push(result);
			if(!result.success) break;
			var match = result;
			position = match.start.move(match.length);
			length += match.length + last_divider_length;
			matches.push(match);
			++step;
			result = this.divider.test(position,depth + 1);
			info_items.push(result);
			if(!result.success) break;
			match = result;
			dividers.push(match);
			last_divider_length = match.length;
			position = position.move(match.length);
		} while(this.max < 1 || step < this.max);
		if(step < this.min) return this.failure(start,info_items);
		var $final = new parser.Repetition_Match(this,start,length,info_items,matches);
		$final.dividers = dividers;
		return $final;
	}
	,get_data: function(match) {
		var result = new Array();
		var _g = 0;
		var _g1 = match.matches;
		while(_g < _g1.length) {
			var child = _g1[_g];
			++_g;
			result.push(child.get_data());
		}
		return result;
	}
	,__class__: parser.Repetition
});
parser.Repetition_Match = function(pattern,start,length,children,matches) {
	parser.Match.call(this,pattern,start,length,children,matches);
};
parser.Repetition_Match.__name__ = ["parser","Repetition_Match"];
parser.Repetition_Match.__super__ = parser.Match;
parser.Repetition_Match.prototype = $extend(parser.Match.prototype,{
	__class__: parser.Repetition_Match
});
parser.Wrapper = function(pattern,action) {
	parser.Pattern.call(this);
	this.pattern = pattern;
	this.action = action;
};
parser.Wrapper.__name__ = ["parser","Wrapper"];
parser.Wrapper.__super__ = parser.Pattern;
parser.Wrapper.prototype = $extend(parser.Pattern.prototype,{
	__test__: function(start,depth) {
		var result = this.pattern.test(start,depth);
		if(!result.success) return this.failure(start,[result]);
		var match = result;
		return this.success(start,match.length,[result],[match]);
	}
	,get_data: function(match) {
		return match.matches[0].get_data();
	}
	,__class__: parser.Wrapper
});
var schema = {};
schema._Kind = {};
schema._Kind.Kind_Impl_ = function() { };
schema._Kind.Kind_Impl_.__name__ = ["schema","_Kind","Kind_Impl_"];
schema.Property = $hx_exports.schema.Property = function(name,source,trellis) {
	this.ports = new Array();
	this.multiple = false;
	this.type = Reflect.field(schema.Types,source.type);
	if(source.default_value != null) this.default_value = source.default_value;
	if(source.allow_null != null) this.allow_null = source.allow_null;
	if(source.multiple != null) this.multiple = source.multiple;
	this.name = name;
	this.trellis = trellis;
};
schema.Property.__name__ = ["schema","Property"];
schema.Property.prototype = {
	fullname: function() {
		return this.trellis.name + "." + this.name;
	}
	,get_default: function() {
		if(this.default_value != null) return this.default_value;
		var _g = this.type;
		switch(_g) {
		case 1:
			return 0;
		case 5:
			return 0;
		case 2:
			return "";
		case 6:
			return false;
		default:
			return null;
		}
	}
	,initialize_link: function(source) {
		var _g = this;
		if(source.type != "list" && source.type != "reference") return;
		this.other_trellis = this.trellis.schema.get_trellis(source.trellis);
		if(source.other_property != null) this.other_property = this.other_trellis.get_property(source.other_property); else {
			var other_properties = Lambda.filter(this.other_trellis.properties,function(p) {
				return p.other_trellis == _g.trellis;
			});
			if(other_properties.length > 1) throw new Error("Multiple ambiguous other properties for " + this.trellis.name + "." + this.name + "."); else if(other_properties.length == 1) {
				this.other_property = other_properties.first();
				this.other_property.other_trellis = this.trellis;
				this.other_property.other_property = this;
			}
		}
	}
	,__class__: schema.Property
};
schema.Property_Chain_Helper = function() { };
schema.Property_Chain_Helper.__name__ = ["schema","Property_Chain_Helper"];
schema.Property_Chain_Helper.flip = function(chain) {
	var result = new Array();
	var i = chain.length - 1;
	while(i >= 0) {
		if(chain[i].other_property != null) result.push(chain[i].other_property);
		--i;
	}
	return result;
};
schema.Property_Chain_Helper.from_string = function(path,trellis,start_index) {
	if(start_index == null) start_index = 0;
	var result = new Array();
	var _g1 = start_index;
	var _g = path.length;
	while(_g1 < _g) {
		var x = _g1++;
		var property = trellis.get_property(path[x]);
		result.push(property);
		trellis = property.other_trellis;
	}
	return result;
};
schema.Property_Chain_Helper.perform = function(chain,node,action,start) {
	if(start == null) start = 0;
	var _g1 = start;
	var _g = chain.length;
	while(_g1 < _g) {
		var i = _g1++;
		var link = chain[i];
		if(link.type == 4) {
			var list_port = node.get_port(link.id);
			var array = list_port.get_array();
			var _g2 = 0;
			while(_g2 < array.length) {
				var j = array[_g2];
				++_g2;
				schema.Property_Chain_Helper.perform(chain,node.hub.get_node(j),action,i + 1);
			}
			return;
		} else if(link.type == 3) {
			var id = node.get_value(link.id);
			node = node.hub.nodes[id];
		} else throw new Error("Not supported: " + link.name);
	}
	action(node);
};
schema.Property_Port = function(property,origin) {
	this.dependents = new Array();
	this.dependencies = new Array();
	this.property = property;
	this.origin = origin;
};
schema.Property_Port.__name__ = ["schema","Property_Port"];
schema.Property_Port.__interfaces__ = [engine.IPort];
schema.Property_Port.prototype = {
	add_dependency: function(other) {
		this.dependencies.push(other);
		other.dependents.push(this);
	}
	,get_type: function() {
		return this.property.type;
	}
	,get_value: function(context) {
		return context.entry_node.get_value(this.property.id);
	}
	,set_value: function(value,context) {
		this.exit(value,context);
		return value;
	}
	,enter: function(value,context) {
		this.update_dependents(value,context);
	}
	,exit: function(value,context) {
		var _g = this;
		if(context.property_port == null) throw new Error("Not implemented.");
		var entry_node = context.entry_node;
		schema.Property_Chain_Helper.perform(context.property_port.origin,entry_node,function(node) {
			node.set_value(_g.property.id,value);
		});
	}
	,update_dependents: function(value,context) {
		var _g = 0;
		var _g1 = this.dependents;
		while(_g < _g1.length) {
			var other = _g1[_g];
			++_g;
			other.set_value(value,context);
		}
	}
	,__class__: schema.Property_Port
};
schema.Schema = function() {
	this.trellis_keys = new haxe.ds.StringMap();
	this.trellises = new Array();
};
schema.Schema.__name__ = ["schema","Schema"];
schema.Schema.prototype = {
	add_trellis: function(name,trellis) {
		this.trellis_keys.set(name,trellis);
		trellis;
		this.trellises.push(trellis);
		return trellis;
	}
	,load_trellises: function(trellises) {
		var trellis;
		var source;
		var name;
		var _g = 0;
		var _g1 = Reflect.fields(trellises);
		while(_g < _g1.length) {
			var name1 = _g1[_g];
			++_g;
			source = Reflect.field(trellises,name1);
			trellis = this.trellis_keys.get(name1);
			if(trellis == null) trellis = this.add_trellis(name1,new schema.Trellis(name1,this));
			trellis.load_properties(source);
		}
		var _g2 = 0;
		var _g11 = Reflect.fields(trellises);
		while(_g2 < _g11.length) {
			var name2 = _g11[_g2];
			++_g2;
			source = Reflect.field(trellises,name2);
			trellis = this.trellis_keys.get(name2);
			trellis.initialize(source);
		}
	}
	,get_trellis: function(name) {
		if(!this.trellis_keys.exists(name)) throw new Error("Could not find trellis named: " + name + ".");
		return this.trellis_keys.get(name);
	}
	,__class__: schema.Schema
};
schema.Trellis = function(name,schema) {
	this.property_keys = new haxe.ds.StringMap();
	this.properties = new Array();
	this.name = name;
	this.schema = schema;
};
schema.Trellis.__name__ = ["schema","Trellis"];
schema.Trellis.prototype = {
	add_property: function(name,source) {
		var property = new schema.Property(name,source,this);
		this.property_keys.set(name,property);
		property;
		property.id = this.properties.length;
		this.properties.push(property);
		return property;
	}
	,get_all_properties: function() {
		var result = new haxe.ds.StringMap();
		var tree = this.get_tree();
		var _g = 0;
		while(_g < tree.length) {
			var trellis = tree[_g];
			++_g;
			var _g1 = 0;
			var _g2 = trellis.properties;
			while(_g1 < _g2.length) {
				var property = _g2[_g1];
				++_g1;
				result.set(property.name,property);
				property;
			}
		}
		return result;
	}
	,get_property: function(name) {
		var properties = this.get_all_properties();
		if(!properties.exists(name)) throw new Error(this.name + " does not contain a property named " + name + ".");
		return properties.get(name);
	}
	,get_value: function(index) {
		throw new Error("Cannot get value of a trellis property.");
	}
	,set_value: function(index,value) {
		throw new Error("Cannot set value of a trellis property.");
	}
	,get_tree: function() {
		var trellis = this;
		var tree = new Array();
		do {
			tree.unshift(trellis);
			trellis = trellis.parent;
		} while(trellis != null);
		return tree;
	}
	,is_a: function(trellis) {
		var current = this;
		do {
			if(current == trellis) return true;
			current = current.parent;
		} while(current != null);
		return false;
	}
	,load_properties: function(source) {
		var _g = 0;
		var _g1 = Reflect.fields(source.properties);
		while(_g < _g1.length) {
			var name = _g1[_g];
			++_g;
			this.add_property(name,Reflect.field(source.properties,name));
		}
	}
	,initialize: function(source) {
		var trellises = this.schema.trellises;
		if(source.parent != null) {
			var trellis = this.schema.get_trellis(source.parent);
			this.set_parent(trellis);
		}
		if(source.properties != null) {
			var _g = 0;
			var _g1 = Reflect.fields(source.properties);
			while(_g < _g1.length) {
				var j = _g1[_g];
				++_g;
				var property = this.get_property(j);
				property.initialize_link(Reflect.field(source.properties,j));
			}
		}
	}
	,set_parent: function(parent) {
		this.parent = parent;
	}
	,__class__: schema.Trellis
};
schema.Types = function() { };
schema.Types.__name__ = ["schema","Types"];
var sys = {};
sys.io = {};
sys.io.File = function() { };
sys.io.File.__name__ = ["sys","io","File"];
sys.io.File.append = function(path,binary) {
	throw "Not implemented";
	return null;
};
sys.io.File.copy = function(src,dst) {
	var content = js.Node.require("fs").readFileSync(src);
	js.Node.require("fs").writeFileSync(dst,content);
};
sys.io.File.getBytes = function(path) {
	var o = js.Node.require("fs").openSync(path,"r");
	var s = js.Node.require("fs").fstatSync(o);
	var len = s.size;
	var pos = 0;
	var bytes = haxe.io.Bytes.alloc(s.size);
	while(len > 0) {
		var r = js.Node.require("fs").readSync(o,bytes.b,pos,len,null);
		pos += r;
		len -= r;
	}
	js.Node.require("fs").closeSync(o);
	return bytes;
};
sys.io.File.getContent = function(path) {
	return js.Node.require("fs").readFileSync(path,sys.io.File.UTF8_ENCODING);
};
sys.io.File.saveContent = function(path,content) {
	js.Node.require("fs").writeFileSync(path,content);
};
sys.io.File.write = function(path,binary) {
	throw "Not implemented";
	return null;
};
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
String.prototype.__class__ = String;
String.__name__ = ["String"];
Array.__name__ = ["Array"];
if(Array.prototype.map == null) Array.prototype.map = function(f) {
	var a = [];
	var _g1 = 0;
	var _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		a[i] = f(this[i]);
	}
	return a;
};
js.Node.setTimeout = setTimeout;
js.Node.clearTimeout = clearTimeout;
js.Node.setInterval = setInterval;
js.Node.clearInterval = clearInterval;
js.Node.global = global;
js.Node.process = process;
js.Node.require = require;
js.Node.console = console;
js.Node.module = module;
js.Node.stringify = JSON.stringify;
js.Node.parse = JSON.parse;
var version = HxOverrides.substr(js.Node.process.version,1,null).split(".").map(Std.parseInt);
if(version[0] > 0 || version[1] >= 9) {
	js.Node.setImmediate = setImmediate;
	js.Node.clearImmediate = clearImmediate;
}
Hub.remove_comments = new EReg("#[^\n]*","g");
js.NodeC.UTF8 = "utf8";
js.NodeC.ASCII = "ascii";
js.NodeC.BINARY = "binary";
js.NodeC.BASE64 = "base64";
js.NodeC.HEX = "hex";
js.NodeC.EVENT_EVENTEMITTER_NEWLISTENER = "newListener";
js.NodeC.EVENT_EVENTEMITTER_ERROR = "error";
js.NodeC.EVENT_STREAM_DATA = "data";
js.NodeC.EVENT_STREAM_END = "end";
js.NodeC.EVENT_STREAM_ERROR = "error";
js.NodeC.EVENT_STREAM_CLOSE = "close";
js.NodeC.EVENT_STREAM_DRAIN = "drain";
js.NodeC.EVENT_STREAM_CONNECT = "connect";
js.NodeC.EVENT_STREAM_SECURE = "secure";
js.NodeC.EVENT_STREAM_TIMEOUT = "timeout";
js.NodeC.EVENT_STREAM_PIPE = "pipe";
js.NodeC.EVENT_PROCESS_EXIT = "exit";
js.NodeC.EVENT_PROCESS_UNCAUGHTEXCEPTION = "uncaughtException";
js.NodeC.EVENT_PROCESS_SIGINT = "SIGINT";
js.NodeC.EVENT_PROCESS_SIGUSR1 = "SIGUSR1";
js.NodeC.EVENT_CHILDPROCESS_EXIT = "exit";
js.NodeC.EVENT_HTTPSERVER_REQUEST = "request";
js.NodeC.EVENT_HTTPSERVER_CONNECTION = "connection";
js.NodeC.EVENT_HTTPSERVER_CLOSE = "close";
js.NodeC.EVENT_HTTPSERVER_UPGRADE = "upgrade";
js.NodeC.EVENT_HTTPSERVER_CLIENTERROR = "clientError";
js.NodeC.EVENT_HTTPSERVERREQUEST_DATA = "data";
js.NodeC.EVENT_HTTPSERVERREQUEST_END = "end";
js.NodeC.EVENT_CLIENTREQUEST_RESPONSE = "response";
js.NodeC.EVENT_CLIENTRESPONSE_DATA = "data";
js.NodeC.EVENT_CLIENTRESPONSE_END = "end";
js.NodeC.EVENT_NETSERVER_CONNECTION = "connection";
js.NodeC.EVENT_NETSERVER_CLOSE = "close";
js.NodeC.FILE_READ = "r";
js.NodeC.FILE_READ_APPEND = "r+";
js.NodeC.FILE_WRITE = "w";
js.NodeC.FILE_WRITE_APPEND = "a+";
js.NodeC.FILE_READWRITE = "a";
js.NodeC.FILE_READWRITE_APPEND = "a+";
schema._Kind.Kind_Impl_["void"] = 0;
schema._Kind.Kind_Impl_["int"] = 1;
schema._Kind.Kind_Impl_.string = 2;
schema._Kind.Kind_Impl_.reference = 3;
schema._Kind.Kind_Impl_.list = 4;
schema._Kind.Kind_Impl_["float"] = 5;
schema._Kind.Kind_Impl_.bool = 6;
schema._Kind.Kind_Impl_.unknown = 7;
schema.Types["void"] = 0;
schema.Types["int"] = 1;
schema.Types.string = 2;
schema.Types.reference = 3;
schema.Types.list = 4;
schema.Types["float"] = 5;
schema.Types.bool = 6;
schema.Types.unknown = 7;
sys.io.File.UTF8_ENCODING = { encoding : "utf8"};
Main.main();
})(typeof window != "undefined" ? window : exports);

//# sourceMappingURL=metahub.js.map