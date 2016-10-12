'use strict'

// ===================================
// R E Q U I R E' S

var fs = require('fs')
var parser = require('posthtml-parser')
var css = require('css')
var _ = require('lodash')

// ===================================
// F U N C T I O N S

/**
 * isObject - detects is it a true object or not
 *
 * @param  {Unknown?} item something is passed
 * @return {Boolean}      true, if it's real object passed. False otherwise
 */
function isObject (item) {
  return (typeof item === 'object' && !Array.isArray(item) && item !== null)
}

// =========

/**
 * findTag - This is a walker-function for fealing with PostHTML-parsed AST.
 * Pass array or object and a tag name.
 * It will recursively walk the incoming "objOrArr" until it will find an
 * object with a key "tag" and a value "tagName" (incoming var).
 * Then it will look for a key "content" at the same depth as found key "tag".
 * If it exists, it will return "content". Same with "attrs", if found at the
 * same level, it's contents will be returned.
 *
 * @param  {Object|Array} objOrArr pass in the PostHTML AST (normally an array).
 * @param  {String} tagName  name of the tag (which is a key value in an object)
 * @return {Object|null}          two keys: 'attrs' and 'content', each if found
 */
function findTag (objOrArr, tagName, findingsArray) {
  var tempObj = {}
  findingsArray = findingsArray || []
  if (tagName === null || tagName === undefined || tagName === '' || typeof tagName !== 'string') {
    return null
  }
  // if object is passed, crawl it, checking for key=tagName:
  if (isObject(objOrArr)) {
    // it's an object. Iterate through it.
    Object.keys(objOrArr).forEach(function (el) {
      // console.log('objOrArr[' + el + ']=' + JSON.stringify(objOrArr[el], null, 4))
      if (objOrArr[el] === tagName) {
        // console.log('FOUND ' + tagName + '!')
        tempObj = {}
        tempObj['tag'] = tagName
        if (objOrArr['attrs']) {
          tempObj['attrs'] = objOrArr['attrs']
        }
        if (objOrArr['content']) {
          tempObj['content'] = objOrArr['content']
        }
        // console.log('tempObj = ' + JSON.stringify(tempObj, null, 4))
        // console.log('objOrArr[attrs] = ' + JSON.stringify(objOrArr['attrs'], null, 4))
        // console.log('objOrArr[content] = ' + JSON.stringify(objOrArr['content'], null, 4))
        findingsArray.push(tempObj)
      }
      if (Array.isArray(objOrArr[el])) {
        findTag(objOrArr[el], tagName, findingsArray)
      }
    })
  } else if (Array.isArray(objOrArr)) {
    // else, it's an array. Iterate each key, if it's an obj, call findTag()
    objOrArr.forEach(function (el, i) {
      // console.log('array el[' + i + ']=' + JSON.stringify(el, null, 4))
      if (isObject(el)) {
        findTag(el, tagName, findingsArray)
      }
    })
  }
  return findingsArray
}

// =========

// returns true if input is not (null or undefined)
// notice loose equal:
function existy (x) { return x != null };
// returns true on all truthy things:
function truthy (x) { return (x !== false) && existy(x) };

// =========

/**
 * getAllValuesByKey - query a key, get an array of values of all that key instances
 *
 * @param  {Whatever} input - AST tree object or Array or String (if called recursively)
 * @param  {String} whatToFind - the name of the key to find. We'll put its value into results array
 * @param  {Array} replacement (optional) - what to replace all found values with
 * @param  {Array} result - INNER VARIABLE - to retain values when called recursively
 * @return {Array|null}  output   Null or Array of all selectors
 */
function getAllValuesByKey (input, whatToFind, replacement, result) {
  result = result || []
  if (typeof whatToFind !== 'string') {
    whatToFind = String(whatToFind)
  }
  if (isObject(input)) {
    // firstly, check does it have key named {whatToFind}, for example "selectors"
    if (existy(input[whatToFind])) {
      // - if replacement is sent, replace:
      if (truthy(replacement)) {
        // -- if replacement is a string:
        if (_.isString(replacement)) {
          input[whatToFind] = replacement
          replacement = null
          // replacement = undefined
        } else if (_.isArray(replacement)) {
        // -- if replacement is array:
          // --- use the first value in replacement[] array:
          if (existy(replacement[0])) {
            input[whatToFind] = replacement[0]
          }
          // --- remove the first element from the replacement array:
          replacement.shift()
        } else {
          throw new Error('Replacement is not recognised!')
        }
      } else {
      // - otherwise, prepare the return array:
      // if can be straight text or array
        if (Array.isArray(input[whatToFind])) {
          input[whatToFind].forEach(function (elem) {
            result.push(elem)
          })
        } else {
          // must be String then:
          result.push(input[whatToFind])
        }
      }
    }
    // secondly, iterate all keys for deeper content
    Object.keys(input).forEach(function (el) {
      // if stumbled on value which is Array
      if (Array.isArray(input[el]) || isObject(input[el])) {
        // if replacement mode, pass result as incoming object!

        // else, pass original input object
        getAllValuesByKey(input[el], whatToFind, replacement, result)
      }
    })
  }
  // if array is passed, iterate each elem, check if it's Obj, call itself recursively
  if (Array.isArray(input)) {
    input.forEach(function (el) {
      if (isObject(el)) {
        getAllValuesByKey(el, whatToFind, replacement, result)
      }
    })
  }
  if (truthy(replacement)) {
    return input
  } else {
    return result
  }
}

