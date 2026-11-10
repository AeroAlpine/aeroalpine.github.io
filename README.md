# AeroAlpine website

## Mountain opening

The user-selected blue panorama is `assets/mountain-intro.png`; its image provenance is recorded in `assets/mountain-intro.prompt.txt`.

`intro.js` loads the photograph and transparent logo, zooms slowly into the scene, dissolves into the registered logo, and settles that mark into the centered hero above the text. Both image layers share one camera frame; the three summit landmarks are calibrated with a uniform scale and translation so the original logo keeps its proportions.

The sequence lasts about 2 seconds after the images load. Escape, Tab, a click, or a window resize skips it. Reduced-motion users and browsers without animation support see the static page immediately. Image errors and a timeout also reveal the static page. The final page remains one screen tall on the tested desktop and mobile sizes.

Preview with `python3 -m http.server 8080 --bind 127.0.0.1` and open `http://127.0.0.1:8080/`. Pushes to `main` publish through the included GitHub Pages workflow.
