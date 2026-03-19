import { getSettings, hasAnySiteConfigured } from "../utils/settings";
import { generateSiteRules } from "../utils/rules";
import { SITE_CONFIGS } from "../utils/types";

export default defineBackground(() => {
  /**
   * 動的ルールを更新する（冪等）
   * 既存の動的ルール全削除 → 新ルール生成・適用
   */
  async function updateRules(): Promise<void> {
    const settings = await getSettings();

    // 既存の動的ルールIDを取得して全削除
    const existingRules =
      await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map((r) => r.id);

    // 有効なサイトのルールを生成
    const addRules: chrome.declarativeNetRequest.Rule[] = [];
    if (settings.globalEnabled) {
      for (const site of SITE_CONFIGS) {
        const s = settings[site.key];
        if (s.enabled && s.affiliateId) {
          addRules.push(...generateSiteRules(site, s.affiliateId));
        }
      }
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });

    await updateBadge(settings);
  }

  /**
   * バッジ表示を更新
   */
  async function updateBadge(
    settings: Awaited<ReturnType<typeof getSettings>>,
  ): Promise<void> {
    if (!settings.globalEnabled) {
      await chrome.action.setBadgeText({ text: "" });
      await chrome.action.setBadgeBackgroundColor({ color: "#9E9E9E" });
      return;
    }

    if (hasAnySiteConfigured(settings)) {
      await chrome.action.setBadgeText({ text: "✓" });
      await chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    } else {
      await chrome.action.setBadgeText({ text: "!" });
      await chrome.action.setBadgeBackgroundColor({ color: "#FF9800" });
    }
  }

  // インストール時の初期化
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      chrome.runtime.openOptionsPage();
    }
    await updateRules();
  });

  // 設定変更時にルール再生成
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "sync" && changes.settings) {
      await updateRules();
    }
  });

  // Service Worker起動時にもルール確認
  updateRules();
});
