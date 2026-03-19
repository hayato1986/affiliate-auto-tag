import { RULE_IDS } from "./types";

type DNRRule = chrome.declarativeNetRequest.Rule;

/**
 * Amazon.co.jp 用の declarativeNetRequest ルールを生成する
 *
 * 2ルール構成で無限ループを防止:
 * 1. allowルール (priority: 2): tag= が既にあるURLは何もしない
 * 2. redirectルール (priority: 1): amazon.co.jp へのアクセスに tag を付与
 *
 * allowルールが高優先度のため、tag付与済みURLではredirectが発火しない
 */
export function generateAmazonJpRules(affiliateId: string): DNRRule[] {
  return [
    // ルール1: tagが既にあるURLは許可（リダイレクトをスキップ）
    {
      id: RULE_IDS.AMAZON_JP_ALLOW,
      priority: 2,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.ALLOW,
      },
      condition: {
        regexFilter: "^https://.*\\.amazon\\.co\\.jp/.*[?&]tag=",
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        ],
      },
    },
    // ルール2: amazon.co.jp へのアクセスに tag を付与
    {
      id: RULE_IDS.AMAZON_JP_REDIRECT,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          transform: {
            queryTransform: {
              addOrReplaceParams: [{ key: "tag", value: affiliateId }],
            },
          },
        },
      },
      condition: {
        requestDomains: ["amazon.co.jp"],
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        ],
      },
    },
  ];
}
