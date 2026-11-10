"use strict";

(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // The static page remains the default when scripting or motion is unavailable.
  if (reducedMotion.matches || !Element.prototype.animate) return;

  root.classList.add("intro-pending");

  let opening;
  let finished = false;
  let loadingTimer;
  let phaseTimer;
  const animations = [];

  function finish() {
    if (finished) return;
    finished = true;
    window.clearTimeout(failsafe);
    window.clearTimeout(loadingTimer);
    window.clearTimeout(phaseTimer);
    root.classList.remove("intro-pending", "intro-revealing");
    animations.forEach((animation) => animation.cancel());
    (opening || document.querySelector(".opening"))?.remove();
    document.removeEventListener("keydown", skipWithKeyboard);
    window.removeEventListener("resize", finish);
    window.removeEventListener("pagehide", finish);
    reducedMotion.removeEventListener("change", motionChanged);
  }

  function skipWithKeyboard(event) {
    if (event.key === "Escape" || event.key === "Tab") finish();
  }

  function motionChanged(event) {
    if (event.matches) finish();
  }

  const failsafe = window.setTimeout(finish, 6000);
  document.addEventListener("keydown", skipWithKeyboard);
  window.addEventListener("resize", finish);
  window.addEventListener("pagehide", finish);
  reducedMotion.addEventListener("change", motionChanged);

  function animate(element, frames, options) {
    const animation = element.animate(frames, options);
    animations.push(animation);
    return animation;
  }

  function fittedImageBox(image) {
    const box = image.getBoundingClientRect();
    const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    return {
      left: box.left + (box.width - width) / 2,
      top: box.top + (box.height - height) / 2,
      width,
      height,
    };
  }

  // Register the three summit tips with a single uniform scale and translation.
  // No stretching, skewing or changes to the original logo proportions.
  function registration() {
    const logoTips = [[524, 317], [994, 101], [1352, 392]];
    const photoTips = [[730, 309], [955, 205], [1117, 338]];
    const center = (points) => points.reduce((sum, point) =>
      [sum[0] + point[0] / points.length, sum[1] + point[1] / points.length], [0, 0]);
    const a = center(logoTips);
    const b = center(photoTips);
    let numerator = 0;
    let denominator = 0;

    logoTips.forEach((point, index) => {
      const x = point[0] - a[0];
      const y = point[1] - a[1];
      numerator += x * (photoTips[index][0] - b[0]) + y * (photoTips[index][1] - b[1]);
      denominator += x * x + y * y;
    });

    const scale = numerator / denominator;
    return { scale, x: b[0] - a[0] * scale, y: b[1] - a[1] * scale };
  }

  async function start() {
    if (finished) return;
    opening = document.querySelector(".opening");
    const stage = opening?.querySelector(".opening-stage");
    const photo = opening?.querySelector(".opening-photo");
    const logo = opening?.querySelector(".opening-logo");
    const destination = document.querySelector(".hero-art img");
    if (!stage || !photo || !logo || !destination) return finish();

    opening.addEventListener("pointerdown", finish, { once: true });

    try {
      // Start the sequence only after both layers can paint; never show a blank intro.
      await Promise.race([
        Promise.all([photo.decode(), logo.decode(), destination.decode()]),
        new Promise((_, reject) => {
          loadingTimer = window.setTimeout(() => reject(new Error("Intro image load timed out")), 2500);
        }),
      ]);
      window.clearTimeout(loadingTimer);
      if (finished) return;

      const frameWidth = 1774;
      const frameHeight = 887;
      const cover = Math.max(window.innerWidth / frameWidth, window.innerHeight / frameHeight);
      const width = frameWidth * cover;
      const height = frameHeight * cover;
      Object.assign(stage.style, {
        width: `${width}px`,
        height: `${height}px`,
        left: `${(window.innerWidth - width) / 2}px`,
        top: `${(window.innerHeight - height) / 2}px`,
      });

      const fit = registration();
      Object.assign(logo.style, {
        left: `${fit.x / frameWidth * 100}%`,
        top: `${fit.y / frameHeight * 100}%`,
        width: `${fit.scale * 100}%`,
      });
      opening.dataset.phase = "zoom";

      const timing = { duration: 900, fill: "forwards" };
      const zoom = animate(stage, [{ transform: "scale(1)" }, { transform: "scale(1.065)" }], {
        ...timing,
        easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      });
      const dissolve = animate(photo, [
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.2 },
        { opacity: 0, offset: 0.96 },
        { opacity: 0, offset: 1 },
      ], timing);
      const appear = animate(logo, [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: 0.25 },
        { opacity: 1, offset: 0.96 },
        { opacity: 1, offset: 1 },
      ], timing);
      phaseTimer = window.setTimeout(() => { opening.dataset.phase = "dissolve"; }, 200);
      await Promise.all([zoom.finished, dissolve.finished, appear.finished]);
      if (finished) return;

      const from = logo.getBoundingClientRect();
      const to = fittedImageBox(destination);
      if (!to.width || !to.height) return finish();

      // Move the same visible mark into the centered hero before handing it off.
      opening.appendChild(logo);
      logo.classList.add("is-settling");
      Object.assign(logo.style, {
        left: `${to.left}px`,
        top: `${to.top}px`,
        width: `${to.width}px`,
        height: `${to.height}px`,
      });
      stage.style.visibility = "hidden";
      opening.dataset.phase = "settle";
      root.classList.add("intro-revealing");
      const settle = animate(logo, [
        { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})` },
        { transform: "translate(0, 0) scale(1)" },
      ], { duration: 300, fill: "forwards", easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      animate(opening.querySelector(".opening-backdrop"), [{ opacity: 1 }, { opacity: 0 }], {
        duration: 240,
        fill: "forwards",
        easing: "ease-out",
      });
      await settle.finished;
      finish();
    } catch {
      finish();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
