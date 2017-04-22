'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = resolveConflicts;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function doResolveConflicts(sourceSet) {
  var entries = [];

  function handleIn(vEntry) {
    return function (uEntry) {
      if (uEntry.merged) {
        return;
      }
      if (_lodash2.default.isUndefined(uEntry.barycenter) || _lodash2.default.isUndefined(vEntry.barycenter) || uEntry.barycenter >= vEntry.barycenter) {
        mergeEntries(vEntry, uEntry);
      }
    };
  }

  function handleOut(vEntry) {
    return function (wEntry) {
      wEntry['in'].push(vEntry);
      if (--wEntry.indegree === 0) {
        sourceSet.push(wEntry);
      }
    };
  }

  while (sourceSet.length) {
    var entry = sourceSet.pop();
    entries.push(entry);
    _lodash2.default.forEach(entry['in'].reverse(), handleIn(entry));
    _lodash2.default.forEach(entry.out, handleOut(entry));
  }

  return _lodash2.default.chain(entries).filter(function (entry) {
    return !entry.merged;
  }).map(function (entry) {
    return _lodash2.default.pick(entry, ['vs', 'i', 'barycenter', 'weight']);
  }).value();
}

function mergeEntries(target, source) {
  var sum = 0;
  var weight = 0;

  if (target.weight) {
    sum += target.barycenter * target.weight;
    weight += target.weight;
  }

  if (source.weight) {
    sum += source.barycenter * source.weight;
    weight += source.weight;
  }

  target.vs = source.vs.concat(target.vs);
  target.barycenter = sum / weight;
  target.weight = weight;
  target.i = Math.min(source.i, target.i);
  source.merged = true;
}

/*
 * Given a list of entries of the form {v, barycenter, weight} and a
 * constraint graph this function will resolve any conflicts between the
 * constraint graph and the barycenters for the entries. If the barycenters for
 * an entry would violate a constraint in the constraint graph then we coalesce
 * the nodes in the conflict into a new node that respects the contraint and
 * aggregates barycenter and weight information.
 *
 * This implementation is based on the description in Forster, "A Fast and
 * Simple Hueristic for Constrained Two-Level Crossing Reduction," thought it
 * differs in some specific details.
 *
 * Pre-conditions:
 *
 *    1. Each entry has the form {v, barycenter, weight}, or if the node has
 *       no barycenter, then {v}.
 *
 * Returns:
 *
 *    A new list of entries of the form {vs, i, barycenter, weight}. The list
 *    `vs` may either be a singleton or it may be an aggregation of nodes
 *    ordered such that they do not violate constraints from the constraint
 *    graph. The property `i` is the lowest original index of any of the
 *    elements in `vs`.
 */
function resolveConflicts(entries, cg) {
  var mappedEntries = {};
  _lodash2.default.forEach(entries, function (entry, i) {
    var tmp = mappedEntries[entry.v] = {
      indegree: 0,
      'in': [],
      out: [],
      vs: [entry.v],
      i: i
    };
    if (!_lodash2.default.isUndefined(entry.barycenter)) {
      tmp.barycenter = entry.barycenter;
      tmp.weight = entry.weight;
    }
  });

  _lodash2.default.forEach(cg.edges(), function (e) {
    var entryV = mappedEntries[e.v];
    var entryW = mappedEntries[e.w];
    if (!_lodash2.default.isUndefined(entryV) && !_lodash2.default.isUndefined(entryW)) {
      entryW.indegree++;
      entryV.out.push(mappedEntries[e.w]);
    }
  });

  var sourceSet = _lodash2.default.filter(mappedEntries, function (entry) {
    return !entry.indegree;
  });

  return doResolveConflicts(sourceSet);
}
module.exports = exports['default'];