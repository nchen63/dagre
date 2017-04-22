'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.undo = undo;
exports.run = run;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _greedyFas = require('./greedy-fas');

var _greedyFas2 = _interopRequireDefault(_greedyFas);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function dfsFAS(g) {
  var fas = [];
  var stack = {};
  var visited = {};

  function dfs(v) {
    if (_lodash2.default.has(visited, v)) {
      return;
    }
    visited[v] = true;
    stack[v] = true;
    _lodash2.default.forEach(g.outEdges(v), function (e) {
      if (_lodash2.default.has(stack, e.w)) {
        fas.push(e);
      } else {
        dfs(e.w);
      }
    });
    delete stack[v];
  }

  _lodash2.default.forEach(g.nodes(), dfs);
  return fas;
}

function undo(g) {
  _lodash2.default.forEach(g.edges(), function (e) {
    var label = g.edge(e);
    if (label.reversed) {
      g.removeEdge(e);

      var forwardName = label.forwardName;
      delete label.reversed;
      delete label.forwardName;
      g.setEdge(e.w, e.v, label, forwardName);
    }
  });
}

function run(g) {
  var fas = g.graph().acyclicer === 'greedy' ? (0, _greedyFas2.default)(g, weightFn(g)) : dfsFAS(g);
  _lodash2.default.forEach(fas, function (e) {
    var label = g.edge(e);
    g.removeEdge(e); // FIXME: this is breaking 4 commented out tests
    label.forwardName = e.name;
    label.reversed = true;
    g.setEdge(e.w, e.v, label, _lodash2.default.uniqueId('rev'));
  });

  function weightFn(g) {
    return function (e) {
      return g.edge(e).weight;
    };
  }
}