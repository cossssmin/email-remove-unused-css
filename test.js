/* eslint-disable no-multi-str */
'use strict'
var remove = require('./index.js')
var util = require('./util.js')
var min = require('html-minifier').minify
var parser = require('posthtml-parser')
var render = require('posthtml-render')
import test from 'ava'
var actual, intended

function minify (inp) {
  return min(inp, {collapseWhitespace: true, minifyCSS: true})
}

// ==============================
// testing basic class/id removal
// ==============================

test('01.01 - removes classes and id\'s from HTML5 (normal input)', t => {
  actual = minify(
    remove('\
<!DOCTYPE html>\
<html lang="en">\
<head>\
<meta charset="UTF-8">\
<title>Dummy HTML</title>\
<style type="text/css">\
  .real-class-1:active, #head-only-id1[whatnot], whatever[lang|en]{width:100% !important;}\
  #real-id-1:hover{width:100% !important;}\
</style>\
</head>\
<body>\
<table id="real-id-1 body-only-id-1" class="body-only-class-1" width="100%" border="0" cellpadding="0" cellspacing="0">\
  <tr>\
    <td>\
      <table width="100%" border="0" cellpadding="0" cellspacing="0">\
        <tr id="body-only-id-4">\
          <td id="body-only-id-2 body-only-id-3" class="real-class-1 body-only-class-2">\
            Dummy content.\
          </td>\
        </tr>\
      </table>\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
    )[0]
  )
  intended = minify(
'\
<!DOCTYPE html>\
<html lang="en">\
<head>\
<meta charset="UTF-8">\
<title>Dummy HTML</title>\
<style type="text/css">\
  .real-class-1:active, whatever[lang|en]{width:100% !important;}\
  #real-id-1:hover{width:100% !important;}\
</style>\
</head>\
<body>\
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">\
  <tr>\
    <td>\
      <table width="100%" border="0" cellpadding="0" cellspacing="0">\
        <tr>\
          <td class="real-class-1">\
            Dummy content.\
          </td>\
        </tr>\
      </table>\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
  )

  t.is(
    actual,
    intended,
    '01.01'
  )
})

test('01.02 - removes classes and id\'s from HTML5 (input as RAW AST)', t => {
  actual = parser(minify(render(remove(
    null,
    {
      parsedTree: parser('\
<!DOCTYPE html>\
<html lang="en">\
<head>\
  <meta charset="UTF-8">\
  <title>Dummy HTML</title>\
  <style type="text/css">\
    .real-class-1:active, #head-only-id1[whatnot], whatever[lang|en]{width:100% !important;}\
    #real-id-1:hover{width:100% !important;}\
  </style>\
</head>\
<body>\
  <table id="real-id-1 body-only-id-1" class="body-only-class-1" width="100%" border="0" cellpadding="0" cellspacing="0">\
    <tr>\
      <td>\
        <table width="100%" border="0" cellpadding="0" cellspacing="0">\
          <tr id="body-only-id-4">\
            <td id="body-only-id-2 body-only-id-3" class="real-class-1 body-only-class-2">\
              Dummy content.\
            </td>\
          </tr>\
        </table>\
      </td>\
    </tr>\
  </table>\
</body>\
</html>\
')
    }
  )[0]
)))
  intended = parser(
    minify('\
  <!DOCTYPE html>\
  <html lang="en">\
  <head>\
    <meta charset="UTF-8">\
    <title>Dummy HTML</title>\
    <style type="text/css">\
      .real-class-1:active, whatever[lang|en]{width:100% !important;}\
      #real-id-1:hover{width:100% !important;}\
    </style>\
  </head>\
  <body>\
    <table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">\
      <tr>\
        <td>\
          <table width="100%" border="0" cellpadding="0" cellspacing="0">\
            <tr>\
              <td class="real-class-1">\
                Dummy content.\
              </td>\
            </tr>\
          </table>\
        </td>\
      </tr>\
    </table>\
  </body>\
  </html>\
  ')
)

  t.deepEqual(
    actual,
    intended,
    '01.02'
  )
})

