/**
 * メートル数値を指定桁数の文字列（例: "35.4 m"）にフォーマットする。
 * 値が null または NaN の場合は "---" を返す。
 */
export function formatMeters(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) {
    return '---';
  }
  return `${value.toFixed(digits)} m`;
}

/**
 * 緯度・経度を指定桁数の文字列（例: "35.68123°, 139.76712°"）にフォーマットする。
 */
export function formatCoordinates(
  latitude: number,
  longitude: number,
  digits = 5
): string {
  return `${latitude.toFixed(digits)}°, ${longitude.toFixed(digits)}°`;
}
