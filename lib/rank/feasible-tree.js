'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = feasibleTree;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _cienaGraphlib = require('ciena-graphlib');

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Finds a maximal tree of tight edges and returns the number of nodes in the
 * tree.
 */
function tightTree(t, g) {
  function dfs(v) {
    _lodash2.default.forEach(g.nodeEdges(v), function (e) {
      var edgeV = e.v;
      var w = v === edgeV ? e.w : edgeV;
      if (!t.hasNode(w) && !(0, _util.slack)(g, e)) {
        t.setNode(w, {});
        t.setEdge(v, w, {});
        dfs(w);
      }
    });
  }

  _lodash2.default.forEach(t.nodes(), dfs);
  return t.nodeCount();
}

/*
 * Finds the edge with the smallest slack that is incident on tree and returns
 * it.
 */
function findMinSlackEdge(t, g) {
  return _lodash2.default.minBy(g.edges(), function (e) {
    if (t.hasNode(e.v) !== t.hasNode(e.w)) {
      return (0, _util.slack)(g, e);
    }
  });
}

function shiftRanks(t, g, delta) {
  _lodash2.default.forEach(t.nodes(), function (v) {
    g.node(v).rank += delta;
  });
}

/*
 * Constructs a spanning tree with tight edges and adjusted the input node's
 * ranks to achieve this. A tight edge is one that is has a length that matches
 * its "minlen" attribute.
 *
 * The basic structure for this function is derived from Gansner, et al., "A
 * Technique for Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    1. Graph must be a DAG.
 *    2. Graph must be connected.
 *    3. Graph must have at least one node.
 *    5. Graph nodes must have been previously assigned a "rank" property that
 *       respects the "minlen" property of incident edges.
 *    6. Graph edges must have a "minlen" property.
 *
 * Post-conditions:
 *
 *    - Graph nodes will have their rank adjusted to ensure that all edges are
 *      tight.
 *
 * Returns a tree (undirected graph) that is constructed using only "tight"
 * edges.
 */
function feasibleTree(g) {
  var t = new _cienaGraphlib.Graph({ directed: false });

  // Choose arbitrary node from which to start our tree
  var start = g.nodes()[0];
  var size = g.nodeCount();
  t.setNode(start, {});

  var edge, delta;
  while (tightTree(t, g) < size) {
    edge = findMinSlackEdge(t, g);
    delta = t.hasNode(edge.v) ? (0, _util.slack)(g, edge) : -(0, _util.slack)(g, edge);
    shiftRanks(t, g, delta);
  }

  return t;
}
module.exports = exports['default'];