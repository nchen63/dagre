'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = layout;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _acyclic = require('./acyclic');

var _normalize = require('./normalize');

var _rank = require('./rank');

var _rank2 = _interopRequireDefault(_rank);

var _util = require('./util');

var _parentDummyChains = require('./parent-dummy-chains');

var _parentDummyChains2 = _interopRequireDefault(_parentDummyChains);

var _nestingGraph = require('./nesting-graph');

var _addBorderSegments = require('./add-border-segments');

var _addBorderSegments2 = _interopRequireDefault(_addBorderSegments);

var _coordinateSystem = require('./coordinate-system');

var _order = require('./order');

var _order2 = _interopRequireDefault(_order);

var _position = require('./position');

var _position2 = _interopRequireDefault(_position);

var _cienaGraphlib = require('ciena-graphlib');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function runLayout(g, time) {
  time('    makeSpaceForEdgeLabels', function () {
    makeSpaceForEdgeLabels(g);
  });
  time('    removeSelfEdges', function () {
    removeSelfEdges(g);
  });
  time('    acyclic', function () {
    (0, _acyclic.run)(g);
  });
  time('    nestingGraph.run', function () {
    (0, _nestingGraph.run)(g);
  });
  time('    rank', function () {
    (0, _rank2.default)((0, _util.asNonCompoundGraph)(g));
  });
  time('    injectEdgeLabelProxies', function () {
    injectEdgeLabelProxies(g);
  });
  time('    removeEmptyRanks', function () {
    (0, _util.removeEmptyRanks)(g);
  });
  time('    nestingGraph.cleanup', function () {
    (0, _nestingGraph.cleanup)(g);
  });
  time('    normalizeRanks', function () {
    (0, _util.normalizeRanks)(g);
  });
  time('    assignRankMinMax', function () {
    assignRankMinMax(g);
  });
  time('    removeEdgeLabelProxies', function () {
    removeEdgeLabelProxies(g);
  });
  time('    normalize.run', function () {
    (0, _normalize.run)(g);
  });
  time('    parentDummyChains', function () {
    (0, _parentDummyChains2.default)(g);
  });
  time('    addBorderSegments', function () {
    (0, _addBorderSegments2.default)(g);
  });
  time('    order', function () {
    (0, _order2.default)(g);
  });
  time('    insertSelfEdges', function () {
    insertSelfEdges(g);
  });
  time('    adjustCoordinateSystem', function () {
    (0, _coordinateSystem.adjust)(g);
  });
  time('    position', function () {
    (0, _position2.default)(g);
  });
  time('    positionSelfEdges', function () {
    positionSelfEdges(g);
  });
  time('    removeBorderNodes', function () {
    removeBorderNodes(g);
  });
  time('    normalize.undo', function () {
    (0, _normalize.undo)(g);
  });
  time('    fixupEdgeLabelCoords', function () {
    fixupEdgeLabelCoords(g);
  });
  time('    undoCoordinateSystem', function () {
    (0, _coordinateSystem.undo)(g);
  });
  time('    translateGraph', function () {
    translateGraph(g);
  });
  time('    assignNodeIntersects', function () {
    assignNodeIntersects(g);
  });
  time('    reversePoints', function () {
    reversePointsForReversedEdges(g);
  });
  time('    acyclic.undo', function () {
    (0, _acyclic.run)(g);
  });
}

/*
 * Copies final layout information from the layout graph back to the input
 * graph. This process only copies whitelisted attributes from the layout graph
 * to the input graph, so it serves as a good place to determine what
 * attributes can influence layout.
 */
function updateInputGraph(inputGraph, layoutGraph) {
  _lodash2.default.forEach(inputGraph.nodes(), function (v) {
    var inputLabel = inputGraph.node(v);
    var layoutLabel = layoutGraph.node(v);

    if (inputLabel) {
      inputLabel.x = layoutLabel.x;
      inputLabel.y = layoutLabel.y;

      if (layoutGraph.children(v).length) {
        inputLabel.width = layoutLabel.width;
        inputLabel.height = layoutLabel.height;
      }
    }
  });

  _lodash2.default.forEach(inputGraph.edges(), function (e) {
    var inputLabel = inputGraph.edge(e);
    var layoutLabel = layoutGraph.edge(e);

    inputLabel.points = layoutLabel.points;
    if (_lodash2.default.has(layoutLabel, 'x')) {
      inputLabel.x = layoutLabel.x;
      inputLabel.y = layoutLabel.y;
    }
  });

  inputGraph.graph().width = layoutGraph.graph().width;
  inputGraph.graph().height = layoutGraph.graph().height;
}

var graphNumAttrs = ['nodesep', 'edgesep', 'ranksep', 'marginx', 'marginy'];
var graphDefaults = { ranksep: 50, edgesep: 20, nodesep: 50, rankdir: 'tb' };
var graphAttrs = ['acyclicer', 'ranker', 'rankdir', 'align'];
var nodeNumAttrs = ['width', 'height'];
var nodeDefaults = { width: 0, height: 0 };
var edgeNumAttrs = ['minlen', 'weight', 'width', 'height', 'labeloffset'];
var edgeDefaults = {
  minlen: 1,
  weight: 1,
  width: 0,
  height: 0,
  labeloffset: 10,
  labelpos: 'r'
};
var edgeAttrs = ['labelpos'];

