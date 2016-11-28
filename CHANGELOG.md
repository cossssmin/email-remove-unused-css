### CHANGELOG

---

# v.1.4.0

> 2016-Nov-28

API change, or rather supplement. Adding all the styles from `body` and all the styles from `head` into the returned object.

It's necessary for upcoming front-end which will need to give option to move classes in and out of whitelist via GUI. Without all classes among the returned keys, it would be impossible to add to whitelist via GUI those classes that are not in yet.

---

# v.1.3.0

> 2016-Nov-25

## New feature - Deleting empty media queries.

If there are empty media query blocks (already supplied empty or empty because all the CSS inside of them were removed), they are deleted as well.

> Adding test 01.06 to prove it

## New feature - Style tags are recognised even when they are outside of `head` or `body` tags.

> Adding test 01.07 to prove it

---

# v.1.2.0

> 2016-Nov-25

## New feature - false positives recognised

Adding a new feature, where a class/id might be present in both `head` and `body`, but all its occurencies in the `head` were sandwich'ed with classes/id's that didn't exist in `body`, and got deleted.

For example:

selector in HEAD:
.existing-in-body.non-existing-body

selector in BODY:
.existing-in-body

As such, both classes should be deleted, even though `.existing-in-body` is used in `head`.

> Adding test 01.03

---
