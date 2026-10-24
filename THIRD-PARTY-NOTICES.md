# Third-Party Notices

Dawnbook ships, or loads in the reader's browser, material from the following
third-party projects. This file gives the attribution their licences require.
The repository's own licences are `LICENSE` (MIT, code) and `LICENSE-CONTENT`
(CC BY-SA 4.0, book text); neither covers the material below.

## Twemoji (sunrise icon, not MIT)

- Location in this repo: the Dawnbook sunrise icon is Twemoji `1f305`
  (sunrise over mountains). `scripts/generate-favicons.py` copies it to
  `public/favicon.svg`, `public/icons/icon-192.svg`, `public/icons/icon-512.svg`
  and `books/_template/theme/favicon.svg` (synced into every book's theme), and
  rasterises it to the PNG and ICO favicons in `public/` (`favicon.ico`,
  `favicon-48x48.png`, `favicon-96x96.png`, `favicon-192x192.png`,
  `favicon-512x512.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`)
  and to `books/_template/theme/favicon.png`.
  It is the site favicon, the PWA icon and the book favicon.
- Upstream: https://github.com/jdecked/twemoji (maintained fork of the original
  Twitter project)
- Copyright Twitter, Inc and other contributors (the upstream `LICENSE` file
  reads "Copyright (c) 2014-2021 Twitter" and "Copyright (c) 2022-present Jason
  Sofonia & Justine De Caires").
- Licence: graphics under CC-BY 4.0,
  https://creativecommons.org/licenses/by/4.0/ (the upstream code is MIT; no
  Twemoji code is used here).
- Changes: the SVG is copied unmodified; the PNG and ICO files are rasterised
  from it at the sizes listed above. No other change to the drawing.
- Credit is also shown on the About page (`/about.html`), which the upstream
  README names as an accepted place for attribution.

Licence checked 2026-10-24 at https://github.com/jdecked/twemoji (README:
"Graphics licensed under CC-BY 4.0"), and in
https://raw.githubusercontent.com/jdecked/twemoji/main/LICENSE-GRAPHICS
(Creative Commons Attribution 4.0 International) and
https://raw.githubusercontent.com/jdecked/twemoji/main/LICENSE.

## mdBook

- Location: not stored in this repository. `bun run build` runs mdBook
  (v0.5.4 on the maintainer's machine) to turn each book into HTML. Its output,
  shipped to readers under each book's folder, includes mdBook's own
  JavaScript and CSS (`book-*.js`, `searcher-*.js`, `toc-*.js`, `css/`) and the
  fonts in `fonts/`.
- Upstream: https://github.com/rust-lang/mdBook
- Licence: Mozilla Public License 2.0 (MPL-2.0).
- Bundled by mdBook, each under its own licence: Open Sans (Apache-2.0) and
  Source Code Pro (SIL OFL 1.1), whose licence files `OPEN-SANS-LICENSE.txt`
  and `SOURCE-CODE-PRO-LICENSE.txt` are written next to the fonts in every
  book's `fonts/` folder; highlight.js 10.1.1 (BSD-3-Clause), clipboard.js
  2.0.4 (MIT) and elasticlunr 0.9.5 (MIT), whose licence headers stay in the
  shipped files.

Licence checked 2026-10-24 at
https://raw.githubusercontent.com/rust-lang/mdBook/master/LICENSE (Mozilla
Public License, version 2.0). The bundled components were read from the
headers and licence files of a local build output on the same day, not from
their upstream pages.

## MathJax 2.7.9

- Location: not stored in this repository. `books/_template/theme/head.hbs`
  loads `MathJax.js` 2.7.9 from cdnjs
  (https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/) to render formulas.
- Upstream: https://github.com/mathjax/MathJax
- Licence: Apache License 2.0.

Licence checked 2026-10-24 at
https://raw.githubusercontent.com/mathjax/MathJax/2.7.9/LICENSE (Apache
License, Version 2.0).

## Syne and Epilogue fonts

- Location: not stored in this repository. The hub pages load both fonts from
  Google Fonts (`fonts.googleapis.com`). At build time, the share-card renderer
  (`scripts/og/cards.ts`) reads them from the `@fontsource/syne` and
  `@fontsource/epilogue` packages (5.3.0) and draws the titles as outlines into
  the PNG cards under `og/`.
- Syne: Copyright 2017 The Syne Project Authors
  (https://gitlab.com/bonjour-monde/fonderie/syne-typeface).
- Epilogue: Copyright 2020 The Epilogue Project Authors
  (https://github.com/Etcetera-Type-Co/Epilogue).
- Licence: SIL Open Font License 1.1 (both).

Licence checked 2026-10-24 at
https://raw.githubusercontent.com/google/fonts/main/ofl/syne/OFL.txt and
https://raw.githubusercontent.com/google/fonts/main/ofl/epilogue/OFL.txt; the
installed `@fontsource` packages declare `OFL-1.1` in their `package.json`.
