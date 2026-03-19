/**
 * アフィリエイトIDのバリデーション
 * - 英数字・ハイフン・アンダースコアのみ許可
 * - 1〜50文字
 * - 先頭は英数字
 * - URL特殊文字やXSSパターンを拒否
 */
const AFFILIATE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,49}$/;
const DANGEROUS_CHARS = /[&=?#/<>"'`\\]/;

export function validateAffiliateId(id: string): boolean {
  if (typeof id !== "string" || id.length === 0) {
    return false;
  }

  // URL特殊文字・XSSインジェクション文字をブロック
  if (DANGEROUS_CHARS.test(id)) {
    return false;
  }

  return AFFILIATE_ID_PATTERN.test(id);
}

/**
 * 全角英数字を半角に変換
 */
export function toHalfWidth(str: string): string {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  );
}
