
var debug = require("debug")("batgirl");
var async = require("async");

function batgirl(edges){
	if (!(this instanceof batgirl)) return new batgirl(edges);
	var self = this;
	
	// queue
	self.queue = async.queue(function(fn,next){
		var t = Date.now();
		debug("[queue] start");
		fn(function(){
			debug("[queue] finished in +%dms", (Date.now()-t));
			next();
		});
	},1);
	
	// keep edges
	self.edges = edges;
	
	return this;
};

batgirl.prototype.find = function(a, b, fn){
	var self = this;

	debug("[find] searching for route: %s ↔ %s", a, b);

	// take a shortcut for non-routes
	if (a === b) {
		debug("[find] none-route detected: %s = %s", a, b);
		fn(null, [[a]]);
		return this;
	};

	self.queue.push(function(next){

		// build node index
		var nodes = {};
		self.edges.forEach(function(edge){
			if (!nodes.hasOwnProperty(edge[0])) nodes[edge[0]] = { id: edge[0], neighbours:[], distance: Infinity };
			if (!nodes.hasOwnProperty(edge[1])) nodes[edge[1]] = { id: edge[1], neighbours:[], distance: Infinity };
			nodes[edge[0]].neighbours.push(nodes[edge[1]]);
			nodes[edge[1]].neighbours.push(nodes[edge[0]]);
		});
		debug("[find] node index created with %d nodes", Object.keys(nodes).length);

		// keep stack and checklist
		var stack = [];
		var checklist = {};

		// check if nodes exist
		if (!nodes.hasOwnProperty(a) || !nodes.hasOwnProperty(b)) {
			debug("[find] invalid nodes: %s ↔ %s", a, b);
			fn(new Error("Invalid nodes"));
			next();
			return;
		};

		// set start node distance to zero
		nodes[a].distance = 0;
		
		// add start node to stack
		if (!checklist.hasOwnProperty(a)){
			stack.push(nodes[a]);
			checklist[a] = true;
		};
		
		// iterate over stack to build distance index
		var _iterations = 0;
		while (stack.length > 0) {
			_iterations++;
			
			// debug("[find] stack is %s", stack.length);
			
			// get next item from stack
			var node = stack.shift();

			// mark as checked
			checklist[node.id] = false;
			
			// iterate over items neighbours
			node.neighbours.forEach(function(neighbour) {

				// check if distance to start is shorter via current node
				if (neighbour.distance > node.distance + 1) {

					// propagate shorter distance to neighbour
					neighbour.distance = node.distance + 1;

					// add neighbour to stack
					if (!checklist.hasOwnProperty(neighbour.id) || checklist[neighbour.id] === false){
						stack.push(neighbour);
						checklist[neighbour.id] = true;
					};
				};
			});
		};
		
		debug("[find] cleared stack after %d iterations", _iterations);

		// get paths to end node
		var result = self.paths(nodes[b]).map(function(path){
			return path.map(function(node){
				return node.id;
			});
		});
		
		if (result.length >= 1) {
			debug("[find] found %d results with %d links", result.length, result[0].length);
		} else {
			debug("[find] found no results");
		};

		// call back with result
		fn(null, result)
				
		// finish queue
		next();

	});
	return this;
};

// find the shortest paths recursively
batgirl.prototype.paths = function(node){

	var self = this;

	// check if destination is reached
   if (node.distance === 0) return [node];

   var paths = [];

	// iterate over neigbours
   node.neighbours.forEach(function(neighbour){

		// check if neighbour has a shorter path
		if (neighbour.distance < node.distance) {

			// find all paths for neighbours and add them to result
			self.paths(neighbour).forEach(function(path){
				paths.push([node].concat(path));
			});
		};
   });

	// return result
   return paths;
	
};

// add edge
batgirl.prototype.add = function(a, b, fn){
	var self = this;

	debug("[add] adding edge: %s ↔ %s", a, b);

	// polyfill callback
	if (typeof fn !== "function") var fn = function(){};

	// remove edge first in case they are double
	self.remove(a, b, function(err){
		if (err) return fn(err);
		self.edges.push([a, b]);
		fn(null);
	});

	return this;
};

// remove edge
batgirl.prototype.remove = function(a, b, fn){
	var self = this;

	debug("[remove] removing edge: %s ↔ %s", a, b);

	// polyfill callback
	if (typeof fn !== "function") var fn = function(){};

	debug("before: %s", self.edges.length);

	// filter edges
	self.edges = self.edges.filter(function(edge){
		if (edge[0] !== a && edge[1] !== a) return true;
		return !((edge[0] === a && edge[1] === b) || (edge[0] === b && edge[1] === a));
	});
	debug("after: %s", self.edges.length);
	fn(null);

	return this;
};

module.exports = batgirl;