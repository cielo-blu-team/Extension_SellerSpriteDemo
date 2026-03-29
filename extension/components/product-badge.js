/**
 * 商品カードバッジコンポーネント
 * 検索結果の各商品画像左下にオーバーレイ表示
 */

const BADGE_STYLES = `
  .ec-lens-badge {
    position: absolute;
    bottom: 0;
    left: 0;
    background: rgba(15, 15, 30, 0.82);
    color: #fff;
    font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 10px;
    padding: 5px 7px;
    border-radius: 0 4px 0 0;
    line-height: 1.6;
    min-width: 90px;
    pointer-events: none;
    z-index: 100;
  }
  .ec-lens-badge .ec-lens-badge-row {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    white-space: nowrap;
  }
  .ec-lens-badge .ec-lens-badge-label {
    color: rgba(255,255,255,0.6);
  }
  .ec-lens-badge .ec-lens-badge-value {
    font-weight: 600;
  }
  .ec-lens-badge .ec-lens-badge-nation {
    display: inline-block;
    padding: 0 4px;
    border-radius: 2px;
    font-size: 9px;
    font-weight: 700;
  }
  .ec-lens-badge .ec-lens-badge-nation.jp {
    background: #1560BD;
  }
  .ec-lens-badge .ec-lens-badge-nation.cn {
    background: #C62828;
  }
  .ec-lens-badge .ec-lens-badge-nation.other {
    background: #555;
  }
  .ec-lens-badge .ec-lens-badge-bs {
    color: #FFD600;
    font-size: 9px;
    font-weight: 700;
  }
`;

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = BADGE_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

export function applyBadgeToCard(cardEl, productData) {
  injectStyles();

  // 既存バッジを削除
  const existing = cardEl.querySelector('.ec-lens-badge');
  if (existing) existing.remove();

  // 画像コンテナを探す（フォールバック付き）
  const imgWrapper =
    cardEl.querySelector('.s-image-square-aspect') ||
    cardEl.querySelector('.s-image-overlay-grey') ||
    cardEl.querySelector('[data-component-type="s-product-image"]') ||
    cardEl.querySelector('.s-product-image-container') ||
    cardEl.querySelector('.a-section.aok-relative') ||
    cardEl.querySelector('img.s-image')?.closest('a') ||
    cardEl.querySelector('img.s-image')?.parentElement;

  if (!imgWrapper) return;

  // position: relative が必要
  const computedStyle = window.getComputedStyle(imgWrapper);
  if (computedStyle.position === 'static') {
    imgWrapper.style.position = 'relative';
  }

  const badge = document.createElement('div');
  badge.className = 'ec-lens-badge';
  badge.innerHTML = buildBadgeHTML(productData);

  imgWrapper.appendChild(badge);
}

function buildBadgeHTML(data) {
  const rows = [];

  // 月間販売数
  if (data.units != null) {
    rows.push(row('月販', `${Number(data.units).toLocaleString()}個`));
  }

  // 月間売上
  if (data.revenue != null) {
    rows.push(row('売上', formatRevenue(data.revenue)));
  }

  // 出品日（販売期間）
  if (data.availableDate) {
    rows.push(row('出品', formatSalesAge(data.availableDate)));
  }

  // セラー国籍
  if (data.sellerNation) {
    const nation = data.sellerNation.toUpperCase();
    const cls = nation === 'JP' ? 'jp' : nation === 'CN' ? 'cn' : 'other';
    rows.push(`
      <div class="ec-lens-badge-row">
        <span class="ec-lens-badge-label">セラー</span>
        <span class="ec-lens-badge-nation ${cls}">${nation}</span>
      </div>
    `);
  }

  // ベストセラーバッジ
  if (data.badge && data.badge.bestSeller) {
    rows.push(`<div class="ec-lens-badge-bs">★ ベストセラー</div>`);
  }

  return rows.join('');
}

function row(label, value) {
  return `
    <div class="ec-lens-badge-row">
      <span class="ec-lens-badge-label">${label}</span>
      <span class="ec-lens-badge-value">${value}</span>
    </div>
  `;
}

function formatRevenue(revenue) {
  if (revenue >= 10000) {
    return `¥${Math.round(revenue / 10000)}万`;
  }
  return `¥${Number(revenue).toLocaleString()}`;
}

function formatSalesAge(availableDate) {
  if (!availableDate) return '---';
  const date = new Date(availableDate);
  const now = new Date();
  const months = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  if (months < 12) return `${months}ヶ月`;
  return `${(months / 12).toFixed(1)}年`;
}
