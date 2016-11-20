'use strict'

// ===================================
// R E Q U I R E' S

var fs = require('fs')
var parser = require('posthtml-parser')
var render = require('posthtml-render')
var css = require('css')
var _ = require('lodash')
var del = require('posthtml-ast-delete-object')
var extract = require('string-extract-class-names')
var getAllValuesByKey = require('posthtml-ast-get-values-by-key')
var deleteKey = require('posthtml-ast-delete-key')
var findTag = require('posthtml-ast-get-object')

var i, len

var whitelist = [
  'ExternalClass',
  'ReadMsgBody',
  'yshortcuts',
  'maxwidth-apple-mail-fix',
  'module-*'
]

// ===================================
// F U N C T I O N S

function aContainsB (a, b) {
  return a.indexOf(b) >= 0
}

function aStartsWithB (a, b) {
  return a.indexOf(b) === 0
}

function existy (x) { return x != null }

function truthy (x) { return (x !== false) && existy(x) }

/**
 * pullAllWithGlob - like _.pullAll but pulling stronger
 * Accepts * glob. This: "module-*" would pull all: "module-1", "module-zzz"...
 *
 * @param  {Array} incomingArray   array of strings
 * @param  {Array} whitelistArray  array of strings (might contain asterisk)
 * @return {Array}                 pulled array
 */
function pullAllWithGlob (incomingArray, whitelistArray) {
  // console.log('incomingArray = ' + JSON.stringify(incomingArray, null, 4))
  if (!Array.isArray(whitelistArray) || !Array.isArray(incomingArray)) {
    return incomingArray
  }
  whitelistArray.forEach(function (whitelistArrayElem, whitelistArrayIndex) {
    _.remove(incomingArray, function (n) {
      if (aContainsB(whitelistArrayElem, '*')) {
        return aStartsWithB(n, _.replace(whitelistArrayElem, /[*].*/g, ''))
      } else {
        return n === whitelistArrayElem
      }
    })
  })
  // console.log('incomingArray = ' + JSON.stringify(incomingArray, null, 4))
  return incomingArray
}

// =========

/**
 * sortClassesFromArrays - reads array of selectors like
 * ['.class2', '.id1', .class2, '.id2']
 * and separates classes from ids, returning array of each
 *
 * @param  {Array} arrayIn array of class, id selectors (or nonsenses)
 * @return {Array}         array of two arrays: classes and id's
 */
function sortClassesFromArrays (arrayIn) {
  var classArrOut = []
  var idArrOut = []
  var temp
  arrayIn.forEach(function (el, i) {
    if ((el.indexOf('#') !== -1) && (el[1] !== undefined)) {
      temp = extract(el, '#')
      if (temp.length > 0) {
        idArrOut.push(temp)
      }
    }
    if ((el.indexOf('.') !== -1) && (el[1] !== undefined)) {
      temp = extract(el, '.')
      if (temp.length > 0) {
        classArrOut.push(temp)
      }
    }
  })
  return [classArrOut, idArrOut]
}

// =========

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

function removeFromTheFrontOfEachEl (arr, whatToRemove) {
  if (!_.isArray(arr) || !_.isString(whatToRemove)) {
    return arr
  }
  return arr.map(function (el) {
    return _.trimStart(el, whatToRemove)
  })
}

// =========

