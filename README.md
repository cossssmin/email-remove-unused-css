# email-remove-unused-css

> Remove unused CSS from email templates

[![Link to npm page][npm-img]][npm-url]
[![Build Status][travis-img]][travis-url]
[![bitHound Overall Score][overall-img]][overall-url]
[![bitHound Dependencies][deps-img]][deps-url]
[![bitHound Dev Dependencies][dev-img]][dev-url]
[![Coverage Status][cov-img]][cov-url]
[![Known Vulnerabilities][vulnerabilities-img]][vulnerabilities-url]
[![Downloads/Month][downloads-img]][downloads-url]
[![View dependencies as 2D chart][deps2d-img]][deps2d-url]
[![Test in browser][runkit-img]][runkit-url]

* Online web app: [EmailComb](https://emailcomb.com)
* Gulp plugin: [gulp-email-remove-unused-css](https://github.com/codsen/gulp-email-remove-unused-css/)
* PostHTML plugin: [posthtml-email-remove-unused-css](https://github.com/codsen/posthtml-email-remove-unused-css/)

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Install](#install)
- [Idea - updated for v.2](#idea---updated-for-v2)
- [API - new in v.2](#api---new-in-v2)
  - [API - Input](#api---input)
  - [API - Input - Options object](#api---input---options-object)
  - [API - Output](#api---output)
- [Input options.whitelist](#input-optionswhitelist)
- [Removing unused CSS from web pages & competition](#removing-unused-css-from-web-pages--competition)
- [Contributing](#contributing)
- [Licence](#licence)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

```bash
$ npm install --save email-remove-unused-css
```

Transpiled code (ES5) is served.

## Idea - updated for v.2

This library removes unused CSS from HTML. It is aimed for email HTML, which means there are peculiarities compared to web HTML:

* email code is expected to have **back-end code**: proprietary ESP markup or whatever backend code is used to set up email campaign: Ruby, Java or others. This library has to play well with non-valid HTML. This means, it can't use **HTML parsing**.
* this library will cope with **dirty code** well. As long as your CSS stays within `<style>` tags and within `class=`/`id=` attributes, this library **will cope fine**. Missing `<html>`, unclosed `</table>` tags - no problemo! Use other tools to lint your code, but this library will not touch your HTML.
* Exceptions to _not-touching-the-HTML_ rule are areas (and vicinity) directly related to CSS removal. For example, if you have CSS within body: `class="    unused-class-1    used-class-2 "` `email-remove-unused-css` will output it as `class="used-class-2"`, removing the redundant space around. It just _aims_ not to touch your HTML, but _where it does_ touch it, it will produce squeaky clean HTML (leaving the rest as it is).
* Full support of `id` attributes (in `<head>`, in `<body>`, mixed with classes, within media queries, whatever) is needed with a whitelisting option. `email-remove-unused-css` does the class and id cleaning equally well.
* maximum speed is a requirement, and full-rewrite in the v.2 release is by magnitudes faster: it takes milliseconds to what previously took minutes. That's because all the job is done on the input string, **within three traversal loops**. There are no operations on objects or parsing.

## API - new in v.2

```js
emailRemoveUnusedCss(htmlContentsAsString, [options])
```

### API - Input

Input argument         | Type    | Obligatory? | Description
-----------------------|---------|-------------|--------------------
`htmlContentsAsString` | String  | yes         | HTML code as string
options object         | Object  | no          | Any options, as a plain object, see below

For example,

```js
var html = '<html>zzz</html><body class="class-1">zzz</body>'
var result = emailRemoveUnusedCss(
  html,
  {
    whitelist: ['.class-1', '#id-1', '.module-*']
  }
)
console.log('result = ' + JSON.stringify(result, null, 4))
```

### API - Input - Options object

Optionally, you can pass the options array:

Options object's key  | Type    | Example                            | Description
----------------------|---------|------------------------------------|-----------------
`whitelist`           | Array   | ['.class-1', '#id-1', '.module-*'] | List all classes or id's you want this library to ignore

### API - Output

Since v.2 a plain object is returned with keys:

Info object's key | Type    | Description
------------------|---------|-----------------
`result`          | String  | A string containing cleaned HTML
`allInHead`       | Array   | Deduped and sorted array of all classes and id's between `<head>` tags
`allInBody`       | Array   | Deduped and sorted array of all classes and id's between `<body>` tags
`deletedFromHead` | Array   | Array of classes/id's that were deleted inside `<head>` _at least once_^
`deletedFromBody` | Array   | Array of classes/id's that were deleted inside `<body>` _at least once_^

^ Some legit, used classes/id's might be "sandwiched" with unused-ones (like `.head-only.real-class`) and deleted in some `<style>` tags, but not in all. This is a rare case, added in [v1.12](https://github.com/codsen/email-remove-unused-css/releases/tag/v1.12.0).

## Input options.whitelist

Since the main purpose of this library is to clean **email** HTML, it needs to cater for email code specifics. One of them is that CSS styles will contain fix or hack styles, meant for email software. For example, here are few of them:

```html
#outlook a { padding:0; }
.ExternalClass, .ReadMsgBody { width:100%; }
.ExternalClass, .ExternalClass div, .ExternalClass font, .ExternalClass p, .ExternalClass span, .ExternalClass td { line-height:100%; }
```

Obviously, you will not be using the above classes, and id's in the `<body>` of your HTML code, what means they would get removed — they are present in `<head>` only. To avoid that, pass the classes and id's in the _whitelist_ key's value, as an array, for example:

```js
var html = '<!DOCTYPE html>...'
emailRemoveUnusedCss(html,
  {
    whitelist: ['#outlook', '.ExternalClass', '.ReadMsgBody']
  }
)
```

You can also use a _wildcard_, for example in order to whitelist classes `module-1`, `module-2` ... `module-99`, `module-100`, you can simply whitelist them as `module-*`:

```js
var html = '<!DOCTYPE html>...'
emailRemoveUnusedCss(html,
  {
    whitelist: ['.module-*']
  }
)
// => all class names that begin with ".module-" will not be touched by this library.
```

## Removing unused CSS from web pages & competition

This library is meant to be used on any HTML where there are **no external stylesheets** and there is **no JavaScript** which could add or remove classes or id's dynamically.

It's quite rare to find a **web page** that would have no external stylesheets, but 100% of **email newsletters** are like that and this library suits them perfectly.

## Contributing

If you see anything incorrect whatsoever, do [raise an issue](https://github.com/codsen/email-remove-unused-css/issues). If you file a pull request, I'll do my best to merge it quickly. If you have any comments on the code, including ideas how to improve something, don't hesitate to contact me by email.

If something doesn't work as you wished or you don't understand the inner workings of this library, _do raise an issue_. I'm happy to explain what's happening. Often some part of my README documentation is woolly, and I can't spot it myself. I need user feedback.

Also, if you miss a feature, request it by [raising](https://github.com/codsen/email-remove-unused-css/issues) an issue as well.

I know it never happens, but if you would ever forked it and worked on a new feature, before filing a pull request, please make sure code is following the rules set in `.eslintrc` and `npm run test` passes fine. It's basically an `airbnb-base` rules preset of `eslint` with few exceptions: 1. No semicolons. 2. Allow plus-plus in `for` loops. See `./eslintrc`.

I dropped JS Standard because it misses many useful ESLint rules and has been neglected by its maintainers, using a half-year-old version of ESLint.

Cheers!

## Licence

> MIT License (MIT)

> Copyright (c) 2017 Codsen Ltd, Roy Revelt

> Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[npm-img]: https://img.shields.io/npm/v/email-remove-unused-css.svg
[npm-url]: https://www.npmjs.com/package/email-remove-unused-css

[travis-img]: https://travis-ci.org/codsen/email-remove-unused-css.svg?branch=master
[travis-url]: https://travis-ci.org/codsen/email-remove-unused-css

[cov-img]: https://coveralls.io/repos/github/codsen/email-remove-unused-css/badge.svg?branch=master
[cov-url]: https://coveralls.io/github/codsen/email-remove-unused-css?branch=master

[overall-img]: https://www.bithound.io/github/codsen/email-remove-unused-css/badges/score.svg
[overall-url]: https://www.bithound.io/github/codsen/email-remove-unused-css

[deps-img]: https://www.bithound.io/github/codsen/email-remove-unused-css/badges/dependencies.svg
[deps-url]: https://www.bithound.io/github/codsen/email-remove-unused-css/master/dependencies/npm

[dev-img]: https://www.bithound.io/github/codsen/email-remove-unused-css/badges/devDependencies.svg
[dev-url]: https://www.bithound.io/github/codsen/email-remove-unused-css/master/dependencies/npm

[downloads-img]: https://img.shields.io/npm/dm/email-remove-unused-css.svg
[downloads-url]: https://www.npmjs.com/package/email-remove-unused-css

[vulnerabilities-img]: https://snyk.io/test/github/codsen/email-remove-unused-css/badge.svg
[vulnerabilities-url]: https://snyk.io/test/github/codsen/email-remove-unused-css

[deps2d-img]: https://img.shields.io/badge/deps%20in%202D-see_here-08f0fd.svg
[deps2d-url]: http://npm.anvaka.com/#/view/2d/email-remove-unused-css

[runkit-img]: https://img.shields.io/badge/runkit-test_in_browser-a853ff.svg
[runkit-url]: https://npm.runkit.com/email-remove-unused-css
