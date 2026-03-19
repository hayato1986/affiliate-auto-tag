import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSettings, saveSettings } from "../../src/utils/settings";
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
    };

    const settings = await getSettings();
    expect(settings.amazonJp.enabled).toBe(true);
    expect(settings.amazonJp.affiliateId).toBe("my-tag-22");
  });

  it("不正なaffiliateIdをデフォルトに戻す（storage改ざん対策）", async () => {
    mockStorage.settings = {
      version: 1,
      globalEnabled: true,
      amazonJp: {
        enabled: true,
        affiliateId: '<script>alert("xss")</script>',
      },
    };

    const settings = await getSettings();
    expect(settings.amazonJp.affiliateId).toBe("");
  });

  it("型が不正なglobalEnabledをデフォルトに戻す", async () => {
    mockStorage.settings = {
      version: 1,
      globalEnabled: "yes",
      amazonJp: { enabled: true, affiliateId: "tag-22" },
    };

    const settings = await getSettings();
    expect(settings.globalEnabled).toBe(DEFAULT_SETTINGS.globalEnabled);
  });

  it("amazonJpが存在しない場合デフォルトを使用する", async () => {
    mockStorage.settings = {
      version: 1,
      globalEnabled: true,
    };

    const settings = await getSettings();
    expect(settings.amazonJp).toEqual(DEFAULT_SETTINGS.amazonJp);
  });
});

describe("saveSettings", () => {
  it("設定をストレージに保存する", async () => {
    const settings = {
      version: 1 as const,
      globalEnabled: true,
      amazonJp: { enabled: true, affiliateId: "my-tag-22" },
    };

    await saveSettings(settings);
    expect(mockStorage.settings).toEqual(settings);
  });

  it("保存と読み込みのラウンドトリップ", async () => {
    const original = {
      version: 1 as const,
      globalEnabled: false,
      amazonJp: { enabled: true, affiliateId: "round-trip-22" },
    };

    await saveSettings(original);
    const loaded = await getSettings();

    expect(loaded).toEqual(original);
  });
});
