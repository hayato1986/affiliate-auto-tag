import { getSettings } from "../utils/settings";
import { generateAmazonJpRules } from "../utils/rules";

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

    // 条件を満たす場合のみルールを追加
    const addRules: chrome.declarativeNetRequest.Rule[] = [];
    if (settings.globalEnabled && settings.amazonJp.enabled && settings.amazonJp.affiliateId) {
      addRules.push(...generateAmazonJpRules(settings.amazonJp.affiliateId));
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });

    // バッジ更新
    await updateBadge(settings.globalEnabled, settings.amazonJp.enabled, settings.amazonJp.affiliateId);
  }

  /**
   * バッジ表示を更新
   */
  async function updateBadge(
    globalEnabled: boolean,
    amazonEnabled: boolean,
    affiliateId: string,
  ): Promise<void> {
    if (!globalEnabled) {
      await chrome.action.setBadgeText({ text: "" });
      await chrome.action.setBadgeBackgroundColor({ color: "#9E9E9E" });
      return;
    }

    if (amazonEnabled && affiliateId) {
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
      // 初回インストール時はオプションページを開く
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
