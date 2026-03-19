import { getSettings, saveSettings } from "../../utils/settings";
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

  // 全て非表示にしてからターゲットを表示
  stateSetup.classList.add("hidden");
  stateActive.classList.add("hidden");
  stateDisabled.classList.add("hidden");

  const hasId = settings.amazonJp.enabled && settings.amazonJp.affiliateId;

  if (!hasId) {
    // 未設定
    stateSetup.classList.remove("hidden");
  } else if (!settings.globalEnabled) {
    // 無効状態
    stateDisabled.classList.remove("hidden");
  } else {
    // 通常状態
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

    if (url.includes("amazon.co.jp")) {
      if (url.includes("tag=")) {
        icon.textContent = "✓";
        icon.className = "tab-icon success";
        text.textContent = "このページ: タグ付与済み";
      } else {
        icon.textContent = "⟳";
        icon.className = "tab-icon pending";
        text.textContent = "このページ: 次回遷移時に付与";
      }
    } else {
      icon.textContent = "—";
      icon.className = "tab-icon neutral";
      text.textContent = "対象外のサイトです";
    }
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
  // 設定ボタン
  $("btn-open-settings")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  $("btn-settings")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // グローバルトグル（通常状態）
  $("toggle-global")?.addEventListener("click", async () => {
    settings.globalEnabled = !settings.globalEnabled;
    await saveSettings(settings);
    announce(settings.globalEnabled ? "有効にしました" : "無効にしました");
    render(settings);
  });

  // グローバルトグル（無効状態）
  $("toggle-global-disabled")?.addEventListener("click", async () => {
    settings.globalEnabled = true;
    await saveSettings(settings);
    announce("有効にしました");
    render(settings);
  });
}

document.addEventListener("DOMContentLoaded", init);
