(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // extension/api/sellersprite.js
  var BASE_URL, TIMEOUT_MS, MARKETPLACE, SellerSpriteAPI, SellerSpriteError;
  var init_sellersprite = __esm({
    "extension/api/sellersprite.js"() {
      BASE_URL = "https://api.sellersprite.com";
      TIMEOUT_MS = 1e4;
      MARKETPLACE = "JP";
      SellerSpriteAPI = class {
        constructor(secretKey) {
          this.secretKey = secretKey;
        }
        // 共通リクエスト
        async request(method, path, params = {}) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
          try {
            let url = `${BASE_URL}${path}`;
            const options = {
              method,
              headers: {
                "secret-key": this.secretKey,
                "Content-Type": "application/json;charset=UTF-8"
              },
              signal: controller.signal
            };
            if (method === "GET") {
              const qs = new URLSearchParams(params).toString();
              if (qs) url += `?${qs}`;
            } else {
              options.body = JSON.stringify(params);
            }
            const response = await fetch(url, options);
            const text = await response.text();
            let data;
            try {
              data = JSON.parse(text);
            } catch (_) {
              throw new Error(`API\u30EC\u30B9\u30DD\u30F3\u30B9\u306E\u30D1\u30FC\u30B9\u306B\u5931\u6557\u3057\u307E\u3057\u305F\uFF08${response.status}\uFF09: ${text.slice(0, 100)}`);
            }
            const code = data.code;
            const isSuccess = code === 0 || code === "0" || code === void 0 && response.ok;
            if (!isSuccess) {
              throw new SellerSpriteError(
                code,
                data.message || data.msg || data.error || `API\u30A8\u30E9\u30FC\uFF08\u30B3\u30FC\u30C9: ${code}, HTTP: ${response.status}\uFF09`
              );
            }
            return data.data !== void 0 ? data.data : data;
          } catch (err) {
            if (err.name === "AbortError") {
              throw new Error("\u30BF\u30A4\u30E0\u30A2\u30A6\u30C8\u3057\u307E\u3057\u305F\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044");
            }
            throw err;
          } finally {
            clearTimeout(timeoutId);
          }
        }
        // API残量確認
        async checkVisits() {
          const data = await this.request("GET", "/v1/visits");
          return {
            remaining: data.remaining,
            total: data.total,
            message: `\u6B8B\u308A ${data.remaining} / ${data.total} \u30EA\u30AF\u30A8\u30B9\u30C8`
          };
        }
        // キーワード挖掘
        async keywordMiner(keyword) {
          return this.request("GET", "/v1/keyword/miner", {
            keyword,
            marketplace: MARKETPLACE
          });
        }
        // 商品リサーチ（最大50件）
        async productResearch(keyword, page = 1, size = 50) {
          return this.request("POST", "/v1/product/research", {
            keyword,
            marketplace: MARKETPLACE,
            page,
            size
          });
        }
        // ASIN詳細
        async asinDetail(marketplace, asin) {
          return this.request("GET", `/v1/asin/${marketplace}/${asin}`);
        }
        // ASIN売上予測
        async salesPredictionAsin(asin) {
          return this.request("GET", "/v1/sales/prediction/asin", {
            asin,
            marketplace: MARKETPLACE
          });
        }
        // BSR売上予測
        async salesPredictionBsr(asin) {
          const nodeId = await this.getCategoryNode(asin);
          return this.request("GET", "/v1/sales/prediction/bsr", {
            nodeId,
            marketplace: MARKETPLACE
          });
        }
        // 逆引きキーワード
        async trafficKeyword(asin, page = 1, size = 20) {
          return this.request("POST", "/v1/traffic/keyword", {
            asin,
            marketplace: MARKETPLACE,
            page,
            size
          });
        }
        // Googleトレンド
        async googleTrends(asin) {
          return this.request("GET", "/v1/google/trends", {
            asin,
            marketplace: MARKETPLACE
          });
        }
        // カテゴリノード（ローカルキャッシュ付き）
        async getCategoryNode(asin) {
          const cacheKey = `node_${asin}`;
          const cached = await chrome.storage.local.get(cacheKey);
          const now = Date.now();
          if (cached[cacheKey] && now - cached[cacheKey].timestamp < 7 * 24 * 60 * 60 * 1e3) {
            return cached[cacheKey].nodeId;
          }
          const data = await this.request("GET", "/v1/product/node", {
            asin,
            marketplace: MARKETPLACE
          });
          const nodeId = data.nodeId || data.node_id || "";
          await chrome.storage.local.set({
            [cacheKey]: { nodeId, timestamp: now }
          });
          return nodeId;
        }
      };
      SellerSpriteError = class extends Error {
        constructor(code, message) {
          super(message);
          this.code = code;
          this.name = "SellerSpriteError";
        }
        toUserMessage() {
          switch (this.code) {
            case "ERROR_VISIT_MAX":
              return "\u672C\u65E5\u306E\u5229\u7528\u4E0A\u9650\u306B\u9054\u3057\u307E\u3057\u305F\u3002\u660E\u65E5\u4EE5\u964D\u306B\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044";
            case "ERROR_SECRET_KEY":
              return "API\u30AD\u30FC\u304C\u7121\u52B9\u3067\u3059\u3002\u8A2D\u5B9A\u753B\u9762\u3067\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044";
            default:
              return this.message || "\u901A\u4FE1\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044";
          }
        }
      };
    }
  });

  // extension/api/claude.js
  var ANTHROPIC_API_URL, MODEL, MAX_TOKENS, TIMEOUT_MS2, ClaudeAPI;
  var init_claude = __esm({
    "extension/api/claude.js"() {
      ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
      MODEL = "claude-sonnet-4-20250514";
      MAX_TOKENS = 3e3;
      TIMEOUT_MS2 = 6e4;
      ClaudeAPI = class {
        constructor(apiKey) {
          this.apiKey = apiKey;
        }
        // 疎通テスト
        async testConnection() {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1e4);
          try {
            const response = await fetch(ANTHROPIC_API_URL, {
              method: "POST",
              headers: {
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
              },
              body: JSON.stringify({
                model: MODEL,
                max_tokens: 10,
                messages: [{ role: "user", content: "Hi" }]
              }),
              signal: controller.signal
            });
            if (response.status === 401) {
              throw new Error("API\u30AD\u30FC\u304C\u7121\u52B9\u3067\u3059");
            }
            if (!response.ok && response.status !== 400) {
              throw new Error(`\u63A5\u7D9A\u30A8\u30E9\u30FC: ${response.status}`);
            }
            return { success: true, message: "\u63A5\u7D9A\u6210\u529F" };
          } catch (err) {
            if (err.name === "AbortError") {
              throw new Error("\u30BF\u30A4\u30E0\u30A2\u30A6\u30C8\u3057\u307E\u3057\u305F");
            }
            throw err;
          } finally {
            clearTimeout(timeoutId);
          }
        }
        // レビュー分析
        async analyzeReviews(asin, productTitle, reviews) {
          const { positive, negative } = reviews;
          if (!positive.length && !negative.length) {
            throw new Error("\u5206\u6790\u3059\u308B\u30EC\u30D3\u30E5\u30FC\u304C\u3042\u308A\u307E\u305B\u3093");
          }
          const positiveText = positive.map((r, i) => `[${i + 1}] \u2605${r.rating} ${r.title}
${r.body}`).join("\n\n");
          const negativeText = negative.map((r, i) => `[${i + 1}] \u2605${r.rating} ${r.title}
${r.body}`).join("\n\n");
          const prompt = `\u3042\u306A\u305F\u306F\u4E16\u754C\u6700\u9AD8\u6C34\u6E96\u306E\u30DE\u30FC\u30B1\u30BF\u30FC\u306E\u601D\u8003\u3092\u6301\u3064Amazon OEM\u30EA\u30B5\u30FC\u30C1\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002
\u4EE5\u4E0B\u306E\u30EC\u30D3\u30E5\u30FC\u3092\u5206\u6790\u3057\u3001JSON\u5F62\u5F0F\u306E\u307F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u5546\u54C1\u540D\u3011${productTitle}
\u3010ASIN\u3011${asin}
\u3010\u9AD8\u8A55\u4FA1\u30EC\u30D3\u30E5\u30FC\uFF084-5\u661F\uFF09\u3011
${positiveText || "\uFF08\u9AD8\u8A55\u4FA1\u30EC\u30D3\u30E5\u30FC\u306A\u3057\uFF09"}

\u3010\u4F4E\u8A55\u4FA1\u30EC\u30D3\u30E5\u30FC\uFF081-2\u661F\uFF09\u3011
${negativeText || "\uFF08\u4F4E\u8A55\u4FA1\u30EC\u30D3\u30E5\u30FC\u306A\u3057\uFF09"}

\u4EE5\u4E0B\u306E4\u3064\u306E\u89B3\u70B9\u3067\u5206\u6790\u3057\u3066\u304F\u3060\u3055\u3044\u3002

1. persona\uFF08\u8CFC\u8CB7\u30DA\u30EB\u30BD\u30CA 5W1H\uFF09
   - who: \u8AB0\u304C\u8CB7\u3063\u3066\u3044\u308B\u304B\uFF08\u4E0A\u4F4D3\u5C5E\u6027\u30FB\u5272\u5408\u4ED8\u304D\uFF09
   - when: \u3044\u3064\u8CB7\u3046\u304B\uFF08\u8CFC\u8CB7\u30BF\u30A4\u30DF\u30F3\u30B0 \u4E0A\u4F4D3\u30D1\u30BF\u30FC\u30F3\u30FB\u5272\u5408\u4ED8\u304D\uFF09
   - where: \u3069\u3053\u3067\u4F7F\u3046\u304B\uFF08\u4F7F\u7528\u5834\u6240 \u4E0A\u4F4D3\u30D1\u30BF\u30FC\u30F3\u30FB\u5272\u5408\u4ED8\u304D\uFF09
   - what: \u4F55\u306E\u305F\u3081\u306B\u8CB7\u3046\u304B\uFF08\u76EE\u7684 \u4E0A\u4F4D3\u30D1\u30BF\u30FC\u30F3\u30FB\u5272\u5408\u4ED8\u304D\uFF09
   - why: \u306A\u305C\u4ECA\u8CB7\u3063\u305F\u304B\uFF08\u8CFC\u8CB7\u30C8\u30EA\u30AC\u30FC \u4E0A\u4F4D3\u30D1\u30BF\u30FC\u30F3\u30FB\u5272\u5408\u4ED8\u304D\uFF09
   - how: \u3069\u3046\u3084\u3063\u3066\u77E5\u3063\u305F\u304B\uFF08\u6D41\u5165\u7D4C\u8DEF \u4E0A\u4F4D3\u30D1\u30BF\u30FC\u30F3\u30FB\u5272\u5408\u4ED8\u304D\uFF09

2. pros\uFF08\u9AD8\u8A55\u4FA1\u30DD\u30A4\u30F3\u30C8\uFF09\u54045\u4EF6
   - topic: \u30C8\u30D4\u30C3\u30AF\u540D
   - percent: \u8A00\u53CA\u5272\u5408\uFF08%\uFF09
   - review_quote: \u30EC\u30D3\u30E5\u30FC\u304B\u3089\u306E\u5F15\u7528\uFF0830\u6587\u5B57\u4EE5\u5185\uFF09

3. cons\uFF08\u4F4E\u8A55\u4FA1\u30DD\u30A4\u30F3\u30C8\uFF09\u54045\u4EF6
   - topic: \u30C8\u30D4\u30C3\u30AF\u540D
   - percent: \u8A00\u53CA\u5272\u5408\uFF08%\uFF09
   - review_quote: \u30EC\u30D3\u30E5\u30FC\u304B\u3089\u306E\u5F15\u7528\uFF0830\u6587\u5B57\u4EE5\u5185\uFF09

4. usage_scenes\uFF08\u4F7F\u7528\u30B7\u30FC\u30F3\uFF09\u54045\u4EF6
   - scene: \u30B7\u30FC\u30F3\u540D
   - percent: \u8A00\u53CA\u5272\u5408\uFF08%\uFF09
   - review_quote: \u30EC\u30D3\u30E5\u30FC\u304B\u3089\u306E\u5F15\u7528\uFF0830\u6587\u5B57\u4EE5\u5185\uFF09

\u5FC5\u305AJSON\u5F62\u5F0F\u306E\u307F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u8AAC\u660E\u6587\u306F\u4E0D\u8981\u3067\u3059\u3002`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS2);
          try {
            const response = await fetch(ANTHROPIC_API_URL, {
              method: "POST",
              headers: {
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
              },
              body: JSON.stringify({
                model: MODEL,
                max_tokens: MAX_TOKENS,
                messages: [{ role: "user", content: prompt }]
              }),
              signal: controller.signal
            });
            if (response.status === 401) {
              throw new Error("Anthropic API\u30AD\u30FC\u304C\u7121\u52B9\u3067\u3059\u3002\u8A2D\u5B9A\u753B\u9762\u3067\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044");
            }
            if (response.status === 429) {
              throw new Error("\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u3057\u3070\u3089\u304F\u5F8C\u306B\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\uFF08\u30EC\u30FC\u30C8\u5236\u9650\uFF09");
            }
            if (!response.ok) {
              throw new Error(`\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F\uFF08HTTP\u30A8\u30E9\u30FC: ${response.status}\uFF09`);
            }
            const data = await response.json();
            const content = data.content?.[0]?.text || "";
            const jsonText = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
            const parsed = JSON.parse(jsonText);
            return { success: true, result: parsed };
          } catch (err) {
            if (err.name === "AbortError") {
              throw new Error("\u5206\u6790\u304C\u30BF\u30A4\u30E0\u30A2\u30A6\u30C8\u3057\u307E\u3057\u305F\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044");
            }
            if (err instanceof SyntaxError) {
              throw new Error("\u5206\u6790\u7D50\u679C\u306E\u89E3\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044");
            }
            throw err;
          } finally {
            clearTimeout(timeoutId);
          }
        }
      };
    }
  });

  // extension/background/service-worker.js
  var require_service_worker = __commonJS({
    "extension/background/service-worker.js"() {
      init_sellersprite();
      init_claude();
      var CACHE_TTL = {
        categoryNode: 7 * 24 * 60 * 60 * 1e3
        // 7日
      };
      chrome.runtime.onInstalled.addListener((details) => {
        if (details.reason === "install") {
          chrome.runtime.openOptionsPage();
        }
      });
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleMessage(message, sender).then(sendResponse).catch((err) => {
          console.error("[EC Lens SW] \u30A8\u30E9\u30FC:", message.type, err);
          sendResponse({ error: err.message || "\u4E0D\u660E\u306A\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F" });
        });
        return true;
      });
      async function handleMessage(message, sender) {
        const { type } = message;
        switch (type) {
          case "GET_SETTINGS":
            return getSettings();
          case "SEARCH_ANALYSIS":
            return handleSearchAnalysis(message.keyword);
          case "ASIN_ANALYSIS":
            return handleAsinAnalysis(message.asin);
          case "REVIEW_ANALYSIS":
            return handleReviewAnalysis(message.asin, message.productTitle, message.reviews);
          case "TEST_SELLERSPRITE_KEY":
            return testSellerSpriteKey(message.secretKey);
          case "TEST_ANTHROPIC_KEY":
            return testAnthropicKey(message.apiKey);
          case "CLEAR_CACHE":
            return clearCache();
          case "OPEN_OPTIONS":
            chrome.runtime.openOptionsPage();
            return { success: true };
          default:
            throw new Error(`\u4E0D\u660E\u306A\u30E1\u30C3\u30BB\u30FC\u30B8\u30BF\u30A4\u30D7: ${type}`);
        }
      }
      async function getSettings() {
        const result = await chrome.storage.local.get([
          "sellerSpriteKey",
          "anthropicKey",
          "extensionEnabled",
          "searchPageEnabled",
          "asinPageEnabled"
        ]);
        return {
          sellerSpriteKey: result.sellerSpriteKey || "",
          anthropicKey: result.anthropicKey || "",
          extensionEnabled: result.extensionEnabled !== false,
          searchPageEnabled: result.searchPageEnabled !== false,
          asinPageEnabled: result.asinPageEnabled !== false
        };
      }
      async function handleSearchAnalysis(keyword) {
        const settings = await getSettings();
        if (!settings.sellerSpriteKey) {
          throw new Error("SellerSprite API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
        }
        const cacheKey = `search_${keyword}`;
        const cached = await getSessionCache(cacheKey);
        if (cached) return cached;
        const api = new SellerSpriteAPI(settings.sellerSpriteKey);
        const [keywordData, productData] = await Promise.allSettled([
          api.keywordMiner(keyword),
          api.productResearch(keyword)
        ]);
        const result = {
          keyword,
          keywordData: keywordData.status === "fulfilled" ? keywordData.value : null,
          keywordError: keywordData.status === "rejected" ? keywordData.reason.message : null,
          productData: productData.status === "fulfilled" ? productData.value : null,
          productError: productData.status === "rejected" ? productData.reason.message : null
        };
        await setSessionCache(cacheKey, result);
        return result;
      }
      async function handleAsinAnalysis(asin) {
        const settings = await getSettings();
        if (!settings.sellerSpriteKey) {
          throw new Error("SellerSprite API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
        }
        const cacheKey = `asin_${asin}`;
        const cached = await getSessionCache(cacheKey);
        if (cached) return cached;
        const api = new SellerSpriteAPI(settings.sellerSpriteKey);
        const [asinDetail, salesPrediction, trafficKeyword, googleTrends, bsrPrediction] = await Promise.allSettled([
          api.asinDetail("JP", asin),
          api.salesPredictionAsin(asin),
          api.trafficKeyword(asin),
          api.googleTrends(asin),
          api.salesPredictionBsr(asin)
        ]);
        const result = {
          asin,
          asinDetail: asinDetail.status === "fulfilled" ? asinDetail.value : null,
          asinDetailError: asinDetail.status === "rejected" ? asinDetail.reason.message : null,
          salesPrediction: salesPrediction.status === "fulfilled" ? salesPrediction.value : null,
          salesPredictionError: salesPrediction.status === "rejected" ? salesPrediction.reason.message : null,
          trafficKeyword: trafficKeyword.status === "fulfilled" ? trafficKeyword.value : null,
          trafficKeywordError: trafficKeyword.status === "rejected" ? trafficKeyword.reason.message : null,
          googleTrends: googleTrends.status === "fulfilled" ? googleTrends.value : null,
          googleTrendsError: googleTrends.status === "rejected" ? googleTrends.reason.message : null,
          bsrPrediction: bsrPrediction.status === "fulfilled" ? bsrPrediction.value : null,
          bsrPredictionError: bsrPrediction.status === "rejected" ? bsrPrediction.reason.message : null
        };
        await setSessionCache(cacheKey, result);
        return result;
      }
      async function handleReviewAnalysis(asin, productTitle, reviews) {
        const settings = await getSettings();
        if (!settings.anthropicKey) {
          throw new Error("Anthropic API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
        }
        const claude = new ClaudeAPI(settings.anthropicKey);
        return claude.analyzeReviews(asin, productTitle, reviews);
      }
      async function testSellerSpriteKey(secretKey) {
        const api = new SellerSpriteAPI(secretKey);
        return api.checkVisits();
      }
      async function testAnthropicKey(apiKey) {
        const claude = new ClaudeAPI(apiKey);
        return claude.testConnection();
      }
      async function clearCache() {
        await chrome.storage.session.clear();
        return { success: true };
      }
      async function getSessionCache(key) {
        const result = await chrome.storage.session.get(key);
        return result[key] || null;
      }
      async function setSessionCache(key, value) {
        await chrome.storage.session.set({ [key]: value });
      }
    }
  });
  require_service_worker();
})();
