import { useState, useCallback, useEffect } from 'react';
import { getStoredKeys, saveStoredKeys, type ApiKeyConfig } from './useApiRateLimiter';
import { useAgencySettings } from './useAgencySettings';

/**
 * Simple hook for Gemini API key access WITHOUT rate limiting.
 * Checks agency settings first, then falls back to localStorage keys.
 * For video (Veo 3), use useApiRateLimiter instead.
 */
export function useGeminiKey() {
  const [keys, setKeys] = useState<ApiKeyConfig[]>(() => getStoredKeys('gemini'));
  const { data: agencySettings } = useAgencySettings();

  // Update keys when they change in storage
  useEffect(() => {
    const handleStorage = () => {
      setKeys(getStoredKeys('gemini'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Get first available API key — agency settings key takes priority
  const getApiKey = useCallback((): string | null => {
    // Priority 1: Agency settings gemini key
    if (agencySettings?.gemini_api_key?.trim()) {
      return agencySettings.gemini_api_key;
    }
    // Priority 2: localStorage keys
    const available = keys.find((k) => k.key.trim());
    return available?.key || null;
  }, [keys, agencySettings]);

  // Check if any key is configured (agency or localStorage)
  const hasApiKey = !!(agencySettings?.gemini_api_key?.trim()) || keys.some((k) => k.key.trim());

  // Save keys
  const updateKeys = useCallback((newKeys: ApiKeyConfig[]) => {
    setKeys(newKeys);
    saveStoredKeys('gemini', newKeys);
  }, []);

  return {
    getApiKey,
    hasApiKey,
    keys,
    updateKeys,
  };
}
