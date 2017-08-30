'use strict';

// const moment = require('moment')

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var pullAll = require('lodash.pullall');
var uniq = require('lodash.uniq');
var intersection = require('lodash.intersection');
var extract = require('string-extract-class-names');
var isObj = require('lodash.isplainobject');
var isArr = Array.isArray;
var pullAllWithGlob = require('array-pull-all-with-glob');
var replaceSlicesArr = require('string-replace-slices-array');
var Slices = require('string-slices-array-push');

function emailRemoveUnusedCss(str, opts) {
  function characterSuitableForNames(char) {
    return (/[.#\-_A-Za-z0-9]/.test(char)
    );
  }
  function existy(x) {
    return x != null;
  }
  function isStr(something) {
    return typeof something === 'string';
  }
  var MAINDEBUG = 0;
  var MAINDEBUG2 = 0;
  var i, len;
  var styleStartedAt = 0;
  var styleEndedAt = 0;
  var headSelectorsArr = [];
  var bodyClassesArr = [];
  var bodyIdsArr = [];

  var headSelectorStartedAt = 0;
  var bodyClassAttributeStartedAt = 0;
  var bodyIdAttributeStartedAt = 0;
  var bodyStartedAt = 0;

  var classStartedAt = 0;
  var classEndedAt = 0;
  var idStartedAt = 0;
  var idEndedAt = 0;

  var beingCurrentlyAt = 0;
  var checkingInsideCurlyBraces = false;
  var insideCurlyBraces = false;

  var regexEmptyStyleTag = /[\n]?\s*<style[^>]*>\s*<\/style\s*>/g;
  var regexEmptyMediaQuery = /[\n]?\s*@media[^{]*{\s*}/g;

  var finalIndexesToDelete = new Slices();

  // insurance
  if (typeof str !== 'string') {
    throw new TypeError('email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_01] Input must be string! Currently it\'s ' + (typeof str === 'undefined' ? 'undefined' : _typeof(str)));
  }
  if (!isObj(opts)) {
    if (opts === undefined || opts === null) {
      opts = {};
    } else {
      throw new TypeError('email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_02] Options, second input argument, must be a plain object! Currently it\'s ' + (typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) + ', equal to: ' + JSON.stringify(opts, null, 4));
    }
  }

  // checking opts
  var defaults = {
    whitelist: []
  };
  opts = Object.assign(defaults, opts);
  if (isStr(opts.whitelist)) {
    opts.whitelist = [opts.whitelist];
  }
  if (!isArr(opts.whitelist)) {
    throw new TypeError('email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_03] opts.whitelist should be an array, but it was customised to a wrong thing, ' + JSON.stringify(opts.whitelist, null, 4));
  }
  if (opts.whitelist.length > 0 && !opts.whitelist.every(function (el) {
    return isStr(el);
  })) {
    throw new TypeError('email-remove-unused-css/emailRemoveUnusedCss(): [THROW_ID_04] opts.whitelist array should contain only string-type elements. Currently we\ve got:\n' + JSON.stringify(opts.whitelist, null, 4));
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

  var totalCounter = 0;
  var originalLength = str.length || 1;
  var ignoreTheNextCurlieBecauseItFollowsAtMedia = false;
  for (var _i = 0, _len = str.length; _i < _len; _i++) {
    if (MAINDEBUG) {
      console.log('----------------------------------------- str[' + _i + '] = ' + (str[_i].trim() !== '' ? str[_i] : 'space/LR'));
    }

    if (MAINDEBUG) {
      totalCounter++;
    }
    var chr = str[_i];

    // pinpoint any <style... tag, anywhere within the given HTML
    // ================
    if ('' + str[_i] + str[_i + 1] + str[_i + 2] + str[_i + 3] + str[_i + 4] + str[_i + 5] === '<style') {
      checkingInsideCurlyBraces = true;
      for (var y = _i; y < _len; y++) {
        if (MAINDEBUG) {
          totalCounter++;
        }
        if (str[y] === '>') {
          styleStartedAt = y + 1;
          break;
        }
      }
    }

    // pinpoint closing style tag, </style>
    // ================
    if ('' + str[_i] + str[_i + 1] + str[_i + 2] + str[_i + 3] + str[_i + 4] + str[_i + 5] === '/style') {
      checkingInsideCurlyBraces = false;
      styleEndedAt = _i - 1;
    }

    // pinpoint @media
    // ================
    if ('' + str[_i] + str[_i + 1] + str[_i + 2] + str[_i + 3] + str[_i + 4] + str[_i + 5] === '@media') {
      if (MAINDEBUG) {
        console.log('\n* @media detected');
      }
      ignoreTheNextCurlieBecauseItFollowsAtMedia = true;
    }

    // pinpoint closing curly braces
    // ================
    if (checkingInsideCurlyBraces && chr === '}') {
      // checkingInsideCurlyBraces = false
      insideCurlyBraces = false;
    }

    // pinpoint opening curly braces, but not @media's.
    // ================
    if (chr === '{') {
      if (ignoreTheNextCurlieBecauseItFollowsAtMedia) {
        ignoreTheNextCurlieBecauseItFollowsAtMedia = false;
      } else if (checkingInsideCurlyBraces && !insideCurlyBraces) {
        insideCurlyBraces = true;
      }
    }

    // catch opening dot or hash
    // ================
    if (styleStartedAt && _i >= styleStartedAt && (
    // (!styleEndedAt || (i > styleEndedAt)) &&

    // a) either it's the first style tag and currently we haven't traversed
    // it's closing yet:
    styleEndedAt === 0 && _i >= styleStartedAt ||
    // b) or, style tag was closed, later another-one was opened and we
    // haven't traversed through its closing tag yet:
    styleStartedAt > styleEndedAt && styleStartedAt < _i) && (chr === '.' || chr === '#') && _i >= beingCurrentlyAt && !insideCurlyBraces) {
      checkingInsideCurlyBraces = true;
      headSelectorStartedAt = _i;
      for (var _y = _i; _y < _len; _y++) {
        if (MAINDEBUG) {
          totalCounter++;
        }
        if (!characterSuitableForNames(str[_y])) {
          headSelectorsArr.push(str.slice(headSelectorStartedAt, _y));
          beingCurrentlyAt = _y;
          break;
        }
      }
    }

    // get opening body tag
    if ('' + str[_i] + str[_i + 1] + str[_i + 2] + str[_i + 3] + str[_i + 4] === '<body') {
      for (var _y2 = _i; _y2 < _len; _y2++) {
        if (MAINDEBUG) {
          totalCounter++;
        }
        if (str[_y2] === '>') {
          bodyStartedAt = _y2 + 1;
          break;
        }
      }
    }

    // catch opening of a class attribute
    // ================
    if (bodyStartedAt !== 0 && '' + str[_i] + str[_i + 1] + str[_i + 2] + str[_i + 3] + str[_i + 4] + str[_i + 5] + str[_i + 6] === 'class="' && (str[_i - 1] === ' ' || str[_i - 1] === '"') // this is to prevent false positives like attribute "superclass=..."
    ) {
        bodyClassAttributeStartedAt = _i + 6;
      }

    // catch opening of an id attribute
    // ================
    if (bodyStartedAt !== 0 && '' + str[_i] + str[_i + 1] + str[_i + 2] + str[_i + 3] === 'id="' && (str[_i - 1] === ' ' || str[_i - 1] === '"') // this is to prevent false positives like attribute "urlid=..."
    ) {
        bodyIdAttributeStartedAt = _i + 3;
      }

    // stop the class attribute's recording if closing double quote encountered
    // ================
    if (bodyClassAttributeStartedAt !== 0 && chr === '"' && _i > bodyClassAttributeStartedAt) {
      bodyClassAttributeStartedAt = 0;
    }

    // stop the id attribute's recording if closing double quote encountered
    // ================
    if (bodyIdAttributeStartedAt !== 0 && chr === '"' && _i > bodyIdAttributeStartedAt) {
      bodyIdAttributeStartedAt = 0;
    }

    // catch first letter within each class attribute
    // ================
    if (bodyClassAttributeStartedAt && _i > bodyClassAttributeStartedAt && characterSuitableForNames(chr) && classStartedAt === 0) {
      classStartedAt = _i;
    }

    // catch whole class
    // ================
    if (classStartedAt !== 0 && _i > classStartedAt && !characterSuitableForNames(chr)) {
      bodyClassesArr.push('.' + str.slice(classStartedAt, _i));
      classStartedAt = 0;
    }

    // catch first letter within each id attribute
    // ================
    if (bodyIdAttributeStartedAt && _i > bodyIdAttributeStartedAt && characterSuitableForNames(chr) && idStartedAt === 0) {
      idStartedAt = _i;
    }

    // catch whole id
    // ================
    if (idStartedAt !== 0 && _i > idStartedAt && !characterSuitableForNames(chr)) {
      bodyIdsArr.push('#' + str.slice(idStartedAt, _i));
      idStartedAt = 0;
    }
  }

  //         F R U I T S   O F   T H E   L A B O U R

  var allClassesAndIdsWithinBody = bodyClassesArr.concat(bodyIdsArr);

  if (MAINDEBUG) {
    console.log('headSelectorsArr = ' + JSON.stringify(headSelectorsArr, null, 4));
  }
  if (MAINDEBUG) {
    console.log('bodyClassesArr = ' + JSON.stringify(bodyClassesArr, null, 4));
  }
  if (MAINDEBUG) {
    console.log('bodyIdsArr = ' + JSON.stringify(bodyIdsArr, null, 4));
  }
  if (MAINDEBUG) {
    console.log('allClassesAndIdsWithinBody = ' + JSON.stringify(allClassesAndIdsWithinBody, null, 4));
  }
  if (MAINDEBUG) {
    console.log('\nopts.whitelist = ' + JSON.stringify(opts.whitelist, null, 4));
  }

  // extract all classes or id's from `headSelectorsArr` and get count of each.
  // That's so we can later exclude sandwitched classes. Each time "collateral"
  // legit, but sandwitched with false-one class gets deleted, we keep count, and
  // later compare totals with these below.
  // If it turns out that a class was in both head and body, but it was sandwitched
  // with unused classes and removed as collateral, we need to remove it from body too.

  var headSelectorsCount = {};
  headSelectorsArr.forEach(function (el, i) {
    extract(el).forEach(function (selector) {
      if (headSelectorsCount.hasOwnProperty(selector)) {
        headSelectorsCount[selector]++;
      } else {
        headSelectorsCount[selector] = 1;
      }
    });
  });
  if (MAINDEBUG) {
    console.log('\n* headSelectorsCount = ' + JSON.stringify(headSelectorsCount, null, 4));
  }
  // create a working copy of `headSelectorsCount` which we'll mutate, subtracting
  // each deleted class/id:
  var headSelectorsCountClone = Object.assign({}, headSelectorsCount);

  //
  //               A F T E R   T R A V E R S A L
  //

  // compile list of to-be-terminated
  // ================

  var allClassesAndIdsWithinHead = uniq(headSelectorsArr.reduce(function (arr, el) {
    return arr.concat(extract(el));
  }, []));
  if (MAINDEBUG) {
    console.log('allClassesAndIdsWithinHead = ' + JSON.stringify(allClassesAndIdsWithinHead, null, 4));
  }

  // to avoid false positives, let's apply two cycles when removing unused classes/id's from head:

  // ---------------------------------------
  // TWO-CYCLE UNUSED CSS IDENTIFICATION:
  // ---------------------------------------

  // cycle #1 - remove comparing separate classes/id's from body against
  // potentially sandwitched lumps from head. Let's see what's left afterwards.
  // ================

  var preppedHeadSelectorsArr = Array.from(headSelectorsArr);
  var deletedFromHeadArr = [];
  for (var _y3 = 0, _len2 = preppedHeadSelectorsArr.length; _y3 < _len2; _y3++) {
    if (MAINDEBUG) {
      totalCounter++;
    }
    // preppedHeadSelectorsArr[y]
    var temp = void 0;
    if (existy(preppedHeadSelectorsArr[_y3])) {
      temp = extract(preppedHeadSelectorsArr[_y3]);
    }
    if (!temp.every(function (el) {
      return allClassesAndIdsWithinBody.includes(el);
    })) {
      var _deletedFromHeadArr;

      (_deletedFromHeadArr = deletedFromHeadArr).push.apply(_deletedFromHeadArr, _toConsumableArray(extract(preppedHeadSelectorsArr[_y3])));
      preppedHeadSelectorsArr.splice(_y3, 1);
      _y3--;
      _len2--;
    }
  }

  deletedFromHeadArr = uniq(pullAllWithGlob(deletedFromHeadArr, opts.whitelist));

  var preppedAllClassesAndIdsWithinHead;
  if (preppedHeadSelectorsArr.length > 0) {
    preppedAllClassesAndIdsWithinHead = preppedHeadSelectorsArr.reduce(function (arr, el) {
      return arr.concat(extract(el));
    }, []);
  } else {
    preppedAllClassesAndIdsWithinHead = [];
  }
  if (MAINDEBUG) {
    console.log('\n* preppedAllClassesAndIdsWithinHead = ' + JSON.stringify(preppedAllClassesAndIdsWithinHead, null, 4));
  }

  // cycle #2 - now treat remaining lumps as definite sources of
  // "what classes or id's are present in the head"
  // use "preppedAllClassesAndIdsWithinHead" as a head selector reference when comparing
  // against the body classes/id's.
  // ================

  var headCssToDelete = pullAllWithGlob(pullAll(uniq(Array.from(allClassesAndIdsWithinHead)), bodyClassesArr.concat(bodyIdsArr)), opts.whitelist);
  if (MAINDEBUG) {
    console.log('\n* OLD headCssToDelete = ' + JSON.stringify(headCssToDelete, null, 4));
  }

  var bodyCssToDelete = uniq(pullAllWithGlob(pullAll(bodyClassesArr.concat(bodyIdsArr), preppedAllClassesAndIdsWithinHead), opts.whitelist));
  if (MAINDEBUG) {
    console.log('* bodyCssToDelete = ' + JSON.stringify(bodyCssToDelete, null, 4));
  }

  // now that we know final to-be-deleted selectors list, compare them with `deletedFromHeadArr`
  // and fill any missing CSS in `headCssToDelete`:
  headCssToDelete = uniq(headCssToDelete.concat(intersection(deletedFromHeadArr, bodyCssToDelete))).sort();
  if (MAINDEBUG) {
    console.log('\n* NEW headCssToDelete = ' + JSON.stringify(headCssToDelete, null, 4));
  }

  var bodyClassesToDelete = bodyCssToDelete.filter(function (s) {
    return s.startsWith('.');
  }).map(function (s) {
    return s.slice(1);
  });
  if (MAINDEBUG) {
    console.log('bodyClassesToDelete = ' + JSON.stringify(bodyClassesToDelete, null, 4));
  }
  var bodyIdsToDelete = bodyCssToDelete.filter(function (s) {
    return s.startsWith('#');
  }).map(function (s) {
    return s.slice(1);
  });
  if (MAINDEBUG) {
    console.log('bodyIdsToDelete = ' + JSON.stringify(bodyIdsToDelete, null, 4));
  }

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
  styleStartedAt = 0;
  styleEndedAt = 0;
  var canDeleteWholeRow = void 0;
  var checkForCurlies = false;
  var withinCurlies = false;
  ignoreTheNextCurlieBecauseItFollowsAtMedia = false;

  for (i = 0, len = str.length; i < len; i++) {
    if (MAINDEBUG) {
      totalCounter++;
    }

    var _chr = str[i];
    if (MAINDEBUG2) {
      console.log('---2---          str[' + i + '] = ' + (str[i].trim() !== '' ? str[i] : 'space/LR'));
    }

    // pinpoint any <style... tag, anywhere within the given HTML
    // ================
    if ('' + str[i] + str[i + 1] + str[i + 2] + str[i + 3] + str[i + 4] + str[i + 5] === '<style') {
      if (MAINDEBUG2) {
        console.log('\n* style tag begins');
      }
      for (var _y4 = i; _y4 < len; _y4++) {
        if (MAINDEBUG) {
          totalCounter++;
        }
        if (str[_y4] === '>') {
          styleStartedAt = _y4 + 1;
          break;
        }
      }
      checkForCurlies = true;
    }

    // pinpoint closing style tag, </style>
    // ================
    if ('' + str[i + 1] + str[i + 2] + str[i + 3] + str[i + 4] + str[i + 5] + str[i + 6] === '/style') {
      if (MAINDEBUG2) {
        console.log('\n* style tag ends');
      }
      styleEndedAt = i;
      checkForCurlies = false;
    }

    // pinpoint @media
    // ================
    if ('' + str[i] + str[i + 1] + str[i + 2] + str[i + 3] + str[i + 4] + str[i + 5] === '@media') {
      if (MAINDEBUG2) {
        console.log('\n* @media detected');
      }
      ignoreTheNextCurlieBecauseItFollowsAtMedia = true;
    }

    // detect being within curly braces, but not @media's.
    if (str[i] === '{') {
      if (ignoreTheNextCurlieBecauseItFollowsAtMedia) {
        ignoreTheNextCurlieBecauseItFollowsAtMedia = false;
      } else if (checkForCurlies && !withinCurlies) {
        withinCurlies = true;
      }
    }

    if (checkForCurlies && withinCurlies && str[i] === '}') {
      withinCurlies = false;
    }

    if (MAINDEBUG2) {
      console.log('\n *   withinCurlies = ' + withinCurlies);
    }

    var firstSelectorFound = false;
    // prep the head
    // ================
    if (styleStartedAt && i >= styleStartedAt && (
    // a) either it's the first style tag and currently we haven't traversed
    // it's closing yet:
    styleEndedAt === 0 && i >= styleStartedAt ||
    // b) or, style tag was closed, later another-one was opened and we
    // haven't traversed through its closing tag yet:
    styleStartedAt > styleEndedAt && styleStartedAt < i) && (_chr === '.' || _chr === '#') && !withinCurlies) {
      if (MAINDEBUG2) {
        console.log('====================================================');
      }
      canDeleteWholeRow = true;
      // march backwards to catch:
      // 1) outer left boundary from which we would delete the whole "line"
      // 2) the beginning of a selector, such as "div" part in "div .class",
      // since we start at full stop or hash and potentially miss the front bit.
      // This marker is also meant to be used to delete certain parts from a line.
      var markerOuterLeft = void 0;
      var markerInnerLeft = null;
      for (var _y5 = i - 1; _y5 > 0; _y5--) {
        if (MAINDEBUG) {
          totalCounter++;
        }
        if (MAINDEBUG2) {
          console.log('<< str[' + _y5 + ']=' + str[_y5]);
        }
        // part 1):
        if (str[_y5] === '>' || str[_y5] === '{' || str[_y5] === '}') {
          markerOuterLeft = _y5 + 1;
          // tending second "line" and the rest:
          if (markerInnerLeft < markerOuterLeft) {
            markerInnerLeft = markerOuterLeft;
          }
          break;
        }
        // part 2):
        if (str[_y5].trim() === '') {
          if (!markerInnerLeft) {
            markerInnerLeft = _y5 + 1;
          }
        } else {
          markerInnerLeft = null;
        }
      }
      // if (MAINDEBUG2) { console.log('\n\n\nmarkerOuterLeft:\n>>>>' + str.slice(markerOuterLeft, markerOuterLeft + 15) + '<<<<') }
      // if (MAINDEBUG2) { console.log('\n') }
      // if (MAINDEBUG2) { console.log('markerInnerLeft:\n>>>>' + str.slice(markerInnerLeft, markerInnerLeft + 15) + '<<<<\n\n\n') }

      // march forward to catch:
      // 3) outer right boundary, up to which we would delete the whole "line".
      // Practically, it's closing curly brace.
      // 4) inner right boundary, either comma or opening curly brace. We will
      // need it for partial deletions from a line.
      var markerInnerRight = void 0;
      var markerOuterRight = void 0;
      var withinCurlie = void 0;
      for (var _y6 = i; _y6 < len; _y6++) {
        if (str[_y6] === '{') {
          withinCurlie = true;
        }
        if (MAINDEBUG) {
          totalCounter++;
        }
        if (str[_y6] === '}') {
          withinCurlie = false;
          markerOuterRight = _y6 + 1;
          firstSelectorFound = false;
          break;
        }
        if (str[_y6] === '{' || str[_y6] === ',' && !withinCurlie) {
          var newMarkerInnerLeft = void 0;
          // we need to include all white space that follows comma too:
          markerInnerRight = _y6;
          if (!firstSelectorFound && str[_y6] === ',') {
            firstSelectorFound = true;
            // we need to catch the following white space as well because it's the first piece:
            newMarkerInnerLeft = _y6;
            for (var z = _y6 + 1; z < len; z++) {
              if (MAINDEBUG) {
                totalCounter++;
              }
              if (str[z].trim() !== '') {
                markerInnerRight = z - 1;
                break;
              }
            }
            if (MAINDEBUG2) {
              console.log('\n1selector:\n>>>>' + str.slice(markerInnerLeft, markerInnerRight + 1) + '<<<<');
            }
            if (intersection(extract(str.slice(markerInnerLeft, markerInnerRight + 1)), headCssToDelete).length > 0 && markerInnerLeft !== undefined && markerInnerRight + 1 !== undefined) {
              // extract each class and subtract counts from `headSelectorsCountClone`
              extract(str.slice(markerInnerLeft, markerInnerRight + 1)).forEach(function (selector) {
                if (headSelectorsCountClone.hasOwnProperty(selector)) {
                  headSelectorsCountClone[selector]--;
                }
              });
              // submit this chunk for deletion
              finalIndexesToDelete.add(markerInnerLeft, markerInnerRight + 1);
            } else {
              // don't delete, but prevent the deletion of the whole "line"
              canDeleteWholeRow = false;
            }
          } else {
            // last chunk leading to opening curlie needs not to include the white space,
            // because if it will be deleted, that white space will need to be retained.
            // We're going to pull back the markerInnerRight marker for the last chunk:
            // Also, if there is more than one white space character, we're going to add it
            // to deletion list, leaving only a space.
            if (str[_y6] === '{') {
              for (var _z = _y6 - 1; _z > 0; _z--) {
                if (str[_z].trim() !== '') {
                  markerInnerRight = _z + 1;
                  break;
                }
              }
            }
            if (MAINDEBUG2) {
              console.log('\n2selector:\n>>>>' + str.slice(markerInnerLeft, markerInnerRight) + '<<<<');
            }
            if (MAINDEBUG2) {
              console.log('\n\n\n\n\n* str.slice(markerInnerLeft, markerInnerRight) = ' + JSON.stringify(str.slice(markerInnerLeft, markerInnerRight), null, 4));
            }
            if (MAINDEBUG2) {
              console.log('* extract(str.slice(markerInnerLeft, markerInnerRight)) = ' + JSON.stringify(extract(str.slice(markerInnerLeft, markerInnerRight)), null, 4));
            }
            if (MAINDEBUG2) {
              console.log('* headCssToDelete = ' + JSON.stringify(headCssToDelete, null, 4));
            }
            if (MAINDEBUG2) {
              console.log('* intersection(extract(str.slice(markerInnerLeft, markerInnerRight)), headCssToDelete) = ' + JSON.stringify(intersection(extract(str.slice(markerInnerLeft, markerInnerRight)), headCssToDelete), null, 4));
            }

            if (intersection(extract(str.slice(markerInnerLeft, markerInnerRight)), headCssToDelete).length > 0 && markerInnerLeft !== undefined && markerInnerRight !== undefined) {
              // subtract the counters for each class/id:
              extract(str.slice(markerInnerLeft, markerInnerRight)).forEach(function (selector) {
                if (headSelectorsCountClone.hasOwnProperty(selector)) {
                  headSelectorsCountClone[selector]--;
                }
              });
              // submit this chunk for deletion later
              if (MAINDEBUG2) {
                console.log('\n\n\n\nOUTCOME #1\nadding for deletion 488');
              }
              finalIndexesToDelete.add(markerInnerLeft, markerInnerRight);
            } else {
              // don't delete, but prevent the deletion of the whole "line"
              if (MAINDEBUG2) {
                console.log('\n\n\n\nOUTCOME #2 can\'t delete whole row');
              }
              canDeleteWholeRow = false;
            }
            newMarkerInnerLeft = markerInnerRight;
          }
          // we offset the main index so that we don't hit the second and
          // subsequential selectors (".class2" in ".class1.class2"):
          i = _y6 - 1;
          if (str[_y6] === ',') {
            markerInnerLeft = newMarkerInnerLeft;
          }
        }
      }
      // deletion of the whole "line":
      if (canDeleteWholeRow && markerOuterLeft !== undefined && markerOuterRight !== undefined) {
        if (MAINDEBUG2) {
          console.log('row 535: ABOUT TO PUSH FOR THE WHOLE THING:' + ('[' + markerOuterLeft + ', ' + markerOuterRight + ']'));
        }
        finalIndexesToDelete.add(markerOuterLeft, markerOuterRight);
      }
      // console.log('\nmarkerOuter:\n>>>>' + str.slice(markerOuterLeft, markerOuterRight) + '<<<<')
      i = markerOuterRight - 1;
    }
  }

  var allClassesAndIdsThatWereCompletelyDeletedFromHead = Object.keys(headSelectorsCountClone).filter(function (singleSelector) {
    return headSelectorsCountClone[singleSelector] === 0;
  });

  // at this point, if any classes in `headSelectorsCountClone` have zero counters
  // that means those have all been deleted from head.
  bodyClassesToDelete = uniq(bodyClassesToDelete.concat(intersection(pullAllWithGlob(allClassesAndIdsWithinBody, opts.whitelist), allClassesAndIdsThatWereCompletelyDeletedFromHead).filter(function (val) {
    return val[0] === '.';
  }) // filter out all classes
  .map(function (val) {
    return val.slice(1);
  }) // remove dots from them
  ));
  // update `bodyCssToDelete` too, it's used in reporting
  bodyCssToDelete = uniq(bodyCssToDelete.concat(bodyClassesToDelete.map(function (val) {
    return '.' + val;
  }))).sort();

  if (MAINDEBUG) {
    console.log('\n\n* BEFORE STEP #3 - bodyClassesToDelete = ' + JSON.stringify(bodyClassesToDelete, null, 4));
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
    if (MAINDEBUG) {
      totalCounter++;
    }

    //
    // 1. identify and remove unused classes from body:
    // ================
    if ('' + str[i] + str[i + 1] + str[i + 2] + str[i + 3] + str[i + 4] + str[i + 5] + str[i + 6] === 'class="' && (str[i - 1] === ' ' || str[i - 1] === '"') // to prevent false positives where attribute ends with "class", like "superclass"
    ) {
        var deleteFrom = void 0;
        classStartedAt = i + 7;
        for (var _y7 = i + 7; _y7 < len; _y7++) {
          if (MAINDEBUG) {
            totalCounter++;
          }
          if (str[_y7] === '"') {
            classEndedAt = _y7;
            break;
          }
        }
        // console.log('CLASS: >>>>' + str.slice(classStartedAt, classEndedAt) + '<<<<')

        var extractedClassArr = pullAll(str.slice(classStartedAt, classEndedAt).split(' '), ['']).map(function (el) {
          return el.trim();
        });

        var whatsLeft = pullAll(Array.from(extractedClassArr), bodyClassesToDelete);
        if (whatsLeft.length > 0) {
          whatsLeft = ' class="' + whatsLeft.join(' ') + '"';
        } else {
          whatsLeft = '';
        }
        if (intersection(extractedClassArr, bodyClassesToDelete).length > 0 || whatsLeft === '') {
          // traverse backwards to catch any multiple spaces:
          // ================
          for (var _y8 = i - 1; _y8 > 0; _y8--) {
            if (MAINDEBUG) {
              totalCounter++;
            }
            if (str[_y8] !== ' ') {
              deleteFrom = _y8 + 1;
              break;
            }
          }
          if (deleteFrom !== undefined && classEndedAt + 1 !== undefined) {
            finalIndexesToDelete.add(deleteFrom, classEndedAt + 1, whatsLeft);
          }
        }
      }
    //
    // 2. identify and remove unused id's from body:
    // ================
    if ('' + str[i] + str[i + 1] + str[i + 2] + str[i + 3] === 'id="' && (str[i - 1] === ' ' || str[i - 1] === '"') // to prevent false positives where attribute ends with "id", like "urlid"
    ) {
        var _deleteFrom = void 0;
        idStartedAt = i + 4;
        for (var _y9 = i + 4; _y9 < len; _y9++) {
          if (MAINDEBUG) {
            totalCounter++;
          }
          if (str[_y9] === '"') {
            idEndedAt = _y9;
            break;
          }
        }
        // console.log('ID: >>>>' + str.slice(idStartedAt, idEndedAt) + '<<<<')

        var extractedIdsArr = pullAll(str.slice(idStartedAt, idEndedAt).split(' '), ['']).map(function (el) {
          return el.trim();
        });

        var _whatsLeft = pullAll(Array.from(extractedIdsArr), bodyIdsToDelete);
        if (_whatsLeft.length > 0) {
          _whatsLeft = ' id="' + _whatsLeft.join(' ') + '"';
        } else {
          _whatsLeft = '';
        }

        // traverse backwards to catch any multiple spaces:
        // ================
        for (var _y10 = i - 1; _y10 > 0; _y10--) {
          if (MAINDEBUG) {
            totalCounter++;
          }
          if (str[_y10] !== ' ') {
            _deleteFrom = _y10 + 1;
            break;
          }
        }
        finalIndexesToDelete.add(_deleteFrom, idEndedAt + 1, _whatsLeft);
      }
  }

  // actual deletion/insertion:
  // ==========================

  if (existy(finalIndexesToDelete.current())) {
    if (MAINDEBUG) {
      console.log('\n\n\n---------\nfinalIndexesToDelete = ' + JSON.stringify(finalIndexesToDelete, null, 4));
    }
    str = replaceSlicesArr(str, finalIndexesToDelete.current());
  }

  if (MAINDEBUG) {
    console.log('totalCounter so far: ' + totalCounter);
  }
  if (MAINDEBUG) {
    console.log('==========\nwe traversed ' + totalCounter / originalLength + ' times more characters than the total input char count.\n==========');
  }

  // final fixing:
  // ================
  // remove empty style tags:
  while (regexEmptyMediaQuery.test(str)) {
    str = str.replace(regexEmptyMediaQuery, '');
  }
  str = str.replace(regexEmptyStyleTag, '\n');
  str = str.replace('\n\n', '\n');
  str = str.replace('\n\n', '\n').trim() + '\n';

  return {
    result: str,
    allInHead: allClassesAndIdsWithinHead.sort(),
    allInBody: allClassesAndIdsWithinBody.sort(),
    // deletedFromHead: uniq(deletedFromHeadArr.concat(headCssToDelete)).sort(),
    deletedFromHead: uniq(Object.keys(headSelectorsCountClone).filter(function (singleSelector) {
      return headSelectorsCountClone[singleSelector] === 0;
    })).sort(),
    deletedFromBody: bodyCssToDelete.sort()
  };
}

module.exports = emailRemoveUnusedCss;