/**
 * 工具函数
 */

/**
 * 格式化倒计时 mm:ss
 */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}

/**
 * 格式化时长文本
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m}分钟`;
  return `${m}分${s}秒`;
}

/**
 * 格式化日期 YYYY-MM-DD HH:mm
 */
export function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 生成唯一 ID
 */
export function uuid(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, wait: number): T {
  let last = 0;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  } as T;
}

/**
 * 震动 + 播放提示音
 */
let audioCtx: WechatMiniprogram.InnerAudioContext | null = null;

export function initAudio() {
  if (audioCtx) return;
  audioCtx = wx.createInnerAudioContext();
  // 使用系统铃声的 base64 或短音频即可（先用 wx 震动 + Toast 代替）
}

export function playAlert() {
  // 震动已移除
}
