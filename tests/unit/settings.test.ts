import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSettings, saveSettings, hasAnySiteConfigured } from "../../src/utils/settings";
import { DEFAULT_SETTINGS } from "../../src/utils/types";

// chrome.storage.sync のモック
let mockStorage: Record<string, unknown> = {};

beforeEach(() => {
  mockStorage = {};
  vi.stubGlobal("chrome", {
    storage: {
      sync: {
        get: vi.fn(async (key: string) => {
          return { [key]: mockStorage[key] };
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(mockStorage, items);
        }),
      },
    },
  });
});

describe("getSettings", () => {
  it("ストレージが空の場合デフォルト値を返す", async () => {
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("保存済みの設定を読み込む", async () => {
    mockStorage.settings = {
      version: 1,
      globalEnabled: true,
      amazonJp: { enabled: true, affiliateId: "my-tag-22" },
      rakuten: { enabled: false, affiliateId: "" },
      a8net: { enabled: false, affiliateId: "" },
    };

    const settings = await getSettings();
    expect(settings.amazonJp.enabled).toBe(true);
    expect(settings.amazonJp.affiliateId).toBe("my-tag-22");
  });

  it("複数サイトの設定を読み込む", async () => {
    mockStorage.settings = {
      version: 1,
      globalEnabled: true,
      amazonJp: { enabled: true, affiliateId: "amz-22" },
      rakuten: { enabled: true, affiliateId: "rak-id" },
      a8net: { enabled: false, affiliateId: "a8-id" },
    };

    const settings = await getSettings();
    expect(settings.amazonJp.affiliateId).toBe("amz-22");
    expect(settings.rakuten.affiliateId).toBe("rak-id");
    expect(settings.a8net.enabled).toBe(false);
    expect(settings.a8net.affiliateId).toBe("a8-id");
  });

  it("不正なaffiliateIdをデフォルトに戻す（storage改ざん対策）", async () => {
    mockStorage.settings = {
      version: 1,
      globalEnabled: true,
      amazonJp: { enabled: true, affiliateId: '<script>alert("xss")</script>' },
      rakuten: { enabled: true, affiliateId: "valid-id" },
      a8net: { enabled: false, affiliateId: "" },
    };

    const settings = await getSettings();
    expect(settings.amazonJp.affiliateId).toBe("");
    expect(settings.rakuten.affiliateId).toBe("valid-id");
  });

  it("サイトキーが存在しない場合デフォルトを使用する", async () => {
    mockStorage.settings = {
      version: 1,
      globalEnabled: true,
    };

    const settings = await getSettings();
    expect(settings.amazonJp).toEqual(DEFAULT_SETTINGS.amazonJp);
    expect(settings.rakuten).toEqual(DEFAULT_SETTINGS.rakuten);
    expect(settings.a8net).toEqual(DEFAULT_SETTINGS.a8net);
  });
});

describe("saveSettings", () => {
  it("設定をストレージに保存する", async () => {
    const settings = {
      version: 1 as const,
      globalEnabled: true,
      amazonJp: { enabled: true, affiliateId: "my-tag-22" },
      rakuten: { enabled: false, affiliateId: "" },
      a8net: { enabled: false, affiliateId: "" },
    };

    await saveSettings(settings);
    expect(mockStorage.settings).toEqual(settings);
  });

  it("保存と読み込みのラウンドトリップ", async () => {
    const original = {
      version: 1 as const,
      globalEnabled: false,
      amazonJp: { enabled: true, affiliateId: "round-trip-22" },
      rakuten: { enabled: true, affiliateId: "rakuten-id" },
      a8net: { enabled: false, affiliateId: "" },
    };

    await saveSettings(original);
    const loaded = await getSettings();
    expect(loaded).toEqual(original);
  });
});

describe("hasAnySiteConfigured", () => {
  it("いずれかのサイトが有効かつID設定済みならtrue", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      amazonJp: { enabled: true, affiliateId: "tag-22" },
    };
    expect(hasAnySiteConfigured(settings)).toBe(true);
  });

  it("全サイト未設定ならfalse", () => {
    expect(hasAnySiteConfigured(DEFAULT_SETTINGS)).toBe(false);
  });

  it("有効だがID未入力はfalse", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      amazonJp: { enabled: true, affiliateId: "" },
    };
    expect(hasAnySiteConfigured(settings)).toBe(false);
  });
});
