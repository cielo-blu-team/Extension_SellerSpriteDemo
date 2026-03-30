(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // extension/components/summary-bar.js
  var SummaryBar;
  var init_summary_bar = __esm({
    "extension/components/summary-bar.js"() {
      SummaryBar = class {
        constructor() {
          this.el = null;
          this.state = "idle";
        }
        render() {
          const bar = document.createElement("div");
          bar.id = "ec-lens-summary-bar";
          bar.innerHTML = `
      <style>
        #ec-lens-summary-bar {
          position: relative;
          z-index: 9999;
          background: #1A237E;
          color: #fff;
          font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        #ec-lens-summary-bar .ec-lens-brand {
          font-weight: 700;
          font-size: 14px;
          color: #90CAF9;
          white-space: nowrap;
          margin-right: 4px;
        }
        #ec-lens-summary-bar .ec-lens-metrics {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          flex-wrap: wrap;
        }
        #ec-lens-summary-bar .ec-lens-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }
        #ec-lens-summary-bar .ec-lens-metric-label {
          font-size: 10px;
          color: rgba(255,255,255,0.65);
          white-space: nowrap;
        }
        #ec-lens-summary-bar .ec-lens-metric-value {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
        }
        #ec-lens-summary-bar .ec-lens-metric-value.pending {
          color: rgba(255,255,255,0.3);
        }
        #ec-lens-summary-bar .ec-lens-analyze-btn {
          background: #1560BD;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        #ec-lens-summary-bar .ec-lens-analyze-btn:hover {
          background: #1976D2;
        }
        #ec-lens-summary-bar .ec-lens-analyze-btn:disabled {
          background: rgba(255,255,255,0.2);
          cursor: default;
        }
        #ec-lens-summary-bar .ec-lens-error {
          color: #FFCDD2;
          font-size: 12px;
          flex: 1;
        }
        #ec-lens-summary-bar .ec-lens-retry-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.5);
          color: #fff;
          border-radius: 4px;
          padding: 4px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        .ec-lens-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: ec-lens-spin 0.6s linear infinite;
          vertical-align: middle;
          margin-right: 4px;
        }
        @keyframes ec-lens-spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <span class="ec-lens-brand">EC Lens</span>
      <div class="ec-lens-metrics" id="ec-lens-metrics">
        ${this._renderMetrics(null)}
      </div>
      <button class="ec-lens-analyze-btn" id="ec-lens-analyze-btn">\u5E02\u5834\u3092\u5206\u6790\u3059\u308B \u25B6</button>
    `;
          this.el = bar;
          return bar;
        }
        _renderMetrics(data) {
          const metrics = [
            { label: "\u6708\u9593\u691C\u7D22", key: "searches", format: (v) => v ? `${Number(v).toLocaleString()}` : "---" },
            { label: "\u8CFC\u8CB7\u7387", key: "purchaseRate", format: (v) => v != null ? `${(v * 100).toFixed(1)}%` : "---" },
            { label: "\u9700\u7D66\u6BD4(DSR)", key: "supplyDemandRatio", format: (v) => v != null ? v.toFixed(1) : "---" },
            { label: "\u5E73\u5747\u4FA1\u683C", key: "avgPrice", format: (v) => v ? `\xA5${Number(v).toLocaleString()}` : "---" },
            { label: "\u4E0A\u4F4D3\u793E\u30B7\u30A7\u30A2", key: "top3Share", format: (v) => v != null ? `${(v * 100).toFixed(0)}%` : "---" },
            { label: "PPC\u5165\u672D\u984D", key: "bid", format: (v) => v ? `\xA5${Number(v).toLocaleString()}` : "---" }
          ];
          return metrics.map((m) => {
            const value = data ? data[m.key] : null;
            const isPending = !data;
            return `
        <div class="ec-lens-metric">
          <span class="ec-lens-metric-label">${m.label}</span>
          <span class="ec-lens-metric-value${isPending ? " pending" : ""}">${m.format(value)}</span>
        </div>
      `;
          }).join("");
        }
        setLoading() {
          this.state = "loading";
          const btn = this.el.querySelector("#ec-lens-analyze-btn");
          btn.disabled = true;
          btn.innerHTML = '<span class="ec-lens-spinner"></span>\u53D6\u5F97\u4E2D...';
        }
        setData(keywordData, productData) {
          this.state = "loaded";
          const metricsData = {};
          if (keywordData) {
            const kw = keywordData.items?.[0] ?? keywordData;
            metricsData.searches = kw.searches;
            metricsData.purchaseRate = kw.purchaseRate;
            metricsData.supplyDemandRatio = kw.supplyDemandRatio;
            metricsData.bid = kw.bid ?? kw.bidMin;
          }
          if (productData && productData.items && productData.items.length > 0) {
            const items = productData.items;
            const prices = items.map((i) => i.price).filter(Boolean);
            if (prices.length) metricsData.avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const totalUnits = items.reduce((a, i) => a + (i.units || 0), 0);
            const top3Units = items.slice(0, 3).reduce((a, i) => a + (i.units || 0), 0);
            if (totalUnits > 0) metricsData.top3Share = top3Units / totalUnits;
          }
          const metricsEl = this.el.querySelector("#ec-lens-metrics");
          metricsEl.innerHTML = this._renderMetrics(metricsData);
          const btn = this.el.querySelector("#ec-lens-analyze-btn");
          btn.disabled = false;
          btn.textContent = "\u518D\u53D6\u5F97 \u25B6";
        }
        setError(message) {
          this.state = "error";
          const metricsEl = this.el.querySelector("#ec-lens-metrics");
          metricsEl.innerHTML = `<span class="ec-lens-error">${message}</span>`;
          const btn = this.el.querySelector("#ec-lens-analyze-btn");
          btn.disabled = false;
          btn.textContent = "\u518D\u8A66\u884C \u25B6";
        }
        onAnalyzeClick(handler) {
          this.el.querySelector("#ec-lens-analyze-btn").addEventListener("click", handler);
        }
      };
    }
  });

  // extension/components/product-badge.js
  function injectStyles() {
    if (stylesInjected) return;
    const style = document.createElement("style");
    style.textContent = BADGE_STYLES;
    document.head.appendChild(style);
    stylesInjected = true;
  }
  function applyBadgeToCard(cardEl, productData) {
    injectStyles();
    const existing = cardEl.querySelector(".ec-lens-badge");
    if (existing) existing.remove();
    const imgWrapper = cardEl.querySelector(".s-image-square-aspect") || cardEl.querySelector(".s-image-overlay-grey") || cardEl.querySelector('[data-component-type="s-product-image"]') || cardEl.querySelector(".s-product-image-container") || cardEl.querySelector(".a-section.aok-relative") || cardEl.querySelector("img.s-image")?.closest("a") || cardEl.querySelector("img.s-image")?.parentElement;
    if (!imgWrapper) return;
    const computedStyle = window.getComputedStyle(imgWrapper);
    if (computedStyle.position === "static") {
      imgWrapper.style.position = "relative";
    }
    const badge = document.createElement("div");
    badge.className = "ec-lens-badge";
    badge.innerHTML = buildBadgeHTML(productData);
    imgWrapper.appendChild(badge);
  }
  function buildBadgeHTML(data) {
    const rows = [];
    if (data.units != null) {
      rows.push(row("\u6708\u8CA9", `${Number(data.units).toLocaleString()}\u500B`));
    }
    if (data.revenue != null) {
      rows.push(row("\u58F2\u4E0A", formatRevenue(data.revenue)));
    }
    if (data.availableDate) {
      rows.push(row("\u51FA\u54C1", formatSalesAge(data.availableDate)));
    }
    if (data.sellerNation) {
      const nation = data.sellerNation.toUpperCase();
      const cls = nation === "JP" ? "jp" : nation === "CN" ? "cn" : "other";
      rows.push(`
      <div class="ec-lens-badge-row">
        <span class="ec-lens-badge-label">\u30BB\u30E9\u30FC</span>
        <span class="ec-lens-badge-nation ${cls}">${nation}</span>
      </div>
    `);
    }
    if (data.badge && data.badge.bestSeller) {
      rows.push(`<div class="ec-lens-badge-bs">\u2605 \u30D9\u30B9\u30C8\u30BB\u30E9\u30FC</div>`);
    }
    return rows.join("");
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
    if (revenue >= 1e4) {
      return `\xA5${Math.round(revenue / 1e4)}\u4E07`;
    }
    return `\xA5${Number(revenue).toLocaleString()}`;
  }
  function formatSalesAge(availableDate) {
    if (!availableDate) return "---";
    const date = new Date(availableDate);
    const now = /* @__PURE__ */ new Date();
    const months = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    if (months < 12) return `${months}\u30F6\u6708`;
    return `${(months / 12).toFixed(1)}\u5E74`;
  }
  var BADGE_STYLES, stylesInjected;
  var init_product_badge = __esm({
    "extension/components/product-badge.js"() {
      BADGE_STYLES = `
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
      stylesInjected = false;
    }
  });

  // extension/content-scripts/search.js
  var require_search = __commonJS({
    "extension/content-scripts/search.js"() {
      init_summary_bar();
      init_product_badge();
      (async function init() {
        const settings = await sendMessage({ type: "GET_SETTINGS" });
        if (!settings.extensionEnabled || !settings.searchPageEnabled) return;
        if (!settings.sellerSpriteKey) {
          insertNoBanner();
          return;
        }
        const keyword = getSearchKeyword();
        if (!keyword) return;
        const bar = new SummaryBar();
        const barEl = bar.render();
        const insertParent = findSearchResultsParent();
        if (insertParent) {
          insertParent.insertBefore(barEl, insertParent.firstChild);
        } else {
          document.body.insertAdjacentElement("afterbegin", barEl);
        }
        let asinMap = null;
        bar.onAnalyzeClick(() => runAnalysis(keyword, bar, (map) => {
          asinMap = map;
          startObserver(() => asinMap);
        }));
      })();
      async function runAnalysis(keyword, bar, onComplete) {
        bar.setLoading();
        try {
          console.log("[EC Lens] \u5206\u6790\u958B\u59CB:", keyword);
          const result = await sendMessage({ type: "SEARCH_ANALYSIS", keyword });
          console.log("[EC Lens] \u5206\u6790\u7D50\u679C:", result);
          if (!result) {
            bar.setError("\u30EC\u30B9\u30DD\u30F3\u30B9\u304C\u7A7A\u3067\u3059\u3002\u62E1\u5F35\u6A5F\u80FD\u3092\u518D\u8AAD\u307F\u8FBC\u307F\u3057\u3066\u304F\u3060\u3055\u3044");
            return;
          }
          if (result.error) {
            bar.setError(result.error);
            return;
          }
          bar.setData(result.keywordData, result.productData);
          if (result.productData?.items) {
            const map = buildAsinMap(result.productData.items);
            applyBadgesAll(map);
            onComplete(map);
          }
        } catch (err) {
          console.error("[EC Lens] \u5206\u6790\u30A8\u30E9\u30FC:", err);
          bar.setError(err.message || "\u901A\u4FE1\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044");
        }
      }
      function buildAsinMap(items) {
        const map = {};
        for (const item of items) {
          if (item.asin) map[item.asin] = item;
        }
        return map;
      }
      function applyBadgesAll(asinMap) {
        const cards = findProductCards();
        for (const card of cards) {
          const asin = extractAsinFromCard(card);
          if (asin && asinMap[asin]) {
            applyBadgeToCard(card, asinMap[asin]);
            card.dataset.ecLensBadge = "true";
          }
        }
      }
      function findProductCards() {
        const byDataAsin = Array.from(document.querySelectorAll("[data-asin]")).filter((el) => el.dataset.asin && el.dataset.asin.length === 10);
        if (byDataAsin.length > 0) return byDataAsin;
        return Array.from(document.querySelectorAll(
          '.s-result-item, [data-component-type="s-search-result"], .sg-col-inner .a-section'
        )).filter((el) => el.querySelector("img.s-image"));
      }
      function extractAsinFromCard(card) {
        if (card.dataset.asin && /^[A-Z0-9]{10}$/i.test(card.dataset.asin)) {
          return card.dataset.asin.toUpperCase();
        }
        const link = card.querySelector('a[href*="/dp/"]') || card.querySelector("a.a-link-normal");
        if (link) {
          const m = link.href.match(/\/dp\/([A-Z0-9]{10})/i);
          if (m) return m[1].toUpperCase();
        }
        return null;
      }
      function startObserver(getAsinMap) {
        const observer = new MutationObserver(() => {
          const map = getAsinMap();
          if (!map) return;
          const unprocessed = findProductCards().filter(
            (card) => !card.dataset.ecLensBadge
          );
          for (const card of unprocessed) {
            const asin = extractAsinFromCard(card);
            if (asin && map[asin]) {
              applyBadgeToCard(card, map[asin]);
              card.dataset.ecLensBadge = "true";
            }
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
      function findSearchResultsParent() {
        const candidates = [
          "#search",
          '[data-component-type="s-search-results"]',
          ".s-search-results",
          "#resultsMid",
          "#center-2"
        ];
        for (const sel of candidates) {
          const el = document.querySelector(sel);
          if (el) return el;
        }
        return null;
      }
      function getSearchKeyword() {
        const params = new URLSearchParams(window.location.search);
        return (params.get("k") || params.get("field-keywords") || "").trim();
      }
      function insertNoBanner() {
        const banner = document.createElement("div");
        banner.style.cssText = `
    background:#1A237E;color:#fff;
    font-family:-apple-system,sans-serif;font-size:13px;
    padding:10px 16px;text-align:center;
    position:relative;z-index:9999;
  `;
        banner.innerHTML = `
    <strong>EC Lens</strong>\uFF1ASellerSprite API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002
    <a href="#" id="ec-lens-settings-link" style="color:#90CAF9;text-decoration:underline;margin-left:8px">\u8A2D\u5B9A\u753B\u9762\u3092\u958B\u304F</a>
  `;
        document.body.insertAdjacentElement("afterbegin", banner);
        banner.querySelector("#ec-lens-settings-link").addEventListener("click", (e) => {
          e.preventDefault();
          chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
        });
      }
      function sendMessage(message) {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      }
    }
  });
  require_search();
})();
