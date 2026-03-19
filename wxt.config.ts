import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  manifest: {
    name: "アフィリエイトID自動付与",
    description: "Amazon・楽天・A8.netのURLにアフィリエイトIDを自動付与します",
    version: "1.1.0",
    default_locale: "ja",
    permissions: ["declarativeNetRequest", "storage", "activeTab"],
    host_permissions: [
      "*://*.amazon.co.jp/*",
      "*://*.rakuten.co.jp/*",
      "*://*.a8.net/*",
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'none'",
    },
    icons: {
      16: "assets/icons/icon-16.png",
      32: "assets/icons/icon-32.png",
      48: "assets/icons/icon-48.png",
      128: "assets/icons/icon-128.png",
    },
    action: {
      default_icon: {
        16: "assets/icons/icon-16.png",
        32: "assets/icons/icon-32.png",
        48: "assets/icons/icon-48.png",
        128: "assets/icons/icon-128.png",
      },
    },
  },
});
