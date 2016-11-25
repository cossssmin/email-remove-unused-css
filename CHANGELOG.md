### CHANGELOG

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
