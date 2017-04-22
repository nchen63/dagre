'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rank;

var _util = require('./util');

var _feasibleTree = require('./feasible-tree');

var _feasibleTree2 = _interopRequireDefault(_feasibleTree);

var _networkSimplex = require('./network-simplex');

var _networkSimplex2 = _interopRequireDefault(_networkSimplex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// A fast and simple ranker, but results are far from optimal.
var longestPathRanker = _util.longestPath;

function tightTreeRanker(g) {
  (0, _util.longestPath)(g);
  (0, _feasibleTree2.default)(g);
}

function networkSimplexRanker(g) {
  (0, _networkSimplex2.default)(g);
}

/*
 * Assigns a rank to each node in the input graph that respects the "minlen"
 * constraint specified on edges between nodes.
 *
 * This basic structure is derived from Gansner, et al., "A Technique for
 * Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    1. Graph must be a connected DAG
 *    2. Graph nodes must be objects
 *    3. Graph edges must have "weight" and "minlen" attributes
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have a "rank" attribute based on the results of the
 *       algorithm. Ranks can start at any index (including negative), we'll
 *       fix them up later.
 */
function rank(g) {
  switch (g.graph().ranker) {
    case 'network-simplex':
      networkSimplexRanker(g);break;
    case 'tight-tree':
      tightTreeRanker(g);break;
    case 'longest-path':
      longestPathRanker(g);break;
    default:
      networkSimplexRanker(g);
  }
}
module.exports = exports['default'];