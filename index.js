'use strict'

// const sply = require('splice-string')
// const moment = require('moment')
const clone = require('lodash.clonedeep')
const pullAll = require('lodash.pullall')
const uniq = require('lodash.uniq')
const intersection = require('lodash.intersection')
const extract = require('string-extract-class-names')
const isObj = require('lodash.isplainobject')
const isArr = Array.isArray
const pullAllWithGlob = require('array-pull-all-with-glob')

function emailRemoveUnusedCss (str, opts) {
  function characterSuitableForNames (char) {
    return /[.#\-_A-Za-z0-9]/.test(char)
  }
  function existy (x) { return x != null }
  var MAINDEBUG = 0
  var i, len
  // var startdate = new Date()
  var styleStartedAt = 0
  var styleEndedAt = 0
  var headSelectorsArr = []
  var bodyClassesArr = []
  var bodyIdsArr = []

  var headSelectorStartedAt = 0
  var bodyClassAttributeStartedAt = 0
  var bodyIdAttributeStartedAt = 0
  var bodyStartedAt = 0

  var classStartedAt = 0
  var classEndedAt = 0
  var idStartedAt = 0
  var idEndedAt = 0

  var beingCurrentlyAt = 0
  var checkingInsideCurlyBraces = false
  var insideCurlyBraces = false

  var regexEmptyStyleTag = /[\n]?\s*<style[^>]*>\s*<\/style\s*>/g
  var regexEmptyMediaQuery = /[\n]?\s*@media[^{]*{\s*}/g

  // insurance
  if (typeof str !== 'string') {
    throw new TypeError('email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_01] Input must be string! Currently it\'s ' + typeof str)
  }
  if (!isObj(opts)) {
    if (opts === undefined || opts === null) {
      opts = {}
    } else {
      throw new TypeError('email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_02] Options, second input argument, must be a plain object! Currently it\'s ' + typeof opts + ', equal to: ' + JSON.stringify(opts, null, 4))
    }
  }

  // checking opts
  var defaults = {
    whitelist: []
  }
  opts = Object.assign(defaults, opts)
  if (!isArr(opts.whitelist)) {
    throw new TypeError('email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_03] opts.whitelist should be an array, but it was customised to a wrong thing, ' + JSON.stringify(opts.whitelist, null, 4))
  }

//
//                       .----------------.
//                      | .--------------. |
//                      | |     __       | |
//                      | |    /  |      | |
//                      | |    `| |      | |
//                      | |     | |      | |
//                      | |    _| |_     | |
//                      | |   |_____|    | |
//                      | |              | |
//                      | '--------------' |
//                       '----------------'
//
// in this round we traverse the whole string, looking for two things:
// 1. any style tags (which can be even within <body>) and
// 2. and "class=" or "id=" attributes
// we compile all of 1) findings into zz; and all of 2) findings into yy

  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str[i]

    // pinpoint any <style... tag, anywhere within the given HTML
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}` === '<style') {
      for (let y = i; y < len; y++) {
        if (str[y] === '>') {
          styleStartedAt = y + 1
          break
        }
      }
      // console.log('styleStartedAt = ' + JSON.stringify(styleStartedAt, null, 4))
    }

    // pinpoint closing style tag, </style>
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}` === '/style') {
      styleEndedAt = i - 1
      // console.log('styleEndedAt = ' + JSON.stringify(styleEndedAt, null, 4))
    }

    // pinpoint closing curly braces
    // ================
    if (checkingInsideCurlyBraces && (chr === '}')) {
      checkingInsideCurlyBraces = false
      insideCurlyBraces = false
    }

    // pinpoint opening curly braces
    // ================
    if (checkingInsideCurlyBraces && (chr === '{')) {
      insideCurlyBraces = true
    }

    // catch opening dot or hash
    // ================
    if (
      styleStartedAt &&
      (i >= styleStartedAt) &&
      // (!styleEndedAt || (i > styleEndedAt)) &&
      (
        // a) either it's the first style tag and currently we haven't traversed
        // it's closing yet:
        ((styleEndedAt === 0) && (i >= styleStartedAt)) ||
        // b) or, style tag was closed, later another-one was opened and we
        // haven't traversed through its closing tag yet:
        ((styleStartedAt > styleEndedAt) && (styleStartedAt < i))
      ) &&
      ((chr === '.') || (chr === '#')) &&
      (i >= beingCurrentlyAt) &&
      !insideCurlyBraces
    ) {
      checkingInsideCurlyBraces = true
      headSelectorStartedAt = i
      for (let y = i; y < len; y++) {
        if (!characterSuitableForNames(str[y])) {
          headSelectorsArr.push(str.slice(headSelectorStartedAt, y))
          beingCurrentlyAt = y
          break
        }
      }
    }

    // get opening body tag
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}` === '<body') {
      for (let y = i; y < len; y++) {
        if (str[y] === '>') {
          bodyStartedAt = y + 1
          break
        }
      }
      // console.log('bodyStartedAt = ' + JSON.stringify(bodyStartedAt, null, 4))
    }

    // catch opening of a class attribute
    // ================
    if (
      (bodyStartedAt !== 0) &&
      (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}${str[i + 6]}` === 'class="')
    ) {
      bodyClassAttributeStartedAt = i + 6
    }

    // catch opening of an id attribute
    // ================
    if (
      (bodyStartedAt !== 0) &&
      (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}` === 'id="')
    ) {
      bodyIdAttributeStartedAt = i + 3
    }

    // stop the class attribute's recording if closing double quote encountered
    // ================
    if ((bodyClassAttributeStartedAt !== 0) && (chr === '"') && (i > bodyClassAttributeStartedAt)) {
      bodyClassAttributeStartedAt = 0
    }

    // stop the id attribute's recording if closing double quote encountered
    // ================
    if ((bodyIdAttributeStartedAt !== 0) && (chr === '"') && (i > bodyIdAttributeStartedAt)) {
      bodyIdAttributeStartedAt = 0
    }

    // catch first letter within each class attribute
    // ================
    if (
      bodyClassAttributeStartedAt &&
      i > bodyClassAttributeStartedAt &&
      characterSuitableForNames(chr) &&
      (classStartedAt === 0)
    ) {
      classStartedAt = i
    }

    // catch whole class
    // ================
    if (
      (classStartedAt !== 0) &&
      (i > classStartedAt) &&
      !characterSuitableForNames(chr)
    ) {
      bodyClassesArr.push(`.${str.slice(classStartedAt, i)}`)
      classStartedAt = 0
    }

    // catch first letter within each id attribute
    // ================
    if (
      bodyIdAttributeStartedAt &&
      i > bodyIdAttributeStartedAt &&
      characterSuitableForNames(chr) &&
      (idStartedAt === 0)
    ) {
      idStartedAt = i
    }

    // catch whole id
    // ================
    if (
      (idStartedAt !== 0) &&
      (i > idStartedAt) &&
      !characterSuitableForNames(chr)
    ) {
      bodyIdsArr.push(`#${str.slice(idStartedAt, i)}`)
      idStartedAt = 0
    }
  }

  //         F R U I T S   O F   T H E   L A B O U R

  let allClassesAndIdsWithinBody = bodyClassesArr.concat(bodyIdsArr)

  if (MAINDEBUG) { console.log('headSelectorsArr = ' + JSON.stringify(headSelectorsArr, null, 4)) }
  if (MAINDEBUG) { console.log('bodyClassesArr = ' + JSON.stringify(bodyClassesArr, null, 4)) }
  if (MAINDEBUG) { console.log('bodyIdsArr = ' + JSON.stringify(bodyIdsArr, null, 4)) }
  if (MAINDEBUG) { console.log('allClassesAndIdsWithinBody = ' + JSON.stringify(allClassesAndIdsWithinBody, null, 4)) }
  if (MAINDEBUG) { console.log('\nopts.whitelist = ' + JSON.stringify(opts.whitelist, null, 4)) }

  //
  //               A F T E R   T R A V E R S A L
  //

  // compile list of to-be-terminated
  // ================

  var allClassesAndIdsWithinHead = uniq(headSelectorsArr.reduce((arr, el) => arr.concat(extract(el)), []))
  if (MAINDEBUG) { console.log('allClassesAndIdsWithinHead = ' + JSON.stringify(allClassesAndIdsWithinHead, null, 4)) }

  // to avoid false positives, let's apply two cycles when removing unused classes/id's from head:

  // ---------------------------------------
  // TWO-CYCLE UNUSED CSS IDENTIFICATION:
  // ---------------------------------------

  // cycle #1 - remove comparing separate classes/id's from body against
  // potentially sandwitched lumps from head. Let's see what's left afterwards.
  // ================

  let preppedHeadSelectorsArr = Array.from(headSelectorsArr)
  let deletedFromHeadArr = []
  for (let y = 0, len = preppedHeadSelectorsArr.length; y < len; y++) {
    // preppedHeadSelectorsArr[y]
    let temp
    if (existy(preppedHeadSelectorsArr[y])) {
      temp = extract(preppedHeadSelectorsArr[y])
    }
    if (!temp.every(el => allClassesAndIdsWithinBody.includes(el))) {
      deletedFromHeadArr.push(...extract(preppedHeadSelectorsArr[y]))
      preppedHeadSelectorsArr.splice(y, 1)
      y--
      len--
    }
  }

  deletedFromHeadArr = pullAllWithGlob(deletedFromHeadArr, opts.whitelist)

  var preppedAllClassesAndIdsWithinHead
  if (preppedHeadSelectorsArr.length > 0) {
    preppedAllClassesAndIdsWithinHead = preppedHeadSelectorsArr.reduce((arr, el) => arr.concat(extract(el)), [])
  } else {
    preppedAllClassesAndIdsWithinHead = []
  }

  // cycle #2 - now treat remaining lumps as definite sources of
  // "what classes or id's are present in the head"
  // use "preppedAllClassesAndIdsWithinHead" as a head selector reference when comparing
  // against the body classes/id's.
  // ================

  let headCssToDelete = clone(allClassesAndIdsWithinHead)
  pullAll(headCssToDelete, bodyClassesArr.concat(bodyIdsArr))
  headCssToDelete = pullAllWithGlob(uniq(headCssToDelete), opts.whitelist)
  if (MAINDEBUG) { console.log('\n* headCssToDelete = ' + JSON.stringify(headCssToDelete, null, 4)) }

  let bodyCssToDelete = pullAllWithGlob(pullAll(bodyClassesArr.concat(bodyIdsArr), preppedAllClassesAndIdsWithinHead), opts.whitelist)
  if (MAINDEBUG) { console.log('* bodyCssToDelete = ' + JSON.stringify(bodyCssToDelete, null, 4)) }
  bodyCssToDelete = uniq(bodyCssToDelete)

  let bodyClassesToDelete = bodyCssToDelete.filter(s => s.startsWith('.')).map(s => s.slice(1))
  if (MAINDEBUG) { console.log('bodyClassesToDelete = ' + JSON.stringify(bodyClassesToDelete, null, 4)) }
  let bodyIdsToDelete = bodyCssToDelete.filter(s => s.startsWith('#')).map(s => s.slice(1))
  if (MAINDEBUG) { console.log('bodyIdsToDelete = ' + JSON.stringify(bodyIdsToDelete, null, 4)) }