test('01.03 - deletes blank class/id attrs and empty because of deletion', t => {
  actual = minify(
    remove('\
<!DOCTYPE html>\
<html lang="en">\
  <head>\
    <meta charset="UTF-8">\
      <title>Dummy HTML</title>\
      <style type="text/css">\
      #real-id-1:hover{width:100% !important;}\
      .real-class-1:hover{width:100% !important;}\
    </style>\
  </head>\
  <body>\
    <table id="body-only-id-1 body-only-id-2" class="body-only-class-1 body-only-class-2" width="100%" border="0" cellpadding="0" cellspacing="0">\
      <tr>\
        <td id="" class="">\
          <table width="100%" border="0" cellpadding="0" cellspacing="0">\
            <tr id="real-id-1" class="real-class-1">\
              <td>\
                Dummy content.\
              </td>\
            </tr>\
          </table>\
        </td>\
      </tr>\
    </table>\
  </body>\
</html>\
'
  )[0]
  )
  intended = minify(
'\
<!DOCTYPE html>\
<html lang="en">\
  <head>\
    <meta charset="UTF-8">\
      <title>Dummy HTML</title>\
      <style type="text/css">\
      #real-id-1:hover{width:100% !important;}\
      .real-class-1:hover{width:100% !important;}\
    </style>\
  </head>\
  <body>\
    <table width="100%" border="0" cellpadding="0" cellspacing="0">\
      <tr>\
        <td>\
          <table width="100%" border="0" cellpadding="0" cellspacing="0">\
            <tr id="real-id-1" class="real-class-1">\
              <td>\
                Dummy content.\
              </td>\
            </tr>\
          </table>\
        </td>\
      </tr>\
    </table>\
  </body>\
</html>\
'
)

  t.is(
    actual,
    intended,
    '01.03'

  )
})

test('01.04 - class present in both head and body, but head has it joined with nonexistent class', t => {
  actual = minify(
    remove('\
<!DOCTYPE html>\
<html lang="en">\
<head>\
<style type="text/css">\
  .real-class-1#head-only-class-1, #head-only-class-2.real-class-1[lang|en]{width:100% !important;}\
</style>\
</head>\
<body>\
<table class="real-class-1" width="100%" border="0" cellpadding="0" cellspacing="0">\
  <tr>\
    <td class="real-class-1">\
      <img src="spacer.gif">\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
    )[0]
  )
  intended = minify(
'\
<!DOCTYPE html>\
<html lang="en">\
<head>\
</head>\
<body>\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
  <tr>\
    <td>\
      <img src="spacer.gif">\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
  )

  t.is(
    actual,
    intended,
    '01.04'
  )
})

test('01.05 - multiple style tags recognised and transformed', t => {
  actual = minify(
    remove('\
<!DOCTYPE html>\
<html lang="en">\
<head>\
<style type="text/css">\
  .real-class-1#head-only-class-1[lang|en]{width:100% !important;}\
  #real-id-1.head-only-class-1:hover{display: block !important;}\
  .head-only-class-2[lang|en]{width: 100% !important;}\
  #real-id-1{font-size: 10px !important;}\
</style>\
<title>zzzz</title>\
<style type="text/css">\
  .real-class-1#head-only-class-1[lang|en]{width:100% !important;}\
  #real-id-1.head-only-class-1:hover{display: block !important;}\
  .head-only-class-3[lang|en]{width: 100% !important;}\
  div .real-class-1 a:hover {width: 50%;}\
</style>\
</head>\
<body>\
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">\
  <tr>\
    <td class="real-class-1">\
      <img src="spacer.gif">\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
    )[0]
  )
  intended = minify(
'\
<!DOCTYPE html>\
<html lang="en">\
<head>\
<style type="text/css">\
  #real-id-1{font-size: 10px !important;}\
</style>\
<title>zzzz</title>\
<style type="text/css">\
  div .real-class-1 a:hover {width: 50%;}\
</style>\
</head>\
<body>\
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">\
  <tr>\
    <td class="real-class-1">\
      <img src="spacer.gif">\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
  )

  t.is(
    actual,
    intended,
    '01.05'
  )
})

