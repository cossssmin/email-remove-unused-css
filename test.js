'use strict'
import test from 'ava'
var remove = require('./')
var actual, intended

// function minify (inp) {
//   return min(inp, {collapseWhitespace: true, minifyCSS: true})
// }

// ==============================
// testing basic class/id removal
// ==============================

test('01.01 - removes classes and id\'s from HTML5 (normal input)', t => {
  actual = remove(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Dummy HTML</title>
<style type="text/css">
  .real-class-1:active, #head-only-id1[whatnot], whatever[lang|en]{width:100% !important;}
  #real-id-1:hover{width:100% !important;}
</style>
</head>
<body>
<table id="     real-id-1    body-only-id-1    " class="     body-only-class-1 " width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr id="      body-only-id-4     ">
          <td id="     body-only-id-2     body-only-id-3   " class="     real-class-1      body-only-class-2     body-only-class-3 ">
            Dummy content.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`).result

  intended = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Dummy HTML</title>
<style type="text/css">
  .real-class-1:active, whatever[lang|en]{width:100% !important;}
  #real-id-1:hover{width:100% !important;}
</style>
</head>
<body>
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td class="real-class-1">
            Dummy content.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.01'
  )
})

test('01.02 - removes classes and id\'s from HTML5 (input as RAW AST)', t => {
  actual = remove(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dummy HTML</title>
  <style type="text/css">
    .real-class-1:active, #head-only-id1[whatnot], whatever[lang|en]{width:100% !important;}
    #real-id-1:hover{width:100% !important;}
  </style>
</head>
<body>
  <table id="real-id-1 body-only-id-1" class="body-only-class-1" width="100%" border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr id="body-only-id-4">
            <td id="body-only-id-2 body-only-id-3" class="real-class-1 body-only-class-2">
              Dummy content.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`).result

  intended = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dummy HTML</title>
  <style type="text/css">
    .real-class-1:active, whatever[lang|en]{width:100% !important;}
    #real-id-1:hover{width:100% !important;}
  </style>
</head>
<body>
  <table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td class="real-class-1">
              Dummy content.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.02'
  )
})

test('01.03 - deletes blank class/id attrs', t => {
  actual = remove(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
      <title>Dummy HTML</title>
      <style type="text/css">
        #real-id-1:hover{width:100% !important;}
        .real-class-1:hover{width:100% !important;}
      </style>
  </head>
  <body>
    <table id="body-only-id-1 body-only-id-2" class="body-only-class-1 body-only-class-2" width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td id="" class="">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr id="real-id-1" class="real-class-1">
              <td>
                Dummy content.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
  ).result

  intended = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
      <title>Dummy HTML</title>
      <style type="text/css">
        #real-id-1:hover{width:100% !important;}
        .real-class-1:hover{width:100% !important;}
      </style>
  </head>
  <body>
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr id="real-id-1" class="real-class-1">
              <td>
                Dummy content.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.03'
  )
})

