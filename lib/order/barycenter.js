'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = barycenter;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function barycenter(g, movable) {
  return _lodash2.default.map(movable, function (v) {
    var inV = g.inEdges(v);
    if (!inV.length) {
      return { v: v };
    } else {
      var result = _lodash2.default.reduce(inV, function (acc, e) {
        var edge = g.edge(e);
        var nodeU = g.node(e.v);
        return {
          sum: acc.sum + edge.weight * nodeU.order,
          weight: acc.weight + edge.weight
        };
      }, { sum: 0, weight: 0 });

      return {
        v: v,
        barycenter: result.sum / result.weight,
        weight: result.weight
      };
    }
  });
}
module.exports = exports['default'];