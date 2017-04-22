'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = order;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _initOrder = require('./init-order');

var _initOrder2 = _interopRequireDefault(_initOrder);

var _crossCount = require('./cross-count');

var _crossCount2 = _interopRequireDefault(_crossCount);

var _sortSubgraph = require('./sort-subgraph');

var _sortSubgraph2 = _interopRequireDefault(_sortSubgraph);

var _buildLayerGraph = require('./build-layer-graph');

var _buildLayerGraph2 = _interopRequireDefault(_buildLayerGraph);

var _addSubgraphConstraints = require('./add-subgraph-constraints');

var _addSubgraphConstraints2 = _interopRequireDefault(_addSubgraphConstraints);

var _cienaGraphlib = require('ciena-graphlib');

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function buildLayerGraphs(g, ranks, relationship) {
  return _lodash2.default.map(ranks, function (rank) {
    return (0, _buildLayerGraph2.default)(g, rank, relationship);
  });
}

function sweepLayerGraphs(layerGraphs, biasRight) {
  var cg = new _cienaGraphlib.Graph();
  _lodash2.default.forEach(layerGraphs, function (lg) {
    var root = lg.graph().root;
    var sorted = (0, _sortSubgraph2.default)(lg, root, cg, biasRight);
    _lodash2.default.forEach(sorted.vs, function (v, i) {
      lg.node(v).order = i;
    });
    (0, _addSubgraphConstraints2.default)(lg, cg, sorted.vs);
  });
}

function assignOrder(g, layering) {
  _lodash2.default.forEach(layering, function (layer) {
    _lodash2.default.forEach(layer, function (v, i) {
      g.node(v).order = i;
    });
  });
}

/*
 * Applies heuristics to minimize edge crossings in the graph and sets the best
 * order solution as an order attribute on each node.
 *
 * Pre-conditions:
 *
 *    1. Graph must be DAG
 *    2. Graph nodes must be objects with a "rank" attribute
 *    3. Graph edges must have the "weight" attribute
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have an "order" attribute based on the results of the
 *       algorithm.
 */
function order(g) {
  var mr = (0, _util.maxRank)(g);
  var downLayerGraphs = buildLayerGraphs(g, _lodash2.default.range(1, mr + 1), 'inEdges');
  var upLayerGraphs = buildLayerGraphs(g, _lodash2.default.range(mr - 1, -1, -1), 'outEdges');

  var layering = (0, _initOrder2.default)(g);
  assignOrder(g, layering);

  var bestCC = Number.POSITIVE_INFINITY;
  var best;

  for (var i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
    sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);

    layering = (0, _util.buildLayerMatrix)(g);
    var cc = (0, _crossCount2.default)(g, layering);
    if (cc < bestCC) {
      lastBest = 0;
      best = _lodash2.default.cloneDeep(layering);
      bestCC = cc;
    }
  }

  assignOrder(g, best);
}
module.exports = exports['default'];