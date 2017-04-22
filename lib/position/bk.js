'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findType1Conflicts = findType1Conflicts;
exports.findType2Conflicts = findType2Conflicts;
exports.findOtherInnerSegmentNode = findOtherInnerSegmentNode;
exports.addConflict = addConflict;
exports.hasConflict = hasConflict;
exports.verticalAlignment = verticalAlignment;
exports.horizontalCompaction = horizontalCompaction;
exports.buildBlockGraph = buildBlockGraph;
exports.findSmallestWidthAlignment = findSmallestWidthAlignment;
exports.alignCoordinates = alignCoordinates;
exports.balance = balance;
exports.positionX = positionX;
exports.sep = sep;
exports.width = width;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _cienaGraphlib = require('ciena-graphlib');

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * This module provides coordinate assignment based on Brandes and Köpf, "Fast
 * and Simple Horizontal Coordinate Assignment."
 */

/*
 * Marks all edges in the graph with a type-1 conflict with the "type1Conflict"
 * property. A type-1 conflict is one where a non-inner segment crosses an
 * inner segment. An inner segment is an edge with both incident nodes marked
 * with the "dummy" property.
 *
 * This algorithm scans layer by layer, starting with the second, for type-1
 * conflicts between the current layer and the previous layer. For each layer
 * it scans the nodes from left to right until it reaches one that is incident
 * on an inner segment. It then scans predecessors to determine if they have
 * edges that cross that inner segment. At the end a final scan is done for all
 * nodes on the current rank to see if they cross the last visited inner
 * segment.
 *
 * This algorithm (safely) assumes that a dummy node will only be incident on a
 * single node in the layers being scanned.
 */
function findType1Conflicts(g, layering) {
  var conflicts = {};

  function visitLayer(prevLayer, layer) {
    // last visited node in the previous layer that is incident on an inner
    // segment.
    var k0 = 0;
    // Tracks the last node in this layer scanned for crossings with a type-1
    // segment.
    var scanPos = 0;
    var prevLayerLength = prevLayer.length;
    var lastNode = _lodash2.default.last(layer);

    _lodash2.default.forEach(layer, function (v, i) {
      var w = findOtherInnerSegmentNode(g, v);
      var k1 = w ? g.node(w).order : prevLayerLength;

      if (w || v === lastNode) {
        _lodash2.default.forEach(layer.slice(scanPos, i + 1), function (scanNode) {
          _lodash2.default.forEach(g.predecessors(scanNode), function (u) {
            var uLabel = g.node(u);
            var uPos = uLabel.order;
            if ((uPos < k0 || k1 < uPos) && !(uLabel.dummy && g.node(scanNode).dummy)) {
              addConflict(conflicts, u, scanNode);
            }
          });
        });
        scanPos = i + 1;
        k0 = k1;
      }
    });

    return layer;
  }

  _lodash2.default.reduce(layering, visitLayer);
  return conflicts;
}

function findType2Conflicts(g, layering) {
  var conflicts = {};

  function scan(south, southPos, southEnd, prevNorthBorder, nextNorthBorder) {
    var v;
    _lodash2.default.forEach(_lodash2.default.range(southPos, southEnd), function (i) {
      v = south[i];
      if (g.node(v).dummy) {
        _lodash2.default.forEach(g.predecessors(v), function (u) {
          var uNode = g.node(u);
          if (uNode.dummy && (uNode.order < prevNorthBorder || uNode.order > nextNorthBorder)) {
            addConflict(conflicts, u, v);
          }
        });
      }
    });
  }

  function visitLayer(north, south) {
    var prevNorthPos = -1;
    var nextNorthPos;
    var southPos = 0;

    _lodash2.default.forEach(south, function (v, southLookahead) {
      if (g.node(v).dummy === 'border') {
        var predecessors = g.predecessors(v);
        if (predecessors.length) {
          nextNorthPos = g.node(predecessors[0]).order;
          scan(south, southPos, southLookahead, prevNorthPos, nextNorthPos);
          southPos = southLookahead;
          prevNorthPos = nextNorthPos;
        }
      }
      scan(south, southPos, south.length, nextNorthPos, north.length);
    });

    return south;
  }

  _lodash2.default.reduce(layering, visitLayer);
  return conflicts;
}

function findOtherInnerSegmentNode(g, v) {
  if (g.node(v).dummy) {
    return _lodash2.default.find(g.predecessors(v), function (u) {
      return g.node(u).dummy;
    });
  }
}

function addConflict(conflicts, v, w) {
  if (v > w) {
    var tmp = v;
    v = w;
    w = tmp;
  }

  var conflictsV = conflicts[v];
  if (!conflictsV) {
    conflicts[v] = conflictsV = {};
  }
  conflictsV[w] = true;
}

