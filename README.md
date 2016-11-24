# email-remove-unused-css

<a href="https://github.com/feross/standard" style="float: right; padding: 0 0 20px 20px;"><img src="https://cdn.rawgit.com/feross/standard/master/sticker.svg" alt="Standard JavaScript" width="100" align="right"></a>

> Remove unused CSS from styles in HTML head and/or inline

[![Build Status](https://travis-ci.org/code-and-send/email-remove-unused-css.svg?branch=master)](https://travis-ci.org/code-and-send/email-remove-unused-css) [![bitHound Overall Score](https://www.bithound.io/github/code-and-send/email-remove-unused-css/badges/score.svg)](https://www.bithound.io/github/code-and-send/email-remove-unused-css) [![bitHound Dependencies](https://www.bithound.io/github/code-and-send/email-remove-unused-css/badges/dependencies.svg)](https://www.bithound.io/github/code-and-send/email-remove-unused-css/master/dependencies/npm) [![bitHound Dev Dependencies](https://www.bithound.io/github/code-and-send/email-remove-unused-css/badges/devDependencies.svg)](https://www.bithound.io/github/code-and-send/email-remove-unused-css/master/dependencies/npm) [![Downloads/Month](https://img.shields.io/npm/dm/email-remove-unused-css.svg)](https://www.npmjs.com/package/email-remove-unused-css)

## Install

```bash
$ npm install --save email-remove-unused-css
```

## API

```js
emailRemoveUnusedCss (
  htmlContentsAsString,     // AST tree, or object or array or whatever. Can be deeply-nested
  {
    whitelist: ['.class-1', '#id-1', '.module-*'],   // classes/id's you want to whitelist
    noThrowing: false                                // should this lib throw when its parser throws?
  }
);
// => [
//      cleanedHtmlAsString,     << string of (likely amended) input code
//        {
//          deletedFromHead: [], << array of what was deleted from HEAD
//          deletedFromBody: []  << array of what was deleted from BODY
//        }
//    ]
```

The second argument, the settings object, is entirely optional.

### settings.whitelist

Since the main purpose of this library is to clean email HTML, it needs to cater for email code specifics. One of them is that CSS styles will contain fix or hack styles, meant for email software. For example, here are few of them:

```html
#outlook a{ padding:0;}
.ExternalClass, .ReadMsgBody{width:100%;}
.ExternalClass, .ExternalClass div, .ExternalClass font, .ExternalClass p, .ExternalClass span, .ExternalClass td{ line-height:100%;}
```

Obviously, you will not be using the above classes and id's in the `<body>` of your HTML code, what means it will get removed because it is present in `<head>` only.

To avoid that, pass the classes and id's to whitelist in a settings object, in a second argument:

```js
var html = '<!DOCTYPE html>...'
emailRemoveUnusedCss(html,
  {
    whitelist: ['#outlook', '.ExternalClass', '.ReadMsgBody']
  }
)
```

### settings.noThrowing

The parser used for HTML part is quite forgiving; it takes some creativity to make it throw an error. For example, tags can be missing, and it will try to fill in missing ones. But it will throw if it encounters, for example, `<html<html<html<html xmlns="http://www.w3.org/1999/xhtml">`.

The parser for CSS parts is very sensitive and will throw an error if it encounters even a missing curly brace.

When either parser throws an error, this library throws the same error. This might or might not be what you want. In latter case pass `{noThrowing = true}` and this library will kindly return a string `the input code has problems, please check it` and keep that dirty secret between us without _throwing_ (up)¹.

```js
var html = '<html<html<html<html xmlns="http://www.w3.org/1999/xhtml">'
emailRemoveUnusedCss(html,
  {
    noThrowing: true
  }
)
```

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

To make this library, I had to code up eleven other libraries (so far):

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

## Contributing & testing

All contributions welcome. This library uses [Standard JavaScript](https://github.com/feross/standard) notation. See `test.js`. It's using [AVA](https://github.com/avajs/ava).

```bash
npm test
```

If you see anything incorrect whatsoever, [raise an issue](https://github.com/code-and-send/email-remove-unused-css/issues), or even better, fork, fix it and file a pull request.

## Licence

MIT © [Roy Reveltas](https://github.com/revelt)

---

¹ Sorry I couldn't help it.