test('01.04 - class present in both head and body, but head has it joined with nonexistent id', t => {
  actual = remove(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>test</title>
  <style type="text/css" media="screen">
    .real-class-1#head-only-id-1, #head-only-id-2.real-class-1[lang|en]{ width:100% !important; }
  </style>
</head>
<body>
  <table class="real-class-1">
    <tr>
      <td class="real-class-1">
        <img src="spacer.gif">
      </td>
    </tr>
  </table>
</body>
</html>
`).result

  intended = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>test</title>
</head>
<body>
  <table>
    <tr>
      <td>
        <img src="spacer.gif">
      </td>
    </tr>
  </table>
</body>
</html>
`
  t.deepEqual(
    actual,
    intended,
    '01.04'
  )
})

test('01.05 - multiple style tags recognised and transformed', t => {
  actual = remove(`
<!DOCTYPE html>
<html lang="en">
<head>
<style type="text/css">
  .real-class-1#head-only-id-1[lang|en]{width:100% !important;}
  #real-id-1.head-only-class-1:hover{display: block !important;}
  .head-only-class-2[lang|en]{width: 100% !important;}
  #real-id-1{font-size: 10px !important;}
</style>
<title>zzzz</title>
<style type="text/css">
  .real-class-1#head-only-id-1[lang|en]{width:100% !important;}
  #real-id-1.head-only-class-1:hover{display: block !important;}
  .head-only-class-3[lang|en]{width: 100% !important;}
  div .real-class-1 a:hover {width: 50%;}
</style>
</head>
<body>
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td class="real-class-1">
      <img src="spacer.gif">
    </td>
  </tr>
</table>
</body>
</html>
`
    ).result

  intended = `<!DOCTYPE html>
<html lang="en">
<head>
<style type="text/css">
  #real-id-1{font-size: 10px !important;}
</style>
<title>zzzz</title>
<style type="text/css">
  div .real-class-1 a:hover {width: 50%;}
</style>
</head>
<body>
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td class="real-class-1">
      <img src="spacer.gif">
    </td>
  </tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.05'
  )
})

test('01.06 - multiple levels of media queries cleaned', t => {
  actual = remove(`
<!DOCTYPE html>
<head>
<style type="text/css">
  @media (max-width: 600px) {
    .real-class-1#head-only-id-1[lang|en]{width:100% !important;}
    #real-id-1.head-only-class-1:hover{display: block !important;}
    .head-only-class-2[lang|en]{width: 100% !important;}
    @media (max-width: 200px) {
      #real-id-1{font-size: 10px !important;}
    }
    @media (max-width: 100px) {
      .head-only-class-1{font-size: 10px !important;}
    }
  }
</style>
<title>zzzz</title>
<style type="text/css">
  .real-class-1#head-only-id-1[lang|en]{width:100% !important;}
  #real-id-1.head-only-class-1:hover{display: block !important;}
  .head-only-class-3[lang|en]{width: 100% !important;}
  div .real-class-1 a:hover {width: 50%;}
</style>
</head>
<body>
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td class="real-class-1">
      <img src="spacer.gif">
    </td>
  </tr>
</table>
</body>
</html>
`
    ).result

  intended = `<!DOCTYPE html>
<head>
<style type="text/css">
  @media (max-width: 600px) {
    @media (max-width: 200px) {
      #real-id-1{font-size: 10px !important;}
    }
  }
</style>
<title>zzzz</title>
<style type="text/css">
  div .real-class-1 a:hover {width: 50%;}
</style>
</head>
<body>
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td class="real-class-1">
      <img src="spacer.gif">
    </td>
  </tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.06'
  )
})

test('01.07 - empty media queries removed', t => {
  actual = remove(`
<!DOCTYPE html>
<head>
<style type="text/css">
  @media (max-width: 600px) {
    @media (max-width: 200px) {
      .head-only-class-1{font-size: 10px !important;}
    }
    @media (max-width: 100px) {
      .head-only-class-2{font-size: 10px !important;}
    }
  }
</style>
<title>zzzz</title>
<style type="text/css">
@media (max-width: 600px) {
  @media (max-width: 200px) {
    .head-only-class-3{font-size: 10px !important;}
  }
  @media (max-width: 100px) {
    .head-only-class-4{font-size: 10px !important;}
  }
}
</style>
</head>
<body>
<table id="">
  <tr>
    <td class="">
      <img src="spacer.gif">
    </td>
  </tr>
</table>
</body>
</html>
`).result

  intended = `<!DOCTYPE html>
<head>
<title>zzzz</title>
</head>
<body>
<table>
  <tr>
    <td>
      <img src="spacer.gif">
    </td>
  </tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.07'
  )
})

test('01.08 - style tags are outside HEAD', t => {
  actual = remove(`
<!DOCTYPE html>
<style>
@media (max-width: 600px) {
@media (max-width: 200px) {
  .head-only-class-1{font-size: 10px !important;}
}
@media (max-width: 100px) {
  .head-only-class-2{font-size: 10px !important;}
}
}
</style>
<head>
<title>zzzz</title>
</head>
<body>
<style type="text/css">
@media (max-width: 600px) {
@media (max-width: 200px) {
  .head-only-class-3{font-size: 10px !important;}
}
@media (max-width: 100px) {
  .head-only-class-4{font-size: 10px !important;}
}
}
</style>
<table id="">
  <tr>
    <td class="">
      <img src="spacer.gif">
    </td>
  </tr>
</table>
</body>
</html>
`).result

  intended = `<!DOCTYPE html>
<head>
<title>zzzz</title>
</head>
<body>
<table>
  <tr>
    <td>
      <img src="spacer.gif">
    </td>
  </tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.08'
  )
})