function hasConflict(conflicts, v, w) {
  if (v > w) {
    var tmp = v;
    v = w;
    w = tmp;
  }
  return _lodash2.default.has(conflicts[v], w);
}

/*
 * Try to align nodes into vertical "blocks" where possible. This algorithm
 * attempts to align a node with one of its median neighbors. If the edge
 * connecting a neighbor is a type-1 conflict then we ignore that possibility.
 * If a previous node has already formed a block with a node after the node
 * we're trying to form a block with, we also ignore that possibility - our
 * blocks would be split in that scenario.
 */
function verticalAlignment(g, layering, conflicts, neighborFn) {
  var root = {};
  var align = {};
  var pos = {};

  // We cache the position here based on the layering because the graph and
  // layering may be out of sync. The layering matrix is manipulated to
  // generate different extreme alignments.
  _lodash2.default.forEach(layering, function (layer) {
    _lodash2.default.forEach(layer, function (v, order) {
      root[v] = v;
      align[v] = v;
      pos[v] = order;
    });
  });

  _lodash2.default.forEach(layering, function (layer) {
    var prevIdx = -1;
    _lodash2.default.forEach(layer, function (v) {
      var ws = neighborFn(v);
      if (ws.length) {
        ws = _lodash2.default.sortBy(ws, function (w) {
          return pos[w];
        });
        var mp = (ws.length - 1) / 2;
        for (var i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
          var w = ws[i];
          if (align[v] === v && prevIdx < pos[w] && !hasConflict(conflicts, v, w)) {
            align[w] = v;
            align[v] = root[v] = root[w];
            prevIdx = pos[w];
          }
        }
      }
    });
  });

  return { root: root, align: align };
}

function horizontalCompaction(g, layering, root, align, reverseSep) {
  // This portion of the algorithm differs from BK due to a number of problems.
  // Instead of their algorithm we construct a new block graph and do two
  // sweeps. The first sweep places blocks with the smallest possible
  // coordinates. The second sweep removes unused space by moving blocks to the
  // greatest coordinates without violating separation.
  var xs = {};
  var blockG = buildBlockGraph(g, layering, root, reverseSep);

  // First pass, assign smallest coordinates via DFS
  var visited = {};
  function pass1(v) {
    if (!_lodash2.default.has(visited, v)) {
      visited[v] = true;
      xs[v] = _lodash2.default.reduce(blockG.inEdges(v), function (max, e) {
        pass1(e.v);
        return Math.max(max, xs[e.v] + blockG.edge(e));
      }, 0);
    }
  }
  _lodash2.default.forEach(blockG.nodes(), pass1);

  var borderType = reverseSep ? 'borderLeft' : 'borderRight';
  function pass2(v) {
    if (visited[v] !== 2) {
      visited[v]++;
      var node = g.node(v);
      var min = _lodash2.default.reduce(blockG.outEdges(v), function (min, e) {
        pass2(e.w);
        return Math.min(min, xs[e.w] - blockG.edge(e));
      }, Number.POSITIVE_INFINITY);
      if (min !== Number.POSITIVE_INFINITY && node.borderType !== borderType) {
        xs[v] = Math.max(xs[v], min);
      }
    }
  }
  _lodash2.default.forEach(blockG.nodes(), pass2);

  // Assign x coordinates to all nodes
  _lodash2.default.forEach(align, function (v) {
    xs[v] = xs[root[v]];
  });

  return xs;
}

function buildBlockGraph(g, layering, root, reverseSep) {
  var blockGraph = new _cienaGraphlib.Graph();
  var graphLabel = g.graph();
  var sepFn = sep(graphLabel.nodesep, graphLabel.edgesep, reverseSep);

  _lodash2.default.forEach(layering, function (layer) {
    var u;
    _lodash2.default.forEach(layer, function (v) {
      var vRoot = root[v];
      blockGraph.setNode(vRoot);
      if (u) {
        var uRoot = root[u];
        var prevMax = blockGraph.edge(uRoot, vRoot);
        blockGraph.setEdge(uRoot, vRoot, Math.max(sepFn(g, v, u), prevMax || 0));
      }
      u = v;
    });
  });

  return blockGraph;
}

/*
 * Returns the alignment that has the smallest width of the given alignments.
 */
function findSmallestWidthAlignment(g, xss) {
  var vals = _lodash2.default.values(xss);

  return _lodash2.default.minBy(vals, function (xs) {
    var maxVals = [];
    var minVals = [];

    _lodash2.default.forIn(xs, function (x, v) {
      var halfWidth = width(g, v) / 2;

      maxVals.push(x + halfWidth);
      minVals.push(x - halfWidth);
    });

    return _lodash2.default.max(maxVals) - _lodash2.default.min(minVals);
  });
}

