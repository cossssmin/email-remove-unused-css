# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [2.5.0] - 2017-08-28
### Fixed
- 🐛 A bug where attributes that ended with "class" (like "superclass") or "id" (like "urlid") were misinterpreted as classes or id's. Sorry about that.
- 🐛 A bug where color hashes in the head were misinterpreted as id's.

## [2.4.0] - 2017-08-25
### Updated
- 🔧 All dependencies
- 🔧 Improved the algorithm, accepting a single string ignore in the `opts` (and later automatically arrayiffying it).
### Removed
- 💥 Dependency of `lodash.clodedeep`. I'm using now simply ES6's `Array.from`.

## [2.3.0] - 2017-07-28
### Added
- ✨ Internal function `pushToFinalIndexesToDelete()` now put into a separate library, [string-slices-array-push](https://github.com/codsen/string-slices-array-push). This means more and thorough unit tests are covering it. Actually, it has 100%-line and 100%-branch unit test [coverage](https://coveralls.io/github/codsen/string-slices-array-push).

## [2.2.0] - 2017-07-25
### Added
- ✨ npmignore
- ✨ Extracted string replacement using slices array into a separate library, [string-replace-slices-array](https://github.com/codsen/string-replace-slices-array) and then tapped it. This will make it easier to add new features to it and also to maintain it.

## [2.1.1] - 2017-07-19

### Changed
- 🔧 Some code rebasing after the review 🍺

## [2.1.0] - 2017-07-19

### Changed
- 🔧 Improved the algorithm, recoding whole second part (and more). Now three main traversal loops only **gather the list of what needs to be deleted**. The deletion happens **once**, at the bottom of the code. Previously, deletion was happening "on the spot", during second loop's traversal, when "bad" selector was detected. That caused overhead in the loop's maintenance - the source was being mutated hundreds of times (for each deletetion).

As a result, even the largest emails with more than hundred thousand characters can be cleaned within miliseconds.

I set up a `MAINDEBUG` variable/switch which, when turned on, shows how many characters were iterated through within all loops in total. Now, the total is usually between 2.5 and 3, but never exceeding 3 times the total input character count. This means, all the cleaning is done within less than three full loops over the input! So far, when testing on real 100K+ char length email HTML templates, I see no slowdown when cleaning.

## [2.0.0] - 2017-07-16

Pivoting on priorities. Now the most important is 1) corectness; but then 2) speed.
Previously, pre-v2, the speed was not consideration. `v1.x` was freaking slow so I had to rewrite everything.

### Changed
- 🔧 Complete rewrite, now using trickling string algorithm instead of parsing and dealing with objects. Now all operations are done on a code treating it as a string. This is very important because now it is not possible that parser would throw an error — there are no parsers used!
- 🔧 Way stricter approach to cleanup after deletion. Previously unit tests were comparing minified _actual_ and _should-be_ versions of code. All minification was removed from unit tests. Now, whitespace issues are treated as bugs.
- 🔧 Now input argument string must be string. If it's not string, this package will `throw` and error.
- 🔧 Now input is strictly `string` - no more passing parsed trees via `opts.parsedTree`. The concept of this library is to avoid parsing and objects at all costs so as to keep this library as fast as possible.
- 🔧 The output of the package is not a single object, not an array. Both info and result HTML string are within one plain object. That's simpler.

### Removed
- 💥 `opts.noThrowing` because there's no parser any more, there's nothing to instruct not to throw to.
- 💥 `opts.parsedTree` because there's no renderer used and we can't bloat this library - it works without parsing/rendering!

## [1.17.0] - 2017-06-19
### Updated
- 🔧 All deps
- 🔧 Rebased some code

## [1.16.0] - 2017-03-03
### Tweaks
- 🔧 Small rebasing.
- 🔧 Updated dependencies and swapped some for better-suiting ones.

## [1.15.0] - 2017-03-01
### Tweaks
- 🔧 Latest (JS) Standard linter doesn't like expressions within AVA throw test blocks. Fixed that.

## [1.14.0] - 2017-02-20
### Tweaks
- 🔧 BitHound config tweak

## [1.13.0] - 2017-02-20
### Updated
- 🔧 Updated dependencies with intent to tighten up the empty AST tree element removal process. Practically this means, `email-remove-unused-css` doesn't remove empty ALT ~tags~ attributes form images any more. I created a new library, `ast-monkey` to solve this bug.

Apparently, it is difficult to traverse the AST tree both ways, particularly, to check, all particular AST node's parent nodes up until the top, root. `ast-monkey` [does that]() with the help of indexing the AST's.

