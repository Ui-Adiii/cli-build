const THEME_KEY = "cli-build-theme";

const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

// Theme management
function applyTheme(theme) {
  root.dataset.theme = theme;

  const icon = themeToggle.querySelector(".theme-icon");

  if (theme === "dark") {
    icon.innerHTML = `
      <path d="M20.2 15.2A8.4 8.4 0 0 1 8.8 3.8
      8.5 8.5 0 1 0 20.2 15.2Z"/>
    `;

    themeToggle.setAttribute("aria-label", "Switch to light theme");
  } else {
    icon.innerHTML = `
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2
      M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42
      m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42
      M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/>
    `;

    themeToggle.setAttribute("aria-label", "Switch to dark theme");
  }
}

// Initialize saved theme
const savedTheme = localStorage.getItem(THEME_KEY);

const systemPrefersDark = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches;

applyTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));

// Toggle theme
themeToggle.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";

  localStorage.setItem(THEME_KEY, nextTheme);

  applyTheme(nextTheme);
});

// Copy installation commands
document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copyTarget);

    if (!target) return;

    try {
      await navigator.clipboard.writeText(target.textContent);

      button.textContent = "Copied";
      button.classList.add("copied");
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      button.textContent = "Copy failed";
    }

    setTimeout(() => {
      button.textContent = "Copy";
      button.classList.remove("copied");
    }, 1600);
  });
});
