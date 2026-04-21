// pages/room/index.ts
Page({
  data: {},
  onShow() {
    wx.showModal({
      title: '🚧 功能开发中',
      content: '多人同桌同步功能将在 M3 阶段上线，敬请期待',
      showCancel: false,
      success: () => wx.navigateBack(),
    });
  },
});
