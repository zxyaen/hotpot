import { Food, Pot } from '../types';

const FOODS: Food[] = [
  { id: 'mao_du', name: '毛肚', emoji: '🫀', category: '牛肉类', cookTime: { min: 8, recommended: 15, max: 20 }, tips: '七上八下，15秒脆嫩爽口', popularity: 98 },
  { id: 'huang_hou', name: '黄喉', emoji: '🫀', category: '牛肉类', cookTime: { min: 10, recommended: 20, max: 30 }, tips: '涮20秒，脆嫩有嚼劲', popularity: 92 },
  { id: 'ya_chang', name: '鸭肠', emoji: '🦆', category: '内脏类', cookTime: { min: 8, recommended: 12, max: 15 }, tips: '七上八下10秒最佳', popularity: 90 },
  { id: 'niu_rou_juan', name: '肥牛卷', emoji: '🥩', category: '牛肉类', cookTime: { min: 10, recommended: 15, max: 20 }, tips: '变色即可捞出', popularity: 95 },
  { id: 'fei_yang_juan', name: '肥羊卷', emoji: '🐑', category: '羊肉类', cookTime: { min: 10, recommended: 15, max: 20 }, tips: '变色即可，鲜嫩不柴', popularity: 88 },
  { id: 'xia_hua', name: '虾滑', emoji: '🦐', category: '海鲜类', cookTime: { min: 90, recommended: 120, max: 180 }, tips: '浮起后再煮30秒', popularity: 93 },
  { id: 'xian_xia', name: '鲜虾', emoji: '🦐', category: '海鲜类', cookTime: { min: 120, recommended: 180, max: 240 }, tips: '变红弯曲后再煮一会儿', popularity: 85 },
  { id: 'yu_pian', name: '鱼片', emoji: '🐟', category: '海鲜类', cookTime: { min: 30, recommended: 60, max: 90 }, tips: '变白卷起即可', popularity: 78 },
  { id: 'you_yu', name: '鱿鱼', emoji: '🦑', category: '海鲜类', cookTime: { min: 60, recommended: 120, max: 180 }, tips: '卷起来就熟了', popularity: 75 },
  { id: 'xie_bang', name: '蟹棒', emoji: '🦀', category: '丸滑类', cookTime: { min: 120, recommended: 180, max: 300 }, tips: '浮起再煮1分钟', popularity: 70 },
  { id: 'yu_wan', name: '鱼丸', emoji: '⚪', category: '丸滑类', cookTime: { min: 180, recommended: 300, max: 480 }, tips: '浮起后再煮2分钟', popularity: 82 },
  { id: 'niu_rou_wan', name: '牛肉丸', emoji: '🟤', category: '丸滑类', cookTime: { min: 240, recommended: 360, max: 540 }, tips: '煮到膨胀浮起', popularity: 85 },
  { id: 'xia_wan', name: '虾丸', emoji: '🟠', category: '丸滑类', cookTime: { min: 180, recommended: 300, max: 420 }, tips: '浮起再煮1-2分钟', popularity: 76 },
  { id: 'xue_wang', name: '鸭血', emoji: '🟥', category: '内脏类', cookTime: { min: 180, recommended: 300, max: 600 }, tips: '久煮更入味', popularity: 88 },
  { id: 'nao_hua', name: '脑花', emoji: '🧠', category: '内脏类', cookTime: { min: 600, recommended: 900, max: 1200 }, tips: '小火慢煮15分钟', popularity: 72 },
  { id: 'niu_bai_ye', name: '千层肚', emoji: '🥩', category: '内脏类', cookTime: { min: 15, recommended: 20, max: 25 }, tips: '涮20秒脆嫩', popularity: 80 },
  { id: 'dou_pi', name: '豆皮', emoji: '🟨', category: '豆制品', cookTime: { min: 60, recommended: 120, max: 180 }, tips: '涮2分钟吸汤入味', popularity: 84 },
  { id: 'dou_fu', name: '嫩豆腐', emoji: '🟨', category: '豆制品', cookTime: { min: 120, recommended: 180, max: 300 }, tips: '小心夹取', popularity: 72 },
  { id: 'dong_dou_fu', name: '冻豆腐', emoji: '🟨', category: '豆制品', cookTime: { min: 180, recommended: 300, max: 600 }, tips: '吸饱汤汁最美味', popularity: 86 },
  { id: 'fu_zhu', name: '腐竹', emoji: '🟫', category: '豆制品', cookTime: { min: 120, recommended: 180, max: 300 }, tips: '变软即可', popularity: 74 },
  { id: 'kuan_fen', name: '宽粉', emoji: '🍜', category: '主食类', cookTime: { min: 180, recommended: 300, max: 420 }, tips: '变透明变软', popularity: 90 },
  { id: 'fen_si', name: '粉丝', emoji: '🍜', category: '主食类', cookTime: { min: 60, recommended: 120, max: 180 }, tips: '变透明即可', popularity: 80 },
  { id: 'nian_gao', name: '年糕', emoji: '⬜', category: '主食类', cookTime: { min: 120, recommended: 180, max: 300 }, tips: '变软有弹性', popularity: 75 },
  { id: 'fang_bian_mian', name: '方便面', emoji: '🍜', category: '主食类', cookTime: { min: 90, recommended: 120, max: 180 }, tips: '煮软即可', popularity: 82 },
  { id: 'tu_dou', name: '土豆片', emoji: '🥔', category: '蔬菜类', cookTime: { min: 120, recommended: 180, max: 300 }, tips: '透亮变软即熟', popularity: 85 },
  { id: 'lian_ou', name: '莲藕', emoji: '⚪', category: '蔬菜类', cookTime: { min: 120, recommended: 240, max: 360 }, tips: '透明脆感最佳', popularity: 78 },
  { id: 'sheng_cai', name: '生菜', emoji: '🥬', category: '蔬菜类', cookTime: { min: 20, recommended: 30, max: 60 }, tips: '烫熟即可', popularity: 88 },
  { id: 'bo_cai', name: '菠菜', emoji: '🥬', category: '蔬菜类', cookTime: { min: 30, recommended: 45, max: 60 }, tips: '变软即可', popularity: 72 },
  { id: 'bai_cai', name: '娃娃菜', emoji: '🥬', category: '蔬菜类', cookTime: { min: 60, recommended: 120, max: 180 }, tips: '变软透明', popularity: 80 },
  { id: 'tong_gao', name: '茼蒿', emoji: '🌿', category: '蔬菜类', cookTime: { min: 30, recommended: 45, max: 60 }, tips: '变软即熟', popularity: 68 },
  { id: 'jin_zhen_gu', name: '金针菇', emoji: '🍄', category: '菌菇类', cookTime: { min: 60, recommended: 90, max: 120 }, tips: 'See you tomorrow 😄', popularity: 90 },
  { id: 'xiang_gu', name: '香菇', emoji: '🍄', category: '菌菇类', cookTime: { min: 180, recommended: 300, max: 420 }, tips: '煮5分钟才入味', popularity: 76 },
  { id: 'ping_gu', name: '平菇', emoji: '🍄', category: '菌菇类', cookTime: { min: 120, recommended: 180, max: 240 }, tips: '变软即熟', popularity: 70 },
  { id: 'yu_mi', name: '玉米', emoji: '🌽', category: '蔬菜类', cookTime: { min: 300, recommended: 480, max: 720 }, tips: '小火慢煮，甜味释放', popularity: 82 },
  { id: 'sheng_cai2', name: '油麦菜', emoji: '🥬', category: '蔬菜类', cookTime: { min: 30, recommended: 45, max: 60 }, tips: '烫软即可', popularity: 75 },
  { id: 'long_li_yu', name: '龙利鱼', emoji: '🐟', category: '海鲜类', cookTime: { min: 45, recommended: 75, max: 120 }, tips: '变白即熟', popularity: 77 },
  { id: 'ma_ling_shu', name: '红薯片', emoji: '🍠', category: '主食类', cookTime: { min: 180, recommended: 240, max: 360 }, tips: '变软变甜', popularity: 72 },
  { id: 'pang_xie', name: '螃蟹', emoji: '🦀', category: '海鲜类', cookTime: { min: 420, recommended: 600, max: 900 }, tips: '煮10分钟，变红即熟', popularity: 70 },
];