// GitHub issue #3
// https://github.com/codsen/email-remove-unused-css/issues/3
test('01.09 - removes media query together with the whole style tag #1', t => {
  actual = remove(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
<style>
@media screen {
._text-color.black {
  color:  black;
}
}
</style></head>
<body>
</body>
</html>
`).result

  intended = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
</head>
<body>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.09'
  )
})

test('01.10 - removes media query together with the whole style tag #2', t => {
  actual = remove(
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
<style>
@media screen {
._text-color.black {
  color:  black;
}
}
</style></head>
<body class="_text-color  black">
zzz
</body>
</html>
`).result

  intended = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
<style>
@media screen {
._text-color.black {
  color:  black;
}
}
</style></head>
<body class="_text-color  black">
zzz
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.10'
  )
})

test('01.11 - removes three media queries together with the style tags', t => {
  actual = remove(
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
@media screen {
#_something-here#green {
  color:  green;
  display: block;
}
}
</style>
<meta name="viewport" content="width=device-width">
<style>
@media screen {
._something-else.red {
  color:  red;
}
}
</style>
<title>test</title>
<style>
@media screen {
._text-color.black {
  color:  black;
}
}
</style></head>
<body class="black">
</body>
</html>
`).result

  intended = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
</head>
<body>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.11'
  )
})

test('01.12 - removes last styles together with the whole style tag', t => {
  actual = remove(
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
<style>
._text-color.black {
color:  black;
}
</style></head>
<body>
</body>
</html>
`).result

  intended = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
</head>
<body>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.12'
  )
})

test('01.13 - media query with asterisk', t => {
  actual = remove(
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
<style>
@media * {
  ._text-color.black {
    color:  black;
  }
}
</style>
</head>
<body>
</body>
</html>
`).result

  intended = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
</head>
<body>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.13'
  )
})

test('01.14 - complex media query #1', t => {
  actual = remove(
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
<style>
@media tv and (min-width: 700px) and (orientation: landscape) {
  .text-color.black {
    color:  black;
  }
}
</style>
</head>
<body class="black">
</body>
</html>
`).result

  intended = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
</head>
<body>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.14'
  )
})

