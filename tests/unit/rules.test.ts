import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSiteRules } from "../../src/utils/rules";
import { SITE_CONFIGS } from "../../src/utils/types";
import type { SiteConfig } from "../../src/utils/types";

// chrome.declarativeNetRequest の列挙型をモック
beforeEach(() => {
  vi.stubGlobal("chrome", {
    declarativeNetRequest: {
      RuleActionType: {
        ALLOW: "allow",
        REDIRECT: "redirect",
      },
      ResourceType: {
        MAIN_FRAME: "main_frame",
      },
    },
  });
});

describe("generateSiteRules", () => {
  const amazonConfig = SITE_CONFIGS.find((s) => s.key === "amazonJp")!;
  const rakutenConfig = SITE_CONFIGS.find((s) => s.key === "rakuten")!;
  const a8netConfig = SITE_CONFIGS.find((s) => s.key === "a8net")!;

  it("各サイトで2つのルールを生成する", () => {
    for (const site of SITE_CONFIGS) {
      const rules = generateSiteRules(site, "test-id");
      expect(rules).toHaveLength(2);
    }
  });

  it("allowルールがredirectルールより高い優先度を持つ", () => {
    for (const site of SITE_CONFIGS) {
      const rules = generateSiteRules(site, "test-id");
      const allowRule = rules.find((r) => r.id === site.ruleIds.allow)!;
      const redirectRule = rules.find((r) => r.id === site.ruleIds.redirect)!;
      expect(allowRule.priority!).toBeGreaterThan(redirectRule.priority!);
    }
  });

  it("Amazon: allowルールが tag= パラメータを持つURLにマッチする", () => {
    const rules = generateSiteRules(amazonConfig, "mytag-22");
    const allowRule = rules.find((r) => r.id === amazonConfig.ruleIds.allow)!;
    const regex = new RegExp(allowRule.condition.regexFilter!);

    expect(regex.test("https://www.amazon.co.jp/dp/B08N5WRWNW?tag=mytag-22")).toBe(true);
    expect(regex.test("https://www.amazon.co.jp/s?k=test&tag=other-22")).toBe(true);
    expect(regex.test("https://www.amazon.co.jp/dp/B08N5WRWNW")).toBe(false);
  });

  it("楽天: allowルールが scid= パラメータを持つURLにマッチする", () => {
    const rules = generateSiteRules(rakutenConfig, "my-rakuten-id");
    const allowRule = rules.find((r) => r.id === rakutenConfig.ruleIds.allow)!;
    const regex = new RegExp(allowRule.condition.regexFilter!);

    expect(regex.test("https://item.rakuten.co.jp/shop/item?scid=my-id")).toBe(true);
    expect(regex.test("https://www.rakuten.co.jp/")).toBe(false);
  });

  it("A8.net: allowルールが a8mat= パラメータを持つURLにマッチする", () => {
    const rules = generateSiteRules(a8netConfig, "XXXXX");
    const allowRule = rules.find((r) => r.id === a8netConfig.ruleIds.allow)!;
    const regex = new RegExp(allowRule.condition.regexFilter!);

    expect(regex.test("https://px.a8.net/svt/ejp?a8mat=XXXXX")).toBe(true);
    expect(regex.test("https://www.a8.net/")).toBe(false);
  });

  it("redirectルールが正しいパラメータキーとバリューを設定する", () => {
    const testCases: [SiteConfig, string, string][] = [
      [amazonConfig, "my-tag", "tag"],
      [rakutenConfig, "rak-id", "scid"],
      [a8netConfig, "a8-id", "a8mat"],
    ];

    for (const [site, id, expectedKey] of testCases) {
      const rules = generateSiteRules(site, id);
      const redirectRule = rules.find((r) => r.id === site.ruleIds.redirect)!;
      const params =
        redirectRule.action.redirect?.transform?.queryTransform?.addOrReplaceParams;
      expect(params).toEqual([{ key: expectedKey, value: id }]);
    }
  });

  it("全ルールが main_frame のみを対象とする", () => {
    for (const site of SITE_CONFIGS) {
      const rules = generateSiteRules(site, "test-id");
      for (const rule of rules) {
        expect(rule.condition.resourceTypes).toEqual(["main_frame"]);
      }
    }
  });

  it("redirectルールが正しいドメインを指定する", () => {
    for (const site of SITE_CONFIGS) {
      const rules = generateSiteRules(site, "test-id");
      const redirectRule = rules.find((r) => r.id === site.ruleIds.redirect)!;
      expect(redirectRule.condition.requestDomains).toEqual(site.domains);
    }
  });

  it("各サイトのルールIDが一意である", () => {
    const allIds = SITE_CONFIGS.flatMap((s) => [s.ruleIds.allow, s.ruleIds.redirect]);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });
});