function clean (input) {
  // delete all empty selectors within rules:
  // erasedWithNoEmpty
  input = del(input, {selectors: ['']})
  input = del(input, {selectors: []})
  input = del(input, {selectors: []})
  input = del(input, {type: 'rule', selectors: ['']})
  input = del(input, {rules: []})
  input = del(input, {rules: []})
  input = del(input, {type: 'stylesheet'}, true)
  input = del(input, {class: ''})
  return input
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

  var rawParsedHtml = fs.readFileSync('./dummy_html/test2.html').toString()
  var htmlAstObj = parser(rawParsedHtml)
  // console.log('*** starting htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))
  // console.log('htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))
  var allStyleTags = findTag(htmlAstObj, {tag: 'style'})
  // console.log('allStyleTags = ' + JSON.stringify(allStyleTags, null, 4))

  // var step_four = css.parse(allStyleTags[0].content[0])
  // var allStyleTagSelectors = getAllValuesByKey(step_four)
  var allStyleTagSelectors = []
  // Note to self. CSS Parser will have all selectors under keys "selectors"
  allStyleTags.forEach(function (el, i) {
    allStyleTagSelectors = allStyleTagSelectors.concat(_.flattenDeep(getAllValuesByKey(css.parse(allStyleTags[i].content[0]), 'selectors')))
  })
  // dedupe:
  allStyleTagSelectors = _.uniq(allStyleTagSelectors)
  // console.log('allStyleTagSelectors = ' + JSON.stringify(allStyleTagSelectors, null, 4))

  var allClassesAndIdsWithinHead = []

  allStyleTagSelectors.forEach(function (el, i) {
    allClassesAndIdsWithinHead.push(extract(el))
  })

  allClassesAndIdsWithinHead = _.uniq(_.flattenDeep(allClassesAndIdsWithinHead, ''))
  allClassesAndIdsWithinHead = pullAllWithGlob(allClassesAndIdsWithinHead, prependToEachElIfMissing(whitelist))

  // console.log('* allClassesAndIdsWithinHead = ' + JSON.stringify(allClassesAndIdsWithinHead, null, 4))

  //
  // PART II. Get all inline styles from within <body>
  //

  var allClassesWithinBodyRawContentsArray = getAllValuesByKey(htmlAstObj, 'class')
  allClassesWithinBodyRawContentsArray.forEach(function (el, i) {
    allClassesWithinBodyRawContentsArray[i] = el.split(' ')
  })
  allClassesWithinBodyRawContentsArray = prependToEachElIfMissing(_.without(_.flattenDeep(allClassesWithinBodyRawContentsArray), ''))

  var allIdsWithinBodyRaw = getAllValuesByKey(htmlAstObj, 'id')
  allIdsWithinBodyRaw.forEach(function (el, i) {
    allIdsWithinBodyRaw[i] = el.split(' ')
  })
  allIdsWithinBodyRaw = prependToEachElIfMissing(_.without(_.flattenDeep(allIdsWithinBodyRaw), ''), '#')

  var allClassesAndIdsWithinBody = allClassesWithinBodyRawContentsArray.concat(allIdsWithinBodyRaw)

  allClassesAndIdsWithinBody = pullAllWithGlob(allClassesAndIdsWithinBody, prependToEachElIfMissing(whitelist))

  // console.log('* allClassesAndIdsWithinBody = ' + JSON.stringify(allClassesAndIdsWithinBody, null, 4))

  //
  // PART III. Compile to-be-deleted class names, within <body> and within <head>
  //

  var headCssToDelete = _.clone(allClassesAndIdsWithinHead)
  _.pullAll(headCssToDelete, allClassesAndIdsWithinBody)
  console.log('\n* headCssToDelete = ' + JSON.stringify(headCssToDelete, null, 4))

  var bodyCssToDelete = _.clone(allClassesAndIdsWithinBody)
  _.pullAll(bodyCssToDelete, allClassesAndIdsWithinHead)
  console.log('* bodyCssToDelete = ' + JSON.stringify(bodyCssToDelete, null, 4) + '\n')

  //
  // PART IV. Delete classes from <head>
  //

  allStyleTags.forEach(function (el, i) {
    var parsedCSS = css.parse(el.content[0])
    // console.log('*** parsedCSS = ' + JSON.stringify(parsedCSS, null, 4))

    var allSelectors = getAllValuesByKey(parsedCSS, 'selectors')
    // console.log('*** allSelectors = ' + JSON.stringify(allSelectors, null, 4))
    var new_oo = _.clone(allSelectors)

    // console.log('new_oo BEFORE: ' + JSON.stringify(new_oo, null, 4))

    new_oo.forEach(function (elem1, index1) {
      // console.log('new_oo[' + index1 + '] = ' + JSON.stringify(new_oo[index1], null, 4))
      for (var i = 0, len = headCssToDelete.length; i < len; i++) {
        // console.log('headCssToDelete[i] = ' + JSON.stringify(headCssToDelete[i], null, 4))
        if (_.includes(extract(new_oo[index1][0]), headCssToDelete[i])) {
          // console.log('REMOVE: ' + JSON.stringify(new_oo[index1][0], null, 4))
          new_oo[index1][0] = ''
        }
      }
    })

    new_oo.forEach(function (el, i) {
      new_oo[i] = _.without(new_oo[i], '')
    })
    // console.log('new_oo AFTER: ' + JSON.stringify(new_oo, null, 4))

    // finally, write over:
    var erasedTest = getAllValuesByKey(css.parse(el.content[0]), 'selectors', new_oo)
    // console.log('!!!!!!!!\nerasedTest = ' + JSON.stringify(erasedTest, null, 4))

    while (!_.isEqual(erasedTest, clean(erasedTest))) {
      erasedTest = clean(erasedTest)
    }

    var stringifiedErasedTest

    if (existy(erasedTest) && (Object.keys(erasedTest).length !== 0)) {
      stringifiedErasedTest = '\n' + css.stringify(erasedTest) + '\n'
    } else {
      // assign manually because css.stringify doesn't accept "{}"
      stringifiedErasedTest = ''
    }

    // console.log('el.content[0] = ' + JSON.stringify(el.content[0], null, 4))

    // assign the stringified thing back to "content": ['...']
    el.content[0] = stringifiedErasedTest
    //
  })

  allStyleTags.forEach(function (el, i) {
    // console.log('el = ' + JSON.stringify(el, null, 4))
    if ((el.tag === 'style') && (el.content.length === 1) && (el.content[0].length === 0)) {
      allStyleTags[i] = {}
    }
  })

  // console.log('allStyleTags before replacing AST: ' + JSON.stringify(allStyleTags, null, 4))
  htmlAstObj = getAllValuesByKey(htmlAstObj, 'style', allStyleTags)

  // clean up the HTML AST from empty <style> tags:
  //
  // {
  //   "tag": "style",
  //   "content": [{}]
  // }
  //

  //
  // PART V. Delete classes from within <body>
  //

  var allBodyClasses = getAllValuesByKey(htmlAstObj, 'class')
  var allBodyIds = getAllValuesByKey(htmlAstObj, 'id')
  // console.log('1. allBodyClasses = ' + JSON.stringify(allBodyClasses, null, 4))
  // console.log('1. allBodyIds = ' + JSON.stringify(allBodyIds, null, 4))

  var splitBodyClasses
  var splitBodyIds

  // ==============================
  // prep classes:
  for (i = 0, len = allBodyClasses.length; i < len; i++) {
    // console.log('\n=======\nRAW allBodyClasses[i] = ' + JSON.stringify(allBodyClasses[i], null, 4))
    splitBodyClasses = allBodyClasses[i].split(' ')
    splitBodyClasses = prependToEachElIfMissing(_.uniq(_.without(splitBodyClasses, '')))
    // console.log('____ splitBodyClasses = ' + JSON.stringify(splitBodyClasses, null, 4))
    allBodyClasses[i] = removeFromTheFrontOfEachEl(_.difference(splitBodyClasses, bodyCssToDelete), '.').join(' ')
  }
  // write classes (notice third input argument)
  htmlAstObj = getAllValuesByKey(htmlAstObj, 'class', allBodyClasses)
  // ==============================
  // prep ids:
  for (i = 0, len = allBodyIds.length; i < len; i++) {
    splitBodyIds = allBodyIds[i].split(' ')
    splitBodyIds = prependToEachElIfMissing(_.uniq(_.without(splitBodyIds, '')), '#')
    // console.log('splitBodyIds = ' + JSON.stringify(splitBodyIds, null, 4))
    allBodyIds[i] = removeFromTheFrontOfEachEl(_.difference(splitBodyIds, bodyCssToDelete), '#').join(' ')
  }
  // write ids (notice third input argument)
  htmlAstObj = getAllValuesByKey(htmlAstObj, 'id', allBodyIds)

  // clean up
  htmlAstObj = deleteKey(htmlAstObj, 'class', '')
  htmlAstObj = deleteKey(htmlAstObj, 'id', '')
  htmlAstObj = del(htmlAstObj, {tag: 'style'}, true)
  htmlAstObj = del(htmlAstObj, {tag: 'style', attrs: {type: 'text/css'}}, true)

  // KK console.log('** htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))

  //
  // FINALE. Write out to ssd.
  //

  fs.writeFileSync('./dummy_html/clean.html', render(htmlAstObj))

  // console.log('*** new htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))
  // console.log(render(htmlAstObj))
})()
// ========================================
// css parser: https://github.com/reworkcss/css