/*
 * Constructs a new graph from the input graph, which can be used for layout.
 * This process copies only whitelisted attributes from the input graph to the
 * layout graph. Thus this function serves as a good place to determine what
 * attributes can influence layout.
 */
function buildLayoutGraph(inputGraph) {
  var g = new _cienaGraphlib.Graph({ multigraph: true, compound: true });
  var graph = canonicalize(inputGraph.graph());

  g.setGraph(_lodash2.default.merge({}, graphDefaults, selectNumberAttrs(graph, graphNumAttrs), _lodash2.default.pick(graph, graphAttrs)));

  _lodash2.default.forEach(inputGraph.nodes(), function (v) {
    var node = canonicalize(inputGraph.node(v));
    g.setNode(v, _lodash2.default.defaults(selectNumberAttrs(node, nodeNumAttrs), nodeDefaults));
    g.setParent(v, inputGraph.parent(v));
  });

  _lodash2.default.forEach(inputGraph.edges(), function (e) {
    var edge = canonicalize(inputGraph.edge(e));
    g.setEdge(e, _lodash2.default.merge({}, edgeDefaults, selectNumberAttrs(edge, edgeNumAttrs), _lodash2.default.pick(edge, edgeAttrs)));
  });

  return g;
}

/*
 * This idea comes from the Gansner paper: to account for edge labels in our
 * layout we split each rank in half by doubling minlen and halving ranksep.
 * Then we can place labels at these mid-points between nodes.
 *
 * We also add some minimal padding to the width to push the label for the edge
 * away from the edge itself a bit.
 */
function makeSpaceForEdgeLabels(g) {
  var graph = g.graph();
  graph.ranksep /= 2;
  _lodash2.default.forEach(g.edges(), function (e) {
    var edge = g.edge(e);
    edge.minlen *= 2;
    if (edge.labelpos.toLowerCase() !== 'c') {
      if (graph.rankdir === 'TB' || graph.rankdir === 'BT') {
        edge.width += edge.labeloffset;
      } else {
        edge.height += edge.labeloffset;
      }
    }
  });
}

/*
 * Creates temporary dummy nodes that capture the rank in which each edge's
 * label is going to, if it has one of non-zero width and height. We do this
 * so that we can safely remove empty ranks while preserving balance for the
 * label's position.
 */
function injectEdgeLabelProxies(g) {
  _lodash2.default.forEach(g.edges(), function (e) {
    var edge = g.edge(e);
    if (edge.width && edge.height) {
      var v = g.node(e.v);
      var w = g.node(e.w);
      var label = { rank: (w.rank - v.rank) / 2 + v.rank, e: e };
      (0, _util.addDummyNode)(g, 'edge-proxy', label, '_ep');
    }
  });
}

function assignRankMinMax(g) {
  var maxRank = 0;
  _lodash2.default.forEach(g.nodes(), function (v) {
    var node = g.node(v);
    if (node.borderTop) {
      node.minRank = g.node(node.borderTop).rank;
      node.maxRank = g.node(node.borderBottom).rank;
      maxRank = _lodash2.default.max(maxRank, node.maxRank);
    }
  });
  g.graph().maxRank = maxRank;
}

function removeEdgeLabelProxies(g) {
  _lodash2.default.forEach(g.nodes(), function (v) {
    var node = g.node(v);
    if (node.dummy === 'edge-proxy') {
      g.edge(node.e).labelRank = node.rank;
      g.removeNode(v);
    }
  });
}

function translateGraph(g) {
  var minX = Number.POSITIVE_INFINITY;
  var maxX = 0;
  var minY = Number.POSITIVE_INFINITY;
  var maxY = 0;
  var graphLabel = g.graph();
  var marginX = graphLabel.marginx || 0;
  var marginY = graphLabel.marginy || 0;

  function getExtremes(attrs) {
    var x = attrs.x;
    var y = attrs.y;
    var w = attrs.width;
    var h = attrs.height;
    minX = Math.min(minX, x - w / 2);
    maxX = Math.max(maxX, x + w / 2);
    minY = Math.min(minY, y - h / 2);
    maxY = Math.max(maxY, y + h / 2);
  }

  _lodash2.default.forEach(g.nodes(), function (v) {
    getExtremes(g.node(v));
  });
  _lodash2.default.forEach(g.edges(), function (e) {
    var edge = g.edge(e);
    if (_lodash2.default.has(edge, 'x')) {
      getExtremes(edge);
    }
  });

  minX -= marginX;
  minY -= marginY;

  _lodash2.default.forEach(g.nodes(), function (v) {
    var node = g.node(v);
    node.x -= minX;
    node.y -= minY;
  });

  _lodash2.default.forEach(g.edges(), function (e) {
    var edge = g.edge(e);
    _lodash2.default.forEach(edge.points, function (p) {
      p.x -= minX;
      p.y -= minY;
    });
    if (_lodash2.default.has(edge, 'x')) {
      edge.x -= minX;
    }
    if (_lodash2.default.has(edge, 'y')) {
      edge.y -= minY;
    }
  });

  graphLabel.width = maxX - minX + marginX;
  graphLabel.height = maxY - minY + marginY;
}