test('01.06 - multiple levels of media queries cleaned', t => {
  actual = minify(
    remove('\
<!DOCTYPE html>\
<head>\
<style type="text/css">\
  @media (max-width: 600px) {\
    .real-class-1#head-only-class-1[lang|en]{width:100% !important;}\
    #real-id-1.head-only-class-1:hover{display: block !important;}\
    .head-only-class-2[lang|en]{width: 100% !important;}\
    @media (max-width: 200px) {\
      #real-id-1{font-size: 10px !important;}\
    }\
    @media (max-width: 100px) {\
      .head-only-class-1{font-size: 10px !important;}\
    }\
  }\
</style>\
<title>zzzz</title>\
<style type="text/css">\
  .real-class-1#head-only-class-1[lang|en]{width:100% !important;}\
  #real-id-1.head-only-class-1:hover{display: block !important;}\
  .head-only-class-3[lang|en]{width: 100% !important;}\
  div .real-class-1 a:hover {width: 50%;}\
</style>\
</head>\
<body>\
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">\
  <tr>\
    <td class="real-class-1">\
      <img src="spacer.gif">\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
    )[0]
  )
  intended = minify(
'\
<!DOCTYPE html>\
<head>\
<style type="text/css">\
  @media (max-width: 600px) {\
    @media (max-width: 200px) {\
      #real-id-1{font-size: 10px !important;}\
    }\
  }\
</style>\
<title>zzzz</title>\
<style type="text/css">\
  div .real-class-1 a:hover {width: 50%;}\
</style>\
</head>\
<body>\
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">\
  <tr>\
    <td class="real-class-1">\
      <img src="spacer.gif">\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
  )

  t.is(
    actual,
    intended,
    '01.06'
  )
})

test('01.07 - empty media queries removed', t => {
  actual = minify(
    remove('\
<!DOCTYPE html>\
<head>\
<style type="text/css">\
  @media (max-width: 600px) {\
    @media (max-width: 200px) {\
      .head-only-class-1{font-size: 10px !important;}\
    }\
    @media (max-width: 100px) {\
      .head-only-class-2{font-size: 10px !important;}\
    }\
  }\
</style>\
<title>zzzz</title>\
<style type="text/css">\
@media (max-width: 600px) {\
  @media (max-width: 200px) {\
    .head-only-class-3{font-size: 10px !important;}\
  }\
  @media (max-width: 100px) {\
    .head-only-class-4{font-size: 10px !important;}\
  }\
}\
</style>\
</head>\
<body>\
<table id="">\
  <tr>\
    <td class="">\
      <img src="spacer.gif">\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
    )[0]
  )
  intended = minify(
'\
<!DOCTYPE html>\
<head>\
<title>zzzz</title>\
</head>\
<body>\
<table>\
  <tr>\
    <td>\
      <img src="spacer.gif">\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
  )

  t.is(
    actual,
    intended,
    '01.07'
  )
})

test('01.08 - style tags are outside HEAD', t => {
  actual = minify(
    remove('\
<!DOCTYPE html>\
<style type="text/css">\
@media (max-width: 600px) {\
@media (max-width: 200px) {\
  .head-only-class-1{font-size: 10px !important;}\
}\
@media (max-width: 100px) {\
  .head-only-class-2{font-size: 10px !important;}\
}\
}\
</style>\
<head>\
<title>zzzz</title>\
</head>\
<body>\
<style type="text/css">\
@media (max-width: 600px) {\
@media (max-width: 200px) {\
  .head-only-class-3{font-size: 10px !important;}\
}\
@media (max-width: 100px) {\
  .head-only-class-4{font-size: 10px !important;}\
}\
}\
</style>\
<table id="">\
  <tr>\
    <td class="">\
      <img src="spacer.gif">\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
    )[0]
  )
  intended = minify(
'\
<!DOCTYPE html>\
<head>\
<title>zzzz</title>\
</head>\
<body>\
<table>\
  <tr>\
    <td>\
      <img src="spacer.gif">\
    </td>\
  </tr>\
</table>\
</body>\
</html>\
'
  )

  t.is(
    actual,
    intended,
    '01.08'
  )
})

// GitHub issue #3
// https://github.com/code-and-send/email-remove-unused-css/issues/3
test('01.09 - removes media query together with the whole style tag #1', t => {
  actual = minify(
    remove(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
<style>\
@media screen {\
._text-color.black {\
  color:  black;\
}\
}\
</style></head>\
<body>\
</body>\
</html>'
    )[0]
  )
  intended = minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>'
  )

  t.is(
    actual,
    intended,
    '01.09'
  )
})

