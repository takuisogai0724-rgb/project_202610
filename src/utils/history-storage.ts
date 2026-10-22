import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { ElevationHistoryItem } from '@/hooks/use-elevation';

/** 履歴の最大保存件数（上限100件） */
export const MAX_HISTORY_ITEMS = 100;

/** SecureStore の1キーあたり2,048バイト制限を回避するための1チャンク最大文字数 */
const CHUNK_SIZE = 1500;

const META_KEY = 'elevation_history_meta_v1';
const CHUNK_KEY_PREFIX = 'elevation_history_chunk_';

interface HistoryMeta {
  chunkCount: number;
}

interface SerializedHistoryItem {
  id: string;
  elevation: number;
  fujiStationLabel: string;
  source: string;
  latitude: number;
  longitude: number;
  savedAt: string;
}

function getChunkKey(index: number): string {
  return `${CHUNK_KEY_PREFIX}${index}`;
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }
  return await SecureStore.getItemAsync(key);
}

async function deleteStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function isValidSerializedItem(raw: unknown): raw is SerializedHistoryItem {
  if (!raw || typeof raw !== 'object') {
    return false;
  }
  const item = raw as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.elevation === 'number' &&
    Number.isFinite(item.elevation) &&
    typeof item.fujiStationLabel === 'string' &&
    typeof item.source === 'string' &&
    typeof item.latitude === 'number' &&
    Number.isFinite(item.latitude) &&
    typeof item.longitude === 'number' &&
    Number.isFinite(item.longitude) &&
    typeof item.savedAt === 'string'
  );
}

/**
 * 端末内の暗号化ストレージ（expo-secure-store / WebはlocalStorage）から標高履歴を読み込む
 */
export async function loadElevationHistory(): Promise<ElevationHistoryItem[]> {
  try {
    const metaRaw = await getStorageItem(META_KEY);
    if (!metaRaw) {
      return [];
    }

    const meta = JSON.parse(metaRaw) as HistoryMeta;
    if (
      !meta ||
      typeof meta.chunkCount !== 'number' ||
      meta.chunkCount <= 0 ||
      meta.chunkCount > 50
    ) {
      return [];
    }

    const chunks: string[] = [];
    for (let i = 0; i < meta.chunkCount; i += 1) {
      const chunk = await getStorageItem(getChunkKey(i));
      if (chunk === null) {
        return [];
      }
      chunks.push(chunk);
    }

    const jsonString = chunks.join('');
    const parsed = JSON.parse(jsonString) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const restored: ElevationHistoryItem[] = [];
    for (const rawItem of parsed) {
      if (isValidSerializedItem(rawItem)) {
        const savedDate = new Date(rawItem.savedAt);
        restored.push({
          id: rawItem.id,
          elevation: rawItem.elevation,
          fujiStationLabel: rawItem.fujiStationLabel,
          source: rawItem.source,
          latitude: rawItem.latitude,
          longitude: rawItem.longitude,
          savedAt: Number.isNaN(savedDate.getTime()) ? new Date() : savedDate,
        });
      }
    }

    return restored.slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

/**
 * 標高履歴を最大100件に制限し、チャンク分割して暗号化ストレージへ保存する
 */
export async function saveElevationHistory(
  items: ElevationHistoryItem[]
): Promise<ElevationHistoryItem[]> {
  const capped = items.slice(0, MAX_HISTORY_ITEMS);

  try {
    const serialized: SerializedHistoryItem[] = capped.map((item) => ({
      id: item.id,
      elevation: item.elevation,
      fujiStationLabel: item.fujiStationLabel,
      source: item.source,
      latitude: item.latitude,
      longitude: item.longitude,
      savedAt: item.savedAt.toISOString(),
    }));

    const jsonString = JSON.stringify(serialized);
    const chunks: string[] = [];
    for (let i = 0; i < jsonString.length; i += CHUNK_SIZE) {
      chunks.push(jsonString.slice(i, i + CHUNK_SIZE));
    }

    // 以前のチャンク数を取得して余剰チャンクがあれば削除する
    const prevMetaRaw = await getStorageItem(META_KEY);
    let prevChunkCount = 0;
    if (prevMetaRaw) {
      try {
        const prevMeta = JSON.parse(prevMetaRaw) as HistoryMeta;
        if (typeof prevMeta.chunkCount === 'number') {
          prevChunkCount = prevMeta.chunkCount;
        }
      } catch {
        // ignore
      }
    }

    for (let i = 0; i < chunks.length; i += 1) {
      await setStorageItem(getChunkKey(i), chunks[i]);
    }

    for (let i = chunks.length; i < prevChunkCount; i += 1) {
      await deleteStorageItem(getChunkKey(i));
    }

    const meta: HistoryMeta = { chunkCount: chunks.length };
    await setStorageItem(META_KEY, JSON.stringify(meta));
  } catch {
    // ストレージ書き込み失敗時もアプリ動作は継続させる
  }

  return capped;
}

/**
 * 保存されている全履歴チャンクとメタデータを暗号化ストレージから削除する
 */
export async function clearElevationHistory(): Promise<void> {
  try {
    const metaRaw = await getStorageItem(META_KEY);
    if (metaRaw) {
      try {
        const meta = JSON.parse(metaRaw) as HistoryMeta;
        if (typeof meta.chunkCount === 'number' && meta.chunkCount > 0) {
          for (let i = 0; i < meta.chunkCount; i += 1) {
            await deleteStorageItem(getChunkKey(i));
          }
        }
      } catch {
        // ignore
      }
    }
    await deleteStorageItem(META_KEY);
  } catch {
    // ignore
  }
}
