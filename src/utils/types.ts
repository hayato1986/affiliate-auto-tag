/** サイトごとの設定 */
export interface SiteSettings {
  enabled: boolean;
  affiliateId: string;
}

/** サイト定義（ドメイン・パラメータキー等） */
export interface SiteConfig {
  /** 設定キー（settings内のプロパティ名） */
  key: SiteKey;
  /** UI表示名 */
  label: string;
  /** 対象ドメイン */
  domains: string[];
  /** URLに付与するパラメータキー */
  paramKey: string;
  /** allowルールの regexFilter で使うパラメータパターン */
  paramPattern: string;
  /** UI上のプレースホルダー例 */
  placeholder: string;
  /** テスト用URL */
  testUrl: string;
  /** IDラベル */
  idLabel: string;
  /** ルールIDペア */
  ruleIds: { allow: number; redirect: number };
}

export type SiteKey = "amazonJp" | "rakuten" | "a8net";

export interface ExtensionSettings {
  version: 1;
  globalEnabled: boolean;
  amazonJp: SiteSettings;
  rakuten: SiteSettings;
  a8net: SiteSettings;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  version: 1,
  globalEnabled: true,
  amazonJp: { enabled: false, affiliateId: "" },
  rakuten: { enabled: false, affiliateId: "" },
  a8net: { enabled: false, affiliateId: "" },
};

/** サイト定義一覧 */
export const SITE_CONFIGS: SiteConfig[] = [
  {
    key: "amazonJp",
    label: "Amazon.co.jp",
    domains: ["amazon.co.jp"],
    paramKey: "tag",
    paramPattern: "tag=",
    placeholder: "例: mytag-22",
    testUrl: "https://www.amazon.co.jp/",
    idLabel: "アソシエイトID",
    ruleIds: { allow: 1, redirect: 2 },
  },
  {
    key: "rakuten",
    label: "楽天市場",
    domains: ["rakuten.co.jp"],
    paramKey: "scid",
    paramPattern: "scid=",
    placeholder: "例: af_my_link",
    testUrl: "https://www.rakuten.co.jp/",
    idLabel: "アフィリエイトID",
    ruleIds: { allow: 3, redirect: 4 },
  },
  {
    key: "a8net",
    label: "A8.net",
    domains: ["a8.net"],
    paramKey: "a8mat",
    paramPattern: "a8mat=",
    placeholder: "例: XXXXX+YYYYY+ZZZZZ",
    testUrl: "https://www.a8.net/",
    idLabel: "メディアID",
    ruleIds: { allow: 5, redirect: 6 },
  },
];

/** 全ルールIDの一覧 */
export const ALL_RULE_IDS = SITE_CONFIGS.flatMap((s) => [
  s.ruleIds.allow,
  s.ruleIds.redirect,
]);