// =========

/**
 * sortClassesFromArrays - reads array of selectors like
 * ['.class2', '.id1', .class2, '.id2']
 * and separates classes from ids, returning array of each
 *
 * @param  {Array} arrayIn array of class, id or nonsense selectors
 * @return {Array}         array of two arrays: classes and id's
 */
function sortClassesFromArrays (arrayIn) {
  var classArrOut = []
  var idArrOut = []
  arrayIn.forEach(function (el, i) {
    if (el[0] === '.') {
      classArrOut.push(el.slice(1))
    } else if (el[0] === '#') {
      idArrOut.push(el.slice(1))
    }
  })
  return [classArrOut, idArrOut]
}

// =========

/**
 * emailRemoveUnusedCss - the main function
 * Purpose: for use in email newsletter development to clean email templates
 * Removes unused CSS from <head> and unused CSS from BODY
 *
 * @param  {String} htmlContentsAsString incoming HTML as (UTF-8) string
 * @return {String}                      cleaned HTML as (UTF-8) string
 */
function emailRemoveUnusedCss (htmlContentsAsString) {
  var cleanedContents
  return cleanedContents
}

// ===================================
// A C T I O N

(function () {
  //
  // PART I. Get all styles from within <head>
  //

  var rawParsedHtml = fs.readFileSync('./dummy_html/test1.html').toString()
  var htmlAstObj = parser(rawParsedHtml)
  // console.log('htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))
  var step_three = findTag(htmlAstObj, 'style')
  console.log('step_three = ' + JSON.stringify(step_three, null, 4))
  // var step_four = css.parse(step_three[0].content[0])
  // var allStyleTagSelectors = getAllValuesByKey(step_four)
  var allStyleTagSelectors = []
  // Note to self. CSS Parser will have all selectors under keys "selectors"
  step_three.forEach(function (el, i) {
    allStyleTagSelectors = allStyleTagSelectors.concat(getAllValuesByKey(css.parse(step_three[i].content[0]), 'selectors'))
  })
  // dedupe:
  allStyleTagSelectors = _.uniq(allStyleTagSelectors)
  var allClassesWithinHead = sortClassesFromArrays(allStyleTagSelectors)[0]
  var allIdSelectors = sortClassesFromArrays(allStyleTagSelectors)[1]
  // console.log('\n\n===============\nall selectors from <style> tags: ' + JSON.stringify(allStyleTagSelectors, null, 4) + '\n===============\n\n')
  // console.log('all classes from style tags: ' + JSON.stringify(allClassesWithinHead, null, 4))
  // console.log('all id\'s from style tags: ' + JSON.stringify(allIdSelectors, null, 4))

  //
  // PART II. Get all inline styles from within <body>
  //

  // Note to self. HTML Parser will have all class attributes under keys "class"
  // allClassesWithinBodyRawContentsArray is array of strings, each is {value} from class="{value}"
  var allClassesWithinBodyRawContentsArray = getAllValuesByKey(htmlAstObj, 'class')
  var allClassesWithinBodySplitArray = []
  allClassesWithinBodyRawContentsArray.forEach(function (el) {
    el.split(' ').forEach(function (el) {
      if (el !== '') {
        allClassesWithinBodySplitArray.push(el)
      }
    })
  })
  allClassesWithinBodySplitArray = _.uniq(allClassesWithinBodySplitArray)

  //
  // PART III. Compile to-be-deleted class names, within <body> and within <head>
  //

  var headCssToDelete = _.clone(allClassesWithinHead)
  _.pullAll(headCssToDelete, allClassesWithinBodySplitArray)
  console.log('\n==================\n\nheadCssToDelete = ' + JSON.stringify(headCssToDelete, null, 4))

  var bodyCssToDelete = _.clone(allClassesWithinBodySplitArray)
  _.pullAll(bodyCssToDelete, allClassesWithinHead)
  console.log('bodyCssToDelete = ' + JSON.stringify(bodyCssToDelete, null, 4))

  //
  // PART IV. Delete classes from <head>
  //

  console.log('htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4) + '\n\n\n\n\n\n')

  // we already have step_three, which is all <style> tags.
})()
// ========================================
// css parser: https://github.com/reworkcss/css