test('01.10 - removes media query together with the whole style tag #2', t => {
  actual = minify(
    remove(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
<style>\
@media screen {\
._text-color.black {\
  color:  black;\
}\
}\
</style></head>\
<body class="_text-color  black">\
zzz\
</body>\
</html>'
    )[0]
  )
  intended = minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
<style>\
@media screen {\
._text-color.black {\
  color:  black;\
}\
}\
</style></head>\
<body class="_text-color  black">\
zzz\
</body>\
</html>'
  )

  t.is(
    actual,
    intended,
    '01.10'
  )
})

test('01.11 - removes three media queries together with the style tags', t => {
  actual = minify(
    remove(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<style>\
@media screen {\
#_something-here#green {\
  color:  green;\
  display: block;\
}\
}\
</style>\
<meta name="viewport" content="width=device-width">\
<style>\
@media screen {\
._something-else.red {\
  color:  red;\
}\
}\
</style>\
<title>test</title>\
<style>\
@media screen {\
._text-color.black {\
  color:  black;\
}\
}\
</style></head>\
<body class="black">\
</body>\
</html>'
    )[0]
  )
  intended = minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>'
  )

  t.is(
    actual,
    intended,
    '01.11'
  )
})

test('01.12 - removes last styles together with the whole style tag', t => {
  actual = minify(
    remove(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
<style>\
._text-color.black {\
color:  black;\
}\
</style></head>\
<body>\
</body>\
</html>'
    )[0]
  )
  intended = minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>'
  )

  t.is(
    actual,
    intended,
    '01.12'
  )
})

test('01.13 - media query with asterisk', t => {
  actual = minify(
    remove(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
<style>\
@media * {\
  ._text-color.black {\
    color:  black;\
  }\
}\
</style>\
</head>\
<body>\
</body>\
</html>'
    )[0]
  )
  intended = minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>'
  )

  t.is(
    actual,
    intended,
    '01.13'
  )
})

test('01.14 - complex media query #1', t => {
  actual = minify(
    remove(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
<style>\
@media tv and (min-width: 700px) and (orientation: landscape) {\
  .text-color.black {\
    color:  black;\
  }\
}\
</style>\
</head>\
<body class="black">\
</body>\
</html>'
    )[0]
  )
  intended = minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>'
  )

  t.is(
    actual,
    intended,
    '01.14'
  )
})

test('01.15 - complex media query #2', t => {
  actual = minify(
    remove(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
<style>\
@media (min-width: 700px), handheld and (orientation: landscape) {\
  ._text-color.black {\
    color:  black;\
  }\
}\
</style>\
</head>\
<body class="black">\
</body>\
</html>'
    )[0]
  )
  intended = minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>'
  )

  t.is(
    actual,
    intended,
    '01.15'
  )
})

// ==============================
// 2. HTML/XHTML issues
// ==============================

test('02.01 - nothing to remove, one img tag', t => {
  actual = minify(
    remove('<img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>'
    )[0]
  )
  intended = minify(
'<img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>'
  )

  t.is(
    actual,
    intended,
    '02.01'
  )
})

test('02.02 - nothing to remove, few single tags', t => {
  actual = minify(
    remove('<br><hr><meta>'
    )[0]
  )
  intended = minify(
    '<br><hr><meta>'
  )

  t.is(
    actual,
    intended,
    '02.02.01'
  )

// ----------------

  actual = minify(
    remove('<br/><hr/><meta/>'
    )[0]
  )
  intended = minify(
    '<br/><hr/><meta/>'
  )

  t.is(
    actual,
    intended,
    '02.02.02'
  )

// ----------------

  actual = minify(
    remove('<br><hr/><meta/>'
    )[0]
  )
  intended = minify(
    '<br/><hr/><meta/>'
  )

  t.is(
    actual,
    intended,
    '02.02.03'
  )

// ----------------

  actual = minify(
    remove('<br><hr/><meta>'
    )[0]
  )
  intended = minify(
    '<br><hr><meta>'
  )

  t.is(
    actual,
    intended,
    '02.02.04'
  )
})

