'use strict'

// ===================================
// R E Q U I R E' S

const parser = require('posthtml-parser')
const render = require('posthtml-render')
const css = require('css')
const _ = require('lodash')
const del = require('posthtml-ast-delete-object')
const extract = require('string-extract-class-names')
const getAllValuesByKey = require('posthtml-ast-get-values-by-key')
const deleteKey = require('posthtml-ast-delete-key')
const findTag = require('posthtml-ast-get-object')
const pullAllWithGlob = require('array-pull-all-with-glob')
const detect = require('detect-is-it-html-or-xhtml')
const nonEmpty = require('util-nonempty')
const equal = require('deep-equal')
const util = require('./util')
const removeConsecutiveEmptySpaceStrings = util.removeConsecutiveEmptySpaceStrings

let i, len

// ===================================
// F U N C T I O N S

function existy (x) { return x != null }
function aContainsB (a, b) {
  return a.indexOf(b) >= 0
}

// =========

function clean (input) {
  // delete all empty selectors within rules:
  input = del(input, {selectors: ['']}, {hungryForWhitespace: true, matchKeysStrictly: true})
  input = del(input, {selectors: []}, {hungryForWhitespace: false, matchKeysStrictly: false})
  input = del(input, {rules: []}, {hungryForWhitespace: false, matchKeysStrictly: false})
  // input = del(input, {rules: ''}, {hungryForWhitespace: true, matchKeysStrictly: true})
  // input = del(input, {type: 'rule', selectors: ['']}, {hungryForWhitespace: true, matchKeysStrictly: true})
  // input = del(input, {type: 'stylesheet'}, {hungryForWhitespace: true, matchKeysStrictly: true})
  // input = del(input, {class: ''}, {hungryForWhitespace: true, matchKeysStrictly: false})
  // input = del(input, {id: ''}, {hungryForWhitespace: true, matchKeysStrictly: false})
  // input = deleteKey(input, {key: '', only: 'arrays'})
  return input
}

// ===================================
// A C T I O N

/**
 * emailRemoveUnusedCss - main function
 *
 * @param  {String} htmlContentsAsString    input, html code in a string format
 * @param  {Object} settings                optional settings object
 * @return {Array}                          * returned html code in a string format in array's elem. [0]
 *                                          * the other info in array's elem. [1]
 */

