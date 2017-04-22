'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sortSubgraph;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _barycenter = require('./barycenter');

var _barycenter2 = _interopRequireDefault(_barycenter);

var _resolveConflicts = require('./resolve-conflicts');

var _resolveConflicts2 = _interopRequireDefault(_resolveConflicts);

var _sort = require('./sort');

var _sort2 = _interopRequireDefault(_sort);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function expandSubgraphs(entries, subgraphs) {
  _lodash2.default.forEach(entries, function (entry) {
    entry.vs = _lodash2.default.flatten(entry.vs.map(function (v) {
      if (subgraphs[v]) {
        return subgraphs[v].vs;
      }
      return v;
    }), true);
  });
}

function mergeBarycenters(target, other) {
  if (!_lodash2.default.isUndefined(target.barycenter)) {
    target.barycenter = (target.barycenter * target.weight + other.barycenter * other.weight) / (target.weight + other.weight);
    target.weight += other.weight;
  } else {
    target.barycenter = other.barycenter;
    target.weight = other.weight;
  }
}

function sortSubgraph(g, v, cg, biasRight) {
  var movable = g.children(v);
  var node = g.node(v);
  var bl = node ? node.borderLeft : undefined;
  var br = node ? node.borderRight : undefined;
  var subgraphs = {};

  if (bl) {
    movable = _lodash2.default.filter(movable, function (w) {
      return w !== bl && w !== br;
    });
  }

  var barycenters = (0, _barycenter2.default)(g, movable);
  _lodash2.default.forEach(barycenters, function (entry) {
    if (g.children(entry.v).length) {
      var subgraphResult = sortSubgraph(g, entry.v, cg, biasRight);
      subgraphs[entry.v] = subgraphResult;
      if (_lodash2.default.has(subgraphResult, 'barycenter')) {
        mergeBarycenters(entry, subgraphResult);
      }
    }
  });

  var entries = (0, _resolveConflicts2.default)(barycenters, cg);
  expandSubgraphs(entries, subgraphs);

  var result = (0, _sort2.default)(entries, biasRight);

  if (bl) {
    result.vs = _lodash2.default.flatten([bl, result.vs, br], true);
    if (g.predecessors(bl).length) {
      var blPred = g.node(g.predecessors(bl)[0]);
      var brPred = g.node(g.predecessors(br)[0]);
      if (!_lodash2.default.has(result, 'barycenter')) {
        result.barycenter = 0;
        result.weight = 0;
      }
      result.barycenter = (result.barycenter * result.weight + blPred.order + brPred.order) / (result.weight + 2);
      result.weight += 2;
    }
  }

  return result;
}
module.exports = exports['default'];