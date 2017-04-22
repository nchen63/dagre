'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (g) {
  function dfs(v) {
    var children = g.children(v);
    var node = g.node(v);
    if (children.length) {
      _lodash2.default.forEach(children, dfs);
    }

    if (_lodash2.default.has(node, 'minRank')) {
      node.borderLeft = [];
      node.borderRight = [];
      for (var rank = node.minRank, maxRank = node.maxRank + 1; rank < maxRank; ++rank) {
        addBorderNode(g, 'borderLeft', '_bl', v, node, rank);
        addBorderNode(g, 'borderRight', '_br', v, node, rank);
      }
    }
  }

  _lodash2.default.forEach(g.children(), dfs);
};

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addBorderNode(g, prop, prefix, sg, sgNode, rank) {
  var label = { width: 0, height: 0, rank: rank, borderType: prop };
  var prev = sgNode[prop][rank - 1];
  var curr = (0, _util.addDummyNode)(g, 'border', label, prefix);
  sgNode[prop][rank] = curr;
  g.setParent(curr, sg);
  if (prev) {
    g.setEdge(prev, curr, { weight: 1 });
  }
}

module.exports = exports['default'];