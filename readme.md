# Better Approach To Getting Interconnected Relation Lists

Find the shortest path(s) in a network of nodes. Somewhat inspired by [Batman](http://en.wikipedia.org/wiki/B.A.T.M.A.N.).

## Install

```
npm install batgirl
```

## API

### batgirl(edges);

Create an instance of batgirl. `edges` is an array containing edges defined as pairs of nodes:

```javascript
[
	[nodeid, nodeid], // edge
	[nodeid, nodeid],
	...
]
```

### batgirl.find(a, b, function(err, result){})

Find all shortest paths between nodes `a` and `b`. `result` is a (possibly empty) array containing lists of nodes.

### batgirl.add(a, b, function(err){})

Add edge with nodes `a` and `b`.

### batgirl.remove(a, b, function(err){})

Remove edge with nodes `a` and `b`.

## Example

```javascript

var batgirl = require("batgirl");

batgirl([[1,2],[1,3],[3,4],[2,5],[6,7],[1,9],[9,5]]).find(1,5, console.log);

```