function emailRemoveUnusedCss (htmlContentsAsString, settings) {
  let whitelist
  let treeInputMode = false
  if (existy(settings) && existy(settings.whitelist)) {
    whitelist = settings.whitelist
  } else {
    whitelist = []
  }

  let noThrowing = false
  if (existy(settings) && existy(settings.noThrowing)) {
    noThrowing = settings.noThrowing
  }

  let parsedTree
  if (existy(settings) && existy(settings.parsedTree)) {
    treeInputMode = true
    parsedTree = settings.parsedTree
    htmlContentsAsString = render(treeInputMode)
  } else {
    if (htmlContentsAsString === null) {
      return htmlContentsAsString
    }
    if (!existy(htmlContentsAsString)) {
      return
    }
    if (typeof htmlContentsAsString !== 'string') {
      return htmlContentsAsString
    }
  }

  // identify is it HTML or XHTML, to be used when rendering-back the AST
  let closingSingleTag = 'default'
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

    let htmlAstObj
    if (treeInputMode) {
      htmlAstObj = parsedTree
    } else {
      htmlAstObj = parser(htmlContentsAsString)
    }

    let allStyleTags = findTag(htmlAstObj, {tag: 'style'})
    let allStyleTagSelectors = []
    allStyleTags.forEach(function (el, i) {
      allStyleTagSelectors = allStyleTagSelectors.concat(_.flattenDeep(getAllValuesByKey(css.parse(allStyleTags[i].content[0]), 'selectors')))
    })
    allStyleTagSelectors = _.uniq(allStyleTagSelectors)

    let allClassesAndIdsWithinHead = []

    allStyleTagSelectors.forEach(function (el, i) {
      allClassesAndIdsWithinHead.push(extract(el))
    })

    allClassesAndIdsWithinHead = _.uniq(_.flattenDeep(allClassesAndIdsWithinHead, ''))
    let unwhitelistedAllClassesAndIdsWithinHead = _.clone(allClassesAndIdsWithinHead)
    allClassesAndIdsWithinHead = pullAllWithGlob(allClassesAndIdsWithinHead, whitelist)

    //
    // PART II. Get all inline styles from within <body>
    //

    let allClassesWithinBodyRawContentsArray = getAllValuesByKey(htmlAstObj, 'class')
    allClassesWithinBodyRawContentsArray.forEach(function (el, i) {
      allClassesWithinBodyRawContentsArray[i] = el.split(' ')
    })
    allClassesWithinBodyRawContentsArray = util.prependToEachElIfMissing(_.without(_.flattenDeep(allClassesWithinBodyRawContentsArray), ''))

    let allIdsWithinBodyRaw = getAllValuesByKey(htmlAstObj, 'id')
    allIdsWithinBodyRaw.forEach(function (el, i) {
      allIdsWithinBodyRaw[i] = el.split(' ')
    })
    allIdsWithinBodyRaw = util.prependToEachElIfMissing(_.without(_.flattenDeep(allIdsWithinBodyRaw), ''), '#')
    let allClassesAndIdsWithinBody = allClassesWithinBodyRawContentsArray.concat(allIdsWithinBodyRaw)
    let unwhitelistedAllClassesAndIdsWithinBody = _.clone(allClassesAndIdsWithinBody)
    allClassesAndIdsWithinBody = pullAllWithGlob(allClassesAndIdsWithinBody, whitelist)

    //
    // PART III. Compile to-be-deleted class names, within <body> and within <head>
    //

    let headCssToDelete = _.clone(allClassesAndIdsWithinHead)
    _.pullAll(headCssToDelete, allClassesAndIdsWithinBody)
    // console.log('\n* headCssToDelete = ' + JSON.stringify(headCssToDelete, null, 4))

    let bodyCssToDelete = _.clone(allClassesAndIdsWithinBody)
    _.pullAll(bodyCssToDelete, allClassesAndIdsWithinHead)
    // console.log('* bodyCssToDelete = ' + JSON.stringify(bodyCssToDelete, null, 4) + '\n')

    //
    // PART IV. Delete classes from <head>
    //

    let deletedFromHead = _.clone(headCssToDelete)
    allStyleTags.forEach(function (el, i) {
      let parsedCSS = css.parse(el.content[0])
      let allSelectors = getAllValuesByKey(parsedCSS, 'selectors')
      let allSelectorsCopy = _.clone(allSelectors)
      allSelectorsCopy.forEach(function (elem1, index1) {
        elem1.forEach(function (elem2, index2) {
          // prepare the deletedFromHead array.
          // some sandwiched classes/id's can be in multiple places.
          // One of places can delete a sandwiched class/id, but it might be present in other, legit  locations.
          // We can't put the deleted class/id into headCssToDelete[] because that would delete them everywhere!
          // Therefore, sandwiched deleted classes/id's go to separate array, which is later output as "deleted". Technically, it's "deleted at least in one place, not necessarily everywhere".
          for (i = 0, len = headCssToDelete.length; i < len; i++) {
            if (_.includes(extract(allSelectorsCopy[index1][index2]), headCssToDelete[i])) {
              // extract and add about-to-be-deleted classes into headCssToDelete array:
              // that's missing sandwiched classes
              deletedFromHead = _.uniq(deletedFromHead.concat(extract(allSelectorsCopy[index1][index2])))
            }
          }
          for (i = 0, len = headCssToDelete.length; i < len; i++) {
            if (_.includes(extract(allSelectorsCopy[index1][index2]), headCssToDelete[i])) {
              allSelectorsCopy[index1][index2] = ''
            }
          }
        })
      })

      // console.log('1. allSelectorsCopy = ' + JSON.stringify(allSelectorsCopy, null, 4))
      allSelectorsCopy.forEach(function (el, i) {
        allSelectorsCopy[i] = _.without(allSelectorsCopy[i], '')
      })
      // console.log('2. allSelectorsCopy = ' + JSON.stringify(allSelectorsCopy, null, 4))
      // finally, write over:
      let erasedTest = getAllValuesByKey(css.parse(el.content[0]), 'selectors', allSelectorsCopy)

      while (!equal(erasedTest, clean(erasedTest), {strict: true})) {
        erasedTest = _.cloneDeep(clean(erasedTest))
      }
      let stringifiedErasedTest

      if (existy(erasedTest) && nonEmpty(erasedTest.stylesheet)) {
        stringifiedErasedTest = '\n' + css.stringify(erasedTest) + '\n'
      } else {
        // assign manually because css.stringify doesn't accept "{}"
        stringifiedErasedTest = ''
      }
      el.content[0] = stringifiedErasedTest
    })

    allStyleTags.forEach(function (el, i) {
      if ((el.tag === 'style') && (el.content.length === 1) && (el.content[0].length === 0)) {
        allStyleTags[i] = ''
      }
    })
    // Perform a secondary check, are all classes within <body> present in this cleaned selectors list.
    // This is necessary to catch classes/id's that were in both <head> and <body> but all their occurencies
    // in <head> were sandwiched with non-existent classes/id's and therefore deleted.
    // See test 01.03. Released v1.2.0.
    let redundantOnes = []
    let found = true
    let remainingClassesAndIdsWithinBody = _.uniq(_.pullAll(allClassesAndIdsWithinBody, bodyCssToDelete))

    remainingClassesAndIdsWithinBody.forEach(function (el, i) {
      found = false

      allStyleTags.forEach(function (el2, i2) {
        if (Object.keys(el2).length === 0) {
          found = false
        } else {
          if (aContainsB(el2.content[0], el)) {
            found = true
          }
        }
      })
      if (!found) {
        redundantOnes.push(el)
      }
    })
    bodyCssToDelete = bodyCssToDelete.concat(redundantOnes)

    // write
    htmlAstObj = findTag(htmlAstObj, {tag: 'style'}, allStyleTags)

    //
    // PART V. Delete classes from within <body>
    //

    let allBodyClasses = getAllValuesByKey(htmlAstObj, 'class')
    let allBodyIds = getAllValuesByKey(htmlAstObj, 'id')

    let splitBodyClasses
    let splitBodyIds

    // ==============================
    // prep classes:
    for (i = 0, len = allBodyClasses.length; i < len; i++) {
      splitBodyClasses = allBodyClasses[i].split(' ')
      splitBodyClasses = util.prependToEachElIfMissing(_.uniq(_.without(splitBodyClasses, '')))
      allBodyClasses[i] = util.unprependToEachElIfPresent(_.difference(splitBodyClasses, bodyCssToDelete), '.').join(' ')
    }
    // write classes (notice third input argument)
    htmlAstObj = getAllValuesByKey(htmlAstObj, 'class', allBodyClasses)
    // ==============================
    // prep ids:
    for (i = 0, len = allBodyIds.length; i < len; i++) {
      splitBodyIds = allBodyIds[i].split(' ')
      splitBodyIds = util.prependToEachElIfMissing(_.uniq(_.without(splitBodyIds, '')), '#')
      allBodyIds[i] = util.unprependToEachElIfPresent(_.difference(splitBodyIds, bodyCssToDelete), '#').join(' ')
    }
    // write ids (notice third input argument)
    htmlAstObj = getAllValuesByKey(htmlAstObj, 'id', allBodyIds)
    // ==============================
    // clean up
    htmlAstObj = deleteKey(htmlAstObj, {key: 'class', val: ''})
    htmlAstObj = deleteKey(htmlAstObj, {key: 'id', val: ''})
    htmlAstObj = deleteKey(htmlAstObj, {key: '', only: 'arrays'})
    htmlAstObj = del(htmlAstObj, {tag: 'style'}, {hungryForWhitespace: true, matchKeysStrictly: true})
    htmlAstObj = del(htmlAstObj, {tag: 'style', attrs: {type: 'text/css'}}, {hungryForWhitespace: true, matchKeysStrictly: true})
    htmlAstObj = removeConsecutiveEmptySpaceStrings(htmlAstObj)

    //
    // FINALE. Prep and return
    //

    // console.log('htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))
    let toBeReturned
    if (treeInputMode) {
      toBeReturned = htmlAstObj
    } else {
      toBeReturned = render(htmlAstObj, { closingSingleTag: closingSingleTag })
    }

    return [toBeReturned, {
      allInHead: unwhitelistedAllClassesAndIdsWithinHead,
      allInBody: unwhitelistedAllClassesAndIdsWithinBody,
      deletedFromHead: deletedFromHead,
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