test('01.15 - complex media query #2', t => {
  actual = remove(
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
<style>
@media (min-width: 700px), handheld and (orientation: landscape) {
  ._text-color.black {
    color:  black;
  }
}
</style>
</head>
<body class="black">
</body>
</html>
`).result

  intended = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>test</title>
</head>
<body>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '01.15'
  )
})

test('01.16 - deletes multiple empty style tags', t => {
  actual = remove(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>test</title>
  <style type="text/css" media="screen">

  </style>
  <style type="text/css" media="screen">      </style>
</head>
<body>
  <table class="real-class-1">
    <tr>
      <td class="real-class-1">
        <img src="spacer.gif">
      </td>
    </tr>
  </table>
</body>
</html>
`).result

  intended = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>test</title>
</head>
<body>
  <table>
    <tr>
      <td>
        <img src="spacer.gif">
      </td>
    </tr>
  </table>
</body>
</html>
`
  t.deepEqual(
    actual,
    intended,
    '01.16'
  )
})

// ==============================
// 2. HTML/XHTML issues
// ==============================

test.skip('02.01 - nothing to remove, one img tag', t => {
  actual = remove('<img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>').result

  intended = `<img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>
`

  t.deepEqual(
    actual,
    intended,
    '02.01'
  )
})

test.skip('02.02 - nothing to remove, few single tags', t => {
  actual = remove('<br><hr><meta>').result

  intended = '<br><hr><meta>'

  t.deepEqual(
    actual,
    intended,
    '02.02.01'
  )

// ----------------

  actual = remove('<br/><hr/><meta/>').result

  intended = '<br/><hr/><meta/>'

  t.deepEqual(
    actual,
    intended,
    '02.02.02'
  )

// ----------------

  actual = remove('<br><hr/><meta/>').result

  intended = '<br/><hr/><meta/>'

  t.deepEqual(
    actual,
    intended,
    '02.02.03'
  )

// ----------------

  actual = remove('<br><hr/><meta>').result

  intended = '<br><hr><meta>'

  t.deepEqual(
    actual,
    intended,
    '02.02.04'
  )
})

test.skip('02.03 - nothing to remove, respects XHTML images within', t => {
  actual = remove(`
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Tile</title>
</head>
<body>
<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>
  </td>
</tr>
</table>
</body>
</html>
`
    ).result

  intended = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Tile</title>
</head>
<body>
<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>
  </td>
</tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '02.03'
  )
})

test.skip('02.04 - fixes the IMG, HR, BR and META tags to be closed because of doctype', t => {
  actual = remove(`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Tile</title>
</head>
<body>
<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">
    <br><br>
    <hr>
    <br><br>
  </td>
</tr>
</table>
</body>
</html>
`).result

  intended = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<title>Tile</title>
</head>
<body>
<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>
    <br/><br/>
    <hr/>
    <br/><br/>
  </td>
</tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '02.04'
  )
})

test.skip('02.05 - doesn\'t fix the IMG, HR, BR and META tags because of doctype', t => {
  actual = remove(`<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Tile</title>
</head>
<body>
<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">
    <br><br>
    <hr>
    <br><br>
  </td>
</tr>
</table>
</body>
</html>
`).result

  intended = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<title>Tile</title>
</head>
<body>
<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz"/>
    <br/><br/>
    <hr/>
    <br/><br/>
  </td>
</tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '02.05'
  )
})

// ==============================
// 3. SHADES OF MESSED UP HTML
// ==============================

test('03.01 - missing closing TD, TR, TABLE will not throw', t => {
  actual =
    remove(`
<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    some text
`
    ).result

  intended = `<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    some text
`

  t.deepEqual(
    actual,
    intended,
    '03.01 - does nothing as head has no styles'
  )
})

test('03.02 - doesn\'t remove any other empty attributes besides class/id', t => {
  actual = remove(`<html>
<body>
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
    <tr whatnot="">
      <td class="">
        <img src="spacer.gif" width="1" height="1" border="0" style="display:block;" alt=""/>
      </td>
    </tr>
  </table>
</body>
</html>
`).result

  intended = `<html>
<body>
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
    <tr whatnot="">
      <td>
        <img src="spacer.gif" width="1" height="1" border="0" style="display:block;" alt=""/>
      </td>
    </tr>
  </table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '03.02'
  )
})

test('03.03 - removes classes and id\'s from HTML even if it\'s heavily messed up', t => {
  actual = remove(`
<title>Dummy HTML</title>
<style type="text/css">
  .real-class-1:active, #head-only-id1[whatnot], whatever[lang|en]{width:100% !important;}
  #real-id-1:hover{width:100% !important;}
</style>
</head>
<body>
<table id="     real-id-1    body-only-id-1    " class="     body-only-class-1  " width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr id="      body-only-id-4     ">
          <td id="     body-only-id-2     body-only-id-3   " class="     real-class-1      body-only-class-2     body-only-class-3 ">
            Dummy content.

    </td>
  </tr>
</table>
</body>`).result

  intended = `<title>Dummy HTML</title>
<style type="text/css">
  .real-class-1:active, whatever[lang|en]{width:100% !important;}
  #real-id-1:hover{width:100% !important;}
</style>
</head>
<body>
<table id="real-id-1" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td class="real-class-1">
            Dummy content.
    </td>
  </tr>
</table>
</body>
`

  t.deepEqual(
    actual,
    intended,
    '03.03 - rubbish in, rubbish out, only rubbish-with-unused-CSS-removed-out!'
  )
})

