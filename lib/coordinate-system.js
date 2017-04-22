'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.adjust = adjust;
exports.undo = undo;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function swapWidthHeight(g) {
  _lodash2.default.forEach(g.nodes(), function (v) {
    swapWidthHeightOne(g.node(v));
  });
  _lodash2.default.forEach(g.edges(), function (e) {
    swapWidthHeightOne(g.edge(e));
  });
}

function swapWidthHeightOne(attrs) {
  var w = attrs.width;
  attrs.width = attrs.height;
  attrs.height = w;
}

function reverseY(g) {
  _lodash2.default.forEach(g.nodes(), function (v) {
    reverseYOne(g.node(v));
  });

  _lodash2.default.forEach(g.edges(), function (e) {
    var edge = g.edge(e);
    _lodash2.default.forEach(edge.points, reverseYOne);
    if (_lodash2.default.has(edge, 'y')) {
      reverseYOne(edge);
    }
  });
}

function reverseYOne(attrs) {
  attrs.y = -attrs.y;
}

function swapXY(g) {
  _lodash2.default.forEach(g.nodes(), function (v) {
    swapXYOne(g.node(v));
  });

  _lodash2.default.forEach(g.edges(), function (e) {
    var edge = g.edge(e);
    _lodash2.default.forEach(edge.points, swapXYOne);
    if (_lodash2.default.has(edge, 'x')) {
      swapXYOne(edge);
    }
  });
}

function swapXYOne(attrs) {
  var x = attrs.x;
  attrs.x = attrs.y;
  attrs.y = x;
}

function adjust(g) {
  var rankDir = g.graph().rankdir.toLowerCase();
  if (rankDir === 'lr' || rankDir === 'rl') {
    swapWidthHeight(g);
  }
}

function undo(g) {
  var rankDir = g.graph().rankdir.toLowerCase();
  if (rankDir === 'bt' || rankDir === 'rl') {
    reverseY(g);
  }

  if (rankDir === 'lr' || rankDir === 'rl') {
    swapXY(g);
    swapWidthHeight(g);
  }
}