//
//                       .----------------.
//                      | .--------------. |
//                      | |    _____     | |
//                      | |   / ___ `.   | |
//                      | |  |_/___) |   | |
//                      | |   .'____.'   | |
//                      | |  / /_____    | |
//                      | |  |_______|   | |
//                      | |              | |
//                      | '--------------' |
//                       '----------------'
//

//
//             T H E   S E C O N D   T R A V E R S A L
//

  // remove the unused head styles
  // ================
  styleStartedAt = 0
  styleEndedAt = 0
  for (i = 0, len = str.length; i < len; i++) {
    let chr = str[i]

    // pinpoint any <style... tag, anywhere within the given HTML
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}` === '<style') {
      for (let y = i; y < len; y++) {
        if (str[y] === '>') {
          styleStartedAt = y + 1
          break
        }
      }
      // console.log('styleStartedAt = ' + JSON.stringify(styleStartedAt, null, 4))
    }

    // pinpoint closing style tag, </style>
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}` === '/style') {
      styleEndedAt = i - 1
    }

    // prep the head
    // ================
    if (
      styleStartedAt &&
      (i >= styleStartedAt) &&
      (
        // a) either it's the first style tag and currently we haven't traversed
        // it's closing yet:
        ((styleEndedAt === 0) && (i >= styleStartedAt)) ||
        // b) or, style tag was closed, later another-one was opened and we
        // haven't traversed through its closing tag yet:
        ((styleStartedAt > styleEndedAt) && (styleStartedAt < i))
      ) &&
      ((chr === '.') || (chr === '#')) // &&
    ) {
      // march backwards, for example, to catch "div" part in "div.name"
      // because we stared from . or #
      let realBeginningOfASelector = 0
      let realEndingOfASelector = 0
      let theresSomethingOnTheLeft = false
      let theresSomethingOnTheRight = false
      for (let z = i; z >= 0; z--) {
        // console.log('traversing backwards: >>>>' + str[z] + '<<<<')
        if (!realBeginningOfASelector && !characterSuitableForNames(str[z])) {
          realBeginningOfASelector = z + 1
          // console.log('\n> not suitable char found')
          // console.log('> new slice is: ' + str.slice(realBeginningOfASelector, realBeginningOfASelector + 12) + '...')
          continue
          // break
        }
        if (realBeginningOfASelector && (str[z] !== ' ')) {
          // console.log('\nFOUND FURTHER')
          if (str[z] === ',') {
            // console.log('COMMA')
            realBeginningOfASelector = z + 1
            theresSomethingOnTheLeft = true
          }
          // console.log('BREAKING')
          break
        }
      }

      // march forward to include a pair of curly braces block if one follows
      // and any line breaks as well. But only if there's nothing on the left.
      // ================
      for (let y = i; y < len; y++) {
        if (theresSomethingOnTheLeft) {
          if ((str[y] === ',') || (str[y] === '{')) {
            if (str[y] === ',') {
              theresSomethingOnTheRight = true
              // catch any spaces after comma:
              for (let z = y; z < len; z++) {
                if (str[z] !== ' ') {
                  realEndingOfASelector = z + 1
                  break
                }
              }
            } // else {
            //   realEndingOfASelector = y
            // }
            break
          }
        } else {
          if ((str[y] === ',') || (str[y] === '{')) {
            if (str[y] === ',') {
              // just catch all spaces that follow comma and stop
              theresSomethingOnTheRight = true
              for (let z = y + 1; z < len; z++) {
                if (str[z] !== ' ') {
                  realEndingOfASelector = z - 1
                  break
                }
              }
              break
            } else if (str[y] === '{') {
              // traverse all the way inside curly brace until closing brace,
              // then add spaces after it, up until line break
              for (let z = y + 1; z < len; z++) {
                if (str[z] === '}') {
                  realEndingOfASelector = z
                  // catch all trailing spaces after comma
                  for (let w = realEndingOfASelector + 1; w < len; w++) {
                    if (str[w] !== ' ') {
                      realEndingOfASelector = w
                      break
                    }
                  }
                  break
                }
              }
              break
            }
          }
        }
      }

      // don't forget the indentation too!
      // ================
      if (!theresSomethingOnTheLeft && !theresSomethingOnTheRight) {
        for (let z = realBeginningOfASelector - 1; z >= 0; z--) {
          if (str[z] !== ' ') {
            if (str[z] === '\n') {
              // catch multiple line breaks in front, not only the first-one
              for (let w = z - 1; w >= 0; w--) {
                if (str[w] !== '\n') {
                  realBeginningOfASelector = w + 1
                  break
                }
              }
            }
            break
          }
        }
      }

      // again extract classes and see if any are in the Wanted list
      // ================
      let headExtracted = extract(str.slice(realBeginningOfASelector, realEndingOfASelector))
      if (intersection(headExtracted, headCssToDelete).length > 0) {
        //
        // delete the head selectors:
        // ================
        let compensation = realEndingOfASelector - realBeginningOfASelector
        str = str.slice(0, realBeginningOfASelector) + str.slice(realEndingOfASelector)

        // fix the loop counters:
        // ================
        len = len - compensation
        i = i - (i - realBeginningOfASelector + 1)
      } else {
        // if the piece of code is used, offset the index forward, so as not to scan
        // starting from the second character onwards, again
        // ================
        i = i + (realEndingOfASelector - realBeginningOfASelector) - (i - realBeginningOfASelector + 1)
      }
    }
  }

