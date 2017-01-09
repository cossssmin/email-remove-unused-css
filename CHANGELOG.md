# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.6.0] - 2016-12-08
### Added
- You can bypass parsing and input the AST tree directly in `options.parsedTree` value. The return will be AST tree as well (instead of string).
- New test: 01.01.02.

---

## [1.5.0] - 2016-12-07

### Fixed
- [Issue #3](https://github.com/code-and-send/email-remove-unused-css/issues/3). Thanks to Steven Vachon for flagging this. The root cause was I had set too loose barriers for the styles coming into the CSS renderer. When style tag had only media query and when both were meant to be deleted, CSS renderer _threw_ because of the empty content. I added some conditional checks and now to-be-deleted empty media queries bypass CSS renderer completely.

### Added
- New tests: 01.08, 01.09, 01.10, 01.11, 01.12, 01.13 to cover all the newly-discovered cases.

---

## [1.4.0] - 2016-11-28

### Added
API change, or rather supplement. Adding all the styles from `body` and all the styles from `head` into the returned object.

It's necessary for upcoming front-end which will need to give option to move classes in and out of whitelist via GUI. Without all classes among the returned keys, it would be impossible to add to whitelist via GUI those classes that are not in yet.

---

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


[1.6.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/code-and-send/email-remove-unused-css/compare/v1.1.0...v1.2.0
