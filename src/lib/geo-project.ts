/** 轻量墨卡托投影 + fitBounds（对齐 lineage-forest 迁徙图的紧凑中国视域） */

export type LonLat = [number, number];

export interface ViewTransform {
  /** 屏幕像素 / 墨卡托单位 */
  scale: number;
  tx: number;
  ty: number;
}

const MAX_LAT = 85.05112878;

export function clampLat(lat: number): number {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
}

/** 经纬度 → 单位墨卡托 [0,1]×[0,1]（y 向下） */
export function lonLatToMercator(lon: number, lat: number): LonLat {
  const x = (lon + 180) / 360;
  const latRad = (clampLat(lat) * Math.PI) / 180;
  const y =
    (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2;
  return [x, y];
}

export function mercatorToLonLat(x: number, y: number): LonLat {
  const lon = x * 360 - 180;
  const n = Math.PI - 2 * Math.PI * y;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lon, lat];
}

export function project(lon: number, lat: number, view: ViewTransform): LonLat {
  const [mx, my] = lonLatToMercator(lon, lat);
  return [mx * view.scale + view.tx, my * view.scale + view.ty];
}

export function unproject(sx: number, sy: number, view: ViewTransform): LonLat {
  const mx = (sx - view.tx) / view.scale;
  const my = (sy - view.ty) / view.scale;
  return mercatorToLonLat(mx, my);
}

export type BBox = [LonLat, LonLat]; // [[minLon,minLat],[maxLon,maxLat]]

export function emptyBBox(): BBox {
  return [
    [Infinity, Infinity],
    [-Infinity, -Infinity],
  ];
}

export function expandBBox(bbox: BBox, lon: number, lat: number): void {
  bbox[0][0] = Math.min(bbox[0][0], lon);
  bbox[0][1] = Math.min(bbox[0][1], lat);
  bbox[1][0] = Math.max(bbox[1][0], lon);
  bbox[1][1] = Math.max(bbox[1][1], lat);
}

function walkCoords(
  coords: unknown,
  visit: (lon: number, lat: number) => void
): void {
  if (!Array.isArray(coords) || coords.length === 0) return;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    visit(coords[0] as number, coords[1] as number);
    return;
  }
  for (const c of coords) walkCoords(c, visit);
}

export function bboxFromGeometry(geometry: GeoJSON.Geometry | null): BBox {
  const bbox = emptyBBox();
  if (!geometry) return bbox;
  if (geometry.type === "GeometryCollection") {
    for (const g of geometry.geometries) {
      const b = bboxFromGeometry(g);
      expandBBox(bbox, b[0][0], b[0][1]);
      expandBBox(bbox, b[1][0], b[1][1]);
    }
    return bbox;
  }
  walkCoords(
    (geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon).coordinates,
    (lon, lat) => expandBBox(bbox, lon, lat)
  );
  return bbox;
}

export function bboxFromFeatureCollection(
  fc: GeoJSON.FeatureCollection
): BBox {
  const bbox = emptyBBox();
  for (const f of fc.features) {
    const b = bboxFromGeometry(f.geometry);
    if (!Number.isFinite(b[0][0])) continue;
    expandBBox(bbox, b[0][0], b[0][1]);
    expandBBox(bbox, b[1][0], b[1][1]);
  }
  return bbox;
}

/** 将地理 bbox 适配到画布，留白 padding（px） */
export function fitBounds(
  bbox: BBox,
  width: number,
  height: number,
  padding = 28
): ViewTransform {
  const [[minLon, minLat], [maxLon, maxLat]] = bbox;
  if (!Number.isFinite(minLon) || width <= 0 || height <= 0) {
    return { scale: width, tx: 0, ty: 0 };
  }

  const [x0, y1] = lonLatToMercator(minLon, minLat);
  const [x1, y0] = lonLatToMercator(maxLon, maxLat);
  const mw = Math.max(1e-9, x1 - x0);
  const mh = Math.max(1e-9, y1 - y0);
  const innerW = Math.max(1, width - padding * 2);
  const innerH = Math.max(1, height - padding * 2);
  const scale = Math.min(innerW / mw, innerH / mh);
  const tx = padding + (innerW - mw * scale) / 2 - x0 * scale;
  const ty = padding + (innerH - mh * scale) / 2 - y0 * scale;
  return { scale, tx, ty };
}

