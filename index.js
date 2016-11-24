'use strict'

// ===================================
// R E Q U I R E' S

var parser = require('posthtml-parser')
var render = require('posthtml-render')
var css = require('css')
var _ = require('lodash')
var del = require('posthtml-ast-delete-object')
var extract = require('string-extract-class-names')
var getAllValuesByKey = require('posthtml-ast-get-values-by-key')
var deleteKey = require('posthtml-ast-delete-key')
var findTag = require('posthtml-ast-get-object')
var pullAllWithGlob = require('array-pull-all-with-glob')
var detect = require('detect-is-it-html-or-xhtml')

var i, len

// ===================================
// F U N C T I O N S

function existy (x) { return x != null }

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

/**
 * removeFromTheFrontOfEachEl - removes characters from the front of other strings
 *
 * @param  {Array|String} arr    input
 * @param  {String} whatToRemove string what to remove
 * @return {type}                returning the same type of what was input
 */
function removeFromTheFrontOfEachEl (arr, whatToRemove) {
  if (!Array.isArray(arr) || !_.isString(whatToRemove)) {
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
  input = del(input, {type: 'rule', selectors: ['']})
  input = del(input, {rules: []})
  input = del(input, {type: 'stylesheet'}, true)
  input = del(input, {class: ''})
  input = del(input, {id: ''})
  return input
}

// ===================================
// A C T I O N

/**
 * emailRemoveUnusedCss - main function
 *
 * @param  {String} htmlContentsAsString    input, html code in a string format
 * @param  {type}   settings                optional settings object
 * @return {type}                           output, html code in a string format
 */
function emailRemoveUnusedCss (htmlContentsAsString, settings) {
  var whitelist
  if (existy(settings) && existy(settings.whitelist)) {
    whitelist = settings.whitelist
  } else {
    whitelist = []
  }

  var noThrowing = false
  if (existy(settings) && existy(settings.noThrowing)) {
    noThrowing = settings.noThrowing
  }


  if (!Array.isArray(whitelist)) whitelist = []

  if (htmlContentsAsString === null) {
    return htmlContentsAsString
  }

  if (!existy(htmlContentsAsString)) {
    return
  }

  if (typeof htmlContentsAsString !== 'string') {
    return htmlContentsAsString
  }

  // identify is it HTML or XHTML, to be used when rendering-back the AST
  var closingSingleTag = 'default'
  if (detect(htmlContentsAsString) === 'xhtml') {
    closingSingleTag = 'slash'
  }

//
//
//

try {

  //
  // PART I. Get all styles from within <head>
  //

  var htmlAstObj = parser(htmlContentsAsString)
  var allStyleTags = findTag(htmlAstObj, {tag: 'style'})
  var allStyleTagSelectors = []
  allStyleTags.forEach(function (el, i) {
    allStyleTagSelectors = allStyleTagSelectors.concat(_.flattenDeep(getAllValuesByKey(css.parse(allStyleTags[i].content[0]), 'selectors')))
  })
  allStyleTagSelectors = _.uniq(allStyleTagSelectors)

  var allClassesAndIdsWithinHead = []

  allStyleTagSelectors.forEach(function (el, i) {
    allClassesAndIdsWithinHead.push(extract(el))
  })

  allClassesAndIdsWithinHead = _.uniq(_.flattenDeep(allClassesAndIdsWithinHead, ''))
  allClassesAndIdsWithinHead = pullAllWithGlob(allClassesAndIdsWithinHead, whitelist)

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
  allClassesAndIdsWithinBody = pullAllWithGlob(allClassesAndIdsWithinBody, whitelist)

  //
  // PART III. Compile to-be-deleted class names, within <body> and within <head>
  //

  var headCssToDelete = _.clone(allClassesAndIdsWithinHead)
  _.pullAll(headCssToDelete, allClassesAndIdsWithinBody)
  // console.log('\n* headCssToDelete = ' + JSON.stringify(headCssToDelete, null, 4))

  var bodyCssToDelete = _.clone(allClassesAndIdsWithinBody)
  _.pullAll(bodyCssToDelete, allClassesAndIdsWithinHead)
  // console.log('* bodyCssToDelete = ' + JSON.stringify(bodyCssToDelete, null, 4) + '\n')

  //
  // PART IV. Delete classes from <head>
  //

  allStyleTags.forEach(function (el, i) {
    var parsedCSS = css.parse(el.content[0])
    var allSelectors = getAllValuesByKey(parsedCSS, 'selectors')
    var new_oo = _.clone(allSelectors)
    new_oo.forEach(function (elem1, index1) {
      elem1.forEach(function (elem2, index2) {
        for (var i = 0, len = headCssToDelete.length; i < len; i++) {
          if (_.includes(extract(new_oo[index1][index2]), headCssToDelete[i])) {
            new_oo[index1][index2] = ''
          }
        }
      })
    })

    new_oo.forEach(function (el, i) {
      new_oo[i] = _.without(new_oo[i], '')
    })
    // finally, write over:
    var erasedTest = getAllValuesByKey(css.parse(el.content[0]), 'selectors', new_oo)

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
    el.content[0] = stringifiedErasedTest
    //
  })

  allStyleTags.forEach(function (el, i) {
    if ((el.tag === 'style') && (el.content.length === 1) && (el.content[0].length === 0)) {
      allStyleTags[i] = {}
    }
  })
  htmlAstObj = findTag(htmlAstObj, {tag: 'style'}, allStyleTags)

  //
  // PART V. Delete classes from within <body>
  //

  var allBodyClasses = getAllValuesByKey(htmlAstObj, 'class')
  var allBodyIds = getAllValuesByKey(htmlAstObj, 'id')

  var splitBodyClasses
  var splitBodyIds

  // ==============================
  // prep classes:
  for (i = 0, len = allBodyClasses.length; i < len; i++) {
    splitBodyClasses = allBodyClasses[i].split(' ')
    splitBodyClasses = prependToEachElIfMissing(_.uniq(_.without(splitBodyClasses, '')))
    allBodyClasses[i] = removeFromTheFrontOfEachEl(_.difference(splitBodyClasses, bodyCssToDelete), '.').join(' ')
  }
  // write classes (notice third input argument)
  htmlAstObj = getAllValuesByKey(htmlAstObj, 'class', allBodyClasses)
  // ==============================
  // prep ids:
  for (i = 0, len = allBodyIds.length; i < len; i++) {
    splitBodyIds = allBodyIds[i].split(' ')
    splitBodyIds = prependToEachElIfMissing(_.uniq(_.without(splitBodyIds, '')), '#')
    allBodyIds[i] = removeFromTheFrontOfEachEl(_.difference(splitBodyIds, bodyCssToDelete), '#').join(' ')
  }
  // write ids (notice third input argument)
  htmlAstObj = getAllValuesByKey(htmlAstObj, 'id', allBodyIds)
  // ==============================
  // clean up
  htmlAstObj = deleteKey(htmlAstObj, 'class', '')
  htmlAstObj = deleteKey(htmlAstObj, 'id', '')
  htmlAstObj = del(htmlAstObj, {tag: 'style'}, true)
  htmlAstObj = del(htmlAstObj, {tag: 'style', attrs: {type: 'text/css'}}, true)

  //
  // FINALE. Write out to ssd.
  //

  // console.log('htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))

  var toBeReturned = render(htmlAstObj, { closingSingleTag: closingSingleTag })
  // console.log('toBeReturned = ' + toBeReturned)

  return [toBeReturned, {
    deletedFromHead: headCssToDelete,
    deletedFromBody: bodyCssToDelete
  }]

// TRY ENDS BELOW
} catch (e) {
  if (noThrowing) {
    return ['the input code has problems, please check it']
  } else {
    throw new Error(e)
  }
}
}

module.exports = emailRemoveUnusedCss
