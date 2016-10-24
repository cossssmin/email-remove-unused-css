'use strict'

// ===================================
// R E Q U I R E' S

var fs = require('fs')
var parser = require('posthtml-parser')
var css = require('css')
var _ = require('lodash')
var deleteObjFromAst = require('posthtml-ast-delete-object')
var render = require('posthtml-render')
var extract = require('string-extract-class-names')
var getAllValuesByKey = require('posthtml-ast-get-values-by-key')

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
        return aStartsWithB(n, _.replace(whitelistArrayElem, /[*].*/g, '')) // TODO
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

function prependDotsToEachEl (arr) {
  return arr.map(function (el) {
    return '.' + el
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
  console.log('*** starting htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))
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
  // console.log('allStyleTagSelectors = ' + JSON.stringify(allStyleTagSelectors, null, 4))

  var allClassesWithinHead = _.uniq(sortClassesFromArrays(allStyleTagSelectors)[0])
  // console.log('allClassesWithinHead = ' + JSON.stringify(allClassesWithinHead, null, 4))
  allClassesWithinHead = pullAllWithGlob(allClassesWithinHead, whitelist)

  // console.log('\n\n===============\nall selectors from <style> tags: ' + JSON.stringify(allStyleTagSelectors, null, 4) + '\n===============\n\n')
  console.log('all classes from style tags: ' + JSON.stringify(allClassesWithinHead, null, 4))

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
  _.pullAll(headCssToDelete, prependDotsToEachEl(allClassesWithinBodySplitArray))
  console.log('\n* headCssToDelete = ' + JSON.stringify(headCssToDelete, null, 4))

  var bodyCssToDelete = _.clone(allClassesWithinBodySplitArray)
  _.pullAll(bodyCssToDelete, removeFromTheFrontOfEachEl(allClassesWithinHead, '.'))
  console.log('* bodyCssToDelete = ' + JSON.stringify(bodyCssToDelete, null, 4) + '\n')

  //
  // PART IV. Delete classes from <head>
  //

  // we already have step_three, which is all <style> tags.
  // First, prep step_three, :
  // console.log('===========================================')
  // console.log('step_three before prepping: ' + JSON.stringify(step_three, null, 4))

  step_three.forEach(function (el, i) {
    var parsedCSS = css.parse(el.content[0])

    var allSelectors = getAllValuesByKey(parsedCSS, 'selectors')
    // console.log('allSelectors = ' + JSON.stringify(allSelectors, null, 4))
    var new_oo = _.clone(allSelectors)

    // console.log('new_oo BEFORE: ' + JSON.stringify(new_oo, null, 4))

    new_oo.forEach(function (elem1, index1) {
      // console.log('new_oo[' + index1 + '] = ' + JSON.stringify(new_oo[index1], null, 4))
      elem1.forEach(function (elem2, index2) {
        new_oo[index1][index2] = extract(new_oo[index1][index2], '.')
      })
    })

    // console.log('new_oo AFTER: ' + JSON.stringify(new_oo, null, 4))

    new_oo.forEach(function (el, i) {
      _.pullAll(new_oo[i], headCssToDelete)
    })
    // console.log('AFTER PULLING, new_oo = ' + JSON.stringify(new_oo, null, 4))

    // finally, write over:
    var erasedTest = getAllValuesByKey(css.parse(el.content[0]), 'selectors', new_oo)
    // delete all empty selectors within rules:
    var erasedWithNoEmpty = deleteObjFromAst(erasedTest, {selectors: []})
    erasedWithNoEmpty = deleteObjFromAst(erasedWithNoEmpty, {type: 'rule', selectors: []})
    // delete all empty rules:
    erasedWithNoEmpty = deleteObjFromAst(erasedWithNoEmpty, {rules: []})
    // delete empty style blocks:
    erasedWithNoEmpty = deleteObjFromAst(erasedWithNoEmpty, {type: 'stylesheet', stylesheet: {rules: []}}, true)
    erasedWithNoEmpty = deleteObjFromAst(erasedWithNoEmpty, {type: 'stylesheet'}, true)

    var stringifiedErasedTest

    if (existy(erasedWithNoEmpty) && (Object.keys(erasedWithNoEmpty).length !== 0)) {
      stringifiedErasedTest = css.stringify(erasedWithNoEmpty)
    } else {
      // assign manually because css.stringify doesn't accept "{}"
      stringifiedErasedTest = ''
    }

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
  //   "content": [{}]
  // }
  //

  htmlAstObj = deleteObjFromAst(htmlAstObj, { 'tag': 'style', 'content': [''] })

  //
  // PART V. Delete classes from within <body>
  //

  var allBodyClasses = getAllValuesByKey(htmlAstObj, 'class')
  var allBodyClassesSplitArr
  console.log('allBodyClasses = ' + JSON.stringify(allBodyClasses, null, 4))
  allBodyClasses.forEach(function (el, i) {
    allBodyClassesSplitArr = _.without(allBodyClasses[i].split(' '), '')
    _.pullAll(allBodyClassesSplitArr, bodyCssToDelete)
    allBodyClasses[i] = allBodyClassesSplitArr.join(' ')
  })
  console.log('pulled allBodyClasses = ' + JSON.stringify(allBodyClasses, null, 4))
  // write:
  console.log('BEFORE REPLACE htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))
  htmlAstObj = getAllValuesByKey(htmlAstObj, 'class', allBodyClasses)
  console.log('AFTER REPLACE htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))

  //
  // FINALE. Write out.
  //

  fs.writeFileSync('./dummy_html/clean.html', render(htmlAstObj))

  // console.log('*** new htmlAstObj = ' + JSON.stringify(htmlAstObj, null, 4))
  // console.log(render(htmlAstObj))
})()
// ========================================
// css parser: https://github.com/reworkcss/css
