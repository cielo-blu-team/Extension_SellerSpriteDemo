/**
 * フローティングボタンコンポーネント
 * 商品詳細ページ右下に固定表示
 */

export class FloatingButton {
  constructor() {
    this.el = null;
  }

  render() {
    const btn = document.createElement('button');
    btn.id = 'ec-lens-floating-btn';
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
      <span id="ec-lens-fab-label">EC Lens 分析</span>
    `;

    this.el = btn;
    return btn;
  }

  setLoading() {
    const label = this.el.querySelector('#ec-lens-fab-label');
    const icon = this.el.querySelector('.ec-lens-fab-icon');
    icon.style.display = 'none';

    const spinner = document.createElement('span');
    spinner.className = 'ec-lens-fab-spinner';
    spinner.id = 'ec-lens-fab-spinner';
    this.el.insertBefore(spinner, label);

    label.textContent = '取得中...';
    this.el.disabled = true;
  }

  setReady() {
    const spinner = this.el.querySelector('#ec-lens-fab-spinner');
    if (spinner) spinner.remove();

    const icon = this.el.querySelector('.ec-lens-fab-icon');
    icon.style.display = '';

    const label = this.el.querySelector('#ec-lens-fab-label');
    label.textContent = 'EC Lens 分析';
    this.el.disabled = false;
  }

  onClick(handler) {
    this.el.addEventListener('click', handler);
  }
}
