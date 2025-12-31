/**
 * Default schedule presets
 */
export const DEFAULT_PRESETS = [
  { id: 'standard', name: 'Standard', intervals: [1, 3, 7] },
  { id: 'intensive', name: 'Intensive', intervals: [1, 2, 4] },
  { id: 'relaxed', name: 'Relaxed', intervals: [2, 7, 14] },
];

/**
 * Get presets from storage
 */
export async function getPresets() {
  try {
    const result = await chrome.storage.local.get(['schedulePresets']);
    return result.schedulePresets || DEFAULT_PRESETS;
  } catch (error) {
    console.error('[LeetCached] Failed to get presets:', error);
    return DEFAULT_PRESETS;
  }
}

/**
 * Add a problem to the schedule with specific intervals
 */
export async function addProblemToSchedule(problemInfo, intervals) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to format date as YYYY-MM-DD in local time
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const scheduledDates = intervals.map(days => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return formatDateLocal(date);
  });

  const problemId = problemInfo.slug;

  const problem = {
    title: problemInfo.title,
    difficulty: problemInfo.difficulty,
    category: problemInfo.category,
    topics: problemInfo.topics || [],
    url: problemInfo.url,
    addedDate: formatDateLocal(today),
    scheduledDates,
    completedDates: []
  };

  try {
    const result = await chrome.storage.local.get(['spacedRepProblems']);
    const problems = result.spacedRepProblems || {};
    problems[problemId] = problem;
    await chrome.storage.local.set({ spacedRepProblems: problems });
    console.log('[LeetCached] Problem added successfully');
    return true;
  } catch (error) {
    console.error('[LeetCached] Failed to save problem:', error);
    if (error.message?.includes('Extension context invalidated')) {
      alert('LeetCached was updated. Please refresh the page to continue.');
    }
    return false;
  }
}

/**
 * Check if a problem is already scheduled
 */
export async function isProblemScheduled(problemSlug) {
  try {
    const result = await chrome.storage.local.get(['spacedRepProblems']);
    const problems = result.spacedRepProblems || {};
    return !!problems[problemSlug];
  } catch (error) {
    console.error('[LeetCached] Failed to check problem:', error);
    return false;
  }
}
