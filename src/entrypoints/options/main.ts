import { getSettings, saveSettings } from "../../utils/settings";
import { validateAffiliateId, toHalfWidth } from "../../utils/validation";
import { SITE_CONFIGS } from "../../utils/types";
import type { ExtensionSettings, SiteConfig } from "../../utils/types";

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

let currentSettings: ExtensionSettings;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function init(): Promise<void> {
  currentSettings = await getSettings();
  applyTheme();
  buildSiteCards();
  buildTestLinks();
  renderAll();
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

/** サイトごとの設定カードをDOM生成 */
function buildSiteCards(): void {
  const container = $("sites-container");
  for (const site of SITE_CONFIGS) {
    const section = document.createElement("section");
    section.className = "card";
    section.id = `card-${site.key}`;

    const header = document.createElement("div");
    header.className = "card-header";

    const h2 = document.createElement("h2");
    h2.textContent = site.label;

    const toggle = document.createElement("button");
    toggle.id = `toggle-${site.key}`;
    toggle.className = "toggle";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-checked", "false");
    toggle.setAttribute("aria-label", `${site.label} の有効/無効`);
    const thumb = document.createElement("span");
    thumb.className = "toggle-thumb";
    toggle.appendChild(thumb);

    header.appendChild(h2);
    header.appendChild(toggle);

    const body = document.createElement("div");
    body.id = `body-${site.key}`;
    body.className = "card-body";

    const label = document.createElement("label");
    label.className = "field-label";
    label.setAttribute("for", `input-${site.key}`);
    label.textContent = site.idLabel;

    const input = document.createElement("input");
    input.type = "text";
    input.id = `input-${site.key}`;
    input.className = "input";
    input.placeholder = site.placeholder;
    input.autocomplete = "off";
    input.spellcheck = false;

    const validation = document.createElement("div");
    validation.id = `validation-${site.key}`;
    validation.className = "validation-msg";

    body.appendChild(label);
    body.appendChild(input);
    body.appendChild(validation);

    section.appendChild(header);
    section.appendChild(body);
    container.appendChild(section);
  }
}

/** テストリンクを生成 */
function buildTestLinks(): void {
  const container = $("test-links");
  for (const site of SITE_CONFIGS) {
    const a = document.createElement("a");
    a.href = site.testUrl;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = "test-link";
    a.textContent = `${site.label} で確認する →`;
    container.appendChild(a);
  }
}

function renderAll(): void {
  for (const site of SITE_CONFIGS) {
    renderSite(site);
  }
}

function renderSite(site: SiteConfig): void {
  const s = currentSettings[site.key];
  const toggle = $<HTMLButtonElement>(`toggle-${site.key}`);
  const input = $<HTMLInputElement>(`input-${site.key}`);
  const body = $(`body-${site.key}`);

  toggle.setAttribute("aria-checked", String(s.enabled));
  toggle.classList.toggle("active", s.enabled);
  input.value = s.affiliateId;
  body.classList.toggle("disabled", !s.enabled);
  updateValidation(site, s.affiliateId);
}

function updateValidation(site: SiteConfig, value: string): void {
  const msg = $(`validation-${site.key}`);

  if (value.length === 0) {
    msg.textContent = `${site.idLabel}を入力してください`;
    msg.className = "validation-msg empty";
    return;
  }

  if (validateAffiliateId(value)) {
    msg.textContent = "✓ 有効な形式です（※登録有無は確認していません）";
    msg.className = "validation-msg valid";
  } else {
    msg.textContent = `形式が正しくありません（${site.placeholder}）`;
    msg.className = "validation-msg invalid";
  }
}

function debouncedSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await saveSettings(currentSettings);
    showSaveFeedback();
  }, 500);
}

function showSaveFeedback(): void {
  const el = $("save-feedback");
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2000);
}

function announce(message: string): void {
  $("status-announce").textContent = message;
}

function bindEvents(): void {
  for (const site of SITE_CONFIGS) {
    // トグル
    $(`toggle-${site.key}`).addEventListener("click", async () => {
      currentSettings[site.key].enabled = !currentSettings[site.key].enabled;
      renderSite(site);
      await saveSettings(currentSettings);
      showSaveFeedback();
      announce(
        currentSettings[site.key].enabled
          ? `${site.label} を有効にしました`
          : `${site.label} を無効にしました`,
      );
    });

    // ID入力
    const input = $<HTMLInputElement>(`input-${site.key}`);
    input.addEventListener("input", () => {
      const converted = toHalfWidth(input.value);
      if (converted !== input.value) {
        const pos = input.selectionStart;
        input.value = converted;
        input.setSelectionRange(pos, pos);
      }

      currentSettings[site.key].affiliateId = input.value;
      updateValidation(site, input.value);

      if (validateAffiliateId(input.value) || input.value === "") {
        debouncedSave();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
