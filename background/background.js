// Background service worker for LeetCode Spaced Repetition extension

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROBLEM_ADDED') {
    console.log('Problem added to spaced rep:', message.problem);
  }
  
  return true;
});