// ==============================
// 4. Emoji content
// ==============================

test('04.01 - doesn\'t affect emoji characters within the code', t => {
  actual = remove(`<td>🦄</td>`).result
  intended = `<td>🦄</td>
`

  t.deepEqual(
    actual,
    intended,
    '04.01'
  )
})

test('04.02 - doesn\'t affect emoji characters within the attribute names', t => {
  actual = remove(`<td data-emoji="🦄">emoji</td>`).result
  intended = `<td data-emoji="🦄">emoji</td>
`

  t.deepEqual(
    actual,
    intended,
    '04.02'
  )
})

// ==============================
// 5. Missing/wrong input args
// ==============================

test('05.01 - wrong inputs result in throw\'ing', t => {
  t.throws(function () {
    remove()
  })
  t.throws(function () {
    remove(true)
  })
  t.throws(function () {
    remove(null)
  })
  t.throws(function () {
    remove({a: 'b'})
  })
  t.notThrows(function () {
    remove('')
  })
  t.notThrows(function () {
    remove('a')
  })
})

test('05.02 - wrong opts', t => {
  t.throws(function () {
    remove('', 1)
  })
  t.throws(function () {
    remove('', true)
  })
  t.notThrows(function () {
    remove('', {})
  })
  t.notThrows(function () {
    remove('', null)
  })
  t.notThrows(function () {
    remove('', undefined)
  })
  t.throws(function () {
    remove('zzz', {whitelist: true})
  })
  t.notThrows(function () {
    remove('zzz', {whitelist: []})
  })
})

// ==============================
// 6. Output info object
// ==============================

test('06.01 - returned correct info object, nothing to delete from body, damaged HTML', t => {
  actual = remove(`<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Tile</title>
<style type="text/css">
  div.non-existent-class{display: block;}
  table#other div#non-existent-id{width:100%; display: inline-block;}
</style>
</head>
<body>
<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">
    <br><br>
    <hr>
    <br><br>`)

  t.deepEqual(
    actual.allInHead,
    ['#non-existent-id', '#other', '.non-existent-class'],
    '06.01.01'
  )
  t.deepEqual(
    actual.allInBody,
    [],
    '06.01.02'
  )
  t.deepEqual(
    actual.deletedFromHead,
    ['#non-existent-id', '#other', '.non-existent-class'],
    '06.01.03'
  )
  t.deepEqual(
    actual.deletedFromBody,
    [],
    '06.01.04'
  )
})

test('06.02 - returned correct info object, clean HTML', t => {
  actual = remove(`<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Tile</title>
<style type="text/css">
  div.non-existent-class{display: block;}
  table#other div#non-existent-id{width:100%; display: inline-block;}
</style>
</head>
<body>
<table width="100%" border="0" cellpadding="0" cellspacing="0">
  <td>
    <img class="unused1 unused2" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">
    <br><br>
    <hr class="unused3">
    <br><br id="unused4">
  </td>
</tr>
</table>
</body>
</html>
`)

  t.deepEqual(
    actual.allInHead,
    ['#non-existent-id', '#other', '.non-existent-class'],
    '06.02.01'
  )
  t.deepEqual(
    actual.allInBody,
    ['#unused4', '.unused1', '.unused2', '.unused3'],
    '06.02.02'
  )
  t.deepEqual(
    actual.deletedFromHead,
    ['#non-existent-id', '#other', '.non-existent-class'],
    '06.02.03'
  )
  t.deepEqual(
    actual.deletedFromBody,
    ['#unused4', '.unused1', '.unused2', '.unused3'],
    '06.02.04'
  )
})

