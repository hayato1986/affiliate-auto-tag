import type { SiteConfig } from "./types";

type DNRRule = chrome.declarativeNetRequest.Rule;

/**
 * サイト定義からdeclarativeNetRequestルールを生成する
 *
 * 2ルール構成で無限ループを防止:
 * 1. allowルール (priority: 2): パラメータが既にあるURLは何もしない
 * 2. redirectルール (priority: 1): 対象ドメインにパラメータを付与
 */
export function generateSiteRules(
  site: SiteConfig,
  affiliateId: string,
): DNRRule[] {
  const escapedDomains = site.domains
    .map((d) => d.replace(/\./g, "\\."))
    .join("|");
  const domainPattern =
    site.domains.length === 1
      ? `\\.${escapedDomains}/`
      : `\\.(${escapedDomains})/`;

  return [
    // allowルール: パラメータが既にあるURLは許可（リダイレクトをスキップ）
    {
      id: site.ruleIds.allow,
      priority: 2,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.ALLOW,
      },
      condition: {
        regexFilter: `^https://.*${domainPattern}.*[?&]${site.paramPattern}`,
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        ],
      },
    },
    // redirectルール: 対象ドメインにパラメータを付与
    {
      id: site.ruleIds.redirect,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          transform: {
            queryTransform: {
              addOrReplaceParams: [{ key: site.paramKey, value: affiliateId }],
            },
          },
        },
      },
      condition: {
        requestDomains: site.domains,
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        ],
      },
    },
  ];
}
