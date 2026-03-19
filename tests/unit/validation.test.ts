import { describe, it, expect } from "vitest";
import { validateAffiliateId, toHalfWidth } from "../../src/utils/validation";

describe("validateAffiliateId", () => {
  it("正常なIDを受け入れる", () => {
    expect(validateAffiliateId("example-22")).toBe(true);
    expect(validateAffiliateId("mytag-22")).toBe(true);
    expect(validateAffiliateId("a")).toBe(true);
    expect(validateAffiliateId("MyStore_Tag-01")).toBe(true);
    expect(validateAffiliateId("abc123")).toBe(true);
  });

  it("空文字を拒否する", () => {
    expect(validateAffiliateId("")).toBe(false);
  });

  it("50文字を超えるIDを拒否する", () => {
    const longId = "a" + "b".repeat(50);
    expect(longId.length).toBe(51);
    expect(validateAffiliateId(longId)).toBe(false);
  });

  it("50文字ちょうどのIDを受け入れる", () => {
    const id50 = "a" + "b".repeat(49);
    expect(id50.length).toBe(50);
    expect(validateAffiliateId(id50)).toBe(true);
  });

  it("先頭がハイフンのIDを拒否する", () => {
    expect(validateAffiliateId("-tag22")).toBe(false);
  });

  it("先頭がアンダースコアのIDを拒否する", () => {
    expect(validateAffiliateId("_tag22")).toBe(false);
  });

  it("XSSスクリプトを拒否する", () => {
    expect(validateAffiliateId('<script>alert(1)</script>')).toBe(false);
  });

  it("パラメータインジェクションを拒否する", () => {
    expect(validateAffiliateId("tag-22&redirect=evil")).toBe(false);
    expect(validateAffiliateId("tag-22?extra=1")).toBe(false);
    expect(validateAffiliateId("tag-22#anchor")).toBe(false);
  });

  it("URLスラッシュを拒否する", () => {
    expect(validateAffiliateId("tag/evil")).toBe(false);
  });

  it("日本語を拒否する", () => {
    expect(validateAffiliateId("タグ22")).toBe(false);
  });

  it("非文字列を拒否する", () => {
    expect(validateAffiliateId(null as unknown as string)).toBe(false);
    expect(validateAffiliateId(undefined as unknown as string)).toBe(false);
    expect(validateAffiliateId(123 as unknown as string)).toBe(false);
  });
});

describe("toHalfWidth", () => {
  it("全角英数字を半角に変換する", () => {
    expect(toHalfWidth("ＡＢＣ１２３")).toBe("ABC123");
  });

  it("半角はそのまま返す", () => {
    expect(toHalfWidth("abc123")).toBe("abc123");
  });

  it("混在した文字列を変換する", () => {
    expect(toHalfWidth("ｍｙtag-２２")).toBe("mytag-22");
  });

  it("記号は変換しない", () => {
    expect(toHalfWidth("tag-22")).toBe("tag-22");
  });
});
