'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = crossCount;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function twoLayerCrossCount(g, northLayer, southLayer) {
  // Sort all of the edges between the north and south layers by their position
  // in the north layer and then the south. Map these edges to the position of
  // their head in the south layer.
  var southPos = _lodash2.default.zipObject(southLayer, _lodash2.default.map(southLayer, function (v, i) {
    return i;
  }));
  var southEntries = _lodash2.default.flatten(_lodash2.default.map(northLayer, function (v) {
    return _lodash2.default.chain(g.outEdges(v)).map(function (e) {
      return { pos: southPos[e.w], weight: g.edge(e).weight };
    }).sortBy('pos').value();
  }), true);

  // Build the accumulator tree
  var firstIndex = 1;
  while (firstIndex < southLayer.length) {
    firstIndex <<= 1;
  }var treeSize = 2 * firstIndex - 1;
  firstIndex -= 1;
  var tree = _lodash2.default.map(new Array(treeSize), function () {
    return 0;
  });

  // Calculate the weighted crossings
  var cc = 0;
  _lodash2.default.forEach(southEntries.forEach(function (entry) {
    var index = entry.pos + firstIndex;
    tree[index] += entry.weight;
    var weightSum = 0;
    while (index > 0) {
      if (index % 2) {
        weightSum += tree[index + 1];
      }
      index = index - 1 >> 1;
      tree[index] += entry.weight;
    }
    cc += entry.weight * weightSum;
  }));

  return cc;
}

/*
 * A function that takes a layering (an array of layers, each with an array of
 * ordererd nodes) and a graph and returns a weighted crossing count.
 *
 * Pre-conditions:
 *
 *    1. Input graph must be simple (not a multigraph), directed, and include
 *       only simple edges.
 *    2. Edges in the input graph must have assigned weights.
 *
 * Post-conditions:
 *
 *    1. The graph and layering matrix are left unchanged.
 *
 * This algorithm is derived from Barth, et al., "Bilayer Cross Counting."
 */
function crossCount(g, layering) {
  var cc = 0;
  for (var i = 1; i < layering.length; ++i) {
    cc += twoLayerCrossCount(g, layering[i - 1], layering[i]);
  }
  return cc;
}
module.exports = exports['default'];