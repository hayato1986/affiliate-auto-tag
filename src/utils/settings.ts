import type { ExtensionSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { validateAffiliateId } from "./validation";

const STORAGE_KEY = "settings";

/**
 * chrome.storage.sync から設定を読み込む
 * 読み込み時に再バリデーションを行い、不正データを修正する
 */
export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Record<string, unknown> | undefined;

  if (!stored || typeof stored !== "object") {
    return { ...DEFAULT_SETTINGS };
  }

  const amazonJp = stored.amazonJp as Record<string, unknown> | undefined;

  // 再バリデーション（storage改ざん対策）
  const settings: ExtensionSettings = {
    version: 1,
    globalEnabled:
      typeof stored.globalEnabled === "boolean"
        ? stored.globalEnabled
        : DEFAULT_SETTINGS.globalEnabled,
    amazonJp: {
      enabled:
        typeof amazonJp?.enabled === "boolean"
          ? amazonJp.enabled
          : DEFAULT_SETTINGS.amazonJp.enabled,
      affiliateId:
        typeof amazonJp?.affiliateId === "string" &&
        validateAffiliateId(amazonJp.affiliateId)
          ? amazonJp.affiliateId
          : DEFAULT_SETTINGS.amazonJp.affiliateId,
    },
  };

  return settings;
}

/**
 * 設定を chrome.storage.sync に保存
 */
export async function saveSettings(
  settings: ExtensionSettings,
): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}