function assignNodeIntersects(g) {
  _lodash2.default.forEach(g.edges(), function (e) {
    var edge = g.edge(e);
    var nodeV = g.node(e.v);
    var nodeW = g.node(e.w);
    var p1;
    var p2;
    if (!edge.points) {
      edge.points = [];
      p1 = nodeW;
      p2 = nodeV;
    } else {
      p1 = edge.points[0];
      p2 = edge.points[edge.points.length - 1];
    }
    edge.points.unshift((0, _util.intersectRect)(nodeV, p1));
    edge.points.push((0, _util.intersectRect)(nodeW, p2));
  });
}

function fixupEdgeLabelCoords(g) {
  _lodash2.default.forEach(g.edges(), function (e) {
    var edge = g.edge(e);
    if (_lodash2.default.has(edge, 'x')) {
      if (edge.labelpos === 'l' || edge.labelpos === 'r') {
        edge.width -= edge.labeloffset;
      }
      switch (edge.labelpos) {
        case 'l':
          edge.x -= edge.width / 2 + edge.labeloffset;break;
        case 'r':
          edge.x += edge.width / 2 + edge.labeloffset;break;
      }
    }
  });
}

function reversePointsForReversedEdges(g) {
  _lodash2.default.forEach(g.edges(), function (e) {
    var edge = g.edge(e);
    if (edge.reversed) {
      edge.points.reverse();
    }
  });
}

function removeBorderNodes(g) {
  _lodash2.default.forEach(g.nodes(), function (v) {
    if (g.children(v).length) {
      var node = g.node(v);
      var t = g.node(node.borderTop);
      var b = g.node(node.borderBottom);
      var l = g.node(_lodash2.default.last(node.borderLeft));
      var r = g.node(_lodash2.default.last(node.borderRight));

      node.width = Math.abs(r.x - l.x);
      node.height = Math.abs(b.y - t.y);
      node.x = l.x + node.width / 2;
      node.y = t.y + node.height / 2;
    }
  });

  _lodash2.default.forEach(g.nodes(), function (v) {
    if (g.node(v).dummy === 'border') {
      g.removeNode(v);
    }
  });
}

function removeSelfEdges(g) {
  _lodash2.default.forEach(g.edges(), function (e) {
    if (e.v === e.w) {
      var node = g.node(e.v);
      if (!node.selfEdges) {
        node.selfEdges = [];
      }
      node.selfEdges.push({ e: e, label: g.edge(e) });
      g.removeEdge(e);
    }
  });
}

function insertSelfEdges(g) {
  var layers = (0, _util.buildLayerMatrix)(g);
  _lodash2.default.forEach(layers, function (layer) {
    var orderShift = 0;
    _lodash2.default.forEach(layer, function (v, i) {
      var node = g.node(v);
      node.order = i + orderShift;
      _lodash2.default.forEach(node.selfEdges, function (selfEdge) {
        (0, _util.addDummyNode)(g, 'selfedge', {
          width: selfEdge.label.width,
          height: selfEdge.label.height,
          rank: node.rank,
          order: i + ++orderShift,
          e: selfEdge.e,
          label: selfEdge.label
        }, '_se');
      });
      delete node.selfEdges;
    });
  });
}

function positionSelfEdges(g) {
  _lodash2.default.forEach(g.nodes(), function (v) {
    var node = g.node(v);
    if (node.dummy === 'selfedge') {
      var selfNode = g.node(node.e.v);
      var x = selfNode.x + selfNode.width / 2;
      var y = selfNode.y;
      var dx = node.x - x;
      var dy = selfNode.height / 2;
      g.setEdge(node.e, node.label);
      g.removeNode(v);
      node.label.points = [{ x: x + 2 * dx / 3, y: y - dy }, { x: x + 5 * dx / 6, y: y - dy }, { x: x + dx, y: y }, { x: x + 5 * dx / 6, y: y + dy }, { x: x + 2 * dx / 3, y: y + dy }];
      node.label.x = node.x;
      node.label.y = node.y;
    }
  });
}

function selectNumberAttrs(obj, attrs) {
  return _lodash2.default.mapValues(_lodash2.default.pick(obj, attrs), Number);
}

function canonicalize(attrs) {
  var newAttrs = {};
  _lodash2.default.forEach(attrs, function (v, k) {
    newAttrs[k.toLowerCase()] = v;
  });
  return newAttrs;
}

function layout(g, opts) {
  var timeFn = opts && opts.debugTiming ? _util.time : _util.notime;
  (0, _util.time)('layout', function () {
    var layoutGraph = (0, _util.time)('  buildLayoutGraph', function () {
      return buildLayoutGraph(g);
    });
    (0, _util.time)('  runLayout', function () {
      runLayout(layoutGraph, timeFn);
    });
    (0, _util.time)('  updateInputGraph', function () {
      updateInputGraph(g, layoutGraph);
    });
  });
}
module.exports = exports['default'];