import { getSettings, saveSettings, hasAnySiteConfigured } from "../../utils/settings";
import { SITE_CONFIGS } from "../../utils/types";
import type { ExtensionSettings } from "../../utils/types";

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

async function init(): Promise<void> {
  const settings = await getSettings();
  applyTheme();
  render(settings);
  bindEvents(settings);
}

function applyTheme(): void {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute(
    "data-theme",
    prefersDark ? "dark" : "light",
  );
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      document.documentElement.setAttribute(
        "data-theme",
        e.matches ? "dark" : "light",
      );
    });
}

function render(settings: ExtensionSettings): void {
  const stateSetup = $("state-setup");
  const stateActive = $("state-active");
  const stateDisabled = $("state-disabled");

  stateSetup.classList.add("hidden");
  stateActive.classList.add("hidden");
  stateDisabled.classList.add("hidden");

  const configured = hasAnySiteConfigured(settings);

  if (!configured) {
    stateSetup.classList.remove("hidden");
  } else if (!settings.globalEnabled) {
    stateDisabled.classList.remove("hidden");
  } else {
    stateActive.classList.remove("hidden");
    const toggle = $<HTMLButtonElement>("toggle-global");
    toggle.setAttribute("aria-checked", String(settings.globalEnabled));
    toggle.classList.toggle("active", settings.globalEnabled);
    updateTabStatus(settings);
  }
}

async function updateTabStatus(settings: ExtensionSettings): Promise<void> {
  const icon = $("tab-status-icon");
  const text = $("tab-status-text");

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = tab?.url ?? "";

    // 現在のタブがどのサイトに該当するかチェック
    for (const site of SITE_CONFIGS) {
      const s = settings[site.key];
      if (!s.enabled || !s.affiliateId) continue;

      const matchesDomain = site.domains.some((d) => url.includes(d));
      if (matchesDomain) {
        if (url.includes(`${site.paramKey}=`)) {
          icon.textContent = "✓";
          icon.className = "tab-icon success";
          text.textContent = `${site.label}: タグ付与済み`;
        } else {
          icon.textContent = "⟳";
          icon.className = "tab-icon pending";
          text.textContent = `${site.label}: 次回遷移時に付与`;
        }
        return;
      }
    }

    icon.textContent = "—";
    icon.className = "tab-icon neutral";
    text.textContent = "対象外のサイトです";
  } catch {
    icon.textContent = "—";
    icon.className = "tab-icon neutral";
    text.textContent = "タブ情報を取得できません";
  }
}

function announce(message: string): void {
  const el = $("status-announce");
  el.textContent = message;
}

function bindEvents(settings: ExtensionSettings): void {
  $("btn-open-settings")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  $("btn-settings")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  $("toggle-global")?.addEventListener("click", async () => {
    settings.globalEnabled = !settings.globalEnabled;
    await saveSettings(settings);
    announce(settings.globalEnabled ? "有効にしました" : "無効にしました");
    render(settings);
  });

  $("toggle-global-disabled")?.addEventListener("click", async () => {
    settings.globalEnabled = true;
    await saveSettings(settings);
    announce("有効にしました");
    render(settings);
  });
}

document.addEventListener("DOMContentLoaded", init);
