'use strict'

var _ = require('lodash')

/**
 * prependToEachElIfMissing - append dot or whatever in front of each array element if it's missing
 *
 * @param  {Array}  arr    incoming array
 * @param  {String} thing  dot or hash (normally)
 * @return {Array}         array having all its elements "thing" appended
 */
function prependToEachElIfMissing (arr, thing) {
  if (!Array.isArray(arr)) {
    return arr
  }
  thing = thing || '.'
  return arr.map(function (el) {
    if (_.startsWith(el, String(thing))) {
      return el
    } else {
      return thing + String(el)
    }
  })
}

// =========

/**
 * unprependToEachElIfPresent - removes characters from the front of other strings
 *
 * @param  {Array|String} arr       input
 * @param  {String} whatToRemove    string what to remove
 * @return {WhateverTypeWasInput}   returning the same type of what was input
 */
function unprependToEachElIfPresent (arr, whatToRemove) {
  if (!Array.isArray(arr) || !_.isString(whatToRemove)) {
    return arr
  }
  return arr.map(function (el) {
    return _.trimStart(el, whatToRemove)
  })
}

module.exports = {
  prependToEachElIfMissing: prependToEachElIfMissing,
  unprependToEachElIfPresent: unprependToEachElIfPresent
}
