
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
	
	// build node index
	self.nodes = {};
	edges.forEach(function(edge){
		if (!self.nodes.hasOwnProperty(edge[0])) self.nodes[edge[0]] = { id: edge[0], neighbours:[], distance: Infinity };
		if (!self.nodes.hasOwnProperty(edge[1])) self.nodes[edge[1]] = { id: edge[1], neighbours:[], distance: Infinity };
		self.nodes[edge[0]].neighbours.push(self.nodes[edge[1]]);
		self.nodes[edge[1]].neighbours.push(self.nodes[edge[0]]);
	});

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

		// keep stack and checklist
		var stack = [];
		var checklist = {};

		// check if nodes exist
		if (!self.nodes.hasOwnProperty(a) || !self.nodes.hasOwnProperty(b)) {
			debug("[find] invalid nodes: %s ↔ %s", a, b);
			fn(new Error("Invalid nodes"));
			next();
		};

		// set start node distance to zero
		self.nodes[a].distance = 0;
		
		// add start node to stack
		if (!checklist.hasOwnProperty(a)){
			stack.push(self.nodes[a]);
			checklist[a] = true;
		};
		
		// iterate over stack to build distance index
		while (stack.length > 0) {
			
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
		
		debug("[find] stack is 0");

		// get paths to end node
		var result = self.paths(self.nodes[b]).map(function(path){
			console.log("PATH", path);
			return path.map(function(node){
				return node.id;
			});
		});

		// call back with result
		fn(null, result)
		
		// reset data
		Object.keys(self.nodes).forEach(function(id){
			self.nodes[id] = { id: id, neighbours: [], distance: Infinity };
		});
		
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

module.exports = batgirl;