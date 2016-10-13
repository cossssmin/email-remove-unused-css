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
 * @param  {Object} objOrArr pass in the PostHTML AST (normally an array).
 * @param  {String} tagName  name of the tag (which is a key value in an object)
 * @param  {String} replacementContents  OPTIONAL array of values to replace findings with - can be a single String or Object (then all findings will be replaced with it)
 * @return {Object|null}          two keys: 'attrs' and 'content', each if found
 */
function findTag (objOrArr, tagName, replacementContents, result) {
  var tempObj = {}
  result = result || []
  if (tagName === null || tagName === undefined || tagName === '' || typeof tagName !== 'string') {
    return objOrArr
  }
  // if object is passed, crawl it, checking for key=tagName:
  if (isObject(objOrArr)) {
    // it's an object. Iterate through it.
    Object.keys(objOrArr).forEach(function (el) {
      // console.log('objOrArr[' + el + ']=' + JSON.stringify(objOrArr[el], null, 4))
      if (objOrArr[el] === tagName) {
        // console.log('FOUND ' + tagName + '!')
        // -- if replacement is passed, replace:
        if (truthy(replacementContents)) {
          // if replacement is an array:
          if (_.isArray(replacementContents)) {
            if (existy(replacementContents[0])) {
              objOrArr['content'] = replacementContents[0]
              replacementContents.shift()
            }
          } else {
          // if replacement is single thing:
            objOrArr['content'] = replacementContents
          }
        } else {
        // -- it's not replcement, so prepare the return array:
          tempObj = {}
          tempObj['tag'] = tagName
          if (objOrArr['attrs']) {
            tempObj['attrs'] = objOrArr['attrs']
          }
          if (objOrArr['content']) {
            tempObj['content'] = objOrArr['content']
          }
          result.push(tempObj)
        }
      }
      if (Array.isArray(objOrArr[el])) {
        findTag(objOrArr[el], tagName, replacementContents, result)
      }
    })
  } else if (Array.isArray(objOrArr)) {
    // else, it's an array. Iterate each key, if it's an obj, call findTag()
    objOrArr.forEach(function (el, i) {
      // console.log('array el[' + i + ']=' + JSON.stringify(el, null, 4))
      if (isObject(el)) {
        findTag(el, tagName, replacementContents, result)
      }
    })
  }
  if (truthy(replacementContents)) {
    return objOrArr
  } else {
    return result
  }
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
      // it can be straight text or array
        if (Array.isArray(input[whatToFind])) {
          var tempArr = []
          input[whatToFind].forEach(function (elem) {
            tempArr.push(elem)
          })
          result.push(tempArr)
        } else {
          // must be String then:
          result.push([input[whatToFind]])
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

  function chopOffUpToDot (str) {
    return _.replace(str, /[^.]*[.]/g, '')
  }

  function chopOffUpToHash (str) {
    return _.replace(str, /[^#]*[#]/g, '')
  }

  function chopOffTheRest (str) {
    return _.replace(str, /[ :>.#+~\[\]].*/g, '')
  }

  var classArrOut = []
  var idArrOut = []
  var temp
  arrayIn.forEach(function (el, i) {
    if ((el.indexOf('#') !== -1) && (el[1] !== undefined)) {
      temp = chopOffUpToHash(el)
      temp = chopOffTheRest(temp)
      if (temp.length > 0) {
        idArrOut.push(temp)
      }
    }
    if ((el.indexOf('.') !== -1) && (el[1] !== undefined)) {
      temp = chopOffUpToDot(el)
      temp = chopOffTheRest(temp)
      if (temp.length > 0) {
        classArrOut.push(temp)
      }
    }
  })
  return [classArrOut, idArrOut]
}

// =========

function prependDotsToEachEl (arr) {
  return arr.map(function (el) {
    return '.' + el
  })
}

// =========

function deleteRulesWithNoSelectors (obj) {
  // console.log('obj = ' + JSON.stringify(obj, null, 4))
  if (!isObject(obj)) {
    return obj
  }
  var tempArr = []

  // first, check for empty "selectors": [], like this:
  //
  // "stylesheet": {
  //   "rules": [
  //     {
  //       "type": "rule",
  //       "selectors": [],
  //
  obj.stylesheet.rules.forEach(function (el, i) {
    // console.log('\n************\n************\n************\n************\nel = ' + JSON.stringify(el, null, 4))
    // console.log('el.selectors = ' + JSON.stringify(el.selectors, null, 4))
    // console.log('* ' + el.selectors.length)
    if (existy(el.selectors) && el.selectors.length > 0) {
      tempArr.push(el)
    }
  })
  obj.stylesheet.rules = tempArr
  // second, maybe we deleted the last selector and the whole "stylesheet" is now empty:
  //
  // {
  //   "type": "stylesheet",
  //   "stylesheet": {
  //     "rules": [],
  //     "parsingErrors": []
  //   }
  // }
  //
  if (!obj.stylesheet.rules.length) {
    // console.log('obj before: ' + JSON.stringify(obj, null, 4))
    obj = {}
    // console.log('obj after: ' + JSON.stringify(obj, null, 4))
  }
  //
  return obj
}

// =========

/**
 * deleteObjFromAst - deletes objects from parsed HTML - AST trees
 *
 * @param  {Arr} astArray       AST in array form
 * @param  {Object} objToDelete Object to search for and delete
 * @param  {type} strictOrNot   If FALSE, it's enough a found object to have
 * the same keys/values as "objToDelete" in order to be deleted. There can be more
 * things, but whole object will still be deleted.
 * If TRUE, mode is strict and finding has EXACTLY match the "objToDelete"
 * @param  {type} result        INTERNAL VARIABLE, used in recursion
 * @return {Arr}                amended AST
 */
function deleteObjFromAst (astArray, objToDelete, strictOrNot, result) {
  return result
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

  var rawParsedHtml = fs.readFileSync('./dummy_html/test4.html').toString()
  var htmlAstObj = parser(rawParsedHtml)
  // console.log('*** starting htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))
  var step_three = findTag(htmlAstObj, 'style')
  // console.log('original step_three = ' + JSON.stringify(step_three, null, 4))
  // var step_four = css.parse(step_three[0].content[0])
  // var allStyleTagSelectors = getAllValuesByKey(step_four)
  var allStyleTagSelectors = []
  // Note to self. CSS Parser will have all selectors under keys "selectors"
  step_three.forEach(function (el, i) {
    allStyleTagSelectors = allStyleTagSelectors.concat(_.flatten(getAllValuesByKey(css.parse(step_three[i].content[0]), 'selectors')))
  })
  // dedupe:
  allStyleTagSelectors = _.uniq(allStyleTagSelectors)
  console.log('allStyleTagSelectors = ' + JSON.stringify(allStyleTagSelectors, null, 4))
  var allClassesWithinHead = _.uniq(sortClassesFromArrays(allStyleTagSelectors)[0])
  var allIdSelectors = _.uniq(sortClassesFromArrays(allStyleTagSelectors)[1])
  // console.log('\n\n===============\nall selectors from <style> tags: ' + JSON.stringify(allStyleTagSelectors, null, 4) + '\n===============\n\n')
  console.log('all classes from style tags: ' + JSON.stringify(allClassesWithinHead, null, 4))
  console.log('all id\'s from style tags: ' + JSON.stringify(allIdSelectors, null, 4))

  //
  // PART II. Get all inline styles from within <body>
  //

  // Note to self. HTML Parser will have all class attributes under keys "class"
  // allClassesWithinBodyRawContentsArray is array of strings, each is {value} from class="{value}"
  var allClassesWithinBodyRawContentsArray = _.flatten(getAllValuesByKey(htmlAstObj, 'class'))
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

  // var testTagReplacement = findTag(htmlAstObj, 'html', [['yo1'], ['yo2']])
  // console.log('testTagReplacement = ' + JSON.stringify(testTagReplacement, null, 4))

  // we already have step_three, which is all <style> tags.
  // First, prep step_three, :
  // console.log('===========================================')
  // console.log('step_three before prepping: ' + JSON.stringify(step_three, null, 4))
  step_three.forEach(function (el, i) {
    // console.log('before deleting: ' + JSON.stringify(el.content[0], null, 4))
    // var nn = css.parse(el.content[0])
    // console.log('nn = ' + JSON.stringify(nn, null, 4))
    // --
    var old_oo = getAllValuesByKey(css.parse(el.content[0]), 'selectors')
    // console.log('old_oo = ' + JSON.stringify(old_oo, null, 4) + '\n=====================================\n=====================================\n')
    // --

    var new_oo = _.clone(old_oo)
    new_oo.forEach(function (el, i) {
      _.pullAll(new_oo[i], prependDotsToEachEl(headCssToDelete))
    })

    var erasedTest = deleteRulesWithNoSelectors(getAllValuesByKey(css.parse(el.content[0]), 'selectors', new_oo))
    // console.log('erasedTest = ' + JSON.stringify(erasedTest, null, 4) + '\n=====================================\n=====================================\n')

    var stringifiedErasedTest

    if (Object.keys(erasedTest).length !== 0) {
      stringifiedErasedTest = css.stringify(erasedTest)
    } else {
      // assign manually because css.stringify doesn't accept "{}"
      stringifiedErasedTest = ''
    }
    // console.log('stringifiedErasedTest: ' + JSON.stringify(stringifiedErasedTest, null, 4) + '\n===========================================')

    // assign the stringified thing back to "content": ['...']
    el.content[0] = stringifiedErasedTest
    //
  })
  // console.log('step_three after CSS cleaning: ' + JSON.stringify(step_three, null, 4))
  // we cleaned the CSS, but now we need to clean at HTML-level too:
  // [
  //   {
  //     "tag": "style",
  //     "content": [
  //       ""
  //     ]
  //   },
  //   ...
  //
  // needs to be turned into:
  // [
  //   {},
  //   ...
  //
  // Most important, we'll retain the empty object, in order to keep the order right
  // later when we'll be replacing the HTML AST tree with it.
  //

  step_three.forEach(function (el, i) {
    // console.log('el = ' + JSON.stringify(el, null, 4))
    if ((el.tag === 'style') && (el.content.length === 1) && (el.content[0].length === 0)) {
      step_three[i] = {}
    }
  })

  // console.log('step_three before replacing AST: ' + JSON.stringify(step_three, null, 4))
  htmlAstObj = getAllValuesByKey(htmlAstObj, 'style', step_three)

  // clean up the HTML AST from empty <style> tags:
  //
  // {
  //   "tag": "style",
  //   "content": {}
  // }
  //

  htmlAstObj = deleteObjFromAst(htmlAstObj, { 'tag': 'style', 'content': {} }, false)

  console.log('*** new htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))

})()
// ========================================
// css parser: https://github.com/reworkcss/css
