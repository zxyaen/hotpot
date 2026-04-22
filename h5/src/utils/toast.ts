/**
 * 全局 Toast / Dialog 封装
 * 基于 react-vant
 */
import { Toast, Dialog } from 'react-vant';

/** 轻提示 */
export function toast(message: string, duration = 2000) {
  Toast.info({ message, duration, position: 'top' });
}

/** 成功提示 */
export function toastSuccess(message: string) {
  Toast.success({ message, duration: 1500, position: 'top' });
}

/** 失败提示 */
export function toastFail(message: string) {
  Toast.fail({ message, duration: 2000, position: 'top' });
}

/** 加载提示（返回 clear 函数） */
export function toastLoading(message = '连接中...') {
  Toast.loading({ message, duration: 0, position: 'top', forbidClick: true });
}

/** 关闭 Toast */
export function closeToast() {
  Toast.clear();
}

/** 确认弹窗（替代 window.confirm） */
export function confirm(title: string, message?: string): Promise<boolean> {
  return Dialog.confirm({
    title,
    message,
    confirmButtonColor: '#C0392B',
  }).then(() => true).catch(() => false);
}

/** 提示弹窗（替代 window.alert） */
export function alert(title: string, message?: string): Promise<any> {
  return Dialog.alert({ title, message, confirmButtonColor: '#C0392B' });
}
