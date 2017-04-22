'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.debugOrdering = debugOrdering;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _util = require('./util');

var _cienaGraphlib = require('ciena-graphlib');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function debugOrdering(g) {
  var layerMatrix = (0, _util.buildLayerMatrix)(g);

  var h = new _cienaGraphlib.Graph({ compound: true, multigraph: true }).setGraph({});

  _lodash2.default.forEach(g.nodes(), function (v) {
    h.setNode(v, { label: v });
    h.setParent(v, 'layer' + g.node(v).rank);
  });

  _lodash2.default.forEach(g.edges(), function (e) {
    h.setEdge(e.v, e.w, {}, e.name);
  });

  _lodash2.default.forEach(layerMatrix, function (layer, i) {
    var layerV = 'layer' + i;
    h.setNode(layerV, { rank: 'same' });
    _lodash2.default.reduce(layer, function (u, v) {
      h.setEdge(u, v, { style: 'invis' });
      return v;
    });
  });

  return h;
}