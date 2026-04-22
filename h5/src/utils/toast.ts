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

function injectStyle() {
  if (document.getElementById('__hotpot_toast_style__')) return;
  const style = document.createElement('style');
  style.id = '__hotpot_toast_style__';
  style.textContent = `
    @keyframes toastIn { from { opacity:0; transform:translateY(-8px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes dialogIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
  `;
  document.head.appendChild(style);
}

function showToast(message: string, type: 'info' | 'success' | 'fail' | 'loading', duration: number) {
  injectStyle();
  const container = getToastContainer();
  container.innerHTML = '';
  if (toastTimer) clearTimeout(toastTimer);

  const bgMap = {
    info: 'rgba(40,40,40,0.90)',
    success: 'rgba(39,174,96,0.94)',
    fail: 'rgba(192,57,43,0.94)',
    loading: 'rgba(40,40,40,0.90)',
  };

  const el = document.createElement('div');
  el.style.cssText = `
    background: ${bgMap[type]}; color: #fff;
    padding: 11px 22px; border-radius: 24px;
    font-size: 14px; font-weight: 500; letter-spacing: 0.3px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    max-width: 260px; text-align: center; line-height: 1.5;
    animation: toastIn 0.2s ease;
    white-space: pre-line; backdrop-filter: blur(4px);
  `;

  const icon = type === 'success' ? '✓  ' : type === 'fail' ? '✕  ' : type === 'loading' ? '⏳  ' : '';
  el.textContent = icon + message;
  container.appendChild(el);

  if (duration > 0) {
    toastTimer = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.2s';
      setTimeout(() => { container.innerHTML = ''; }, 200);
    }, duration);
  }
}

export function toast(message: string, duration = 2000) { showToast(message, 'info', duration); }
export function toastSuccess(message: string) { showToast(message, 'success', 1800); }
export function toastFail(message: string) { showToast(message, 'fail', 2500); }
export function toastLoading(message = '连接中...') { showToast(message, 'loading', 0); }
export function closeToast() {
  if (toastContainer) toastContainer.innerHTML = '';
  if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
}

// ======================== Dialog ========================

interface DialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmDanger?: boolean;
  icon?: string;
}

function createDialog(opts: DialogOptions, hasCancelBtn: boolean): Promise<boolean> {
  injectStyle();
  return new Promise((resolve) => {
    const mask = document.createElement('div');
    mask.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      box-sizing: border-box;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: #fff; border-radius: 20px; overflow: hidden;
      width: 100%; max-width: 300px;
      text-align: center;
      box-shadow: 0 16px 40px rgba(0,0,0,0.20);
      animation: dialogIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
    `;

    // 顶部图标区（若有icon则显示）
    if (opts.icon) {
      const iconWrap = document.createElement('div');
      iconWrap.style.cssText = `
        padding: 22px 20px 4px;
        font-size: 42px; line-height: 1;
      `;
      iconWrap.textContent = opts.icon;
      box.appendChild(iconWrap);
    }

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      font-size: 17px; font-weight: 700; color: #1a1a1a;
      padding: ${opts.icon ? '8px' : '24px'} 24px 8px;
      line-height: 1.4;
    `;
    titleEl.textContent = opts.title;
    box.appendChild(titleEl);

    if (opts.message) {
      const msgEl = document.createElement('div');
      msgEl.style.cssText = `
        font-size: 14px; color: #888; padding: 0 24px 20px;
        line-height: 1.6;
      `;
      msgEl.textContent = opts.message;
      box.appendChild(msgEl);
    } else {
      titleEl.style.paddingBottom = '24px';
    }

    const btns = document.createElement('div');
    btns.style.cssText = `
      display: flex; gap: 12px;
      padding: 0 16px 16px; box-sizing: border-box;
    `;

    if (hasCancelBtn) {
      const cancelBtn = document.createElement('button');
      cancelBtn.style.cssText = `
        flex: 1; padding: 13px 0; font-size: 15px;
        border: 1.5px solid #E8E8E8; background: #F7F7F7;
        color: #666; cursor: pointer; border-radius: 12px;
        font-weight: 500; transition: background 0.15s;
      `;
      cancelBtn.textContent = opts.cancelText || '取消';
      cancelBtn.onmousedown = () => { cancelBtn.style.background = '#EFEFEF'; };
      cancelBtn.onmouseup = () => { cancelBtn.style.background = '#F7F7F7'; };
      cancelBtn.onclick = () => { cleanup(false); };
      btns.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement('button');
    const isDanger = opts.confirmDanger !== false; // 默认danger红色
    confirmBtn.style.cssText = `
      flex: 1; padding: 13px 0; font-size: 15px; font-weight: 700;
      border: none; cursor: pointer; border-radius: 12px; color: #fff;
      background: ${isDanger
        ? 'linear-gradient(135deg, #E8432D, #C0392B)'
        : 'linear-gradient(135deg, #2ECC71, #27AE60)'};
      box-shadow: ${isDanger
        ? '0 4px 12px rgba(192,57,43,0.35)'
        : '0 4px 12px rgba(39,174,96,0.35)'};
      transition: opacity 0.15s;
    `;
    confirmBtn.textContent = opts.confirmText || '确定';
    confirmBtn.onmousedown = () => { confirmBtn.style.opacity = '0.85'; };
    confirmBtn.onmouseup = () => { confirmBtn.style.opacity = '1'; };
    confirmBtn.onclick = () => { cleanup(true); };
    btns.appendChild(confirmBtn);

    box.appendChild(btns);
    mask.appendChild(box);
    document.body.appendChild(mask);

    const cleanup = (result: boolean) => {
      mask.style.opacity = '0';
      mask.style.transition = 'opacity 0.15s';
      setTimeout(() => {
        if (document.body.contains(mask)) document.body.removeChild(mask);
      }, 150);
      resolve(result);
    };

    mask.onclick = (e) => { if (e.target === mask) cleanup(false); };
  });
}

/** 确认弹窗 */
export function confirm(title: string, message?: string, opts?: Partial<DialogOptions>): Promise<boolean> {
  return createDialog({ title, message, confirmDanger: true, ...opts }, true);
}

/** 提示弹窗 */
export function alert(title: string, message?: string, opts?: Partial<DialogOptions>): Promise<void> {
  return createDialog({
    title, message,
    confirmText: '我知道了',
    confirmDanger: false,
    ...opts
  }, false).then(() => {});
}