//                       .----------------.
//                      | .--------------. |
//                      | |    ______    | |
//                      | |   / ____ `.  | |
//                      | |   `'  __) |  | |
//                      | |   _  |__ '.  | |
//                      | |  | \____) |  | |
//                      | |   \______.'  | |
//                      | |              | |
//                      | '--------------' |
//                       '----------------'

//
//             T H E   T H I R D   T R A V E R S A L
//

  // removing unused classes & id's from body
  // ================
  for (i = str.indexOf('<body'), len = str.length; i < len; i++) {
    //
    // 1. identify and remove unused classes from body:
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}${str[i + 6]}` === 'class="') {
      classStartedAt = i + 7
      for (let y = i + 7; y < len; y++) {
        if (str[y] === '"') {
          classEndedAt = y
          break
        }
      }

      let extractedClassArr = pullAll(str.slice(classStartedAt, classEndedAt).split(' '), ['']).map(el => el.trim())

      let whatsLeft = pullAll(Array.from(extractedClassArr), bodyClassesToDelete)
      if (whatsLeft.length > 0) {
        whatsLeft = 'class="' + whatsLeft.join(' ') + '"'
      } else {
        whatsLeft = ''
      }
      // remove whole class attribute, mutating the string:
      str = str.slice(0, i) + whatsLeft + str.slice(classEndedAt + 1)
      // fix the loop's counters:
      len = len - ((classEndedAt - i) - whatsLeft.length) - 1
      i = i + whatsLeft.length - 1
      // if whole class attribute was removed and it was the last attr. in the tag,
      // and the following character is closing bracket, we remove this remaining
      // space character, so that bracket follows whatever was left.
      // otherwise you'd get cases like <table > instead of <table> after deletion.
      if (str[i] === ' ') {
        let deleteFrom = null
        let deleteUpTo = null
        for (let y = i + 1; y < len; y++) {
          if (str[y] !== ' ') {
            if (str[y] === '>') {
              deleteUpTo = y + 1
              break
            } else {
              deleteUpTo = y
              break
            }
          }
        }
        for (let y = i - 1; y > 0; y--) {
          if (str[y] !== ' ') {
            deleteFrom = y + 1
            break
          }
        }
        if ((deleteFrom !== null) && (deleteUpTo !== null)) {
          str = str.slice(0, deleteFrom) + str.slice(deleteUpTo - 1)
          len = len - (deleteUpTo - deleteFrom) + 1
          i = i - (deleteUpTo - deleteFrom) + 1
        }
      }
    }
    //
    // 2. identify and remove unused id's from body:
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}` === 'id="') {
      idStartedAt = i + 4
      for (let y = i + 4; y < len; y++) {
        if (str[y] === '"') {
          idEndedAt = y
          break
        }
      }

      let extractedIdsArr = pullAll(str.slice(idStartedAt, idEndedAt).split(' '), ['']).map(el => el.trim())

      let whatsLeft = pullAll(Array.from(extractedIdsArr), bodyIdsToDelete)
      if (whatsLeft.length > 0) {
        whatsLeft = 'id="' + whatsLeft.join(' ') + '"'
      } else {
        whatsLeft = ''
      }
      // remove whole id attribute, mutating the string:
      str = str.slice(0, i) + whatsLeft + str.slice(idEndedAt + 1)
      // fix the loop's counters:
      len = len - ((idEndedAt - i) - whatsLeft.length) - 1
      i = i + whatsLeft.length - 1
      // if whole id attribute was removed and it was the last attr. in the tag,
      // and the following character is closing bracket, we remove this remaining
      // space character, so that bracket follows whatever was left.
      // otherwise you'd get cases like <table > instead of <table> after deletion.
      if (str[i] === ' ') {
        let deleteFrom = null
        let deleteUpTo = null
        for (let y = i + 1; y < len; y++) {
          if (str[y] !== ' ') {
            if (str[y] === '>') {
              deleteUpTo = y + 1
              break
            } else {
              deleteUpTo = y
              break
            }
          }
        }
        for (let y = i - 1; y > 0; y--) {
          if (str[y] !== ' ') {
            deleteFrom = y + 1
            break
          }
        }
        if ((deleteFrom !== null) && (deleteUpTo !== null)) {
          str = str.slice(0, deleteFrom) + str.slice(deleteUpTo - 1)
          len = len - (deleteUpTo - deleteFrom) + 1
          i = i - (deleteUpTo - deleteFrom) + 1
        }
      }
    }
  }

  //
  // FINAL FIXING:
  // ================

  // remove empty style tags:

  while (regexEmptyMediaQuery.test(str)) {
    str = str.replace(regexEmptyMediaQuery, '')
  }
  str = str.replace(regexEmptyStyleTag, '\n')
  str = str.replace('\u000A\n', '\n')
  str = str.replace('\n\n', '\n')

  // calculate duration taken:
  // ================

  // var endDate = new Date()
  // var timeTaken = moment.utc(moment(endDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(startdate, 'DD/MM/YYYY HH:mm:ss'))).format('HH:mm:ss')
  // console.log('\n\ntimeTaken: ' + timeTaken)

  return {
    result: str,
    allInHead: allClassesAndIdsWithinHead.sort(),
    allInBody: allClassesAndIdsWithinBody.sort(),
    deletedFromHead: uniq(deletedFromHeadArr.concat(headCssToDelete)).sort(),
    deletedFromBody: bodyCssToDelete.sort()
  }
}

module.exports = emailRemoveUnusedCss
