CHANGELOG

---

# v.1.2.0

> 2016-Nov-25

## New feature.

Adding a new feature, where a class/id might be present in both `head` and `body`, but all its occurencies in the `head` were sandwich'ed with classes/id's that didn't exist in `body`, and got deleted.

For example:

selector in HEAD:
.existing-in-body.non-existing-body

selector in BODY:
.existing-in-body

As such, both classes should be deleted, even though `.existing-in-body` is used in `head`.

> Adding test 01.03

---
