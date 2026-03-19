import type { ExtensionSettings, SiteSettings } from "./types";
import { DEFAULT_SETTINGS, SITE_CONFIGS } from "./types";
import { validateAffiliateId } from "./validation";

const STORAGE_KEY = "settings";

function validateSiteSettings(
  raw: Record<string, unknown> | undefined,
): SiteSettings {
  return {
    enabled:
      typeof raw?.enabled === "boolean"
        ? raw.enabled
        : false,
    affiliateId:
      typeof raw?.affiliateId === "string" &&
      validateAffiliateId(raw.affiliateId)
        ? raw.affiliateId
        : "",
  };
}

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

  const settings: ExtensionSettings = {
    version: 1,
    globalEnabled:
      typeof stored.globalEnabled === "boolean"
        ? stored.globalEnabled
        : DEFAULT_SETTINGS.globalEnabled,
    amazonJp: validateSiteSettings(
      stored.amazonJp as Record<string, unknown> | undefined,
    ),
    rakuten: validateSiteSettings(
      stored.rakuten as Record<string, unknown> | undefined,
    ),
    a8net: validateSiteSettings(
      stored.a8net as Record<string, unknown> | undefined,
    ),
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

/**
 * いずれかのサイトが有効かつIDが設定済みかを返す
 */
export function hasAnySiteConfigured(settings: ExtensionSettings): boolean {
  return SITE_CONFIGS.some((site) => {
    const s = settings[site.key];
    return s.enabled && s.affiliateId;
  });
}
