# 5. Data Model (MVP)

> Section 7 of the architecture doc.

---

## Product Model

- Entries default **PRIVATE**.
- Optional visibility: `PARTNER`, `CIRCLE`, `FUTURE_CIRCLE_ONLY`.
- Circles require **unanimous approval** for new members.
- History policy on join request: `ALL` vs `FUTURE_ONLY` (join timestamp gates access).
- Comments + reactions allowed only for viewers with permission.
