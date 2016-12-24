/* eslint-disable no-multi-str */
'use strict'
var remove = require('./index.js')
var minify = require('html-minifier').minify
var parser = require('posthtml-parser')
var render = require('posthtml-render')
import test from 'ava'

// ==============================
// testing basic class/id removal
// ==============================

test('01.01 - removes classes and id\'s from HTML5', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
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
',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.01.01')

  t.deepEqual(
    parser(minify(render(remove(
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
  ), {collapseWhitespace: true, minifyCSS: true})),
    parser(
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
    ', {collapseWhitespace: true, minifyCSS: true})
  ),
    '01.01.02')
})

test('01.02 - deletes blank class/id attrs and empty because of deletion', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
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
',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.02')
})

test('01.03 - class present in both head and body, but head has it joined with nonexistent class', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
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
',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.03')
})

test('01.04 - multiple style tags recognised and transformed', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
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
',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.04')
})

test('01.05 - multiple levels of media queries cleaned', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
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
',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.05')
})

test('01.06 - empty media queries removed', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
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
',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.06')
})

test('01.07 - style tags are outside HEAD', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
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
',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.07')
})

// GitHub issue #3
// https://github.com/code-and-send/email-remove-unused-css/issues/3
test('01.08 - removes media query together with the whole style tag', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.08.01')
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
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
</html>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.08.02')
})

test('01.09 - removes three media queries together with the style tags', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.09')
})

test('01.10 - removes last styles together with the whole style tag', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.10')
})

test('01.11 - media query with asterisk', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.11')
})

test('01.12 - complex media query #1', t => {
  t.is(
    minify(
      remove(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
<style>\
  @media tv and (min-width: 700px) and (orientation: landscape) {\
    ._text-color.black {\
      color:  black;\
    }\
  }\
</style>\
</head>\
<body class="black">\
</body>\
</html>'
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.12')
})

test('01.13 - complex media query #2', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<!doctype html>\
<html>\
<head>\
<meta charset="utf-8">\
<meta name="viewport" content="width=device-width">\
<title>test</title>\
</head>\
<body>\
</body>\
</html>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '01.13')
})

// ==============================
// 2. HTML/XHTML issues
// ==============================

test('02.01 - nothing to remove, one img tag', t => {
  t.is(
    minify(
      remove('<img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>'
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '02.01')
})

test('02.02 - nothing to remove, few single tags', t => {
  t.is(
    minify(
      remove('<br><hr><meta>'
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<br><hr><meta>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '02.02.01')
  t.is(
    minify(
      remove('<br/><hr/><meta/>'
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<br/><hr/><meta/>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '02.02.02')
  t.is(
    minify(
      remove('<br><hr/><meta/>'
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<br/><hr/><meta/>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '02.02.03')
  t.is(
    minify(
      remove('<br><hr/><meta>'
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<br><hr><meta>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '02.02.04')
})

test('02.03 - nothing to remove, respects XHTML images within', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
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
',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '02.03')
})

test('02.04 - fixes the IMG, HR, BR and META tags to be closed because of doctype', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
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
</html>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '02.04')
})

test('02.05 - doesn\'t fix the IMG, HR, BR and META tags because of doctype', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
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
</html>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '02.05')
})

// ==============================
// 3. Parser patches up dirty HTML
// ==============================

test('03.01 - missing closing TD, TR, TABLE tags restored by parser', t => {
  t.is(
    minify(
      remove('\
<table width="100%" border="0" cellpadding="0" cellspacing="0">\
  <tr>\
    <td>\
      some text\
'
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify(
'<table width="100%" border="0" cellpadding="0" cellspacing="0">\
  <tr>\
    <td>\
      some text\
    </td>\
  </tr>\
</table>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '03.01')
})

test('03.02 - missing TD, TR, TABLE, BODY and HTML closing tags restored by parser', t => {
  t.is(
    minify(
      remove('\
<html>\
  <body>\
    <table width="100%" border="0" cellpadding="0" cellspacing="0">\
      <tr>\
        <td>\
          some text\
'
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify('\
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
</html>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '03.02')
})

// ==============================
// 4. Emoji content
// ==============================

test('04.01 - doesn\'t affect emoji characters within the code', t => {
  t.is(
    minify(
      remove('<td>🦄</td>'
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify('<td>🦄</td>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '04.01')
})

test('04.02 - doesn\'t affect emoji characters within the attribute names', t => {
  t.is(
    minify(
      remove('<td data-emoji="🦄">emoji</td>'
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify('<td data-emoji="🦄">emoji</td>',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '04.02')
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
  t.deepEqual(
    remove('\
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
'
    )[1].deletedFromHead,
    ['.non-existent-class', '#other', '#non-existent-id'],
    '06.01')
})

test('06.02 - returned correct info object, body content + missing opening TR', t => {
  t.deepEqual(
    remove('\
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
    )[1].deletedFromBody,
    ['.unused1', '.unused2', '.unused3', '#unused4'],
    '06.02')
})

test('06.03 - returns array of all classes, without whitelisting them', t => {
  t.deepEqual(
    remove('\
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
    )[1].allInHead,
    ['.non-existent-class', '#other', '#non-existent-id'],
    '06.03.01')

  t.deepEqual(
    remove('\
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
    )[1].allInBody,
    ['.body-only-class-1', '.body-only-class-2'],
    '06.03.02')
})

// ==============================
// 7. Whitelist
// ==============================

test('07.01 - nothing removed because of settings.whitelist', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify('\
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
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '07.01')
})

test('07.02 - some removed, some whitelisted', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify('\
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
',
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '07.02')
})

test('07.03 - case of whitelisting everything', t => {
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    minify('\
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
      {collapseWhitespace: true, minifyCSS: true}
    ),
    '07.03')
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
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    'the input code has problems, please check it',
    '08.02')
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
  t.is(
    minify(
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
      )[0],
      {collapseWhitespace: true, minifyCSS: true}
    ),
    'the input code has problems, please check it',
    '08.04')
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
