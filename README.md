# Graphica - Graphing Calculator

A fast, installation-free graphing calculator. It plots linear, quadratic, cubic, quartic, exponential,
logarithmic and custom `f(x)` functions, runs entirely in the browser (no server, nothing to install) and deploys
as a static site.

This is a rebuild of the original Flask + Matplotlib app (`graphcial_calculator/app.py`).

## Features

- **Six function types from the original** (linear, quadratic, cubic, quartic, exponential `a^(bx+d)+c`, logarithmic
  `a·log_b(x)+c`) plus **custom expressions** such as `2x^2 - 3x + 1`, `sin(x)/x` or `e^(-x/4) * sin(3x)`
- **Up to 8 functions** on one graph, each with its own colour, From/To range, show/hide and collapse
- **Interactive graph:** drag to pan, scroll or pinch to zoom, hover/tap to trace any curve, snap to special points,
  arrow keys / `+` / `-` / `0`, fit and reset buttons
- **Analysis:** y-intercept, roots and local minima/maxima, listed under each function and marked on the graph
- **Value table** with any step size, and **CSV export**
- **Share** any graph with a link (functions and view are stored in the URL), **download as PNG**
- Dark and light themes, responsive from phone to desktop

## What changed from the Flask version

| Original | Now |
| --- | --- |
| Server renders a Matplotlib PNG to `static/plot.png` (breaks with several users and on read-only hosts such as Vercel) | Drawn live on a canvas in the browser |
| Integer inputs only, six near-identical branches per function to build the x values | Any real numbers; one smooth sampler |
| Cubic and quartic overwrote the constant term (`d = c` after `c = p`), so those graphs were wrong | All coefficients used correctly (covered by tests) |
| Some ranges left `list_x` undefined and crashed; exponential rendered `index6_result .html` (with a space) | Every range works in both directions; errors are shown next to the field |
| Log accepted any base | Base must be > 0 and not 1, and x ≤ 0 is left undefined |

## Run locally

```bash
npm run start      # serves the folder on http://localhost:3400
npm test           # math tests (parser, functions, roots, extrema, tables)
```

Any static file server works (for example `python -m http.server`). The app uses ES modules, so open it through a
server rather than from `file://`.

## Project layout

```
index.html          page shell
css/styles.css      themes and layout
js/parser.js        safe expression parser (no eval)
js/functions.js     function families, equation text
js/analysis.js      roots, extrema, value tables
js/plot.js          canvas renderer + pan/zoom/pinch/trace
js/main.js          UI, state, sharing
tests/              node:test suite
```

## Deploy

It is a static site, so `vercel deploy --prod` works with no configuration (`vercel.json` only adds security headers).
