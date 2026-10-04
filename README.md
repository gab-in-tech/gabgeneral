# Gab — Web Development VA portfolio

Plain HTML, CSS, and JavaScript. No build step, no framework.
Built on top of HTML5 Boilerplate v9.0.1 (see css/style.css for the parts
that come from H5BP versus the site-specific styles below them).

## Folder layout

```
index.html          the site
404.html             shown for broken links, once hosted
css/style.css        H5BP base styles + this site's design
js/app.js            theme toggle, accessibility panel, active-link highlight
img/                 add your own images here
icon.svg, icon.png,  tab icon and home-screen icon (generated placeholder
favicon.ico          monograms — swap for your own logo any time)
site.webmanifest     lets phones treat the site like an app
robots.txt           search engine crawling rules
```

## Editing content

Open `index.html` and look for these landmarks (search for the text):
- Name, title, and photo: inside `<header class="sidebar">`
- Headline and intro: the `<section class="hero">`
- Projects, About, Credentials, Services, Tools, Contact: each is a
  `<section class="card ...">` inside the `<div class="bento">`

Comments in the file mark the placeholder links (GitHub, LinkedIn, email,
project URLs) and the credential status, which should stay truthful.

## Running it locally

No install needed. Open `index.html` directly in a browser, or serve the
folder so `/favicon.ico`-style absolute paths resolve correctly:

```
npx serve .
```

## Deploying

Push the folder to GitHub and connect it in Cloudflare Pages (no build
command needed — use `exit 0`, output directory `/`), or drag the folder
into the Pages dashboard for a direct upload.

## Before going live

- Fill in `og:url` in `index.html` once the site has a domain
- Replace the generated monogram icons with a real logo if you have one
- Fill in `robots.txt`'s sitemap line if you add one
- Re-run WAVE, Lighthouse, and the W3C HTML validator after any edit