test('06.03 - as 06.02 but now with whitelist, dirty HTML', t => {
  actual = remove(`<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Tile</title>
<style type="text/css">
  div.non-existent-class{display: block;}
  table#other div#non-existent-id{width:100%; display: inline-block;}
</style>
</head>
<body>
<table class="body-only-class-1 body-only-class-2" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    <img src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz">
    <br><br>
    <hr>
    <br><br>`,
    {
      whitelist: ['.non-existent-*', '#other*', '#non-existent-*', '.body-only-*']
    }
  )
  t.deepEqual(
    actual.allInHead,
    ['#non-existent-id', '#other', '.non-existent-class'],
    '06.03.01'
  )
  t.deepEqual(
    actual.allInBody,
    ['.body-only-class-1', '.body-only-class-2'],
    '06.03.02'
  )
  t.deepEqual(
    actual.deletedFromHead,
    [],
    '06.03.03 - nothing removed because of whitelist'
  )
  t.deepEqual(
    actual.deletedFromBody,
    [],
    '06.03.04 - nothing removed because of whitelist'
  )
})

test('06.04 - correct classes reported in info/deletedFromBody', t => {
  actual = remove(`<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Tile</title>
<style type="text/css">
  .unused.used {display: block;}
</style>
</head>
<body>
<table class="used" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td>
    Text
  </td>
</tr>
</table>
</body>
</html>
`)

  t.deepEqual(
    actual.allInHead,
    ['.unused', '.used'],
    '06.04.01'
  )
  t.deepEqual(
    actual.allInBody,
    ['.used'],
    '06.04.02'
  )
  t.deepEqual(
    actual.deletedFromHead,
    ['.unused', '.used'],
    '06.04.03'
  )
  t.deepEqual(
    actual.deletedFromBody,
    ['.used'],
    '06.04.04 - sneaky case - it is within head, but it is sandwitched with an unused class, so it does not count!'
  )
})

test('06.05 - more sandwitched classes/ids cases', t => {
  actual = remove(`<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Tile</title>
<style type="text/css">
  .unused-class.used-class {display: block;}
  .unused-class#used-id {display: block;}
  #unused-id#used-id {display: block;}
</style>
</head>
<body>
<table class="used-class" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
  <td id="used-id">
    Text
  </td>
</tr>
</table>
</body>
</html>
`)

  t.deepEqual(
    actual.allInHead,
    ['#unused-id', '#used-id', '.unused-class', '.used-class'],
    '06.05.01'
  )
  t.deepEqual(
    actual.allInBody,
    ['#used-id', '.used-class'],
    '06.05.02'
  )
  t.deepEqual(
    actual.deletedFromHead,
    ['#unused-id', '#used-id', '.unused-class', '.used-class'],
    '06.05.03 - deleted because they\'e sandwitched with unused classes/ids'
  )
  t.deepEqual(
    actual.deletedFromBody,
    ['#used-id', '.used-class'],
    '06.05.04 - deleted because they\'e sandwitched with unused classes/ids'
  )
})

// ==============================
// 7. Whitelist
// ==============================

test('07.01 - nothing removed because of settings.whitelist', t => {
  actual = remove(`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Tile</title>
<style type="text/css">
  .module-1{display: none !important;}
  .module-2{display: none !important;}
  .module-3{display: none !important;}
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}
  .particular{width: 100% !important;}
</style>
</head>
<body>
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr class="module-93">
  <td class="module-94 module-lkfjgldhglktjja">
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />
  </td>
</tr>
</table>
</body>
</html>
`,
    {
      whitelist: ['.module-*', '.particular']
    }
  ).result

  intended = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Tile</title>
<style type="text/css">
  .module-1{display: none !important;}
  .module-2{display: none !important;}
  .module-3{display: none !important;}
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}
  .particular{width: 100% !important;}
</style>
</head>
<body>
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr class="module-93">
  <td class="module-94 module-lkfjgldhglktjja">
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />
  </td>
</tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '07.01'
  )
})

