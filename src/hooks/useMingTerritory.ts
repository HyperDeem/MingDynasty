"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import {
  resolveTerritorySnapshot,
  type MingTerritorySnapshotMeta,
} from "@/data/ming-territory";
import {
  buildExtrasGeoJSON,
  getMapLayerSpec,
  type CapitalMarker,
} from "@/data/ming-map-layers";

export interface UseMingTerritoryResult {
  snapshot: MingTerritorySnapshotMeta;
  coreProvinces: readonly string[];
  previousCoreProvinces: readonly string[] | null;
  extras: FeatureCollection;
  previousExtras: FeatureCollection | null;
  capitals: CapitalMarker[];
  crossfade: number;
  loading: boolean;
  error: string | null;
}

/**
 * currentYear → 省界核心区 + 额外示意区 + Cross-fade
 */
export function useMingTerritory(currentYear: number): UseMingTerritoryResult {
  const snapshot = useMemo(
    () => resolveTerritorySnapshot(currentYear),
    [currentYear]
  );

  const initialSpec = useMemo(
    () => getMapLayerSpec(snapshot.id),
    // 仅用于首帧，避免空 coreProvinces 导致「空白」观感
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [coreProvinces, setCoreProvinces] = useState<readonly string[]>(
    () => initialSpec.coreProvinces
  );
  const [previousCoreProvinces, setPreviousCoreProvinces] = useState<
    readonly string[] | null
  >(null);
  const [extras, setExtras] = useState<FeatureCollection>(() =>
    buildExtrasGeoJSON(initialSpec.extraIds)
  );
  const [previousExtras, setPreviousExtras] =
    useState<FeatureCollection | null>(null);
  const [capitals, setCapitals] = useState<CapitalMarker[]>(
    () => initialSpec.capitals
  );
  const [crossfade, setCrossfade] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayedIdRef = useRef<string | null>(snapshot.id);
  const displayedCoreRef = useRef<readonly string[]>(initialSpec.coreProvinces);
  const displayedExtrasRef = useRef<FeatureCollection>(
    buildExtrasGeoJSON(initialSpec.extraIds)
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    try {
      const spec = getMapLayerSpec(snapshot.id);
      const nextExtras = buildExtrasGeoJSON(spec.extraIds);
      if (cancelled) return;

      const isFirst = displayedIdRef.current === null;
      const same = displayedIdRef.current === snapshot.id;

      if (isFirst || same) {
        displayedIdRef.current = snapshot.id;
        displayedCoreRef.current = spec.coreProvinces;
        displayedExtrasRef.current = nextExtras;
        setCoreProvinces(spec.coreProvinces);
        setPreviousCoreProvinces(null);
        setExtras(nextExtras);
        setPreviousExtras(null);
        setCapitals(spec.capitals);
        setCrossfade(1);
        setLoading(false);
        setError(null);
        return;
      }

      const prevCore = displayedCoreRef.current;
      const prevExtras = displayedExtrasRef.current;
      displayedIdRef.current = snapshot.id;
      displayedCoreRef.current = spec.coreProvinces;
      displayedExtrasRef.current = nextExtras;

      setPreviousCoreProvinces(prevCore);
      setPreviousExtras(prevExtras);
      setCoreProvinces(spec.coreProvinces);
      setExtras(nextExtras);
      setCapitals(spec.capitals);
      setCrossfade(0);
      setLoading(false);
      setError(null);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const start = performance.now();
      const duration = 720;

      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / duration);
        const eased =
          t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setCrossfade(eased);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setPreviousCoreProvinces(null);
          setPreviousExtras(null);
          setCrossfade(1);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : "加载疆域失败");
        setLoading(false);
      }
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [snapshot.id]);

  return {
    snapshot,
    coreProvinces,
    previousCoreProvinces,
    extras,
    previousExtras,
    capitals,
    crossfade,
    loading,
    error,
  };
}
