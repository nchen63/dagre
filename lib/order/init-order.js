'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initOrder;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Assigns an initial order value for each node by performing a DFS search
 * starting from nodes in the first rank. Nodes are assigned an order in their
 * rank as they are first visited.
 *
 * This approach comes from Gansner, et al., "A Technique for Drawing Directed
 * Graphs."
 *
 * Returns a layering matrix with an array per layer and each layer sorted by
 * the order of its nodes.
 */
function initOrder(g) {
  var visited = {};
  var simpleNodes = _lodash2.default.filter(g.nodes(), function (v) {
    return !g.children(v).length;
  });
  var maxRank = _lodash2.default.max(_lodash2.default.map(simpleNodes, function (v) {
    return g.node(v).rank;
  }));
  var layers = _lodash2.default.map(_lodash2.default.range(maxRank + 1), function () {
    return [];
  });

  function dfs(v) {
    if (_lodash2.default.has(visited, v)) return;
    visited[v] = true;
    var node = g.node(v);
    layers[node.rank].push(v);
    _lodash2.default.forEach(g.successors(v), dfs);
  }

  var orderedVs = _lodash2.default.sortBy(simpleNodes, function (v) {
    return g.node(v).rank;
  });
  _lodash2.default.forEach(orderedVs, dfs);

  return layers;
}
module.exports = exports['default'];