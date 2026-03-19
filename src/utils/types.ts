export interface AmazonJpSettings {
  enabled: boolean;
  affiliateId: string;
}

export interface ExtensionSettings {
  version: 1;
  globalEnabled: boolean;
  amazonJp: AmazonJpSettings;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  version: 1,
  globalEnabled: true,
  amazonJp: {
    enabled: false,
    affiliateId: "",
  },
};

/** declarativeNetRequest ルールIDの定数 */
export const RULE_IDS = {
  AMAZON_JP_ALLOW: 1,
  AMAZON_JP_REDIRECT: 2,
} as const;
