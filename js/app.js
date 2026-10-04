(() => {
  const root = document.documentElement;

  /* ---------- Light and dark theme (icon button) ---------- */
  const themeBtn = document.getElementById("theme-toggle");
  const themeIcon = themeBtn.querySelector("use");
  const colorQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Which theme is showing now: the saved choice, or the device setting.
  const currentTheme = () =>
    root.getAttribute("data-theme") || (colorQuery.matches ? "dark" : "light");

  // The icon and its accessible name describe what pressing the button will do.
  const updateThemeButton = () => {
    const dark = currentTheme() === "dark";
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    themeIcon.setAttribute("href", dark ? "#i-sun" : "#i-moon");
  };

  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") root.setAttribute("data-theme", savedTheme);
  } catch (e) {}
  updateThemeButton();

  themeBtn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    updateThemeButton();
  });
  colorQuery.addEventListener?.("change", updateThemeButton);

  /* ---------- Accessibility options panel ---------- */
  const panel = document.getElementById("a11y-panel");
  const openBtn = document.getElementById("a11y-open");
  const defaults = { size: "100", contrast: false, font: false, spacing: false, links: false, motion: false };
  const prefs = { ...defaults };

  // Saved options: each one becomes a data attribute on <html>, and style.css reacts to it.
  const attrs = { contrast: "data-contrast", font: "data-font", spacing: "data-spacing", links: "data-links", motion: "data-motion" };
  const values = { contrast: "high", font: "readable", spacing: "wide", links: "underline", motion: "reduce" };

  try {
    const stored = JSON.parse(localStorage.getItem("a11y-prefs") || "{}");
    Object.keys(defaults).forEach((key) => { if (key in stored) prefs[key] = stored[key]; });
  } catch (e) {}

  let fontLoaded = false;
  const loadReadableFont = () => {
    if (fontLoaded) return;
    fontLoaded = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap";
    document.head.appendChild(link);
  };

  const applyPrefs = () => {
    root.style.setProperty("--fs", `${prefs.size}%`);
    Object.entries(attrs).forEach(([key, attr]) => {
      if (prefs[key]) root.setAttribute(attr, values[key]);
      else root.removeAttribute(attr);
    });
    if (prefs.font) loadReadableFont();
    panel.querySelectorAll('input[name="size"]').forEach((radio) => { radio.checked = radio.value === prefs.size; });
    panel.querySelectorAll("[data-opt]").forEach((checkbox) => { checkbox.checked = !!prefs[checkbox.dataset.opt]; });
  };

  const savePrefs = () => {
    try { localStorage.setItem("a11y-prefs", JSON.stringify(prefs)); } catch (e) {}
  };

  applyPrefs();

  panel.addEventListener("change", (event) => {
    const target = event.target;
    if (target.name === "size") prefs.size = target.value;
    else if (target.dataset.opt) prefs[target.dataset.opt] = target.checked;
    applyPrefs();
    savePrefs();
  });

  document.getElementById("a11y-reset").addEventListener("click", () => {
    Object.assign(prefs, defaults);
    applyPrefs();
    savePrefs();
  });

  // A native <dialog> traps keyboard focus, closes with Escape, and returns focus to the button.
  openBtn.addEventListener("click", () => {
    if (typeof panel.showModal === "function") panel.showModal();
    else panel.setAttribute("open", "");
  });
  document.getElementById("a11y-close").addEventListener("click", () => {
    if (typeof panel.close === "function") panel.close();
    else panel.removeAttribute("open");
  });
  panel.addEventListener("click", (event) => {
    if (event.target === panel) panel.close?.();
  });

  /* ---------- Highlight the link for the section on screen ---------- */
  const navLinks = document.querySelectorAll("[data-target]");
  const markActive = (id) => {
    navLinks.forEach((link) => {
      if (link.dataset.target === id) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };
  markActive("top");

  // Clicking a link should always win over the scroll-based guess below: on
  // this layout, two cards can sit side by side (e.g. a short "About" next
  // to a taller "Projects"), so after the jump finishes, the taller
  // neighbor can still be the one sitting in the detection band and steal
  // the highlight. Pausing the scroll-based check until the jump settles
  // stops that regardless of section height, column layout, or device.
  let paused = false;
  let resumeTimer = null;
  const pauseAutoHighlight = () => {
    paused = true;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { paused = false; }, 1000); // fallback if scrollend never fires
  };
  if ("onscrollend" in window) {
    window.addEventListener("scrollend", () => {
      paused = false;
      clearTimeout(resumeTimer);
    });
  }
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      markActive(link.dataset.target);
      pauseAutoHighlight();
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (paused) return;
      entries.forEach((entry) => { if (entry.isIntersecting) markActive(entry.target.id); });
    }, { rootMargin: "-35% 0px -55% 0px" });

    ["top", "projects", "about", "credentials", "services", "contact"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* ---------- Live local time comparison ---------- */
  const MY_TZ = "Asia/Manila";
  const mineEl = document.getElementById("clock-mine");
  const yoursEl = document.getElementById("clock-yours");
  const diffEl = document.getElementById("clock-diff");

  if (mineEl && yoursEl && diffEl) {
    const timeFormatter = (timeZone) =>
      new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit", hour12: true, timeZone });

    // UTC offset in minutes for a named zone, read from Intl's own output so
    // it stays correct through daylight-saving changes, rather than a
    // hardcoded "+8" that would quietly go stale if the zone ever changes.
    const zoneOffsetMinutes = (timeZone) => {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" }).formatToParts(new Date());
      const name = parts.find((p) => p.type === "timeZoneName")?.value || "";
      const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
      if (!match) return null;
      const sign = match[1] === "-" ? -1 : 1;
      return sign * (parseInt(match[2], 10) * 60 + (match[3] ? parseInt(match[3], 10) : 0));
    };

    const describeDiff = (mineMinutes, visitorMinutes) => {
      if (mineMinutes === null) return "";
      const diff = Math.round((mineMinutes - visitorMinutes) / 15) * 15; // nearest quarter hour
      if (diff === 0) return "Same time as you";
      const hours = Math.abs(diff) / 60;
      const label = hours % 1 === 0 ? hours : hours.toFixed(1);
      return diff > 0 ? `${label}h ahead of you` : `${label}h behind you`;
    };

    const updateClocks = () => {
      const now = new Date();
      mineEl.textContent = timeFormatter(MY_TZ).format(now);
      yoursEl.textContent = timeFormatter().format(now); // no zone given: the visitor's own
      diffEl.textContent = describeDiff(zoneOffsetMinutes(MY_TZ), -now.getTimezoneOffset());
    };

    try {
      updateClocks();
      setInterval(updateClocks, 30000);
    } catch (e) {
      diffEl.textContent = "";
    }
  }
})();