test('02.03 - nothing to remove, respects XHTML images within', t => {
  actual = minify(
    remove('\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
<title>Tile</title>\
</head>\
<body>\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
    )[0]
  )
  intended = minify('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
<title>Tile</title>\
</head>\
<body>\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
  )

  t.is(
    actual,
    intended,
    '02.03'
  )
})

test('02.04 - fixes the IMG, HR, BR and META tags to be closed because of doctype', t => {
  actual = minify(
    remove('\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
<title>Tile</title>\
</head>\
<body>\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">\
    <br><br>\
    <hr>\
    <br><br>\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
    )[0]
  )
  intended = minify(
'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>\
<title>Tile</title>\
</head>\
<body>\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>\
    <br/><br/>\
    <hr/>\
    <br/><br/>\
  </td>\
</tr>\
</table>\
</body>\
</html>'
  )

  t.is(
    actual,
    intended,
    '02.04'
  )
})

test('02.05 - doesn\'t fix the IMG, HR, BR and META tags because of doctype', t => {
  actual = minify(
    remove('\
<!DOCTYPE html>\
<html>\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
<title>Tile</title>\
</head>\
<body>\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">\
    <br><br>\
    <hr>\
    <br><br>\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
    )[0]
  )
  intended = minify(
'<!DOCTYPE html>\
<html>\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>\
<title>Tile</title>\
</head>\
<body>\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>\
    <br/><br/>\
    <hr/>\
    <br/><br/>\
  </td>\
</tr>\
</table>\
</body>\
</html>'
  )

  t.is(
    actual,
    intended,
    '02.05'
  )
})

// ==============================
// 3. Parser patches up dirty HTML
// ==============================

test('03.01 - missing closing TD, TR, TABLE tags restored by parser', t => {
  actual = minify(
    remove('\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    some text\
'
    )[0]
  )
  intended = minify(
'<table width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    some text\
  </td>\
</tr>\
</table>'
  )

  t.is(
    actual,
    intended,
    '03.01'
  )
})

test('03.02 - missing TD, TR, TABLE, BODY and HTML closing tags restored by parser', t => {
  actual = minify(
    remove('\
<html>\
<body>\
  <table width="100%" border="0" cellpadding="0" cellspacing="0">\
    <tr>\
      <td>\
        some text\
'
    )[0]
  )
  intended = minify('\
<html>\
<body>\
  <table width="100%" border="0" cellpadding="0" cellspacing="0">\
    <tr>\
      <td>\
        some text\
      </td>\
    </tr>\
  </table>\
</body>\
</html>'
  )

  t.is(
    actual,
    intended,
    '03.02'
  )
})

// ==============================
// 4. Emoji content
// ==============================

test('04.01 - doesn\'t affect emoji characters within the code', t => {
  actual = minify(
    remove('<td>🦄</td>')[0]
  )
  intended = minify('<td>🦄</td>')

  t.is(
    actual,
    intended,
    '04.01'
  )
})

test('04.02 - doesn\'t affect emoji characters within the attribute names', t => {
  actual = minify(
    remove('<td data-emoji="🦄">emoji</td>')[0]
  )
  intended = minify('<td data-emoji="🦄">emoji</td>')

  t.is(
    actual,
    intended,
    '04.02'
  )
})

// ==============================
// 5. Missing/wrong input args
// ==============================

test('05.01 - all missing args', t => {
  t.is(
    remove(),
    undefined,
    '05.01')
})

test('05.02 - Boolean input', t => {
  t.is(
    remove(true),
    true,
    '05.02')
})

test('05.03 - null input', t => {
  t.is(
    remove(null),
    null,
    '05.03')
})

test('05.04 - plain object input', t => {
  t.deepEqual(
    remove({a: 'b'}),
    {a: 'b'},
    '05.04')
})

// ==============================
// 6. Output info object
// ==============================

