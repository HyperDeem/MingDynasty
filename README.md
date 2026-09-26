# 全景明朝

交互式明朝历史 Web 应用：时间轴 · 帝王谱系 · 疆域地图。

## 技术栈

- Next.js (App Router) + TypeScript + Tailwind CSS
- Framer Motion
- **MapLibre GL JS**（交互疆域图）
- ECharts（可选扩展）

## 疆域地图

### 地图实现
使用 **ECharts map + GeoJSON**（项目已有依赖，渲染稳定）。支持拖拽平移、滚轮缩放、悬停高亮与年份 Cross-fade。
GeoJSON 经 `src/data/geojson/ming/` **静态打包**，避免运行时 fetch 失败导致空白。

### 数据说明
GitHub 上鲜有可自由再分发的「谭其骧矢量」完整包；CHGIS 学术许可**禁止商业再分发**。  
本仓库在 `public/geojson/ming/` 提供**示意性**关键时期边界（概念参考谭图 / CHGIS），可替换为你自行转换的正式数据：

| 文件 | 年份区间 | 特点 |
|------|----------|------|
| `1368-hongwu.json` | 1368–1401 | 开国核心 |
| `1420-yongle-peak.json` | 1402–1426 | **交趾 + 奴儿干** |
| `1435-post-jiaozhi.json` | 1427–1448 | 弃交趾 |
| `1450-post-tumu.json` | 1449–1566 | 北疆内缩至长城一线 |
| `1582-wanli.json` | 1567–1620 | 万历九边 |
| `1644-fall.json` | 1621–1644 | 明末收缩 |

### Hook
`useMingTerritory(currentYear)`：按年解析快照 → fetch GeoJSON → **750ms Cross-fade** 旧/新图层。

试法：时间轴点「郑和下西洋」(1405) → 再点「土木堡之变」(1449)，观察交趾与奴儿干淡出。

## 启动

```bash
npm install
npm run dev
```

需已安装 Node.js 18+。若尚未安装 `maplibre-gl`，`npm install` 会一并拉取。
