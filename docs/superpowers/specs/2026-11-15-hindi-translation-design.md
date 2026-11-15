# Hindi translation, round 1 — design

Status: agreed in chat with the owner, 2026-11-15.

## Why

Users can pick Hindi (onboarding and profile save `language_pref = 'hi'`),
but the app shows English everywhere, with a note saying so. Hindi-first
gardeners are a core audience. This round makes the parts people read most
— every screen and every plant name — Hindi when they choose Hindi.

## Goals

1. **Screen text.** Every string the web app renders from
   `web/src/locales/en.json` (about 590) has a Hindi version, and the app
   shows Hindi when the user's language is Hindi.
2. **Catalogue text.** The plant reference text the API sends for display
   has a Hindi version where one exists, sent when the web asks for Hindi:
   crop and seasonal-flower names and descriptions, planting-method labels
   and material texts, care-step labels, fruit add-tree display names, and
   perennial-flower names.
3. **The owner reviews every Hindi line before it ships.** Nothing Hindi
   goes live without the owner's yes.

## Style (owner's decision)

Everyday spoken Hindi, in Devanagari. Keep the English words people
actually use in speech ("स्प्रे करें", "सेव करें", "पौधा"), not formal or
Sanskritised Hindi ("छिड़काव", "सहेजें"). Short and plain, like the English.

## Non-goals (this round)

- Reminder (task) titles. They are saved as finished English sentences per
  user; translating them needs a different storage shape. Later.
- Tree-care advice, phases and home season tips. They still live in code and
  move to the catalogue in stages 3–4; translate them once, after that.
- Anything users type (notes, their plant names). A plant's saved name
  (e.g. "Tomato", copied from the catalogue when it was added) is user data
  and stays as saved.
- Other languages. The design must not block adding them later.

## Anti-goals

- A blank or broken label where a Hindi string is missing: always fall back
  to English.
- Hindi that the owner has not reviewed going live.
- A change for English users.

## Decided

- **Screen text** lives in `web/src/locales/hi.json` with the same keys as
  `en.json`; i18next falls back to English for any missing key. The app's
  language follows the signed-in user's `language_pref` (and the choice made
  on the onboarding language screen before sign-up). The "Hindi shows
  English for now" note goes.
- **Digits** stay 0–9; dates keep using `hi-IN` month names as today. *(My
  call.)*
- **Catalogue text** gets Hindi beside the English in the seed files, so it
  rides the existing push and approval path. Records without a Hindi value
  serve English. *(My call: per-record optional Hindi fields, not a separate
  translation table.)*
- **How the API knows the language.** The web sends its current language on
  every request (standard `Accept-Language` header); catalogue responses use
  Hindi when it is `hi` and a Hindi value exists. This works before sign-in
  and needs no extra lookup. *(My call.)*
- **Review.** The draft Hindi goes into a Claude Doc as English | Hindi
  tables grouped by screen (and by catalogue kind); the owner edits inline
  and says yes. Only approved text is written to the files.
- **Plant names a user already has (owner's decision).** Saved names stay
  as saved (English for catalogue plants). When the request is Hindi and a
  plant's name is still exactly the catalogue's English name for its crop or
  add-tree entry, plant responses show the catalogue's Hindi name instead; a
  name the user changed ("Dadi's tomato") shows as written. This touches the
  plant and ledger read responses, not only catalogue ones. Responses keep
  `name` as saved and add a `display_name`, so editing never saves the
  Hindi name. *(My call.)* Switching back to
  English shows English again; no saved data changes.
- **Release (owner's decision): all at once.** Screen text and catalogue
  Hindi ship together after the owner approves the whole review, so a Hindi
  user never sees half-translated screens. Until then, `hi.json` and the
  Hindi seed values may exist on a branch but are not served.
- **Month labels** the server builds today ("Oct–Nov", in three places) are
  written by the server in the request's language (`hi-IN` month names);
  English labels stay exactly as today. *(My call; first said client-side,
  changed in planning because the server builds them in three places.)*
- **Care steps:** only their web labels (`label_title`, `label_body`) get
  Hindi; `title` is the reminder template and stays with the reminder
  non-goal. *(My call.)*
- **Language before sign-in:** the device's choice; the signed-in user's
  `language_pref` wins after. The web sends its language explicitly on every
  request, and caches per language. *(My call.)*

## Left to the builder

- Exact seed field names and schema for Hindi values; validation (Devanagari
  present, no empty strings).
- Which catalogue fields get Hindi, within goal 2; plant names may reuse
  the Devanagari names already in aliases/`languages.hi` where they fit.
- Interpolated strings (`{{name}}`) and plurals in Hindi.
- A test that every `en.json` key exists in `hi.json` (or is listed as
  intentionally English), and that Hindi catalogue values pass validation.
- Order of work: screen text and catalogue text can ship separately.

## Deploy

Screen text is a web deploy. Catalogue Hindi is a migration only if the
schema needs one, then a catalogue push, then the API deploy.