test('06.01 - returned correct info object, head content + missing HTML end', t => {
  actual = remove('\
<!DOCTYPE html>\
<html>\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
<title>Tile</title>\
<style type="text/css">\
  div.non-existent-class{display: block;}\
  table#other div#non-existent-id{width:100%; display: inline-block;}\
</style>\
</head>\
<body>\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">\
    <br><br>\
    <hr>\
    <br><br>\
  ')[1].deletedFromHead

  intended = ['.non-existent-class', '#other', '#non-existent-id']

  t.deepEqual(
    actual,
    intended,
    '06.01'
  )
})

test('06.02 - returned correct info object, body content + missing opening TR', t => {
  actual = remove('\
<!DOCTYPE html>\
<html>\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
<title>Tile</title>\
<style type="text/css">\
  div.non-existent-class{display: block;}\
  table#other div#non-existent-id{width:100%; display: inline-block;}\
</style>\
</head>\
<body>\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
  <td>\
    <img class="unused1 unused2" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">\
    <br><br>\
    <hr class="unused3">\
    <br><br id="unused4">\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
  )[1].deletedFromBody

  intended = ['.unused1', '.unused2', '.unused3', '#unused4']

  t.deepEqual(
    actual,
    intended,
    '06.02'
  )
})

test('06.03 - returns array of all classes, without whitelisting them', t => {
  actual = remove('\
<!DOCTYPE html>\
<html>\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
<title>Tile</title>\
<style type="text/css">\
  div.non-existent-class{display: block;}\
  table#other div#non-existent-id{width:100%; display: inline-block;}\
</style>\
</head>\
<body>\
<table class="body-only-class-1 body-only-class-2" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">\
    <br><br>\
    <hr>\
    <br><br>\
',
    {
      whitelist: ['.non-existent-*', '#other*', '#non-existent-*', '.body-only-*']
    }
  )[1].allInHead

  intended = ['.non-existent-class', '#other', '#non-existent-id']

  t.deepEqual(
    actual,
    intended,
    '06.03.01')

// ----------------

  actual = remove('\
<!DOCTYPE html>\
<html>\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
<title>Tile</title>\
<style type="text/css">\
  div.non-existent-class{display: block;}\
  table#other div#non-existent-id{width:100%; display: inline-block;}\
</style>\
</head>\
<body>\
<table class="body-only-class-1 body-only-class-2" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">\
    <br><br>\
    <hr>\
    <br><br>\
',
    {
      whitelist: ['.non-existent-*', '#other*', '#non-existent-*', '.body-only-*']
    }
  )[1].allInBody

  intended = ['.body-only-class-1', '.body-only-class-2']

  t.deepEqual(
    actual,
    intended,
    '06.03.02'
  )
})

test('06.04 - correct classes reported in info/deletedFromBody', t => {
  actual = remove('\
<!DOCTYPE html>\
<html>\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
<title>Tile</title>\
<style type="text/css">\
  .unused.used {display: block;}\
</style>\
</head>\
<body>\
<table class="used" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    Text\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
  )[1].deletedFromBody

  intended = ['.used']

  t.deepEqual(
    actual,
    intended,
    '06.04'
  )
})

test('06.05 - correct classes reported in info/deletedFromHead', t => {
  actual = remove('\
<!DOCTYPE html>\
<html>\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
<title>Tile</title>\
<style type="text/css">\
  .unused.used {display: block;}\
</style>\
</head>\
<body>\
<table class="used" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td>\
    Text\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
  )[1].deletedFromHead

  intended = ['.unused', '.used']

  t.deepEqual(
    actual,
    intended,
    '06.05'
  )
})

test('06.06 - correct id\'s reported in info/deletedFromHead', t => {
  actual = remove('\
<!DOCTYPE html>\
<html>\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
<title>Tile</title>\
<style type="text/css">\
  .unused-class.used-class {display: block;}\
  .unused-class#used-id {display: block;}\
  #unused-id#used-id {display: block;}\
</style>\
</head>\
<body>\
<table class="used-class" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr>\
  <td id="used-id">\
    Text\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
  )[1].deletedFromHead

  intended = ['.unused-class', '#unused-id', '.used-class', '#used-id']

  t.deepEqual(
    actual,
    intended,
    '06.06'
  )
})

// ==============================
// 7. Whitelist
// ==============================

test('07.01 - nothing removed because of settings.whitelist', t => {
  actual = minify(
    remove('\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
<title>Tile</title>\
<style type="text/css">\
  .module-1{display: none !important;}\
  .module-2{display: none !important;}\
  .module-3{display: none !important;}\
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}\
  .particular{width: 100% !important;}\
</style>\
</head>\
<body>\
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr class="module-93">\
  <td class="module-94 module-lkfjgldhglktjja">\
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />\
  </td>\
</tr>\
</table>\
</body>\
</html>\
    ',
      {
        whitelist: ['.module-*', '.particular']
      }
    )[0]
  )

  intended = minify('\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
<title>Tile</title>\
<style type="text/css">\
  .module-1{display: none !important;}\
  .module-2{display: none !important;}\
  .module-3{display: none !important;}\
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}\
  .particular{width: 100% !important;}\
</style>\
</head>\
<body>\
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr class="module-93">\
  <td class="module-94 module-lkfjgldhglktjja">\
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
  )

  t.is(
    actual,
    intended,
    '07.01'
  )
})

