# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.12.0] - 2017-01-11
### Added
- If certain classes/id's were removed from `<head>` because they were "sandwiched" with non-existent-ones, like `.head-only` in `.head-only.real`, it's also added to the returned info object. Previously it was not. Mind you, in some cases, that "sandwiched" class/id can be present in few places in `<head>` styles, and removed not from everywhere. That means, info object's "removed" lists mention classes/id's that were deleted at least once, not necessary from everywhere.
- New tests to cover that.

### Improved
- Rebased all tests to include only two variables in assertions, so that AVA shows only two things if a test error occurs. Previosuly minification was within assertions and it stood in a way.
- Separated utility functions to prepend/append strings on array elements into a new JS file and added tests (99.xx.xx) for that. Test coverage is 100% now because of that.

## [1.8.0] - 2016-12-23
### Added
- Separated function nonEmpty() into a separate microlibrary.

## [1.7.0] - 2016-12-21
### Added
- Test coverage via Istanbul CLI.

## [1.6.0] - 2016-12-08
### Added
- You can bypass parsing and input the AST tree directly in `options.parsedTree` value. The return will be AST tree as well (instead of string).
- New test: 01.01.02.

## [1.5.0] - 2016-12-07

### Fixed
- [Issue #3](https://github.com/code-and-send/email-remove-unused-css/issues/3). Thanks to Steven Vachon for flagging this. The root cause was I had set too loose barriers for the styles coming into the CSS renderer. When style tag had only media query and when both were meant to be deleted, CSS renderer _threw_ because of the empty content. I added some conditional checks and now to-be-deleted empty media queries bypass CSS renderer completely.

### Added
- New tests: 01.08, 01.09, 01.10, 01.11, 01.12, 01.13 to cover all the newly-discovered cases.

## [1.4.0] - 2016-11-28

### Added
API change, or rather supplement. Adding all the styles from `body` and all the styles from `head` into the returned object.

It's necessary for upcoming front-end which will need to give option to move classes in and out of whitelist via GUI. Without all classes among the returned keys, it would be impossible to add to whitelist via GUI those classes that are not in yet.

## [1.3.0] - 2016-11-25

### Added

- New feature - Deleting empty media queries. If there are empty media query blocks (already supplied empty or empty because all the CSS inside of them were removed), they are deleted as well.

- Test 01.06 to prove it

- New feature - Style tags are recognised even when they are outside of `head` or `body` tags.

- Adding test 01.07 to prove it

---

## [1.2.0] - 2016-11-25

### Added

- New feature - false positives recognised. Adding a new feature, where a class/id might be present in both `head` and `body`, but all its occurencies in the `head` were sandwich'ed with classes/id's that didn't exist in `body`, and got deleted.

For example:

selector in HEAD:
.existing-in-body.non-existing-body

selector in BODY:
.existing-in-body

As such, both classes should be deleted, even though `.existing-in-body` is used in `head`.

- Adding test 01.03


[1.12.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.8.0...v1.12.0
[1.8.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.1.0...v1.2.0
