'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addDummyNode = addDummyNode;
exports.simplify = simplify;
exports.asNonCompoundGraph = asNonCompoundGraph;
exports.successorWeights = successorWeights;
exports.predecessorWeights = predecessorWeights;
exports.intersectRect = intersectRect;
exports.buildLayerMatrix = buildLayerMatrix;
exports.normalizeRanks = normalizeRanks;
exports.removeEmptyRanks = removeEmptyRanks;
exports.addBorderNode = addBorderNode;
exports.maxRank = maxRank;
exports.partition = partition;
exports.time = time;
exports.notime = notime;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _cienaGraphlib = require('ciena-graphlib');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Adds a dummy node to the graph and return v.
 */
function addDummyNode(g, type, attrs, name) {
  var v;
  do {
    v = _lodash2.default.uniqueId(name);
  } while (g.hasNode(v));

  attrs.dummy = type;
  g.setNode(v, attrs);
  return v;
}

/*
 * Returns a new graph with only simple edges. Handles aggregation of data
 * associated with multi-edges.
 */
function simplify(g) {
  var simplified = new _cienaGraphlib.Graph().setGraph(g.graph());
  _lodash2.default.forEach(g.nodes(), function (v) {
    simplified.setNode(v, g.node(v));
  });
  _lodash2.default.forEach(g.edges(), function (e) {
    var simpleLabel = simplified.edge(e.v, e.w) || { weight: 0, minlen: 1 };
    var label = g.edge(e);
    simplified.setEdge(e.v, e.w, {
      weight: simpleLabel.weight + label.weight,
      minlen: Math.max(simpleLabel.minlen, label.minlen)
    });
  });
  return simplified;
}

function asNonCompoundGraph(g) {
  var simplified = new _cienaGraphlib.Graph({ multigraph: g.isMultigraph() }).setGraph(g.graph());
  _lodash2.default.forEach(g.nodes(), function (v) {
    if (!g.children(v).length) {
      simplified.setNode(v, g.node(v));
    }
  });
  _lodash2.default.forEach(g.edges(), function (e) {
    simplified.setEdge(e, g.edge(e));
  });
  return simplified;
}

function successorWeights(g) {
  var weightMap = _lodash2.default.map(g.nodes(), function (v) {
    var sucs = {};
    _lodash2.default.forEach(g.outEdges(v), function (e) {
      sucs[e.w] = (sucs[e.w] || 0) + g.edge(e).weight;
    });
    return sucs;
  });
  return _lodash2.default.zipObject(g.nodes(), weightMap);
}

function predecessorWeights(g) {
  var weightMap = _lodash2.default.map(g.nodes(), function (v) {
    var preds = {};
    _lodash2.default.forEach(g.inEdges(v), function (e) {
      preds[e.v] = (preds[e.v] || 0) + g.edge(e).weight;
    });
    return preds;
  });
  return _lodash2.default.zipObject(g.nodes(), weightMap);
}

/*
 * Finds where a line starting at point ({x, y}) would intersect a rectangle
 * ({x, y, width, height}) if it were pointing at the rectangle's center.
 */
function intersectRect(rect, point) {
  var x = rect.x;
  var y = rect.y;

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  var dx = point.x - x;
  var dy = point.y - y;
  var w = rect.width / 2;
  var h = rect.height / 2;

  if (!dx && !dy) {
    throw new Error('Not possible to find intersection inside of the rectangle');
  }

  var sx, sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = w * dy / dx;
  }

  return { x: x + sx, y: y + sy };
}

/*
 * Given a DAG with each node assigned "rank" and "order" properties, this
 * function will produce a matrix with the ids of each node.
 */
function buildLayerMatrix(g) {
  var layering = _lodash2.default.map(_lodash2.default.range(maxRank(g) + 1), function () {
    return [];
  });
  _lodash2.default.forEach(g.nodes(), function (v) {
    var node = g.node(v);
    var rank = node.rank;
    if (!_lodash2.default.isUndefined(rank)) {
      layering[rank][node.order] = v;
    }
  });
  return layering;
}

/*
 * Adjusts the ranks for all nodes in the graph such that all nodes v have
 * rank(v) >= 0 and at least one node w has rank(w) = 0.
 */
function normalizeRanks(g) {
  var min = _lodash2.default.min(_lodash2.default.map(g.nodes(), function (v) {
    return g.node(v).rank;
  }));
  _lodash2.default.forEach(g.nodes(), function (v) {
    var node = g.node(v);
    if (_lodash2.default.has(node, 'rank')) {
      node.rank -= min;
    }
  });
}

function removeEmptyRanks(g) {
  // Ranks may not start at 0, so we need to offset them
  var offset = _lodash2.default.min(_lodash2.default.map(g.nodes(), function (v) {
    return g.node(v).rank;
  }));

  var layers = [];
  _lodash2.default.forEach(g.nodes(), function (v) {
    var rank = g.node(v).rank - offset;
    if (!layers[rank]) {
      layers[rank] = [];
    }
    layers[rank].push(v);
  });

  var delta = 0;
  var nodeRankFactor = g.graph().nodeRankFactor;
  _lodash2.default.forEach(layers, function (vs, i) {
    if (_lodash2.default.isUndefined(vs) && i % nodeRankFactor !== 0) {
      --delta;
    } else if (delta) {
      _lodash2.default.forEach(vs, function (v) {
        g.node(v).rank += delta;
      });
    }
  });
}

function addBorderNode(g, prefix, rank, order) {
  var node = {
    width: 0,
    height: 0
  };
  if (arguments.length >= 4) {
    node.rank = rank;
    node.order = order;
  }
  return addDummyNode(g, 'border', node, prefix);
}

function maxRank(g) {
  return _lodash2.default.max(_lodash2.default.map(g.nodes(), function (v) {
    var rank = g.node(v).rank;
    if (!_lodash2.default.isUndefined(rank)) {
      return rank;
    }
  }));
}

/*
 * Partition a collection into two groups: `lhs` and `rhs`. If the supplied
 * function returns true for an entry it goes into `lhs`. Otherwise it goes
 * into `rhs.
 */
function partition(collection, fn) {
  var result = { lhs: [], rhs: [] };
  _lodash2.default.forEach(collection, function (value) {
    if (fn(value)) {
      result.lhs.push(value);
    } else {
      result.rhs.push(value);
    }
  });
  return result;
}

/*
 * Returns a new function that wraps `fn` with a timer. The wrapper logs the
 * time it takes to execute the function.
 */
function time(name, fn) {
  var start = _lodash2.default.now();
  try {
    return fn();
  } finally {
    console.log(name + ' time: ' + (_lodash2.default.now() - start) + 'ms');
  }
}

function notime(name, fn) {
  return fn();
}

exports.default = {
  addBorderNode: addBorderNode,
  addDummyNode: addDummyNode,
  asNonCompoundGraph: asNonCompoundGraph,
  buildLayerMatrix: buildLayerMatrix,
  intersectRect: intersectRect,
  maxRank: maxRank,
  partition: partition,
  predecessorWeights: predecessorWeights,
  normalizeRanks: normalizeRanks,
  notime: notime,
  removeEmptyRanks: removeEmptyRanks,
  simplify: simplify,
  successorWeights: successorWeights,
  time: time
};