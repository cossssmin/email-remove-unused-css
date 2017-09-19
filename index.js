/* eslint no-param-reassign: 0, no-console: 0 */

const pullAll = require('lodash.pullall')
const uniq = require('lodash.uniq')
const intersection = require('lodash.intersection')
const extract = require('string-extract-class-names')
const isObj = require('lodash.isplainobject')
const pullAllWithGlob = require('array-pull-all-with-glob')
const replaceSlicesArr = require('string-replace-slices-array')
const Slices = require('string-slices-array-push')

const isArr = Array.isArray

function emailRemoveUnusedCss(str, opts) {
  function characterSuitableForNames(char) {
    return /[.#\-_A-Za-z0-9]/.test(char)
  }
  function existy(x) { return x != null }
  function isStr(something) { return typeof something === 'string' }
  const MAINDEBUG = 0
  const MAINDEBUG2 = 0
  let i
  let len
  let styleStartedAt = 0
  let styleEndedAt = 0
  const headSelectorsArr = []
  const bodyClassesArr = []
  const bodyIdsArr = []

  let headSelectorStartedAt = 0
  let bodyClassAttributeStartedAt = 0
  let bodyIdAttributeStartedAt = 0
  let bodyStartedAt = 0

  let classStartedAt = 0
  let classEndedAt = 0
  let idStartedAt = 0
  let idEndedAt = 0

  let beingCurrentlyAt = 0
  let checkingInsideCurlyBraces = false
  let insideCurlyBraces = false

  const regexEmptyStyleTag = /[\n]?\s*<style[^>]*>\s*<\/style\s*>/g
  const regexEmptyMediaQuery = /[\n]?\s*@media[^{]*{\s*}/g

  const finalIndexesToDelete = new Slices()

  // insurance
  if (typeof str !== 'string') {
    throw new TypeError(`email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_01] Input must be string! Currently it's ${typeof str}`)
  }
  if (!isObj(opts)) {
    if (opts === undefined || opts === null) {
      opts = {}
    } else {
      throw new TypeError(`email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_02] Options, second input argument, must be a plain object! Currently it's ${typeof opts}, equal to: ${JSON.stringify(opts, null, 4)}`)
    }
  }

  // checking opts
  const defaults = {
    whitelist: [],
  }
  opts = Object.assign(defaults, opts)
  if (isStr(opts.whitelist)) {
    opts.whitelist = [opts.whitelist]
  }
  if (!isArr(opts.whitelist)) {
    throw new TypeError(`email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_03] opts.whitelist should be an array, but it was customised to a wrong thing, ${JSON.stringify(opts.whitelist, null, 4)}`)
  }
  if ((opts.whitelist.length > 0) && (!opts.whitelist.every(el => isStr(el)))) {
    throw new TypeError(`email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_04] opts.whitelist array should contain only string-type elements. Currently we\ve got:\n${JSON.stringify(opts.whitelist, null, 4)}`)
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

  let totalCounter = 0
  const originalLength = str.length || 1
  let ignoreTheNextCurlieBecauseItFollowsAtMedia = false
  for (i = 0, len = str.length; i < len; i++) {
    if (MAINDEBUG) { console.log(`----------------------------------------- str[${i}] = ${(str[i].trim() !== '') ? str[i] : 'space/LR'}`) }

    if (MAINDEBUG) { totalCounter += 1 }
    const chr = str[i]

    // pinpoint any <style... tag, anywhere within the given HTML
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}` === '<style') {
      checkingInsideCurlyBraces = true
      for (let y = i; y < len; y++) {
        if (MAINDEBUG) { totalCounter += 1 }
        if (str[y] === '>') {
          styleStartedAt = y + 1
          break
        }
      }
    }

    // pinpoint closing style tag, </style>
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}` === '/style') {
      checkingInsideCurlyBraces = false
      styleEndedAt = i - 1
    }

    // pinpoint @media
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}` === '@media') {
      if (MAINDEBUG) { console.log('\n* @media detected') }
      ignoreTheNextCurlieBecauseItFollowsAtMedia = true
    }

    // pinpoint closing curly braces
    // ================
    if (checkingInsideCurlyBraces && (chr === '}')) {
      // checkingInsideCurlyBraces = false
      insideCurlyBraces = false
    }

    // pinpoint opening curly braces, but not @media's.
    // ================
    if (chr === '{') {
      if (ignoreTheNextCurlieBecauseItFollowsAtMedia) {
        ignoreTheNextCurlieBecauseItFollowsAtMedia = false
      } else if (checkingInsideCurlyBraces && !insideCurlyBraces) {
        insideCurlyBraces = true
      }
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
        if (MAINDEBUG) { totalCounter += 1 }
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
        if (MAINDEBUG) { totalCounter += 1 }
        if (str[y] === '>') {
          bodyStartedAt = y + 1
          break
        }
      }
    }

    // catch opening of a class attribute
    // ================
    if (
      (bodyStartedAt !== 0) &&
      (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}${str[i + 6]}` === 'class="') &&
      ((str[i - 1] === ' ') || (str[i - 1] === '"')) // this is to prevent false positives like attribute "superclass=..."
    ) {
      bodyClassAttributeStartedAt = i + 6
    }

    // catch opening of an id attribute
    // ================
    if (
      (bodyStartedAt !== 0) &&
      (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}` === 'id="') &&
      ((str[i - 1] === ' ') || (str[i - 1] === '"')) // this is to prevent false positives like attribute "urlid=..."
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

  const allClassesAndIdsWithinBody = bodyClassesArr.concat(bodyIdsArr)

  if (MAINDEBUG) { console.log(`headSelectorsArr = ${JSON.stringify(headSelectorsArr, null, 4)}`) }
  if (MAINDEBUG) { console.log(`bodyClassesArr = ${JSON.stringify(bodyClassesArr, null, 4)}`) }
  if (MAINDEBUG) { console.log(`bodyIdsArr = ${JSON.stringify(bodyIdsArr, null, 4)}`) }
  if (MAINDEBUG) { console.log(`allClassesAndIdsWithinBody = ${JSON.stringify(allClassesAndIdsWithinBody, null, 4)}`) }
  if (MAINDEBUG) { console.log(`\nopts.whitelist = ${JSON.stringify(opts.whitelist, null, 4)}`) }

  // extract all classes or id's from `headSelectorsArr` and get count of each.
  // That's so we can later exclude sandwitched classes. Each time "collateral"
  // legit, but sandwitched with false-one class gets deleted, we keep count, and
  // later compare totals with these below.
  // If it turns out that a class was in both head and body, but it was sandwitched
  // with unused classes and removed as collateral, we need to remove it from body too.

  const headSelectorsCount = {}
  headSelectorsArr.forEach((el) => {
    extract(el).forEach((selector) => {
      if (Object.prototype.hasOwnProperty.call(headSelectorsCount, selector)) {
        headSelectorsCount[selector] += 1
      } else {
        headSelectorsCount[selector] = 1
      }
    })
  })
  if (MAINDEBUG) { console.log(`\n* headSelectorsCount = ${JSON.stringify(headSelectorsCount, null, 4)}`) }
  // create a working copy of `headSelectorsCount` which we'll mutate, subtracting
  // each deleted class/id:
  const headSelectorsCountClone = Object.assign({}, headSelectorsCount)

  //
  //               A F T E R   T R A V E R S A L
  //

  // compile list of to-be-terminated
  // ================

  const allClassesAndIdsWithinHead = uniq(headSelectorsArr
    .reduce((arr, el) => arr.concat(extract(el)), []))
  if (MAINDEBUG) { console.log(`allClassesAndIdsWithinHead = ${JSON.stringify(allClassesAndIdsWithinHead, null, 4)}`) }

  // to avoid false positives, let's apply two cycles when removing unused classes/id's from head:

  // ---------------------------------------
  // TWO-CYCLE UNUSED CSS IDENTIFICATION:
  // ---------------------------------------

  // cycle #1 - remove comparing separate classes/id's from body against
  // potentially sandwitched lumps from head. Let's see what's left afterwards.
  // ================

  const preppedHeadSelectorsArr = Array.from(headSelectorsArr)
  let deletedFromHeadArr = []
  for (let y = 0, len2 = preppedHeadSelectorsArr.length; y < len2; y++) {
    if (MAINDEBUG) { totalCounter += 1 }
    // preppedHeadSelectorsArr[y]
    let temp
    if (existy(preppedHeadSelectorsArr[y])) {
      temp = extract(preppedHeadSelectorsArr[y])
    }
    if (!temp.every(el => allClassesAndIdsWithinBody.includes(el))) {
      deletedFromHeadArr.push(...extract(preppedHeadSelectorsArr[y]))
      preppedHeadSelectorsArr.splice(y, 1)
      y -= 1
      len2 -= 1
    }
  }

  deletedFromHeadArr = uniq(pullAllWithGlob(deletedFromHeadArr, opts.whitelist))

  let preppedAllClassesAndIdsWithinHead
  if (preppedHeadSelectorsArr.length > 0) {
    preppedAllClassesAndIdsWithinHead = preppedHeadSelectorsArr
      .reduce(
        (arr, el) => arr.concat(extract(el)),
        [],
      )
  } else {
    preppedAllClassesAndIdsWithinHead = []
  }
  if (MAINDEBUG) { console.log(`\n* preppedAllClassesAndIdsWithinHead = ${JSON.stringify(preppedAllClassesAndIdsWithinHead, null, 4)}`) }

  // cycle #2 - now treat remaining lumps as definite sources of
  // "what classes or id's are present in the head"
  // use "preppedAllClassesAndIdsWithinHead" as a head selector reference when comparing
  // against the body classes/id's.
  // ================

  let headCssToDelete = pullAllWithGlob(
    pullAll(
      uniq(Array.from(allClassesAndIdsWithinHead)),
      bodyClassesArr.concat(bodyIdsArr),
    ),
    opts.whitelist,
  )
  if (MAINDEBUG) { console.log(`\n* OLD headCssToDelete = ${JSON.stringify(headCssToDelete, null, 4)}`) }

  let bodyCssToDelete = uniq(pullAllWithGlob(pullAll(
    bodyClassesArr.concat(bodyIdsArr),
    preppedAllClassesAndIdsWithinHead,
  ), opts.whitelist))
  if (MAINDEBUG) { console.log(`* bodyCssToDelete = ${JSON.stringify(bodyCssToDelete, null, 4)}`) }

  // now that we know final to-be-deleted selectors list, compare them with `deletedFromHeadArr`
  // and fill any missing CSS in `headCssToDelete`:
  headCssToDelete = uniq(headCssToDelete
    .concat(intersection(deletedFromHeadArr, bodyCssToDelete))).sort()
  if (MAINDEBUG) { console.log(`\n* NEW headCssToDelete = ${JSON.stringify(headCssToDelete, null, 4)}`) }

  let bodyClassesToDelete = bodyCssToDelete.filter(s => s.startsWith('.')).map(s => s.slice(1))
  if (MAINDEBUG) { console.log(`bodyClassesToDelete = ${JSON.stringify(bodyClassesToDelete, null, 4)}`) }
  const bodyIdsToDelete = bodyCssToDelete.filter(s => s.startsWith('#')).map(s => s.slice(1))
  if (MAINDEBUG) { console.log(`bodyIdsToDelete = ${JSON.stringify(bodyIdsToDelete, null, 4)}`) }

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
  let canDeleteWholeRow
  let checkForCurlies = false
  let withinCurlies = false
  ignoreTheNextCurlieBecauseItFollowsAtMedia = false

  for (i = 0, len = str.length; i < len; i++) {
    if (MAINDEBUG) { totalCounter += 1 }

    const chr = str[i]
    if (MAINDEBUG2) { console.log(`---2---          str[${i}] = ${(str[i].trim() !== '') ? str[i] : 'space/LR'}`) }

    // pinpoint any <style... tag, anywhere within the given HTML
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}` === '<style') {
      if (MAINDEBUG2) { console.log('\n* style tag begins') }
      for (let y = i; y < len; y++) {
        if (MAINDEBUG) { totalCounter += 1 }
        if (str[y] === '>') {
          styleStartedAt = y + 1
          break
        }
      }
      checkForCurlies = true
    }

    // pinpoint closing style tag, </style>
    // ================
    if (`${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}${str[i + 6]}` === '/style') {
      if (MAINDEBUG2) { console.log('\n* style tag ends') }
      styleEndedAt = i
      checkForCurlies = false
    }

    // pinpoint @media
    // ================
    if (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}` === '@media') {
      if (MAINDEBUG2) { console.log('\n* @media detected') }
      ignoreTheNextCurlieBecauseItFollowsAtMedia = true
    }

    // detect being within curly braces, but not @media's.
    if (str[i] === '{') {
      if (ignoreTheNextCurlieBecauseItFollowsAtMedia) {
        ignoreTheNextCurlieBecauseItFollowsAtMedia = false
      } else if (checkForCurlies && !withinCurlies) {
        withinCurlies = true
      }
    }

    if (checkForCurlies && withinCurlies && (str[i] === '}')) {
      withinCurlies = false
    }

    if (MAINDEBUG2) { console.log(`\n *   withinCurlies = ${withinCurlies}`) }

    let firstSelectorFound = false
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
      ((chr === '.') || (chr === '#')) &&
      !withinCurlies
    ) {
      if (MAINDEBUG2) { console.log('====================================================') }
      canDeleteWholeRow = true
      // march backwards to catch:
      // 1) outer left boundary from which we would delete the whole "line"
      // 2) the beginning of a selector, such as "div" part in "div .class",
      // since we start at full stop or hash and potentially miss the front bit.
      // This marker is also meant to be used to delete certain parts from a line.
      let markerOuterLeft
      let markerInnerLeft = null
      for (let y = i - 1; y > 0; y--) {
        if (MAINDEBUG) { totalCounter += 1 }
        if (MAINDEBUG2) { console.log(`<< str[${y}]=${str[y]}`) }
        // part 1):
        if ((str[y] === '>') || (str[y] === '{') || (str[y] === '}')) {
          markerOuterLeft = y + 1
          // tending second "line" and the rest:
          if (markerInnerLeft < markerOuterLeft) {
            markerInnerLeft = markerOuterLeft
          }
          break
        }
        // part 2):
        if (str[y].trim() === '') {
          if (!markerInnerLeft) {
            markerInnerLeft = y + 1
          }
        } else {
          markerInnerLeft = null
        }
      }

      // march forward to catch:
      // 3) outer right boundary, up to which we would delete the whole "line".
      // Practically, it's closing curly brace.
      // 4) inner right boundary, either comma or opening curly brace. We will
      // need it for partial deletions from a line.
      let markerInnerRight
      let markerOuterRight
      let withinCurlie
      for (let y = i; y < len; y++) {
        if (str[y] === '{') {
          withinCurlie = true
        }
        if (MAINDEBUG) { totalCounter += 1 }
        if (str[y] === '}') {
          withinCurlie = false
          markerOuterRight = y + 1
          firstSelectorFound = false
          break
        }
        if (
          (str[y] === '{') ||
          ((str[y] === ',') && !withinCurlie)
        ) {
          let newMarkerInnerLeft
          // we need to include all white space that follows comma too:
          markerInnerRight = y
          if (!firstSelectorFound && (str[y] === ',')) {
            firstSelectorFound = true
            // we need to catch the following white space as well because it's the first piece:
            newMarkerInnerLeft = y
            for (let z = y + 1; z < len; z++) {
              if (MAINDEBUG) { totalCounter += 1 }
              if (str[z].trim() !== '') {
                markerInnerRight = z - 1
                break
              }
            }
            if (MAINDEBUG2) { console.log(`\n1selector:\n>>>>${str.slice(markerInnerLeft, markerInnerRight + 1)}<<<<`) }
            if (
              (intersection(
                extract(str.slice(markerInnerLeft, markerInnerRight + 1)),
                headCssToDelete,
              ).length > 0) &&
              (markerInnerLeft !== undefined) &&
              ((markerInnerRight + 1) !== undefined)
            ) {
              // extract each class and subtract counts from `headSelectorsCountClone`
              extract(str.slice(markerInnerLeft, markerInnerRight + 1)).forEach((selector) => {
                if (Object.prototype.hasOwnProperty.call(headSelectorsCountClone, selector)) {
                  headSelectorsCountClone[selector] -= 1
                }
              })
              // submit this chunk for deletion
              finalIndexesToDelete.add(markerInnerLeft, markerInnerRight + 1)
            } else {
              // don't delete, but prevent the deletion of the whole "line"
              canDeleteWholeRow = false
            }
          } else {
            // last chunk leading to opening curlie needs not to include the white space,
            // because if it will be deleted, that white space will need to be retained.
            // We're going to pull back the markerInnerRight marker for the last chunk:
            // Also, if there is more than one white space character, we're going to add it
            // to deletion list, leaving only a space.
            if (str[y] === '{') {
              for (let z = y - 1; z > 0; z--) {
                if (str[z].trim() !== '') {
                  markerInnerRight = z + 1
                  break
                }
              }
            }
            if (MAINDEBUG2) { console.log(`\n2selector:\n>>>>${str.slice(markerInnerLeft, markerInnerRight)}<<<<`) }
            if (MAINDEBUG2) { console.log(`\n\n\n\n\n* str.slice(markerInnerLeft, markerInnerRight) = ${JSON.stringify(str.slice(markerInnerLeft, markerInnerRight), null, 4)}`) }
            if (MAINDEBUG2) { console.log(`* extract(str.slice(markerInnerLeft, markerInnerRight)) = ${JSON.stringify(extract(str.slice(markerInnerLeft, markerInnerRight)), null, 4)}`) }
            if (MAINDEBUG2) { console.log(`* headCssToDelete = ${JSON.stringify(headCssToDelete, null, 4)}`) }
            if (MAINDEBUG2) { console.log(`* intersection(extract(str.slice(markerInnerLeft, markerInnerRight)), headCssToDelete) = ${JSON.stringify(intersection(extract(str.slice(markerInnerLeft, markerInnerRight)), headCssToDelete), null, 4)}`) }

            if (
              (intersection(
                extract(str.slice(markerInnerLeft, markerInnerRight)),
                headCssToDelete,
              ).length > 0) &&
              (markerInnerLeft !== undefined) &&
              (markerInnerRight !== undefined)
            ) {
              // subtract the counters for each class/id:
              extract(str.slice(markerInnerLeft, markerInnerRight)).forEach((selector) => {
                if (Object.prototype.hasOwnProperty.call(headSelectorsCountClone, selector)) {
                  headSelectorsCountClone[selector] -= 1
                }
              })
              // submit this chunk for deletion later
              if (MAINDEBUG2) { console.log('\n\n\n\nOUTCOME #1\nadding for deletion 488') }
              finalIndexesToDelete.add(markerInnerLeft, markerInnerRight)
            } else {
              // don't delete, but prevent the deletion of the whole "line"
              if (MAINDEBUG2) { console.log('\n\n\n\nOUTCOME #2 can\'t delete whole row') }
              canDeleteWholeRow = false
            }
            newMarkerInnerLeft = markerInnerRight
          }
          // we offset the main index so that we don't hit the second and
          // subsequential selectors (".class2" in ".class1.class2"):
          i = y - 1
          if (str[y] === ',') {
            markerInnerLeft = newMarkerInnerLeft
          }
        }
      }
      // deletion of the whole "line":
      if (
        canDeleteWholeRow &&
        (markerOuterLeft !== undefined) &&
        (markerOuterRight !== undefined)
      ) {
        if (MAINDEBUG2) { console.log(`row 535: ABOUT TO PUSH FOR THE WHOLE THING: [${markerOuterLeft}, ${markerOuterRight}]`) }
        finalIndexesToDelete.add(markerOuterLeft, markerOuterRight)
      }
      // console.log('\nmarkerOuter:\n>>>>' + str.slice(markerOuterLeft, markerOuterRight) + '<<<<')
      i = markerOuterRight - 1
    }
  }

  const allClassesAndIdsThatWereCompletelyDeletedFromHead = Object
    .keys(headSelectorsCountClone)
    .filter(singleSelector => (headSelectorsCountClone[singleSelector] === 0))

  // at this point, if any classes in `headSelectorsCountClone` have zero counters
  // that means those have all been deleted from head.
  bodyClassesToDelete = uniq(bodyClassesToDelete
    .concat(intersection(
      pullAllWithGlob(allClassesAndIdsWithinBody, opts.whitelist),
      allClassesAndIdsThatWereCompletelyDeletedFromHead,
    )
      .filter(val => (val[0] === '.')) // filter out all classes
      .map(val => val.slice(1)))) // remove dots from them
  // update `bodyCssToDelete` too, it's used in reporting
  bodyCssToDelete = uniq(bodyCssToDelete.concat(bodyClassesToDelete.map(val => `.${val}`))).sort()

  if (MAINDEBUG) { console.log(`\n\n* BEFORE STEP #3 - bodyClassesToDelete = ${JSON.stringify(bodyClassesToDelete, null, 4)}`) }

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
    if (MAINDEBUG) { totalCounter += 1 }

    //
    // 1. identify and remove unused classes from body:
    // ================
    if (
      (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}${str[i + 4]}${str[i + 5]}${str[i + 6]}` === 'class="') &&
      ((str[i - 1] === ' ') || (str[i - 1] === '"')) // to prevent false positives where attribute ends with "class", like "superclass"
    ) {
      let deleteFrom
      classStartedAt = i + 7
      for (let y = i + 7; y < len; y++) {
        if (MAINDEBUG) { totalCounter += 1 }
        if (str[y] === '"') {
          classEndedAt = y
          break
        }
      }
      // console.log('CLASS: >>>>' + str.slice(classStartedAt, classEndedAt) + '<<<<')

      const extractedClassArr = pullAll(str.slice(classStartedAt, classEndedAt).split(' '), ['']).map(el => el.trim())

      let whatsLeft = pullAll(Array.from(extractedClassArr), bodyClassesToDelete)
      if (whatsLeft.length > 0) {
        whatsLeft = ` class="${whatsLeft.join(' ')}"`
      } else {
        whatsLeft = ''
      }
      if ((intersection(extractedClassArr, bodyClassesToDelete).length > 0) || (whatsLeft === '')) {
        // traverse backwards to catch any multiple spaces:
        // ================
        for (let y = i - 1; y > 0; y--) {
          if (MAINDEBUG) { totalCounter += 1 }
          if (str[y] !== ' ') {
            deleteFrom = y + 1
            break
          }
        }
        if ((deleteFrom !== undefined) && ((classEndedAt + 1) !== undefined)) {
          finalIndexesToDelete.add(deleteFrom, classEndedAt + 1, whatsLeft)
        }
      }
    }
    //
    // 2. identify and remove unused id's from body:
    // ================
    if (
      (`${str[i]}${str[i + 1]}${str[i + 2]}${str[i + 3]}` === 'id="') &&
      ((str[i - 1] === ' ') || (str[i - 1] === '"')) // to prevent false positives where attribute ends with "id", like "urlid"
    ) {
      let deleteFrom
      idStartedAt = i + 4
      for (let y = i + 4; y < len; y++) {
        if (MAINDEBUG) { totalCounter += 1 }
        if (str[y] === '"') {
          idEndedAt = y
          break
        }
      }
      // console.log('ID: >>>>' + str.slice(idStartedAt, idEndedAt) + '<<<<')

      const extractedIdsArr = pullAll(str.slice(idStartedAt, idEndedAt).split(' '), ['']).map(el => el.trim())

      let whatsLeft = pullAll(Array.from(extractedIdsArr), bodyIdsToDelete)
      if (whatsLeft.length > 0) {
        whatsLeft = ` id="${whatsLeft.join(' ')}"`
      } else {
        whatsLeft = ''
      }

      // traverse backwards to catch any multiple spaces:
      // ================
      for (let y = i - 1; y > 0; y--) {
        if (MAINDEBUG) { totalCounter += 1 }
        if (str[y] !== ' ') {
          deleteFrom = y + 1
          break
        }
      }
      finalIndexesToDelete.add(deleteFrom, idEndedAt + 1, whatsLeft)
    }
  }

  // actual deletion/insertion:
  // ==========================

  if (existy(finalIndexesToDelete.current())) {
    if (MAINDEBUG) { console.log(`\n\n\n---------\nfinalIndexesToDelete = ${JSON.stringify(finalIndexesToDelete, null, 4)}`) }
    str = replaceSlicesArr(str, finalIndexesToDelete.current())
  }

  if (MAINDEBUG) { console.log(`totalCounter so far: ${totalCounter}`) }
  if (MAINDEBUG) { console.log(`==========\nwe traversed ${totalCounter / originalLength} times more characters than the total input char count.\n==========`) }

  // final fixing:
  // ================
  // remove empty style tags:
  while (regexEmptyMediaQuery.test(str)) {
    str = str.replace(regexEmptyMediaQuery, '')
  }
  str = str.replace(regexEmptyStyleTag, '\n')
  str = str.replace('\u000A\n', '\n')
  str = `${str.replace('\n\n', '\n').trim()}\n`

  return {
    result: str,
    allInHead: allClassesAndIdsWithinHead.sort(),
    allInBody: allClassesAndIdsWithinBody.sort(),
    // deletedFromHead: uniq(deletedFromHeadArr.concat(headCssToDelete)).sort(),
    deletedFromHead: uniq(Object.keys(headSelectorsCountClone)
      .filter(singleSelector => (headSelectorsCountClone[singleSelector] === 0))).sort(),
    deletedFromBody: bodyCssToDelete.sort(),
  }
}

module.exports = emailRemoveUnusedCss
