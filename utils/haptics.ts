
/**
 * Triggers haptic feedback on supported devices.
 * @param pattern A number or an array of numbers representing the vibration pattern in milliseconds.
 * E.g., 50 for a short vibration, [100, 30, 100] for a pattern.
 */
export const vibrate = (pattern: number | number[] = 50) => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Vibration might be disabled by user settings
      console.warn("Haptic feedback failed:", error);
    }
  }
};
