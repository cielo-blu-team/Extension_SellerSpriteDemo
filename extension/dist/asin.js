(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // extension/components/floating-btn.js
  var FloatingButton;
  var init_floating_btn = __esm({
    "extension/components/floating-btn.js"() {
      FloatingButton = class {
        constructor() {
          this.el = null;
        }
        render() {
          const btn = document.createElement("button");
          btn.id = "ec-lens-floating-btn";
          btn.innerHTML = `
      <style>
        #ec-lens-floating-btn {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 99999;
          background: #1A237E;
          color: #fff;
          border: none;
          border-radius: 50px;
          padding: 10px 18px;
          font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          gap: 7px;
          transition: background 0.15s, box-shadow 0.15s;
          user-select: none;
        }
        #ec-lens-floating-btn:hover {
          background: #283593;
          box-shadow: 0 6px 16px rgba(0,0,0,0.5);
        }
        #ec-lens-floating-btn .ec-lens-fab-icon {
          width: 18px;
          height: 18px;
          fill: #90CAF9;
        }
        #ec-lens-floating-btn .ec-lens-fab-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: ec-lens-fab-spin 0.6s linear infinite;
        }
        @keyframes ec-lens-fab-spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <svg class="ec-lens-fab-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>
      <span id="ec-lens-fab-label">EC Lens \u5206\u6790</span>
    `;
          this.el = btn;
          return btn;
        }
        setLoading() {
          const label = this.el.querySelector("#ec-lens-fab-label");
          const icon = this.el.querySelector(".ec-lens-fab-icon");
          icon.style.display = "none";
          const spinner = document.createElement("span");
          spinner.className = "ec-lens-fab-spinner";
          spinner.id = "ec-lens-fab-spinner";
          this.el.insertBefore(spinner, label);
          label.textContent = "\u53D6\u5F97\u4E2D...";
          this.el.disabled = true;
        }
        setReady() {
          const spinner = this.el.querySelector("#ec-lens-fab-spinner");
          if (spinner) spinner.remove();
          const icon = this.el.querySelector(".ec-lens-fab-icon");
          icon.style.display = "";
          const label = this.el.querySelector("#ec-lens-fab-label");
          label.textContent = "EC Lens \u5206\u6790";
          this.el.disabled = false;
        }
        onClick(handler) {
          this.el.addEventListener("click", handler);
        }
      };
    }
  });

  // extension/components/modal.js
  function formatRevenue(amount) {
    if (!amount) return "---";
    if (amount >= 1e4) return `\xA5${Math.round(amount / 1e4)}\u4E07`;
    return `\xA5${Number(amount).toLocaleString()}`;
  }
  function formatDateAndAge(dateStr) {
    if (!dateStr) return "---";
    const date = new Date(dateStr);
    const now = /* @__PURE__ */ new Date();
    const months = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    const years = (months / 12).toFixed(1);
    return `${dateStr}\uFF08\u7D04${years}\u5E74\uFF09`;
  }
  function chartOptions(xLabel, y1Label, y2Label) {
    const opts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { font: { size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          titleFont: { size: 11 },
          bodyFont: { size: 11 },
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y;
              if (ctx.dataset.yAxisID === "y2" || ctx.dataset.label?.includes("\u58F2\u4E0A")) {
                return ` ${ctx.dataset.label}: \xA5${Number(val).toLocaleString()}`;
              }
              return ` ${ctx.dataset.label}: ${Number(val).toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 10 }, maxRotation: 45 },
          grid: { color: "#F0F0F0" }
        },
        y: {
          ticks: {
            font: { size: 10 },
            callback: (v) => Number(v).toLocaleString()
          },
          grid: { color: "#F0F0F0" },
          title: y1Label ? { display: true, text: y1Label, font: { size: 10 } } : void 0
        }
      }
    };
    if (y2Label) {
      opts.scales.y2 = {
        position: "right",
        ticks: {
          font: { size: 10 },
          callback: (v) => `\xA5${Math.round(v / 1e4)}\u4E07`
        },
        grid: { drawOnChartArea: false },
        title: { display: true, text: y2Label, font: { size: 10 } }
      };
    }
    return opts;
  }
  var Modal;
  var init_modal = __esm({
    "extension/components/modal.js"() {
      Modal = class {
        constructor() {
          this.el = null;
          this.activeTab = "overview";
          this.data = null;
          this.asin = null;
          this.reviewHandler = null;
          this._charts = {};
        }
        render(asin) {
          this.asin = asin;
          const modal = document.createElement("div");
          modal.id = "ec-lens-modal-overlay";
          modal.innerHTML = `
      <style>
        #ec-lens-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        #ec-lens-modal {
          background: #fff;
          width: 760px;
          max-width: 96vw;
          max-height: 86vh;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        #ec-lens-modal-header {
          background: #1A237E;
          color: #fff;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        #ec-lens-modal-header .ec-lens-asin {
          font-size: 12px;
          color: #90CAF9;
          margin-right: 8px;
        }
        #ec-lens-modal-header .ec-lens-title {
          font-size: 13px;
          font-weight: 600;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        #ec-lens-modal-close {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.7);
          font-size: 20px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }
        #ec-lens-modal-close:hover { color: #fff; }
        #ec-lens-modal-tabs {
          display: flex;
          border-bottom: 2px solid #E0E0E0;
          background: #F5F5F5;
          flex-shrink: 0;
          overflow-x: auto;
        }
        .ec-lens-tab-btn {
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          background: transparent;
          cursor: pointer;
          white-space: nowrap;
          color: #555;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          transition: color 0.15s;
        }
        .ec-lens-tab-btn.active {
          color: #1560BD;
          border-bottom-color: #1560BD;
          font-weight: 700;
        }
        .ec-lens-tab-btn:hover:not(.active) { color: #1560BD; }
        #ec-lens-modal-body {
          overflow-y: auto;
          flex: 1;
          padding: 16px;
          font-size: 12px;
          color: #333;
          line-height: 1.6;
        }
        /* \u5171\u901A\u30C6\u30FC\u30D6\u30EB */
        .ec-lens-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .ec-lens-table th {
          background: #1A237E;
          color: #fff;
          padding: 7px 10px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
        }
        .ec-lens-table td {
          padding: 6px 10px;
          border-bottom: 1px solid #E0E0E0;
        }
        .ec-lens-table tr:hover td { background: #F5F7FF; }
        /* \u6982\u8981\u30B0\u30EA\u30C3\u30C9 */
        .ec-lens-overview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .ec-lens-overview-card {
          background: #F5F7FF;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          padding: 10px 12px;
        }
        .ec-lens-overview-card .label {
          font-size: 10px;
          color: #777;
          margin-bottom: 2px;
        }
        .ec-lens-overview-card .value {
          font-size: 17px;
          font-weight: 700;
          color: #1A237E;
        }
        .ec-lens-overview-card .value.sm { font-size: 13px; }
        /* \u30D0\u30C3\u30B8\u884C */
        .ec-lens-badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .ec-lens-pill {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .ec-lens-pill.good { background: #E8F5E9; color: #2E7D32; }
        .ec-lens-pill.warn { background: #FFF3E0; color: #E65100; }
        .ec-lens-pill.info { background: #E3F2FD; color: #1560BD; }
        .ec-lens-pill.gray { background: #F5F5F5; color: #555; }
        /* \u5272\u5408\u30D0\u30FC */
        .ec-lens-percent-bar {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ec-lens-percent-bar .bar-track {
          flex: 1;
          height: 6px;
          background: #E0E0E0;
          border-radius: 3px;
          overflow: hidden;
        }
        .ec-lens-percent-bar .bar-fill {
          height: 100%;
          border-radius: 3px;
        }
        .ec-lens-percent-bar .bar-fill.green { background: #2E7D32; }
        .ec-lens-percent-bar .bar-fill.red { background: #C62828; }
        .ec-lens-percent-bar .bar-fill.blue { background: #1560BD; }
        /* 5W1H\u30B0\u30EA\u30C3\u30C9 */
        .ec-lens-5w1h-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .ec-lens-5w1h-card {
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          overflow: hidden;
        }
        .ec-lens-5w1h-card .card-head {
          background: #1A237E;
          color: #fff;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 700;
        }
        .ec-lens-5w1h-card .card-body {
          padding: 8px 10px;
          font-size: 11px;
        }
        .ec-lens-5w1h-card .card-body li {
          padding: 2px 0;
          border-bottom: 1px solid #F0F0F0;
          list-style: none;
          display: flex;
          justify-content: space-between;
        }
        .ec-lens-5w1h-card .card-body li:last-child { border-bottom: none; }
        /* \u30B9\u30B1\u30EB\u30C8\u30F3 */
        .ec-lens-skeleton {
          background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%);
          background-size: 200% 100%;
          animation: ec-lens-shimmer 1.2s infinite;
          border-radius: 4px;
        }
        @keyframes ec-lens-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        /* \u30A8\u30E9\u30FC\u8868\u793A */
        .ec-lens-tab-error {
          color: #C62828;
          background: #FFF8F8;
          border: 1px solid #FFCDD2;
          border-radius: 6px;
          padding: 12px;
          margin: 8px 0;
          font-size: 12px;
        }
        /* \u30C1\u30E3\u30FC\u30C8\u30A8\u30EA\u30A2 */
        .ec-lens-chart-wrap {
          position: relative;
          height: 220px;
          margin-bottom: 14px;
          background: #FAFAFA;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          padding: 10px;
        }
        .ec-lens-chart-title {
          font-size: 11px;
          font-weight: 700;
          color: #444;
          margin-bottom: 6px;
        }
      </style>
      <div id="ec-lens-modal">
        <div id="ec-lens-modal-header">
          <span class="ec-lens-asin">${asin}</span>
          <span class="ec-lens-title" id="ec-lens-modal-title">\u30C7\u30FC\u30BF\u53D6\u5F97\u4E2D...</span>
          <button id="ec-lens-modal-close">\xD7</button>
        </div>
        <div id="ec-lens-modal-tabs">
          <button class="ec-lens-tab-btn active" data-tab="overview">\u5546\u54C1\u6982\u8981</button>
          <button class="ec-lens-tab-btn" data-tab="sales">\u58F2\u4E0A\u63A8\u79FB</button>
          <button class="ec-lens-tab-btn" data-tab="keywords">\u6D41\u5165KW</button>
          <button class="ec-lens-tab-btn" data-tab="trends">\u5E02\u5834\u30C8\u30EC\u30F3\u30C9</button>
          <button class="ec-lens-tab-btn" data-tab="reviews">AI\u30EC\u30D3\u30E5\u30FC</button>
        </div>
        <div id="ec-lens-modal-body">
          ${this._renderLoading()}
        </div>
      </div>
    `;
          this.el = modal;
          this._bindEvents();
          return modal;
        }
        _bindEvents() {
          this.el.querySelector("#ec-lens-modal-close").addEventListener("click", () => this.close());
          this.el.addEventListener("click", (e) => {
            if (e.target === this.el) this.close();
          });
          this.el.querySelectorAll(".ec-lens-tab-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
              const tab = btn.dataset.tab;
              this._switchTab(tab);
            });
          });
        }
        _switchTab(tab) {
          Object.values(this._charts).forEach((c) => {
            try {
              c.destroy();
            } catch (_) {
            }
          });
          this._charts = {};
          this.activeTab = tab;
          this.el.querySelectorAll(".ec-lens-tab-btn").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.tab === tab);
          });
          this._renderTabContent();
        }
        setData(data, productTitle) {
          this.data = data;
          if (productTitle) {
            this.el.querySelector("#ec-lens-modal-title").textContent = productTitle;
          }
          this._renderTabContent();
        }
        _renderTabContent() {
          const body = this.el.querySelector("#ec-lens-modal-body");
          if (!this.data) {
            body.innerHTML = this._renderLoading();
            return;
          }
          switch (this.activeTab) {
            case "overview":
              body.innerHTML = this._renderOverview();
              break;
            case "sales":
              body.innerHTML = this._renderSales();
              this._drawSalesCharts();
              break;
            case "keywords":
              body.innerHTML = this._renderKeywords();
              break;
            case "trends":
              body.innerHTML = this._renderTrends();
              this._drawTrendsChart();
              break;
            case "reviews":
              body.innerHTML = this._renderReviews();
              this._bindReviewBtn();
              break;
          }
        }
        _renderLoading() {
          return `
      <div style="padding:12px 0">
        <div class="ec-lens-skeleton" style="height:20px;width:60%;margin-bottom:12px"></div>
        <div class="ec-lens-overview-grid">
          ${Array(6).fill('<div class="ec-lens-skeleton" style="height:70px"></div>').join("")}
        </div>
        <div class="ec-lens-skeleton" style="height:14px;width:40%;margin-bottom:8px"></div>
        <div class="ec-lens-skeleton" style="height:120px"></div>
      </div>
    `;
        }
        _renderOverview() {
          const d = this.data.asinDetail;
          const sp = this.data.salesPrediction;
          if (!d && this.data.asinDetailError) {
            return `<div class="ec-lens-tab-error">\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC: ${this.data.asinDetailError}</div>`;
          }
          const monthSales = sp?.monthItemList?.slice(-1)[0];
          const cards = [
            { label: "\u6708\u9593\u8CA9\u58F2\u6570\uFF08\u63A8\u5B9A\uFF09", value: monthSales ? `${Number(monthSales.sales || 0).toLocaleString()}\u500B` : "---" },
            { label: "\u6708\u9593\u58F2\u4E0A\uFF08\u63A8\u5B9A\uFF09", value: monthSales ? formatRevenue(monthSales.amount) : "---" },
            { label: "BSR\u30E9\u30F3\u30AD\u30F3\u30B0", value: d?.bsrRank ? `${Number(d.bsrRank).toLocaleString()}\u4F4D` : "---" },
            { label: "LQS\u30B9\u30B3\u30A2", value: d?.lqs != null ? `${d.lqs}\u70B9` : "---" },
            { label: "\u51FA\u54C1\u65E5", value: d?.availableDate ? formatDateAndAge(d.availableDate) : "---", sm: true },
            { label: "\u30D0\u30EA\u30A8\u30FC\u30B7\u30E7\u30F3\u6570", value: d?.variations != null ? `${d.variations}\u7A2E` : "---" }
          ];
          const badges = [];
          if (d?.badge?.ebc) badges.push({ text: "A+ \u3042\u308A", cls: "good" });
          if (d?.badge?.video) badges.push({ text: "\u52D5\u753B\u3042\u308A", cls: "info" });
          else badges.push({ text: "\u52D5\u753B\u306A\u3057", cls: "gray" });
          if (d?.badge?.bestSeller) badges.push({ text: "\u30D9\u30B9\u30C8\u30BB\u30E9\u30FC", cls: "good" });
          if (d?.sellerNation) {
            const n = d.sellerNation.toUpperCase();
            badges.push({ text: `\u30BB\u30E9\u30FC: ${n}`, cls: n === "JP" ? "info" : "warn" });
          }
          return `
      <div class="ec-lens-overview-grid">
        ${cards.map((c) => `
          <div class="ec-lens-overview-card">
            <div class="label">${c.label}</div>
            <div class="value${c.sm ? " sm" : ""}">${c.value}</div>
          </div>
        `).join("")}
      </div>
      <div class="ec-lens-badge-row">
        ${badges.map((b) => `<span class="ec-lens-pill ${b.cls}">${b.text}</span>`).join("")}
      </div>
    `;
        }
        _renderSales() {
          const sp = this.data.salesPrediction;
          if (!sp && this.data.salesPredictionError) {
            return `<div class="ec-lens-tab-error">\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC: ${this.data.salesPredictionError}</div>`;
          }
          if (!sp) return `<div class="ec-lens-tab-error">\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093</div>`;
          const monthly = (sp.monthItemList || []).slice(-6);
          const rows = monthly.map((item) => `
      <tr>
        <td>${item.date || "---"}</td>
        <td>${Number(item.sales || 0).toLocaleString()}\u500B</td>
        <td>${formatRevenue(item.amount || 0)}</td>
      </tr>
    `).join("");
          return `
      <div class="ec-lens-chart-title">\u6708\u5225\u8CA9\u58F2\u6570\uFF08\u76F4\u8FD16\u30F6\u6708\uFF09</div>
      <div class="ec-lens-chart-wrap">
        <canvas id="ec-lens-chart-monthly"></canvas>
      </div>
      <div class="ec-lens-chart-title" style="margin-top:8px">\u65E5\u5225\u8CA9\u58F2\u6570\uFF08\u76F4\u8FD130\u65E5\uFF09</div>
      <div class="ec-lens-chart-wrap">
        <canvas id="ec-lens-chart-daily"></canvas>
      </div>
      <table class="ec-lens-table" style="margin-top:12px">
        <thead><tr><th>\u6708</th><th>\u8CA9\u58F2\u6570</th><th>\u58F2\u4E0A</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#999">\u30C7\u30FC\u30BF\u306A\u3057</td></tr>'}</tbody>
      </table>
    `;
        }
        _drawSalesCharts() {
          if (!window.Chart) {
            this._loadChartJs(() => this._drawSalesCharts());
            return;
          }
          const sp = this.data.salesPrediction;
          if (!sp) return;
          const monthly = (sp.monthItemList || []).slice(-6);
          const monthCanvas = this.el.querySelector("#ec-lens-chart-monthly");
          if (monthCanvas && monthly.length) {
            this._charts.monthly = new window.Chart(monthCanvas, {
              type: "bar",
              data: {
                labels: monthly.map((i) => i.date || ""),
                datasets: [
                  {
                    label: "\u8CA9\u58F2\u6570\uFF08\u500B\uFF09",
                    data: monthly.map((i) => i.sales || 0),
                    backgroundColor: "rgba(21, 96, 189, 0.75)",
                    borderColor: "#1560BD",
                    borderWidth: 1,
                    yAxisID: "y"
                  },
                  {
                    label: "\u58F2\u4E0A\uFF08\u5186\uFF09",
                    data: monthly.map((i) => i.amount || 0),
                    type: "line",
                    borderColor: "#E65100",
                    backgroundColor: "rgba(230, 81, 0, 0.1)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    yAxisID: "y2"
                  }
                ]
              },
              options: chartOptions("\u6708", "\u8CA9\u58F2\u6570", "\u58F2\u4E0A")
            });
          }
          const daily = (sp.dailyItemList || []).slice(-30);
          const dailyCanvas = this.el.querySelector("#ec-lens-chart-daily");
          if (dailyCanvas && daily.length) {
            this._charts.daily = new window.Chart(dailyCanvas, {
              type: "line",
              data: {
                labels: daily.map((i) => i.date || ""),
                datasets: [
                  {
                    label: "\u65E5\u5225\u8CA9\u58F2\u6570\uFF08\u500B\uFF09",
                    data: daily.map((i) => i.sales || 0),
                    borderColor: "#1560BD",
                    backgroundColor: "rgba(21, 96, 189, 0.08)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2
                  }
                ]
              },
              options: chartOptions("\u65E5", "\u8CA9\u58F2\u6570", null)
            });
          }
        }
        _renderKeywords() {
          const kw = this.data.trafficKeyword;
          if (!kw && this.data.trafficKeywordError) {
            return `<div class="ec-lens-tab-error">\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC: ${this.data.trafficKeywordError}</div>`;
          }
          const items = kw?.items || [];
          if (!items.length) return `<div class="ec-lens-tab-error">\u6D41\u5165\u30AD\u30FC\u30EF\u30FC\u30C9\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093</div>`;
          const rows = items.slice(0, 20).map((item) => `
      <tr>
        <td>${item.keyword || "---"}</td>
        <td>${item.searches ? Number(item.searches).toLocaleString() : "---"}</td>
        <td>${item.rankPosition?.position ?? "---"}</td>
        <td>${item.adPosition?.position ?? "---"}</td>
        <td>${item.trafficPercentage != null ? `${(item.trafficPercentage * 100).toFixed(1)}%` : "---"}</td>
        <td>${item.bid ? `\xA5${Number(item.bid).toLocaleString()}` : "---"}</td>
      </tr>
    `).join("");
          return `
      <table class="ec-lens-table">
        <thead>
          <tr>
            <th>\u30AD\u30FC\u30EF\u30FC\u30C9</th>
            <th>\u6708\u9593\u691C\u7D22\u6570</th>
            <th>\u81EA\u7136\u9806\u4F4D</th>
            <th>\u5E83\u544A\u9806\u4F4D</th>
            <th>\u6D41\u5165\u5272\u5408</th>
            <th>PPC\u5165\u672D</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
        }
        _renderTrends() {
          const trends = this.data.googleTrends;
          const bsr = this.data.bsrPrediction;
          if (!trends && this.data.googleTrendsError) {
            return `<div class="ec-lens-tab-error">\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC: ${this.data.googleTrendsError}</div>`;
          }
          const bsrValue = bsr?.estMonthSales;
          return `
      ${bsrValue != null ? `
        <div style="margin-bottom:12px;padding:10px 14px;background:#F5F7FF;border-radius:6px;border:1px solid #E0E0E0">
          <span style="font-size:11px;color:#777">BSR\u63A8\u5B9A\u6708\u9593\u8CA9\u58F2\u6570</span>
          <span style="font-size:17px;font-weight:700;color:#1A237E;margin-left:10px">${Number(bsrValue).toLocaleString()}\u500B</span>
        </div>
      ` : ""}
      <div class="ec-lens-chart-title">Google\u30C8\u30EC\u30F3\u30C9\uFF08\u76F4\u8FD112\u30F6\u6708\uFF09</div>
      <div class="ec-lens-chart-wrap">
        <canvas id="ec-lens-chart-trends"></canvas>
      </div>
      ${!trends && !this.data.googleTrendsError ? '<p style="font-size:11px;color:#999;text-align:center">Google\u30C8\u30EC\u30F3\u30C9\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093</p>' : ""}
    `;
        }
        _drawTrendsChart() {
          if (!window.Chart) {
            this._loadChartJs(() => this._drawTrendsChart());
            return;
          }
          const trends = this.data.googleTrends;
          if (!trends?.items?.length) return;
          const items = trends.items.slice(-12);
          const canvas = this.el.querySelector("#ec-lens-chart-trends");
          if (!canvas) return;
          this._charts.trends = new window.Chart(canvas, {
            type: "line",
            data: {
              labels: items.map((i) => i.date || i.month || ""),
              datasets: [
                {
                  label: "\u691C\u7D22\u30C8\u30EC\u30F3\u30C9",
                  data: items.map((i) => i.value || i.index || 0),
                  borderColor: "#2E7D32",
                  backgroundColor: "rgba(46, 125, 50, 0.1)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 3
                }
              ]
            },
            options: chartOptions("\u6708", "\u30C8\u30EC\u30F3\u30C9\u6307\u6570", null)
          });
        }
        _loadChartJs(callback) {
          if (document.getElementById("ec-lens-chartjs")) {
            setTimeout(() => {
              if (window.Chart) callback();
            }, 200);
            return;
          }
          const script = document.createElement("script");
          script.id = "ec-lens-chartjs";
          script.src = chrome.runtime.getURL("assets/chart.umd.js");
          script.onload = callback;
          document.head.appendChild(script);
        }
        _renderReviews() {
          return `
      <div id="ec-lens-review-initial">
        <p style="color:#555;margin-bottom:12px;line-height:1.7">
          \u73FE\u5728\u8868\u793A\u4E2D\u306EAmazon\u5546\u54C1\u30DA\u30FC\u30B8\u304B\u3089\u30EC\u30D3\u30E5\u30FC\u3092\u53D6\u5F97\u3057\u3001Claude AI\u3067\u5206\u6790\u3057\u307E\u3059\u3002<br>
          \u9AD8\u8A55\u4FA1\uFF084\u301C5\u661F\uFF0915\u4EF6 + \u4F4E\u8A55\u4FA1\uFF081\u301C2\u661F\uFF0915\u4EF6\u3092\u81EA\u52D5\u53CE\u96C6\u3057\u307E\u3059\u3002
        </p>
        <button id="ec-lens-review-btn" style="
          background:#1560BD;color:#fff;border:none;border-radius:4px;
          padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;
          font-family:inherit;
        ">AI\u3067\u30EC\u30D3\u30E5\u30FC\u3092\u5206\u6790\u3059\u308B\uFF08Claude\uFF09</button>
        <div id="ec-lens-review-result"></div>
      </div>
    `;
        }
        _bindReviewBtn() {
          const btn = this.el.querySelector("#ec-lens-review-btn");
          if (!btn || !this.reviewHandler) return;
          btn.addEventListener("click", async () => {
            btn.disabled = true;
            btn.textContent = "\u5206\u6790\u4E2D...";
            const resultEl = this.el.querySelector("#ec-lens-review-result");
            resultEl.innerHTML = this._renderReviewSkeleton();
            try {
              await this.reviewHandler(resultEl);
            } catch (err) {
              resultEl.innerHTML = `<div class="ec-lens-tab-error">${err.message}</div>`;
            } finally {
              btn.disabled = false;
              btn.textContent = "\u518D\u5206\u6790\u3059\u308B\uFF08Claude\uFF09";
            }
          });
        }
        _renderReviewSkeleton() {
          return `
      <div style="margin-top:16px">
        <div class="ec-lens-5w1h-grid">
          ${Array(6).fill('<div class="ec-lens-skeleton" style="height:100px"></div>').join("")}
        </div>
        <div class="ec-lens-skeleton" style="height:140px;margin-bottom:10px"></div>
        <div class="ec-lens-skeleton" style="height:140px;margin-bottom:10px"></div>
        <div class="ec-lens-skeleton" style="height:140px"></div>
      </div>
    `;
        }
        renderReviewResult(result, el) {
          const { persona, pros, cons, usage_scenes } = result;
          const targetEl = el || this.el.querySelector("#ec-lens-review-result");
          if (!targetEl) return;
          const w1hLabels = {
            who: "\u8AB0\u304C\uFF08Who\uFF09",
            when: "\u3044\u3064\uFF08When\uFF09",
            where: "\u3069\u3053\u3067\uFF08Where\uFF09",
            what: "\u4F55\u306E\u305F\u3081\u306B\uFF08What\uFF09",
            why: "\u306A\u305C\u4ECA\uFF08Why\uFF09",
            how: "\u3069\u3046\u3084\u3063\u3066\uFF08How\uFF09"
          };
          const personaHTML = persona ? `
      <h4 style="font-size:12px;font-weight:700;color:#1A237E;margin:16px 0 8px">\u8CFC\u8CB7\u30DA\u30EB\u30BD\u30CA\uFF085W1H\uFF09</h4>
      <div class="ec-lens-5w1h-grid">
        ${Object.entries(w1hLabels).map(([key, label]) => {
            const items = persona[key] || [];
            return `
            <div class="ec-lens-5w1h-card">
              <div class="card-head">${label}</div>
              <ul class="card-body">
                ${items.slice(0, 3).map((item) => `
                  <li>
                    <span>${typeof item === "string" ? item : item.label || item.text || ""}</span>
                    ${item.percent != null ? `<span style="color:#1560BD;font-weight:600">${item.percent}%</span>` : ""}
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
          }).join("")}
      </div>
    ` : "";
          const tableHTML = (title, items, color) => {
            if (!items || !items.length) return "";
            return `
        <h4 style="font-size:12px;font-weight:700;color:#1A237E;margin:16px 0 8px">${title}</h4>
        <table class="ec-lens-table" style="margin-bottom:12px">
          <thead><tr><th>\u30C8\u30D4\u30C3\u30AF</th><th style="width:140px">\u8A00\u53CA\u5272\u5408</th><th>\u5F15\u7528</th></tr></thead>
          <tbody>
            ${items.slice(0, 5).map((item) => `
              <tr>
                <td>${item.topic || ""}</td>
                <td>
                  <div class="ec-lens-percent-bar">
                    <div class="bar-track">
                      <div class="bar-fill ${color}" style="width:${Math.min(item.percent || 0, 100)}%"></div>
                    </div>
                    <span style="font-size:11px;color:#555;white-space:nowrap">${item.percent || 0}%</span>
                  </div>
                </td>
                <td style="color:#666;font-size:11px">${item.review_quote || ""}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
          };
          targetEl.innerHTML = `
      <div style="margin-top:16px">
        ${personaHTML}
        ${tableHTML("\u9AD8\u8A55\u4FA1\u30DD\u30A4\u30F3\u30C8", pros, "green")}
        ${tableHTML("\u4F4E\u8A55\u4FA1\u30DD\u30A4\u30F3\u30C8", cons, "red")}
        ${tableHTML("\u4F7F\u7528\u30B7\u30FC\u30F3", usage_scenes, "blue")}
      </div>
    `;
        }
        onReviewAnalysis(handler) {
          this.reviewHandler = handler;
          if (this.activeTab === "reviews") {
            this._bindReviewBtn();
          }
        }
        close() {
          if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
          }
        }
      };
    }
  });

  // extension/content-scripts/asin.js
  var require_asin = __commonJS({
    "extension/content-scripts/asin.js"() {
      init_floating_btn();
      init_modal();
      (async function init() {
        const settings = await sendMessage({ type: "GET_SETTINGS" });
        if (!settings.extensionEnabled || !settings.asinPageEnabled) return;
        if (!settings.sellerSpriteKey) {
          insertNoBanner();
          return;
        }
        const asin = getAsinFromUrl();
        if (!asin) return;
        const fab = new FloatingButton();
        const fabEl = fab.render();
        document.body.appendChild(fabEl);
        fab.onClick(async () => {
          const modal = new Modal();
          const productTitle = getProductTitle();
          const modalEl = modal.render(asin);
          document.body.appendChild(modalEl);
          modal.onReviewAnalysis(async (resultEl) => {
            if (!settings.anthropicKey) {
              throw new Error("Anthropic API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u8A2D\u5B9A\u753B\u9762\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044");
            }
            const reviews = extractReviews();
            if (!reviews.positive.length && !reviews.negative.length) {
              throw new Error("\u3053\u306E\u30DA\u30FC\u30B8\u306B\u30EC\u30D3\u30E5\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
            }
            const result = await sendMessage({
              type: "REVIEW_ANALYSIS",
              asin,
              productTitle,
              reviews
            });
            if (result.error) throw new Error(result.error);
            modal.renderReviewResult(result.result, resultEl);
          });
          fab.setLoading();
          try {
            const data = await sendMessage({ type: "ASIN_ANALYSIS", asin });
            if (data.error) {
              modal.setData({ error: data.error }, productTitle);
            } else {
              modal.setData(data, productTitle);
            }
          } catch (err) {
            modal.setData({ error: err.message }, productTitle);
          } finally {
            fab.setReady();
          }
        });
      })();
      function getAsinFromUrl() {
        const dpMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
        if (dpMatch) return dpMatch[1].toUpperCase();
        const params = new URLSearchParams(window.location.search);
        const asinParam = params.get("asin") || params.get("ASIN");
        if (asinParam && /^[A-Z0-9]{10}$/i.test(asinParam)) return asinParam.toUpperCase();
        const canonicalEl = document.querySelector('link[rel="canonical"]');
        if (canonicalEl) {
          const m = canonicalEl.href.match(/\/dp\/([A-Z0-9]{10})/i);
          if (m) return m[1].toUpperCase();
        }
        return null;
      }
      function getProductTitle() {
        const selectors = [
          "#productTitle",
          "#title span",
          ".product-title-word-break",
          "h1.a-size-large span",
          'h1[data-automation-id="title"]',
          "h1"
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        return document.title.replace(/\s*[-|].*$/, "").trim();
      }
      function extractReviews() {
        const positive = [];
        const negative = [];
        const REVIEW_SELECTORS = [
          '[data-hook="review"]',
          // 標準
          ".a-section.review.aok-relative",
          // 代替1
          '.a-section[data-hook="review"]',
          // 代替2
          ".review"
          // 汎用フォールバック
        ];
        const RATING_SELECTORS = [
          '[data-hook="review-star-rating"] .a-icon-alt',
          '[data-hook="cmps-review-star-rating"] .a-icon-alt',
          ".review-rating .a-icon-alt",
          'i[data-hook="review-star-rating"] .a-icon-alt',
          "i.review-rating .a-icon-alt",
          ".a-star-mini .a-icon-alt"
        ];
        const TITLE_SELECTORS = [
          '[data-hook="review-title"] > span:not(.a-icon-alt):not(.a-color-secondary)',
          '[data-hook="review-title"] span.a-size-base',
          ".review-title > span",
          "a.review-title span"
        ];
        const BODY_SELECTORS = [
          '[data-hook="review-body"] span:not(.cr-original-language-review-body span)',
          '[data-hook="review-body"] .a-expander-content span',
          ".review-text span",
          ".review-text-content span",
          ".a-expander-content.reviewText span"
        ];
        let reviewEls = [];
        for (const sel of REVIEW_SELECTORS) {
          reviewEls = Array.from(document.querySelectorAll(sel));
          if (reviewEls.length > 0) break;
        }
        for (const el of reviewEls) {
          const rating = extractRating(el, RATING_SELECTORS);
          if (rating === null) continue;
          const title = extractText(el, TITLE_SELECTORS);
          const body = extractText(el, BODY_SELECTORS);
          if (!body) continue;
          const review = { rating, title, body: body.slice(0, 500) };
          if (rating >= 4 && positive.length < 15) {
            positive.push(review);
          } else if (rating <= 2 && negative.length < 15) {
            negative.push(review);
          }
        }
        return { positive, negative };
      }
      function extractRating(el, selectors) {
        for (const sel of selectors) {
          const ratingEl = el.querySelector(sel);
          if (!ratingEl) continue;
          const text = ratingEl.textContent.trim();
          const m = text.match(/(\d+(?:[.,]\d+)?)/);
          if (m) return parseFloat(m[1].replace(",", "."));
        }
        return null;
      }
      function extractText(el, selectors) {
        for (const sel of selectors) {
          const target = el.querySelector(sel);
          if (target && target.textContent.trim()) return target.textContent.trim();
        }
        return "";
      }
      function insertNoBanner() {
        const banner = document.createElement("div");
        banner.style.cssText = `
    position:fixed;bottom:20px;right:20px;z-index:99999;
    background:#1A237E;color:#fff;
    font-family:-apple-system,sans-serif;font-size:12px;
    padding:10px 14px;border-radius:8px;
    box-shadow:0 4px 12px rgba(0,0,0,0.4);
    max-width:260px;line-height:1.5;
  `;
        banner.innerHTML = `
    <strong>EC Lens</strong>: SellerSprite API\u30AD\u30FC\u672A\u8A2D\u5B9A<br>
    <a href="#" id="ec-lens-opt-link" style="color:#90CAF9;text-decoration:underline">\u8A2D\u5B9A\u753B\u9762\u3092\u958B\u304F</a>
    <span id="ec-lens-banner-close" style="float:right;cursor:pointer;opacity:0.6;margin-left:8px">\xD7</span>
  `;
        document.body.appendChild(banner);
        banner.querySelector("#ec-lens-opt-link").addEventListener("click", (e) => {
          e.preventDefault();
          chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
        });
        banner.querySelector("#ec-lens-banner-close").addEventListener("click", () => {
          banner.remove();
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
  require_asin();
})();