test('07.02 - some removed, some whitelisted', t => {
  actual = minify(
    remove('\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
<title>Tile</title>\
<style type="text/css">\
  .module-1{display: none !important;}\
  .module-2{display: none !important;}\
  .module-3{display: none !important;}\
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}\
  .head-only-class-1 a.module-94:hover{width: 100% !important;}\
  #head-only-id-1[lang|en]{width: 100% !important;}\
</style>\
</head>\
<body>\
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr class="module-93 body-only-class-1">\
  <td id="body-only-id-1" class="module-94 module-lkfjgldhglktjja">\
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />\
  </td>\
</tr>\
</table>\
</body>\
</html>\
    ',
      {
        whitelist: ['.module-*', '.particular']
      }
    )[0]
  )
  intended = minify('\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
<title>Tile</title>\
<style type="text/css">\
  .module-1{display: none !important;}\
  .module-2{display: none !important;}\
  .module-3{display: none !important;}\
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}\
</style>\
</head>\
<body>\
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr class="module-93">\
  <td class="module-94 module-lkfjgldhglktjja">\
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
  )

  t.is(
    actual,
    intended,
    '07.02'
  )
})

test('07.03 - case of whitelisting everything', t => {
  actual = minify(
    remove('\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
<title>Tile</title>\
<style type="text/css">\
  .module-1{display: none !important;}\
  .module-2{display: none !important;}\
  .module-3{display: none !important;}\
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}\
  .head-only-class-1 a.module-94:hover{width: 100% !important;}\
  #head-only-id-1[lang|en]{width: 100% !important;}\
</style>\
</head>\
<body>\
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr class="module-93 body-only-class-1">\
  <td id="body-only-id-1" class="module-94 module-lkfjgldhglktjja">\
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />\
  </td>\
</tr>\
</table>\
</body>\
</html>\
    ',
      {
        whitelist: ['*']
      }
    )[0]
  )
  intended = minify('\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
<title>Tile</title>\
<style type="text/css">\
  .module-1{display: none !important;}\
  .module-2{display: none !important;}\
  .module-3{display: none !important;}\
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}\
  .head-only-class-1 a.module-94:hover{width: 100% !important;}\
  #head-only-id-1[lang|en]{width: 100% !important;}\
</style>\
</head>\
<body>\
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr class="module-93 body-only-class-1">\
  <td id="body-only-id-1" class="module-94 module-lkfjgldhglktjja">\
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />\
  </td>\
</tr>\
</table>\
</body>\
</html>\
'
  )

  t.is(
    actual,
    intended,
    '07.03'
  )
})

// ==============================
// 8. Make the parser throw and test that. Test both HTML and CSS parse throwing separately of course.
// ==============================

test('08.01 - CSS parsing throws - default behaviour', t => {
  t.throws(function () {
    remove('\
      <html xmlns="http://www.w3.org/1999/xhtml">\
      <head>\
        <style type="text/css">\
          .module-1{display: none !important;\
        </style>\
      </head>\
      </html>\
    ')[0]
  })
})

