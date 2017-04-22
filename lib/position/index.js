'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = position;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _util = require('../util');

var _bk = require('./bk');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function positionY(g) {
  var layering = (0, _util.buildLayerMatrix)(g);
  var rankSep = g.graph().ranksep;
  var prevY = 0;
  _lodash2.default.forEach(layering, function (layer) {
    var maxHeight = _lodash2.default.max(_lodash2.default.map(layer, function (v) {
      return g.node(v).height;
    }));
    _lodash2.default.forEach(layer, function (v) {
      g.node(v).y = prevY + maxHeight / 2;
    });
    prevY += maxHeight + rankSep;
  });
}

function position(g) {
  g = (0, _util.asNonCompoundGraph)(g);

  positionY(g);
  _lodash2.default.forEach((0, _bk.positionX)(g), function (x, v) {
    g.node(v).x = x;
  });
}
module.exports = exports['default'];