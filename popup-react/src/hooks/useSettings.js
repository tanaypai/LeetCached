import { useState, useEffect, useCallback } from 'react';

const DEFAULT_PRESETS = [
  { id: 'standard', name: 'Standard', intervals: [1, 3, 7] },
  { id: 'intensive', name: 'Intensive', intervals: [1, 2, 4] },
  { id: 'relaxed', name: 'Relaxed', intervals: [2, 7, 14] },
];

export function useSettings() {
  const [autoDetect, setAutoDetect] = useState(true);
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get({
        autoDetect: true,
        schedulePresets: DEFAULT_PRESETS,
      });
      setAutoDetect(result.autoDetect);
      setPresets(result.schedulePresets);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const saveAutoDetect = useCallback(async (value) => {
    try {
      await chrome.storage.local.set({ autoDetect: value });
      setAutoDetect(value);
    } catch (err) {
      console.error('Failed to save autoDetect', err);
    }
  }, []);

  const savePresets = useCallback(async (newPresets) => {
    try {
      await chrome.storage.local.set({ schedulePresets: newPresets });
      setPresets(newPresets);
    } catch (err) {
      console.error('Failed to save presets', err);
    }
  }, []);

  const addPreset = useCallback(async (preset) => {
    const newPresets = [...presets, { ...preset, id: 'custom_' + Date.now() }];
    await savePresets(newPresets);
  }, [presets, savePresets]);

  const updatePreset = useCallback(async (index, preset) => {
    const newPresets = [...presets];
    newPresets[index] = preset;
    await savePresets(newPresets);
  }, [presets, savePresets]);

  const deletePreset = useCallback(async (index) => {
    const newPresets = presets.filter((_, i) => i !== index);
    await savePresets(newPresets);
  }, [presets, savePresets]);

  const resetSettings = useCallback(async () => {
    await chrome.storage.local.set({
      autoDetect: true,
      schedulePresets: DEFAULT_PRESETS,
    });
    setAutoDetect(true);
    setPresets(DEFAULT_PRESETS);
  }, []);

  return {
    autoDetect,
    presets,
    loading,
    saveAutoDetect,
    savePresets,
    addPreset,
    updatePreset,
    deletePreset,
    resetSettings,
  };
}

export default useSettings;