export const POTS: Pot[] = [
  { id: 'qing_tang', name: '清汤锅', emoji: '🥘', color: '#FFF5E6', boilTemp: 100, timeFactor: 1.0, description: '标准沸水，食材原味' },
  { id: 'fan_qie', name: '番茄锅', emoji: '🍅', color: '#FF6347', boilTemp: 98, timeFactor: 1.05, description: '酸甜开胃' },
  { id: 'ma_la', name: '麻辣锅', emoji: '🌶️', color: '#C0392B', boilTemp: 105, timeFactor: 0.95, description: '油脂覆盖，温度略高' },
  { id: 'niu_you', name: '牛油锅', emoji: '🔥', color: '#8B0000', boilTemp: 110, timeFactor: 0.9, description: '牛油浓郁，温度最高' },
  { id: 'jun_gu', name: '菌菇锅', emoji: '🍄', color: '#D4A574', boilTemp: 100, timeFactor: 1.0, description: '清鲜滋补' },
  { id: 'suan_cai', name: '酸菜锅', emoji: '🥬', color: '#F5DEB3', boilTemp: 100, timeFactor: 1.0, description: '东北酸爽' },
  { id: 'yuan_yang', name: '鸳鸯锅', emoji: '☯️', color: '#8B0000', boilTemp: 105, timeFactor: 0.95, description: '一锅两味' },
];

