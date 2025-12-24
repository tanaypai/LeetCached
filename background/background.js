// Background service worker for LeetCode Spaced Repetition extension

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROBLEM_ADDED') {
    console.log('Problem added to spaced rep:', message.problem);
    // Update badge after problem is added
    checkAndNotifyDueProblems();
  }
  
  return true;
});

async function checkAndNotifyDueProblems() {
  try {
    const result = await chrome.storage.local.get(['spacedRepProblems']);
    const problems = result.spacedRepProblems || {};
    const today = new Date().toISOString().split('T')[0];
    
    let dueCount = 0;
    for (const problem of Object.values(problems)) {
      if (problem.scheduledDates && problem.scheduledDates.includes(today)) {
        dueCount++;
      }
    }
    
    if (dueCount > 0) {
      // Update badge
      chrome.action.setBadgeText({ text: dueCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#ffa116' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error checking due problems:', error);
  }
}

// Initial check on install/update
chrome.runtime.onInstalled.addListener(() => {
  checkAndNotifyDueProblems();
});

// Check on startup
chrome.runtime.onStartup.addListener(() => {
  checkAndNotifyDueProblems();
});
