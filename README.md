# email-remove-unused-css

<a href="https://github.com/feross/standard" style="float: right; padding: 0 0 20px 20px;"><img src="https://cdn.rawgit.com/feross/standard/master/sticker.svg" alt="Standard JavaScript" width="100" align="right"></a>

> Remove unused CSS from styles in HTML head and/or from body, inline

[![Build Status][travis-img]][travis-url]
[![bitHound Overall Score][overall-img]][overall-url]
[![bitHound Dependencies][deps-img]][deps-url]
[![bitHound Dev Dependencies][dev-img]][dev-url]
[![Downloads/Month][downloads-img]][downloads-url]

See plugin for [gulp](https://github.com/code-and-send/email-remove-unused-css/). Others are coming.

## Install

```bash
$ npm install --save email-remove-unused-css
```

## API

```js
emailRemoveUnusedCss(htmlContentsAsString, [options])
```

### API - Input

Input argument         | Type    | Obligatory? | Description
-----------------------|---------|-------------|--------------------
`htmlContentsAsString` | String  | yes^        | HTML code as string
options object         | Object  | no          | Any options, as a plain object, see below

^ If you are passing in parsed AST tree in options, you can put `null` (or whatever) as first argument, `htmlContentsAsString`. Your AST tree from options object will be used instead.

For example,

```js
var html = '<html>zzz</html><body class="class-1">zzz</body>'
var result = emailRemoveUnusedCss(
  html,
  {
    whitelist: ['.class-1', '#id-1', '.module-*'],
    noThrowing: false // you can omit in such case because it's false by default
  }
)
console.log('result = ' + JSON.stringify(result, null, 4))
```

### API - Input - Options object

Optionally, you can pass the options array:

Options object's key  | Type    | Example                            | Description
----------------------|---------|------------------------------------|-----------------
`whitelist`           | Array   | ['.class-1', '#id-1', '.module-*'] | List all classes or id's you want this library to ignore
`noThrowing`          | Boolean | true                               | Should this lib throw when its parser throws?
`parsedTree`          | Array   | it's too big to fit here           | Pass in raw, parsed AST tree, **it will override first argument, HTML as string**

### API - Output array

Position | Type         | Description
---------|--------------|---------------------------
`[0]`    | String|Array | Cleaned HTML as string OR when AST tree is passed in `options.parsedTree`, amended AST tree (array of objects and strings)
`[1]`    | Object       | Info object

### API - Output array - Info object

Info object's key | Type    | Description
------------------|---------|-----------------
`allInHead`       | Array   | Deduped array of all classes and id's in HEAD
`allInBody`       | Array   | Deduped array of all classes and id's in BODY
`deletedFromHead` | Array   | Array of what classes/id's were deleted from HEAD
`deletedFromBody` | Array   | Array of what classes/id's were deleted from BODY

## Input options.whitelist

Since the main purpose of this library is to clean **email** HTML, it needs to cater for email code specifics. One of them is that CSS styles will contain fix or hack styles, meant for email software. For example, here are few of them:

```html
#outlook a { padding:0; }
.ExternalClass, .ReadMsgBody { width:100%; }
.ExternalClass, .ExternalClass div, .ExternalClass font, .ExternalClass p, .ExternalClass span, .ExternalClass td { line-height:100%; }
```

Obviously, you will not be using the above classes and id's in the `<body>` of your HTML code, what means they would get removed — they are present in `<head>` only. To avoid that, pass the classes and id's in the _whitelist_ key's value, as an array, for example:

```js
var html = '<!DOCTYPE html>...'
emailRemoveUnusedCss(html,
  {
    whitelist: ['#outlook', '.ExternalClass', '.ReadMsgBody']
  }
)
```

You can also use a _glob_, for example in order to whitelist classes `module-1`, `module-2` ... `module-99`, `module-100`, you can simply whitelist them as `module-*`:

```js
var html = '<!DOCTYPE html>...'
emailRemoveUnusedCss(html,
  {
    whitelist: ['.module-*']
  }
)
// => all class names that begin with ".module-" will not be touched by this library.
```

## Input options.noThrowing

The parser used for HTML part is quite forgiving; it takes some creativity to make it throw an error. For example, tags can be missing, and it will try to fill in missing ones. But it will throw if it encounters, for example, `<html<html<html<html xmlns="http://www.w3.org/1999/xhtml">`.

The parser for CSS parts is very sensitive and will throw an error if it encounters even a missing curly brace.

When either of parsers throws an error, this library throws the same error. This might or might not be what you want. In latter case pass `{noThrowing = true}` and this library will kindly return a string `the input code has problems, please check it`, keeping that dirty secret between us without _throwing_.

```js
var html = '<html<html<html<html xmlns="http://www.w3.org/1999/xhtml">'
emailRemoveUnusedCss(html,
  {
    noThrowing: true
  }
)
```

## Removing unused CSS from web pages & competition

This library is meant to be used on any HTML where there are **no external stylesheets** and there is **no JavaScript** which could add or remove classes or id's dynamically.

It's quite rare to find a **web page** that would have no external stylesheets, but 100% of **email newsletters** are like that and this library suits them perfectly.

If you need more advanced CSS removal tools, check out [uncss](https://github.com/giakki/uncss) which runs a headless browser and is capable to parse external stylesheets. However, it's by magnitude slower and it's definitely an overkill for email HTML code.

## Use

```js
// require first:
var emailRemoveUnusedCss = require('email-remove-unused-css')
...
// then, for example, delete empty style tag from PostHTML AST object tree:
var newHTML = emailRemoveUnusedCss('<!DOCTYPE html><html lang="en"><head>...')
console.log(newHTML[0]) // remember result will come in an array's first element!
// second argument will contain object with information regarding this cleaning
```

## Dependencies

![Dependencies tree](http://i.imgur.com/kkiGzsZ.png)

This library is dependent on few other libraries:

* [array-pull-all-with-glob](https://github.com/code-and-send/array-pull-all-with-glob)
* [detect-is-it-html-or-xhtml](https://github.com/code-and-send/detect-is-it-html-or-xhtml)
* [posthtml-ast-delete-key](https://github.com/code-and-send/posthtml-ast-delete-key)
* [posthtml-ast-delete-object](https://github.com/code-and-send/posthtml-ast-delete-object)
* [posthtml-ast-get-object](https://github.com/code-and-send/posthtml-ast-get-object)
* [posthtml-ast-get-values-by-key](https://github.com/code-and-send/posthtml-ast-get-values-by-key)
* [posthtml-ast-is-empty](https://github.com/code-and-send/posthtml-ast-is-empty)
* [string-extract-class-names](https://github.com/code-and-send/string-extract-class-names)
* [posthtml-ast-loose-compare](https://github.com/code-and-send/posthtml-ast-loose-compare)
* [posthtml-ast-compare](https://github.com/code-and-send/posthtml-ast-compare)
* [posthtml-ast-contains-only-empty-space](https://github.com/code-and-send/posthtml-ast-contains-only-empty-space)

By the way, the libraries that have `posthtml` in their name are not PostHTML plugins, but rather libraries to work with [posthtml-parser](https://github.com/posthtml/posthtml-parser)-parsed abstract syntax trees (AST's). AST is a fancy word, basically it's an array full of nested arrays, plain objects and strings.

I chose PostHTML parser/renderer because I'm using PostHTML itself in daily client work.

## Testing

```bash
$ npm test
```

Unit tests use [AVA](https://github.com/avajs/ava) and [JS Standard](https://github.com/feross/standard) notation.

## Contributing

All contributions are welcome. Please stick to [Standard JavaScript](https://github.com/feross/standard) notation and supplement the `test.js` with new unit tests covering your feature(s).

If you see anything incorrect whatsoever, do [raise an issue](https://github.com/code-and-send/email-remove-unused-css/issues). If you file a pull request, I'll do my best to help you to get it merged in a timely manner. If you have any comments on the code, including ideas how to improve things, don't hesitate to contact me by email.

## Licence

> MIT License (MIT)

> Copyright (c) 2016 Code and Send Ltd, Roy Reveltas

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

[travis-img]: https://travis-ci.org/code-and-send/email-remove-unused-css.svg?branch=master
[travis-url]: https://travis-ci.org/code-and-send/email-remove-unused-css

[overall-img]: https://www.bithound.io/github/code-and-send/email-remove-unused-css/badges/score.svg
[overall-url]: https://www.bithound.io/github/code-and-send/email-remove-unused-css

[deps-img]: https://www.bithound.io/github/code-and-send/email-remove-unused-css/badges/dependencies.svg
[deps-url]: https://www.bithound.io/github/code-and-send/email-remove-unused-css/master/dependencies/npm

[dev-img]: https://www.bithound.io/github/code-and-send/email-remove-unused-css/badges/devDependencies.svg
[dev-url]: https://www.bithound.io/github/code-and-send/email-remove-unused-css/master/dependencies/npm

[downloads-img]: https://img.shields.io/npm/dm/email-remove-unused-css.svg
[downloads-url]: https://www.npmjs.com/package/email-remove-unused-css
