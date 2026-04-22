/**
 * 全局 Toast / Dialog 封装
 * 使用原生 DOM 实现，避免 react-vant Toast 在 React 18 下的兼容问题
 */

// ======================== Toast ========================

let toastContainer: HTMLDivElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function getToastContainer(): HTMLDivElement {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = '__hotpot_toast__';
    toastContainer.style.cssText = `
      position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
      z-index: 9999; pointer-events: none;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(message: string, type: 'info' | 'success' | 'fail' | 'loading', duration: number) {
  const container = getToastContainer();
  // 清掉之前的
  container.innerHTML = '';
  if (toastTimer) clearTimeout(toastTimer);

  const bgMap = {
    info: 'rgba(50,50,50,0.88)',
    success: 'rgba(39,174,96,0.92)',
    fail: 'rgba(192,57,43,0.92)',
    loading: 'rgba(50,50,50,0.88)',
  };

  const el = document.createElement('div');
  el.style.cssText = `
    background: ${bgMap[type]}; color: #fff;
    padding: 10px 20px; border-radius: 22px;
    font-size: 14px; font-weight: 500; letter-spacing: 0.3px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.22);
    max-width: 260px; text-align: center; line-height: 1.5;
    animation: toastIn 0.2s ease;
    white-space: pre-line;
  `;

  const icon = type === 'success' ? '✓ ' : type === 'fail' ? '✕ ' : type === 'loading' ? '⏳ ' : '';
  el.textContent = icon + message;
  container.appendChild(el);

  if (!document.getElementById('__hotpot_toast_style__')) {
    const style = document.createElement('style');
    style.id = '__hotpot_toast_style__';
    style.textContent = `@keyframes toastIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`;
    document.head.appendChild(style);
  }

  if (duration > 0) {
    toastTimer = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.2s';
      setTimeout(() => { container.innerHTML = ''; }, 200);
    }, duration);
  }
}

/** 轻提示 */
export function toast(message: string, duration = 2000) {
  showToast(message, 'info', duration);
}

/** 成功提示 */
export function toastSuccess(message: string) {
  showToast(message, 'success', 1800);
}

/** 失败提示 */
export function toastFail(message: string) {
  showToast(message, 'fail', 2500);
}

/** 加载提示（需手动关闭） */
export function toastLoading(message = '连接中...') {
  showToast(message, 'loading', 0);
}

/** 关闭 Toast */
export function closeToast() {
  if (toastContainer) toastContainer.innerHTML = '';
  if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
}

// ======================== Dialog ========================

/** 确认弹窗（替代 window.confirm） */
export function confirm(title: string, message?: string): Promise<boolean> {
  return new Promise((resolve) => {
    // 创建遮罩
    const mask = document.createElement('div');
    mask.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 10000; display: flex; align-items: center; justify-content: center;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: #fff; border-radius: 16px; overflow: hidden;
      width: 280px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    `;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `font-size: 16px; font-weight: 700; color: #1a1a1a; padding: 20px 20px 8px;`;
    titleEl.textContent = title;

    const msgEl = document.createElement('div');
    msgEl.style.cssText = `font-size: 14px; color: #666; padding: 0 20px 20px; line-height: 1.5;`;
    msgEl.textContent = message || '';

    const btns = document.createElement('div');
    btns.style.cssText = `display: flex; border-top: 1px solid #f0f0f0;`;

    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = `flex:1; padding: 14px; font-size:16px; border:none; background:#fff; color:#666; cursor:pointer; border-right:1px solid #f0f0f0; border-radius:0 0 0 16px;`;
    cancelBtn.textContent = '取消';

    const confirmBtn = document.createElement('button');
    confirmBtn.style.cssText = `flex:1; padding: 14px; font-size:16px; font-weight:700; border:none; background:#fff; color:#C0392B; cursor:pointer; border-radius:0 0 16px 0;`;
    confirmBtn.textContent = '确定';

    btns.appendChild(cancelBtn);
    btns.appendChild(confirmBtn);
    if (message) box.appendChild(msgEl);
    box.appendChild(titleEl);
    box.appendChild(btns);
    mask.appendChild(box);
    document.body.appendChild(mask);

    const cleanup = (result: boolean) => {
      document.body.removeChild(mask);
      resolve(result);
    };

    cancelBtn.onclick = () => cleanup(false);
    confirmBtn.onclick = () => cleanup(true);
    mask.onclick = (e) => { if (e.target === mask) cleanup(false); };
  });
}

/** 提示弹窗（替代 window.alert） */
export function alert(title: string, message?: string): Promise<void> {
  return new Promise((resolve) => {
    const mask = document.createElement('div');
    mask.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 10000; display: flex; align-items: center; justify-content: center;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: #fff; border-radius: 16px; overflow: hidden;
      width: 280px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    `;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `font-size: 16px; font-weight: 700; color: #1a1a1a; padding: 20px 20px 8px;`;
    titleEl.textContent = title;

    const msgEl = document.createElement('div');
    msgEl.style.cssText = `font-size: 14px; color: #666; padding: 0 20px 20px; line-height: 1.5;`;
    msgEl.textContent = message || '';

    const btns = document.createElement('div');
    btns.style.cssText = `display: flex; border-top: 1px solid #f0f0f0;`;

    const okBtn = document.createElement('button');
    okBtn.style.cssText = `flex:1; padding: 14px; font-size:16px; font-weight:700; border:none; background:#fff; color:#C0392B; cursor:pointer;`;
    okBtn.textContent = '我知道了';

    btns.appendChild(okBtn);
    if (message) box.appendChild(msgEl);
    box.appendChild(titleEl);
    box.appendChild(btns);
    mask.appendChild(box);
    document.body.appendChild(mask);

    okBtn.onclick = () => { document.body.removeChild(mask); resolve(); };
  });
}
