import type { EventCategory } from "./categories";
import type { EmperorId } from "./emperors";
import type { PeriodId } from "./ming-dynasty";

/**
 * 全朝代编年事件
 * - turning：核心主线大节点
 * - major：重要事件（已并入核心主线展示）
 * - minor：细节年份（仅时期面板详情，不进入时间轴）
 *
 * 时间轴模式：
 * - core：展示 turning + major
 * - chronicle：仅皇帝更替色带，不展示事件节点
 */

export type EventWeight = "turning" | "major" | "minor";

export type TimelineMode = "core" | "chronicle";

export interface ChronicleEvent {
  id: string;
  title: string;
  /** 定位用主年份（用于纵轴位置） */
  year: number;
  /** 展示用年份文案 */
  yearLabel: string;
  description: string;
  categories: EventCategory[];
  weight: EventWeight;
  periodId: PeriodId;
  emperorId: EmperorId;
}

export const CHRONICLE_EVENTS: ChronicleEvent[] = [
  {
    id: "ev-founding",
    title: "建立大明",
    year: 1368,
    yearLabel: "1368",
    description:
      "朱元璋于南京称帝，定国号「明」，改元洪武，开启享国二百七十六年的明朝。",
    categories: ["military", "political"],
    weight: "turning",
    periodId: "hongwu",
    emperorId: "taizu",
  },
  {
    id: "ev-abolish-chancellor",
    title: "废丞相",
    year: 1380,
    yearLabel: "1380",
    description:
      "胡惟庸案后废除中书省与丞相，皇权高度集中，奠定明朝内阁制雏形。",
    categories: ["political"],
    weight: "turning",
    periodId: "hongwu",
    emperorId: "taizu",
  },
  {
    id: "ev-weiso",
    title: "卫所制度定型",
    year: 1392,
    yearLabel: "约 1392",
    description: "军户世袭、卫所屯田的军事制度在全国推开，支撑明初边防与征伐。",
    categories: ["military", "political"],
    weight: "minor",
    periodId: "hongwu",
    emperorId: "taizu",
  },
  {
    id: "ev-jingnan",
    title: "靖难之役",
    year: 1402,
    yearLabel: "1399—1402",
    description:
      "燕王朱棣起兵「清君侧」，攻陷南京。建文帝下落成谜，朱棣即位改元永乐。",
    categories: ["military", "political"],
    weight: "turning",
    periodId: "jianwen",
    emperorId: "huizong",
  },
  {
    id: "ev-yongle-enthroned",
    title: "朱棣即位改元永乐",
    year: 1403,
    yearLabel: "1403",
    description: "成祖即位，改元永乐，开启明朝国力巅峰的二十年。",
    categories: ["political"],
    weight: "major",
    periodId: "yongle",
    emperorId: "chengzu",
  },
  {
    id: "ev-zhenghe",
    title: "郑和下西洋",
    year: 1405,
    yearLabel: "1405—1433",
    description:
      "郑和率领庞大船队七下西洋，远达印度洋与东非，朝贡贸易与国威远播。",
    categories: ["foreign"],
    weight: "turning",
    periodId: "yongle",
    emperorId: "chengzu",
  },
  {
    id: "ev-yongle-dadian",
    title: "编修《永乐大典》",
    year: 1408,
    yearLabel: "1403—1408",
    description: "集天下典籍之大成，编成两万余卷，是世界文化史上巨构。",
    categories: ["culture"],
    weight: "major",
    periodId: "yongle",
    emperorId: "chengzu",
  },
  {
    id: "ev-move-capital",
    title: "迁都北京",
    year: 1421,
    yearLabel: "1421",
    description:
      "永乐十九年正式迁都北京，南京为留都。紫禁城落成，奠定明清政治中心。",
    categories: ["political"],
    weight: "turning",
    periodId: "yongle",
    emperorId: "chengzu",
  },
  {
    id: "ev-northern-expedition",
    title: "五征漠北",
    year: 1422,
    yearLabel: "1410—1424",
    description: "成祖数度亲征蒙古，巩固北疆，亦耗损国力。",
    categories: ["military"],
    weight: "major",
    periodId: "yongle",
    emperorId: "chengzu",
  },
  {
    id: "ev-renxuan",
    title: "仁宣之治",
    year: 1430,
    yearLabel: "1425—1435",
    description: "仁宗、宣宗宽仁恤民，社会安定，史称治世。",
    categories: ["political"],
    weight: "major",
    periodId: "xuande",
    emperorId: "xuanzong",
  },
  {
    id: "ev-zhenghe7",
    title: "郑和末次远航",
    year: 1431,
    yearLabel: "1431—1433",
    description: "第七次下西洋后，大规模宝船远航渐止。",
    categories: ["foreign"],
    weight: "minor",
    periodId: "xuande",
    emperorId: "xuanzong",
  },
  {
    id: "ev-tumubao",
    title: "土木堡之变",
    year: 1449,
    yearLabel: "1449",
    description:
      "英宗亲征瓦剌，土木堡全军覆没被俘，明朝由盛转衰的关键转折。",
    categories: ["military"],
    weight: "turning",
    periodId: "zhengtong",
    emperorId: "yingzong",
  },
  {
    id: "ev-beijing-defense",
    title: "北京保卫战",
    year: 1449,
    yearLabel: "1449",
    description: "于谦整军抗敌，击退瓦剌，保住京师。",
    categories: ["military"],
    weight: "major",
    periodId: "jingtai",
    emperorId: "daizong",
  },
  {
    id: "ev-duomen",
    title: "夺门之变",
    year: 1457,
    yearLabel: "1457",
    description: "英宗复位改元天顺，于谦被杀，朝局再起波澜。",
    categories: ["political"],
    weight: "major",
    periodId: "tianshun",
    emperorId: "yingzong",
  },
  {
    id: "ev-xichang",
    title: "设立西厂",
    year: 1477,
    yearLabel: "1477",
    description: "汪直提督西厂，特务政治加剧。",
    categories: ["political"],
    weight: "minor",
    periodId: "chenghua",
    emperorId: "xianzong",
  },
  {
    id: "ev-hongzhi",
    title: "弘治中兴",
    year: 1490,
    yearLabel: "1488—1505",
    description: "孝宗勤政爱民、任用贤臣，明朝中期难得的治世。",
    categories: ["political"],
    weight: "turning",
    periodId: "hongzhi",
    emperorId: "xiaozong",
  },
  {
    id: "ev-wangyangming",
    title: "王阳明龙场悟道",
    year: 1508,
    yearLabel: "1508",
    description: "王守仁贬谪贵州龙场，悟「心即理」，心学由此大成。",
    categories: ["culture"],
    weight: "turning",
    periodId: "zhengde",
    emperorId: "wuzong",
  },
  {
    id: "ev-liujin",
    title: "刘瑾专权",
    year: 1510,
    yearLabel: "1506—1510",
    description: "宦官「八虎」刘瑾权倾朝野，后被诛。",
    categories: ["political"],
    weight: "minor",
    periodId: "zhengde",
    emperorId: "wuzong",
  },
  {
    id: "ev-daliyi",
    title: "大礼议",
    year: 1524,
    yearLabel: "1521—1524",
    description: "世宗追尊本生父母引发朝臣激烈争执，皇权与士大夫冲突白热化。",
    categories: ["political"],
    weight: "major",
    periodId: "jiajing",
    emperorId: "shizong",
  },
  {
    id: "ev-wokou",
    title: "东南倭患与抗倭",
    year: 1555,
    yearLabel: "嘉靖中后期",
    description: "倭寇侵扰沿海，戚继光、俞大猷等名将平定海患。",
    categories: ["military", "foreign"],
    weight: "turning",
    periodId: "jiajing",
    emperorId: "shizong",
  },
  {
    id: "ev-gengxu",
    title: "庚戌之变",
    year: 1550,
    yearLabel: "1550",
    description: "俺答汗兵临北京城下，暴露北疆空虚。",
    categories: ["military"],
    weight: "major",
    periodId: "jiajing",
    emperorId: "shizong",
  },
  {
    id: "ev-longqing-open",
    title: "隆庆开关",
    year: 1567,
    yearLabel: "1567",
    description: "部分开放民间海外贸易，刺激东南沿海经济。",
    categories: ["foreign"],
    weight: "turning",
    periodId: "longqing",
    emperorId: "muzong",
  },
  {
    id: "ev-anda",
    title: "俺答封贡",
    year: 1571,
    yearLabel: "1571",
    description: "与蒙古俺答议和封贡，北疆暂时安定。",
    categories: ["foreign", "political"],
    weight: "major",
    periodId: "longqing",
    emperorId: "muzong",
  },
  {
    id: "ev-zhangjuzheng",
    title: "张居正改革",
    year: 1573,
    yearLabel: "1573—1582",
    description: "推行考成法、一条鞭法，财政与吏治一度振兴。",
    categories: ["political"],
    weight: "turning",
    periodId: "wanli",
    emperorId: "shenzong",
  },
  {
    id: "ev-chaoxian",
    title: "万历援朝抗倭",
    year: 1592,
    yearLabel: "1592—1598",
    description: "日本丰臣秀吉入侵朝鲜，明军出兵援助，史称万历朝鲜之役。",
    categories: ["military", "foreign"],
    weight: "turning",
    periodId: "wanli",
    emperorId: "shenzong",
  },
  {
    id: "ev-sarhu",
    title: "萨尔浒之战",
    year: 1619,
    yearLabel: "1619",
    description: "明军四路攻后金大败，辽东战局急转直下。",
    categories: ["military"],
    weight: "turning",
    periodId: "wanli",
    emperorId: "shenzong",
  },
  {
    id: "ev-hongwan",
    title: "红丸案",
    year: 1620,
    yearLabel: "1620",
    description: "光宗服红丸后猝死，明末宫廷三大案之一。",
    categories: ["political"],
    weight: "major",
    periodId: "taichang",
    emperorId: "guangzong",
  },
  {
    id: "ev-weizhongxian",
    title: "魏忠贤专权",
    year: 1625,
    yearLabel: "天启年间",
    description: "阉党遍布朝野，东林党人惨遭镇压。",
    categories: ["political"],
    weight: "turning",
    periodId: "tianqi",
    emperorId: "xizong",
  },
  {
    id: "ev-yuan-chonghuan",
    title: "袁崇焕守宁远",
    year: 1626,
    yearLabel: "1626",
    description: "宁远大捷击退后金，暂缓辽东危局；后崇祯朝袁崇焕被冤杀。",
    categories: ["military"],
    weight: "major",
    periodId: "tianqi",
    emperorId: "xizong",
  },
  {
    id: "ev-tiangong",
    title: "《天工开物》出版",
    year: 1637,
    yearLabel: "1637",
    description: "宋应星著成工艺百科，记录农业与手工业技术，誉为「中国 17 世纪工艺百科全书」。",
    categories: ["culture"],
    weight: "turning",
    periodId: "chongzhen",
    emperorId: "sizong",
  },
  {
    id: "ev-kaizhong",
    title: "开放中左所等海贸节点",
    year: 1630,
    yearLabel: "约 1630",
    description: "晚明东南海贸仍在民间延续，白银持续流入（示意条目）。",
    categories: ["foreign"],
    weight: "minor",
    periodId: "chongzhen",
    emperorId: "sizong",
  },
  {
    id: "ev-li-zicheng",
    title: "李自成兴起",
    year: 1641,
    yearLabel: "1630s—1644",
    description: "连年灾荒与苛政下，流民军席卷中原。",
    categories: ["military"],
    weight: "major",
    periodId: "chongzhen",
    emperorId: "sizong",
  },
  {
    id: "ev-jiashen",
    title: "甲申国难",
    year: 1644,
    yearLabel: "1644",
    description:
      "李自成破京，崇祯自缢煤山。享国二百七十六年的明朝灭亡。",
    categories: ["military", "political"],
    weight: "turning",
    periodId: "chongzhen",
    emperorId: "sizong",
  },
];

export const DYNASTY_YEAR_SPAN = {
  start: 1368,
  end: 1644,
  total: 1644 - 1368 + 1,
};

/** 按时间轴模式过滤可见事件（编年史模式不展示事件节点） */
export function getVisibleEvents(mode: TimelineMode): ChronicleEvent[] {
  if (mode === "chronicle") return [];
  // 核心主线：原转折点 + 原编年史重要事件
  return CHRONICLE_EVENTS.filter((e) => e.weight !== "minor");
}

export function getEventsByEmperor(emperorId: EmperorId): ChronicleEvent[] {
  return CHRONICLE_EVENTS.filter((e) => e.emperorId === emperorId).sort(
    (a, b) => a.year - b.year
  );
}

export function getEventsByPeriod(periodId: PeriodId): ChronicleEvent[] {
  return CHRONICLE_EVENTS.filter((e) => e.periodId === periodId).sort(
    (a, b) => a.year - b.year
  );
}

export function countCoreEvents(): number {
  return CHRONICLE_EVENTS.filter((e) => e.weight !== "minor").length;
}
