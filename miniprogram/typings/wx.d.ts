/**
 * 微信小程序全局类型声明（简化版，仅保证编译通过）
 * 实际运行时由微信开发者工具提供完整类型
 */

declare const wx: any;
declare function App<T>(options: any): T;
declare function Page(options: any): void;
declare function Component(options: any): void;
declare function Behavior(options: any): any;
declare function getApp<T = any>(): T;
declare function getCurrentPages(): any[];

declare namespace WechatMiniprogram {
  interface InnerAudioContext {
    src: string;
    play(): void;
    pause(): void;
    stop(): void;
    destroy(): void;
  }
}