test('07.02 - some removed, some whitelisted', t => {
  actual = remove(`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Tile</title>
<style type="text/css">
  .module-1{display: none !important;}
  .module-2{display: none !important;}
  .module-3{display: none !important;}
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}
  .head-only-class-1 a.module-94:hover{width: 100% !important;}
  #head-only-id-1[lang|en]{width: 100% !important;}
</style>
</head>
<body>
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr class="module-93 body-only-class-1">
  <td id="body-only-id-1" class="module-94 module-lkfjgldhglktjja">
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />
  </td>
</tr>
</table>
</body>
</html>
`,
    {
      whitelist: ['.module-*', '.particular']
    }
  ).result

  intended = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Tile</title>
<style type="text/css">
  .module-1{display: none !important;}
  .module-2{display: none !important;}
  .module-3{display: none !important;}
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}
</style>
</head>
<body>
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr class="module-93">
  <td class="module-94 module-lkfjgldhglktjja">
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />
  </td>
</tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '07.02'
  )
})

test('07.03 - case of whitelisting everything', t => {
  actual = remove(`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Tile</title>
<style type="text/css">
  .module-1{display: none !important;}
  .module-2{display: none !important;}
  .module-3{display: none !important;}
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}
  .head-only-class-1 a.module-94:hover{width: 100% !important;}
  #head-only-id-1[lang|en]{width: 100% !important;}
</style>
</head>
<body>
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr class="module-93 body-only-class-1">
  <td id="body-only-id-1" class="module-94 module-lkfjgldhglktjja">
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />
  </td>
</tr>
</table>
</body>
</html>
`,
    {
      whitelist: ['*']
    }
    ).result

  intended = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" />
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Tile</title>
<style type="text/css">
  .module-1{display: none !important;}
  .module-2{display: none !important;}
  .module-3{display: none !important;}
  .module-zzzzkldfjglfjhlfjlhfglj{display: none !important;}
  .head-only-class-1 a.module-94:hover{width: 100% !important;}
  #head-only-id-1[lang|en]{width: 100% !important;}
</style>
</head>
<body>
<table class="module-92" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr class="module-93 body-only-class-1">
  <td id="body-only-id-1" class="module-94 module-lkfjgldhglktjja">
    <img class="module-91" src="image.jpg" width="zzz" height="zzz" border="0" style="display:block;" alt="zzz" />
  </td>
</tr>
</table>
</body>
</html>
`

  t.deepEqual(
    actual,
    intended,
    '07.03'
  )
})

test('07.04 - special case - checking adjacent markers #1', t => {
  actual = remove(`<style type="text/css">
  .del-1{display: none;}
  .real{display: none;}
  .del-3{display: none;}
</style>
<body class="real">
zzz
</body>`).result

  intended = `<style type="text/css">
  .real{display: none;}
</style>
<body class="real">
zzz
</body>
`

  t.deepEqual(
    actual,
    intended,
    '07.04'
  )
})

test('07.05 - special case - checking adjacent markers #2', t => {
  actual = remove(`<style type="text/css">.del-1{display: none;}.del-2{display: none;}.del-3{display: none;}</style>
<body>
zzz
</body>`).result

  intended = `<body>
zzz
</body>
`

  t.deepEqual(
    actual,
    intended,
    '07.05'
  )
})

// div~[^whatever] .del-1 {display: none;}
test('07.06 - special case - checking commas within curly braces', t => {
  actual = remove(`
<style type="text/css">
  .used {display: block;}
  .deleteme{,,,<<<,>>>,,,,,}
</style>
<body class="used">
zzz
</body>`).result

  intended = `<style type="text/css">
  .used {display: block;}
</style>
<body class="used">
zzz
</body>
`

  t.deepEqual(
    actual,
    intended,
    '07.06'
  )
})