/*
 * Align the coordinates of each of the layout alignments such that
 * left-biased alignments have their minimum coordinate at the same point as
 * the minimum coordinate of the smallest width alignment and right-biased
 * alignments have their maximum coordinate at the same point as the maximum
 * coordinate of the smallest width alignment.
 */
function alignCoordinates(xss, alignTo) {
  var vals = _lodash2.default.values(alignTo);
  var alignToMin = _lodash2.default.min(vals);
  var alignToMax = _lodash2.default.max(vals);

  _lodash2.default.forEach(['u', 'd'], function (vert) {
    _lodash2.default.forEach(['l', 'r'], function (horiz) {
      var alignment = vert + horiz;
      var xs = xss[alignment];
      var delta;
      if (xs === alignTo) return;

      var xsVals = _lodash2.default.values(xs);
      delta = horiz === 'l' ? alignToMin - _lodash2.default.min(xsVals) : alignToMax - _lodash2.default.max(xsVals);

      if (delta) {
        xss[alignment] = _lodash2.default.mapValues(xs, function (x) {
          return x + delta;
        });
      }
    });
  });
}

function balance(xss, align) {
  return _lodash2.default.mapValues(xss.ul, function (ignore, v) {
    if (align) {
      return xss[align.toLowerCase()][v];
    } else {
      var xs = _lodash2.default.sortBy(_lodash2.default.map(xss, v));
      return (xs[1] + xs[2]) / 2;
    }
  });
}

function positionX(g) {
  var layering = (0, _util.buildLayerMatrix)(g);
  var conflicts = _lodash2.default.merge(findType1Conflicts(g, layering), findType2Conflicts(g, layering));

  var xss = {};
  var adjustedLayering;
  _lodash2.default.forEach(['u', 'd'], function (vert) {
    adjustedLayering = vert === 'u' ? layering : _lodash2.default.values(layering).reverse();
    _lodash2.default.forEach(['l', 'r'], function (horiz) {
      if (horiz === 'r') {
        adjustedLayering = _lodash2.default.map(adjustedLayering, function (inner) {
          return _lodash2.default.values(inner).reverse();
        });
      }

      var neighborFn = _lodash2.default.bind(vert === 'u' ? g.predecessors : g.successors, g);
      var align = verticalAlignment(g, adjustedLayering, conflicts, neighborFn);
      var xs = horizontalCompaction(g, adjustedLayering, align.root, align.align, horiz === 'r');
      if (horiz === 'r') {
        xs = _lodash2.default.mapValues(xs, function (x) {
          return -x;
        });
      }
      xss[vert + horiz] = xs;
    });
  });

  var smallestWidth = findSmallestWidthAlignment(g, xss);
  alignCoordinates(xss, smallestWidth);
  return balance(xss, g.graph().align);
}

function sep(nodeSep, edgeSep, reverseSep) {
  return function (g, v, w) {
    var vLabel = g.node(v);
    var wLabel = g.node(w);
    var sum = 0;
    var delta;

    sum += vLabel.width / 2;
    if (_lodash2.default.has(vLabel, 'labelpos')) {
      switch (vLabel.labelpos.toLowerCase()) {
        case 'l':
          delta = -vLabel.width / 2;break;
        case 'r':
          delta = vLabel.width / 2;break;
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;

    sum += (vLabel.dummy ? edgeSep : nodeSep) / 2;
    sum += (wLabel.dummy ? edgeSep : nodeSep) / 2;

    sum += wLabel.width / 2;
    if (_lodash2.default.has(wLabel, 'labelpos')) {
      switch (wLabel.labelpos.toLowerCase()) {
        case 'l':
          delta = wLabel.width / 2;break;
        case 'r':
          delta = -wLabel.width / 2;break;
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;

    return sum;
  };
}

function width(g, v) {
  return g.node(v).width;
}

exports.default = {
  alignCoordinates: alignCoordinates,
  balance: balance,
  buildBlockGraph: buildBlockGraph,
  findOtherInnerSegmentNode: findOtherInnerSegmentNode,
  findSmallestWidthAlignment: findSmallestWidthAlignment,
  findType1Conflicts: findType1Conflicts,
  findType2Conflicts: findType2Conflicts,
  hasConflict: hasConflict,
  horizontalCompaction: horizontalCompaction,
  positionX: positionX,
  sep: sep,
  verticalAlignment: verticalAlignment,
  width: width
};