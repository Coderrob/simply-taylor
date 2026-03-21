### Local Preview

This repo now includes a small local preview harness for the template stylesheet.

- Copy `.env.example` to `.env` or `.env.local` to configure local settings.
- `npm run doctor` checks local prerequisites and environment variables.
- `npm start` starts the local visual preview server.
- `npm run preview` compiles `styles/base.less` plus `styles/reset.css`, watches for style changes, and serves preview pages at `http://localhost:4321`.
- `npm run build` runs the local preview stylesheet build.
- `npm run preview:build` runs a one-off stylesheet compile into `.preview/site.css`.
- Preview routes:
  - `/` homepage shell
  - `/blog.html` blog list approximation
  - `/post.html` blog item approximation

This does not execute Squarespace JSON-T locally. It is intended for fast visual iteration on the base design system before uploading the template to Squarespace.

### License

This repository uses Apache License 2.0 with additional terms that restrict commercial use.

- Core license text: `LICENSE`
- Additional terms: `COMMERCIAL-USE-RESTRICTIONS.md`

If there is any conflict between the Apache 2.0 text and the additional terms,
the additional terms govern for this repository.

### Squarespace Local Development

For the supported local developer workflow, use Squarespace's Local Development Server against a real Developer Mode site.

- Install the official server first by following the Squarespace docs: https://developers.squarespace.com/local-development
- Run `npm run doctor` if the local environment is not behaving as expected.
- Preferred setup: copy `.env.example` to `.env` and set `SQUARESPACE_SITE_URL`.
- Shell environment variables still work and override `.env` values:
  - PowerShell: `$env:SQUARESPACE_SITE_URL="https://your-site.squarespace.com"`
- Start the official server from this repo:
  - `npm run dev`
  - `npm run sqsp:dev`
- Optional variants:
  - `npm run dev:auth`
  - `npm run dev:verbose`
  - `npm run sqsp:dev:auth`
  - `npm run sqsp:dev:verbose`
- Optional port override:
  - `.env`: `SQUARESPACE_DEV_PORT=9000`
  - PowerShell: `$env:SQUARESPACE_DEV_PORT="9000"`

Supported environment variables:

- `SQUARESPACE_SITE_URL`: required for Squarespace-backed local development
- `SQUARESPACE_DEV_PORT`: port used by the Squarespace local development server
- `SQUARESPACE_DEV_AUTH`: set to `1` to add `--auth`
- `SQUARESPACE_DEV_VERBOSE`: set to `1` to add `--verbose`
- `PREVIEW_PORT`: port used by `npm start`

The repo script lives at `scripts/squarespace-dev.js` and forwards the current template directory to `squarespace-server`.

## Base Template

A minimal template for developers getting started with Squarespace, using developer mode. No tweaks, no web fonts, no static assets, no static pages, no system collections, no collection features, no modules at all.

For more information about the Squarespace Developer Platform see [developers.squarespace.com](http://developers.squarespace.com).

### Usage

See the [Developer Getting Started](https://developers.squarespace.com/quick-start) page for an step-by-step guide for getting started with the Squaresapce Developer Platform. You can create a new website using this template by visiting [base-template.squarespace.com](http://base-template.squarespace.com) and clicking the "Create a Site Like This" button. This template is also available on [GitHub](https://github.com/Squarespace/base-template).

### Squarespace Templates

Each Squarespace website is based on a template like this one. Templates contain regular web files like CSS and JavaScript. In addition, Squarespace recognizes a few special file types:

#### JSON-T Template Files

Squarespace template files are written in [JSON Template](https://developers.squarespace.com/what-is-json-t), also known as JSON-T. It is a simple yet expressive template language. JSON-T files have different extensions depending on the type of file, for example `.list`, `.item`, and `.region`.

#### LESS Files

Template LESS files (.less) are processed through the [LESS](http://lesscss.org/) preprocessor. LESS extends CSS with dynamic behavior such as variables, mixins, operations and functions.

### Template Folder Structure

Squarespace template files are organized using the following folder structure at the root of your site:

- **assets**: design assets — example: images, fonts and icons
- **blocks**: reusable blocks of JSON-T (AKA partials) — ex: navigation.block
- **collections**: collection files — [collection].list, [collection].item, [collection].conf
- **pages**: static page files — [static].page, [static].page.conf
- **scripts**: Javascript files — site.js
- **styles**: stylesheet files — styles.css, styles.less
- [**root**]: sitewide files — site.region, template.conf

### Template Partials

This repo now uses Squarespace template partials (`/blocks/*.block`) so aesthetic variants can be swapped without duplicating full page templates.

- `blocks/home-active.block`: single switch point for the current homepage variant
- `blocks/home-variant-collision.block`: current poster-wall / collision layout
- `blocks/home-variant-soft-subversion.block`: alternate softer editorial variant
- `blocks/blog-item-meta.block`: shared blog date/author markup
- `blocks/blog-filters.block`: shared blog filter banner markup

To switch homepage aesthetics for A/B testing, change one line in `blocks/home-active.block`:

```txt
{@|apply home-variant-collision.block}
```

Swap to:

```txt
{@|apply home-variant-soft-subversion.block}
```

Squarespace partial docs:
https://developers.squarespace.com/template-partials

### Essential Files

At the very minimum, your template needs a `.region` file and a `template.conf`.

#### /site.region

Typically this file is used as the global site template – containing the site header, footer, and sidebars. This is like the `index.html` of your site. Every template must have at least one `.region` file. Simple templates will have a single `.region`, more advanced templates will have multiple `.region` files describing header, body, and footer variants. Regions files live in the root directory of a template.

See the [Layouts & Regions documentation](https://developers.squarespace.com/layouts-regions/) for more details.

#### /template.conf

Contains the configuration settings for the template. This is where you can name your template, specify layouts, add navigation sections, specify stylesheets, and other general site options. Template configuration files must live in the root directory of a template.

See the [Template Configuration documentation](https://developers.squarespace.com/template-configuration/) for more details.

### Further Reading

For further reading please consult the [Squarespace Template Overview](https://developers.squarespace.com/template-overview/) and other documentation on the Squarespace developers website.
