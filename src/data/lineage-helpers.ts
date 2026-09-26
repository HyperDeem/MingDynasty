/** 轻量 helper，避免 genealogy 组件直接循环依赖 */
import { getEventsByEmperor } from "@/data/chronicle-events";
import {
  displayReignHonorific,
  getEmperorPerson,
  reignTitlesLabel,
} from "@/data/lineage";
import type { EmperorId } from "@/data/emperors";

export { getEmperorPerson, reignTitlesLabel, displayReignHonorific };

export function getEventsByEmperorSafe(emperorId: EmperorId) {
  return getEventsByEmperor(emperorId);
}