/** 以屏幕点为锚缩放 */
export function zoomAt(
  view: ViewTransform,
  screenX: number,
  screenY: number,
  factor: number,
  minScale: number,
  maxScale: number
): ViewTransform {
  const next = Math.max(minScale, Math.min(maxScale, view.scale * factor));
  const k = next / view.scale;
  return {
    scale: next,
    tx: screenX - (screenX - view.tx) * k,
    ty: screenY - (screenY - view.ty) * k,
  };
}

export function panBy(view: ViewTransform, dx: number, dy: number): ViewTransform {
  return { ...view, tx: view.tx + dx, ty: view.ty + dy };
}

/**
 * 限制平移/缩放后内容 bbox 不至于拖出视口过多空白。
 * edgePad：视口边缘允许「无内容」的最大比例（0.2 = 两侧各最多 20% 空）。
 */
export function clampViewToContent(
  view: ViewTransform,
  bbox: BBox,
  width: number,
  height: number,
  edgePad = 0.18
): ViewTransform {
  if (width <= 0 || height <= 0) return view;
  const [[minLon, minLat], [maxLon, maxLat]] = bbox;
  if (!Number.isFinite(minLon)) return view;

  const [mx0, myNorth] = lonLatToMercator(minLon, maxLat);
  const [mx1, mySouth] = lonLatToMercator(maxLon, minLat);
  const { scale } = view;
  let { tx, ty } = view;

  const xMin = width * edgePad;
  const xMax = width * (1 - edgePad);
  const yMin = height * edgePad;
  const yMax = height * (1 - edgePad);
  const safeW = width * (1 - 2 * edgePad);
  const safeH = height * (1 - 2 * edgePad);

  const cLeft = mx0 * scale + tx;
  const cRight = mx1 * scale + tx;
  const cW = cRight - cLeft;

  if (cW <= safeW) {
    tx += width / 2 - (cLeft + cRight) / 2;
  } else {
    if (cRight < xMin) tx += xMin - cRight;
    if (mx0 * scale + tx > xMax) tx = xMax - mx0 * scale;
  }

  const cTop = myNorth * scale + ty;
  const cBottom = mySouth * scale + ty;
  const cH = cBottom - cTop;

  if (cH <= safeH) {
    ty += height / 2 - (cTop + cBottom) / 2;
  } else {
    if (cBottom < yMin) ty += yMin - cBottom;
    if (myNorth * scale + ty > yMax) ty = yMax - myNorth * scale;
  }

  return { scale, tx, ty };
}

/** 将环坐标写入 Path2D（墨卡托 → 屏幕） */
export function ringToPath(
  path: Path2D,
  ring: LonLat[],
  view: ViewTransform,
  move: boolean
): void {
  if (!ring.length) return;
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const [x, y] = project(lon, lat, view);
    if (i === 0 && move) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
}

export function geometryToPath(
  geometry: GeoJSON.Geometry,
  view: ViewTransform
): Path2D {
  const path = new Path2D();
  const addPolygon = (rings: LonLat[][]) => {
    for (const ring of rings) {
      ringToPath(path, ring as LonLat[], view, true);
    }
  };

  if (geometry.type === "Polygon") {
    addPolygon(geometry.coordinates as LonLat[][]);
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates as LonLat[][][]) {
      addPolygon(poly);
    }
  } else if (geometry.type === "GeometryCollection") {
    for (const g of geometry.geometries) {
      const sub = geometryToPath(g, view);
      path.addPath(sub);
    }
  }
  return path;
}

/** 简化：按步长抽稀，加速绘制（细节已足够参考站观感） */
export function simplifyRing(ring: LonLat[], step: number): LonLat[] {
  if (step <= 1 || ring.length <= 8) return ring;
  const out: LonLat[] = [];
  for (let i = 0; i < ring.length; i += step) {
    out.push(ring[i]);
  }
  const last = ring[ring.length - 1];
  const prev = out[out.length - 1];
  if (!prev || prev[0] !== last[0] || prev[1] !== last[1]) out.push(last);
  return out;
}

export function simplifyGeometry(
  geometry: GeoJSON.Geometry,
  step: number
): GeoJSON.Geometry {
  if (step <= 1) return geometry;
  if (geometry.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: geometry.coordinates.map((r) =>
        simplifyRing(r as LonLat[], step)
      ),
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geometry.coordinates.map((poly) =>
        poly.map((r) => simplifyRing(r as LonLat[], step))
      ),
    };
  }
  return geometry;
}
