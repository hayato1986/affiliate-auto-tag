import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateAmazonJpRules } from "../../src/utils/rules";
import { RULE_IDS } from "../../src/utils/types";

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

describe("generateAmazonJpRules", () => {
  it("2つのルールを生成する", () => {
    const rules = generateAmazonJpRules("mytag-22");
    expect(rules).toHaveLength(2);
  });

  it("allowルールがredirectルールより高い優先度を持つ", () => {
    const rules = generateAmazonJpRules("mytag-22");
    const allowRule = rules.find((r) => r.id === RULE_IDS.AMAZON_JP_ALLOW)!;
    const redirectRule = rules.find(
      (r) => r.id === RULE_IDS.AMAZON_JP_REDIRECT,
    )!;

    expect(allowRule.priority!).toBeGreaterThan(redirectRule.priority!);
  });

  it("allowルールが tag= パラメータを持つURLにマッチする", () => {
    const rules = generateAmazonJpRules("mytag-22");
    const allowRule = rules.find((r) => r.id === RULE_IDS.AMAZON_JP_ALLOW)!;

    expect(allowRule.condition.regexFilter).toBeDefined();
    const regex = new RegExp(allowRule.condition.regexFilter!);

    // マッチすべきURL
    expect(regex.test("https://www.amazon.co.jp/dp/B08N5WRWNW?tag=mytag-22")).toBe(true);
    expect(regex.test("https://www.amazon.co.jp/s?k=test&tag=other-22")).toBe(true);

    // マッチしないURL
    expect(regex.test("https://www.amazon.co.jp/dp/B08N5WRWNW")).toBe(false);
    expect(regex.test("https://www.amazon.co.jp/")).toBe(false);
  });

  it("redirectルールが addOrReplaceParams で正しい tag を設定する", () => {
    const rules = generateAmazonJpRules("my-affiliate-tag");
    const redirectRule = rules.find(
      (r) => r.id === RULE_IDS.AMAZON_JP_REDIRECT,
    )!;

    const params =
      redirectRule.action.redirect?.transform?.queryTransform
        ?.addOrReplaceParams;
    expect(params).toEqual([{ key: "tag", value: "my-affiliate-tag" }]);
  });

  it("両方のルールが main_frame のみを対象とする", () => {
    const rules = generateAmazonJpRules("mytag-22");
    for (const rule of rules) {
      expect(rule.condition.resourceTypes).toEqual(["main_frame"]);
    }
  });

  it("redirectルールが amazon.co.jp をリクエストドメインに指定する", () => {
    const rules = generateAmazonJpRules("mytag-22");
    const redirectRule = rules.find(
      (r) => r.id === RULE_IDS.AMAZON_JP_REDIRECT,
    )!;

    expect(redirectRule.condition.requestDomains).toEqual(["amazon.co.jp"]);
  });

  it("affiliateId変更時にルールのvalue値が反映される", () => {
    const rules1 = generateAmazonJpRules("tag-A");
    const rules2 = generateAmazonJpRules("tag-B");

    const getTagValue = (rules: typeof rules1) =>
      rules.find((r) => r.id === RULE_IDS.AMAZON_JP_REDIRECT)!.action.redirect
        ?.transform?.queryTransform?.addOrReplaceParams?.[0]?.value;

    expect(getTagValue(rules1)).toBe("tag-A");
    expect(getTagValue(rules2)).toBe("tag-B");
  });

  it("allowルールのアクションタイプがallowである", () => {
    const rules = generateAmazonJpRules("mytag-22");
    const allowRule = rules.find((r) => r.id === RULE_IDS.AMAZON_JP_ALLOW)!;
    expect(allowRule.action.type).toBe("allow");
  });

  it("redirectルールのアクションタイプがredirectである", () => {
    const rules = generateAmazonJpRules("mytag-22");
    const redirectRule = rules.find(
      (r) => r.id === RULE_IDS.AMAZON_JP_REDIRECT,
    )!;
    expect(redirectRule.action.type).toBe("redirect");
  });
});