## [1.12.0] - 2017-01-11
### Added
- ✨ If certain classes/id's were removed from `<head>` because they were "sandwiched" with non-existent-ones, like `.head-only` in `.head-only.real`, it's also added to the returned info object. Previously it was not. Mind you, in some cases, that "sandwiched" class/id can be present in few places in `<head>` styles, and removed not from everywhere. That means, info object's "removed" lists mention classes/id's that were deleted at least once, not necessary from everywhere.
- ✨ New tests to cover that.

### Improved
- ✨ Rebased all tests to include only two variables in assertions, so that AVA shows only two things if a test error occurs. Previosuly minification was within assertions and it stood in a way.
- ✨ Separated utility functions to prepend/append strings on array elements into a new JS file and added tests (99.xx.xx) for that. Test coverage is 100% now because of that.

## [1.8.0] - 2016-12-23
### Added
- ✨ Separated function nonEmpty() into a separate microlibrary.

## [1.7.0] - 2016-12-21
### Added
- ✨ Test coverage via Istanbul CLI.

## [1.6.0] - 2016-12-08
### Added
- ✨ You can bypass parsing and input the AST tree directly in `options.parsedTree` value. The return will be AST tree as well (instead of string).
- ✨ New test: 01.01.02.

## [1.5.0] - 2016-12-07

### Fixed
- 🔧 [Issue #3](https://github.com/codsen/email-remove-unused-css/issues/3). Thanks to Steven Vachon for flagging this. The root cause was I had set too loose barriers for the styles coming into the CSS renderer. When style tag had only media query and when both were meant to be deleted, CSS renderer _threw_ because of the empty content. I added some conditional checks and now to-be-deleted empty media queries bypass CSS renderer completely.

### Added
- ✨ New tests: 01.08, 01.09, 01.10, 01.11, 01.12, 01.13 to cover all the newly-discovered cases.

## [1.4.0] - 2016-11-28

### Added
✨ API change, or rather supplement. Adding all the styles from `body` and all the styles from `head` into the returned object.

It's necessary for upcoming front-end which will need to give option to move classes in and out of whitelist via GUI. Without all classes among the returned keys, it would be impossible to add to whitelist via GUI those classes that are not in yet.

## [1.3.0] - 2016-11-25

### Added

- ✨ New feature - Deleting empty media queries. If there are empty media query blocks (already supplied empty or empty because all the CSS inside of them were removed), they are deleted as well.

- ✨ Test 01.06 to prove it

- ✨ New feature - Style tags are recognised even when they are outside of `head` or `body` tags.

- ✨ Adding test 01.07 to prove it

---

## 1.2.0 - 2016-11-25

### Added

- ✨ New feature - false positives recognised. Adding a new feature, where a class/id might be present in both `head` and `body`, but all its occurencies in the `head` were sandwich'ed with classes/id's that didn't exist in `body`, and got deleted.

For example:

selector in HEAD:
.existing-in-body.non-existing-body

selector in BODY:
.existing-in-body

As such, both classes should be deleted, even though `.existing-in-body` is used in `head`.

- ✨ Adding test 01.03

[1.2.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.1.0...v1.2.0
[1.3.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.2.0...v1.3.0
[1.4.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.3.0...v1.4.0
[1.5.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.4.0...v1.5.0
[1.6.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.5.0...v1.6.0
[1.7.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.6.0...v1.7.0
[1.8.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.7.0...v1.8.0
[1.12.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.8.0...v1.12.0
[1.13.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.12.0...v1.13.0
[1.14.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.13.0...v1.14.0
[1.15.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.14.0...v1.15.0
[1.16.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.15.0...v1.16.0
[1.17.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.16.0...v1.17.0
[2.0.0]: https://github.com/codsen/email-remove-unused-css/compare/v1.17.0...v2.0.0
[2.1.0]: https://github.com/codsen/email-remove-unused-css/compare/v2.0.0...v2.1.0
[2.1.1]: https://github.com/codsen/email-remove-unused-css/compare/v2.1.0...v2.1.1
[2.2.0]: https://github.com/codsen/email-remove-unused-css/compare/v2.1.1...v2.2.0
[2.3.0]: https://github.com/codsen/email-remove-unused-css/compare/v2.2.0...v2.3.0
[2.4.0]: https://github.com/codsen/email-remove-unused-css/compare/v2.3.0...v2.4.0
[2.5.0]: https://github.com/codsen/email-remove-unused-css/compare/v2.4.0...v2.5.0
