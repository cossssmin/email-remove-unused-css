'use strict'

const _ = require('lodash')
const isArr = Array.isArray
const monkey = require('ast-monkey')

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

function unprependToEachElIfPresent (arr, whatToRemove) {
  if (!Array.isArray(arr) || !_.isString(whatToRemove)) {
    return arr
  }
  return arr.map(function (el) {
    return _.trimStart(el, whatToRemove)
  })
}

function removeConsecutiveEmptySpaceStrings (ast) {
  var res = monkey.traverse(ast, function (key, val, innerObj) {
    var current = (val !== undefined) ? val : key
    if (isArr(current)) {
      var previousWasEmpty = false
      for (let i = 0, len = current.length; i < len; i++) {
        if ((typeof current[i] === 'string') && (current[i].trim() === '')) {
          if (previousWasEmpty) {
            // delete previous element
            current.splice(i - 1, 1)
            i--
            previousWasEmpty = false
          } else {
            previousWasEmpty = true
          }
        } else {
          previousWasEmpty = false
        }
      }
    }
    return current
  })
  return res
}

module.exports = {
  prependToEachElIfMissing: prependToEachElIfMissing,
  unprependToEachElIfPresent: unprependToEachElIfPresent,
  removeConsecutiveEmptySpaceStrings: removeConsecutiveEmptySpaceStrings
}