const CATEGORIES = ['牛肉类', '羊肉类', '海鲜类', '内脏类', '丸滑类', '豆制品', '主食类', '蔬菜类', '菌菇类'];
const CUSTOM_CATEGORY = '自定义';

// 懒加载 customDataStore，避免循环依赖
let _customStore: { getCustomFoods(): Food[]; getCustomPots(): Pot[] } | null = null;
export function setCustomStore(store: { getCustomFoods(): Food[]; getCustomPots(): Pot[] }) {
  _customStore = store;
}

export function getAllFoods(): Food[] {
  const custom = _customStore?.getCustomFoods() ?? [];
  // 内置在前，自定义在后；自定义条目覆盖同 id 的内置条目
  const builtinFiltered = FOODS.filter(f => !custom.find(c => c.id === f.id));
  return [...builtinFiltered, ...custom];
}

export function getAllPots(): Pot[] {
  const custom = _customStore?.getCustomPots() ?? [];
  const builtinFiltered = POTS.filter(p => !custom.find(c => c.id === p.id));
  return [...builtinFiltered, ...custom];
}

export function getCategories(): string[] {
  const customFoods = _customStore?.getCustomFoods() ?? [];
  const hasCustom = customFoods.some(f => f.category === CUSTOM_CATEGORY || !CATEGORIES.includes(f.category));
  return hasCustom ? [...CATEGORIES, CUSTOM_CATEGORY] : CATEGORIES;
}

export function getFoodById(id: string): Food | undefined {
  return getAllFoods().find(f => f.id === id);
}

export function getPotById(id: string): Pot | undefined {
  return getAllPots().find(p => p.id === id);
}

export function adjustTimeByPot(baseSeconds: number, potId: string | null): number {
  if (!potId) return baseSeconds;
  const pot = getPotById(potId);
  if (!pot) return baseSeconds;
  return Math.round(baseSeconds * pot.timeFactor);
}
