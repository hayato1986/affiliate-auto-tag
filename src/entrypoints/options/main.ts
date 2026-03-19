import { getSettings, saveSettings } from "../../utils/settings";
import { validateAffiliateId, toHalfWidth } from "../../utils/validation";
import type { ExtensionSettings } from "../../utils/types";

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

let currentSettings: ExtensionSettings;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function init(): Promise<void> {
  currentSettings = await getSettings();
  applyTheme();
  renderSettings();
  bindEvents();
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

function renderSettings(): void {
  const toggle = $<HTMLButtonElement>("toggle-amazon");
  const input = $<HTMLInputElement>("affiliate-id");
  const settingsBody = $("amazon-settings");

  toggle.setAttribute(
    "aria-checked",
    String(currentSettings.amazonJp.enabled),
  );
  toggle.classList.toggle("active", currentSettings.amazonJp.enabled);

  input.value = currentSettings.amazonJp.affiliateId;
  settingsBody.classList.toggle("disabled", !currentSettings.amazonJp.enabled);

  updateValidation(currentSettings.amazonJp.affiliateId);
}

function updateValidation(value: string): void {
  const msg = $("validation-msg");

  if (value.length === 0) {
    msg.textContent = "アソシエイトIDを入力してください";
    msg.className = "validation-msg empty";
    return;
  }

  if (validateAffiliateId(value)) {
    msg.textContent =
      "✓ 有効な形式です（※Amazon側の登録有無は確認していません）";
    msg.className = "validation-msg valid";
  } else {
    msg.textContent = "形式が正しくありません（例: mytag-22）";
    msg.className = "validation-msg invalid";
  }
}

function debouncedSave(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(async () => {
    await saveSettings(currentSettings);
    showSaveFeedback();
  }, 500);
}

function showSaveFeedback(): void {
  const el = $("save-feedback");
  el.classList.remove("hidden");
  setTimeout(() => {
    el.classList.add("hidden");
  }, 2000);
}

function announce(message: string): void {
  const el = $("status-announce");
  el.textContent = message;
}

function bindEvents(): void {
  // Amazon トグル
  $("toggle-amazon").addEventListener("click", async () => {
    currentSettings.amazonJp.enabled = !currentSettings.amazonJp.enabled;
    renderSettings();
    await saveSettings(currentSettings);
    showSaveFeedback();
    announce(
      currentSettings.amazonJp.enabled
        ? "Amazon.co.jp を有効にしました"
        : "Amazon.co.jp を無効にしました",
    );
  });

  // アソシエイトID入力
  const input = $<HTMLInputElement>("affiliate-id");
  input.addEventListener("input", () => {
    // 全角→半角変換
    const converted = toHalfWidth(input.value);
    if (converted !== input.value) {
      const pos = input.selectionStart;
      input.value = converted;
      input.setSelectionRange(pos, pos);
    }

    currentSettings.amazonJp.affiliateId = input.value;
    updateValidation(input.value);

    if (validateAffiliateId(input.value) || input.value === "") {
      debouncedSave();
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