test('08.02 - suppressing CSS throwing by settings.noThrowing = true', t => {
  actual = minify(
    remove('\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />\
<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
<title>Tile</title>\
<style type="text/css">\
  .module-1{{{{{{{{\
</style>\
</head>\
<body>\
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">\
<tr class="module-93 body-only-class-1">\
  <td id="body-only-id-1" class="module-94 module-lkfjgldhglktjja">\
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />\
  </td>\
</tr>\
</table>\
</body>\
</html>\
    ',
      {
        noThrowing: true
      }
    )[0]
  )

  t.is(
    actual,
    'the input code has problems, please check it',
    '08.02'
  )
})

test('08.03 - HTML parsing throws - default behaviour', t => {
  t.throws(function () {
    remove('\
      <html<html<html<html xmlns="http://www.w3.org/1999/xhtml">\
      <head>\
        <style type="text/css">\
          .module-1{display: none !important;\
        </style>\
      </head>\
      </html>\
    ')[0]
  })
})

test('08.04 - suppressing HTML throwing by settings.noThrowing = true', t => {
  actual = minify(
    remove('\
<html<html<html<html xmlns="http://www.w3.org/1999/xhtml">\
<head>\
<style type="text/css">\
  .module-1{display: none !important;\
</style>\
</head>\
</html>\
    ',
      {
        noThrowing: true
      }
    )[0]
  )

  t.is(
    actual,
    'the input code has problems, please check it',
    '08.04'
  )
})

// ==============================

// Utility tests

// --- prependToEachElIfMissing

test('99.01 - UTIL/prepend: prepends on missing', t => {
  t.deepEqual(
    util.prependToEachElIfMissing(['x', 'yy', 'zzz'], '_'),
    ['_x', '_yy', '_zzz'],
    '99.01'
  )
})

test('99.02 - UTIL/prepend: doesn\'t prepend because all are present', t => {
  t.deepEqual(
    util.prependToEachElIfMissing(['_x', '_yy', '_zzz'], '_'),
    ['_x', '_yy', '_zzz'],
    '99.02'
  )
})

test('99.03 - UTIL/prepend: prepends on some', t => {
  t.deepEqual(
    util.prependToEachElIfMissing(['_x', 'aaayy', '_zzz'], 'aaa'),
    ['aaa_x', 'aaayy', 'aaa_zzz'],
    '99.03'
  )
})

test('99.04 - UTIL/prepend: wrong input', t => {
  t.deepEqual(
    util.prependToEachElIfMissing('aaa'),
    'aaa',
    '99.04.01'
  )
  t.deepEqual(
    util.prependToEachElIfMissing('aaa', 'aaa'),
    'aaa',
    '99.04.02'
  )
  t.deepEqual(
    util.prependToEachElIfMissing(),
    undefined,
    '99.04.03'
  )
  t.deepEqual(
    util.prependToEachElIfMissing(null),
    null,
    '99.04.04'
  )
})

// --- unprependToEachElIfPresent

test('99.05 - UTIL/unprepend: unprepends on present', t => {
  t.deepEqual(
    util.unprependToEachElIfPresent(['_x', 'yy', '_zzz'], '_'),
    ['x', 'yy', 'zzz'],
    '99.05'
  )
})

test('99.06 - UTIL/unprepend: not found', t => {
  t.deepEqual(
    util.unprependToEachElIfPresent(['x', 'yy', 'zzz'], '_'),
    ['x', 'yy', 'zzz'],
    '99.06'
  )
})

test('99.07 - UTIL/unprepend: wrong input', t => {
  t.deepEqual(
    util.unprependToEachElIfPresent('aaa'),
    'aaa',
    '99.07.01'
  )
  t.deepEqual(
    util.unprependToEachElIfPresent('aaa', 'aaa'),
    'aaa',
    '99.07.02'
  )
  t.deepEqual(
    util.unprependToEachElIfPresent(),
    undefined,
    '99.07.03'
  )
  t.deepEqual(
    util.unprependToEachElIfPresent(null),
    null,
    '99.07.04'
  )
})

// ==============================

// Covered:
// [x] Test for missing stuff in the inputs
// [x] Test for wrong input type
// [x] Test info object, what's deleted
// [x] Test info object, does it return all original selectors
// [x] Test whitelist
// [x] Graciously return unpatch-eable instead of throwing when HTML is dirty (see separate case for patched)
// [x] Graciously return unpatch-eable instead of throwing when CSS is dirty (see separate case for patched)
// [x] Test for HTML/XHTML differences and return correct type
// [x] Test cases where wrongly closed IMG tags are patched
// [x] Test cases where incomplete HTML are patched
// [x] Test for emoji in everywhere
