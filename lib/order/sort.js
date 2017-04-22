'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sort;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function consumeUnsortable(vs, unsortable, index) {
  var last;
  while (unsortable.length && (last = _lodash2.default.last(unsortable)).i <= index) {
    unsortable.pop();
    vs.push(last.vs);
    index++;
  }
  return index;
}

function compareWithBias(bias) {
  return function (entryV, entryW) {
    if (entryV.barycenter < entryW.barycenter) {
      return -1;
    } else if (entryV.barycenter > entryW.barycenter) {
      return 1;
    }

    return !bias ? entryV.i - entryW.i : entryW.i - entryV.i;
  };
}

function sort(entries, biasRight) {
  var parts = (0, _util.partition)(entries, function (entry) {
    return _lodash2.default.has(entry, 'barycenter');
  });
  var sortable = parts.lhs;
  var unsortable = _lodash2.default.sortBy(parts.rhs, function (entry) {
    return -entry.i;
  });
  var vs = [];
  var sum = 0;
  var weight = 0;
  var vsIndex = 0;

  sortable.sort(compareWithBias(!!biasRight));

  vsIndex = consumeUnsortable(vs, unsortable, vsIndex);

  _lodash2.default.forEach(sortable, function (entry) {
    vsIndex += entry.vs.length;
    vs.push(entry.vs);
    sum += entry.barycenter * entry.weight;
    weight += entry.weight;
    vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
  });

  var result = { vs: _lodash2.default.flatten(vs, true) };
  if (weight) {
    result.barycenter = sum / weight;
    result.weight = weight;
  }
  return result;
}
module.exports = exports['default'];