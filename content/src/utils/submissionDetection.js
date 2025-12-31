/**
 * Submission Detection Utility
 * Detects when a LeetCode submission is accepted and triggers a callback
 */

// Submission states
const STATES = {
  IDLE: 'IDLE',
  SUBMITTING: 'SUBMITTING', 
  RUNNING: 'RUNNING',
  FINISHED: 'FINISHED'
};

let submissionState = STATES.IDLE;
let observer = null;
let observerTimeout = null;
let staleResultString = null;
let submitTimestamp = 0;

/**
 * Check if an element is visible in the DOM
 */
function isVisible(elem) {
  if (!elem) return false;
  return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
}

/**
 * Verify that the result element is in the submission context
 */
function verifySubmissionContext(element) {
  if (!element) return false;
  
  // 1. Is it inside the submission result container? (Strongest check)
  if (element.closest('[data-e2e-locator="submission-result"]')) {
    console.log('[LeetCached] Context Verified: Inside submission-result container');
    return true;
  }

  // 2. Proximity to other result keywords (Legacy check) - REMOVED
  // This was causing false positives with "Last submission: Accepted" being found near stats.
  // We now rely on data-e2e-locator or strict state transition.
  
  // 3. Relaxed check for RUNNING state
  if (submissionState === STATES.RUNNING) {
    console.log('[LeetCached] Context Verified: Creating lenient pass due to RUNNING state');
    return true;
  }

  console.log('[LeetCached] Context Verification Failed');
  return false;
}

/**
 * Detect if submission is still running (Pending/Judging)
 */
function detectRunningState() {
  // 1. Images with alt text
  const pendingImages = document.querySelectorAll('img[alt="Pending..."], img[alt="Judging..."]');
  for (const img of pendingImages) {
    if (isVisible(img)) {
      return true;
    }
  }
  
  // 2. Text content in the result area
  const resultContainer = document.querySelector('[data-e2e-locator="submission-result"]');
  if (resultContainer && isVisible(resultContainer)) {
    const text = resultContainer.textContent;
    if (text.includes('Pending') || text.includes('Judging')) {
      return true;
    }
  }

  return false;
}

/**
 * Detect the final result of a submission
 */
function detectFinalResult() {
  // Accepted Check
  const greenElements = document.querySelectorAll('.text-green-s, .text-green-60, .dark\\:text-dark-green-s, .dark\\:text-dark-green-60');
  for (const el of greenElements) {
    if (el.textContent.includes('Accepted') && !el.textContent.includes('Last submission')) {
      if (isVisible(el) && verifySubmissionContext(el)) {
        return { status: 'ACCEPTED', detail: 'Accepted' };
      }
    }
  }

  // Failed Check
  const redElements = document.querySelectorAll('.text-red-s, .text-red-60, .dark\\:text-dark-red-s, .dark\\:text-dark-red-60');
  const failureTexts = ['Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Memory Limit Exceeded', 'Compile Error', 'Output Limit Exceeded'];
  
  for (const el of redElements) {
    const text = el.textContent;
    const failureType = failureTexts.find(ft => text.includes(ft));
    if (failureType) {
      if (isVisible(el) && verifySubmissionContext(el)) {
        return { status: 'FAILED', detail: failureType };
      }
    }
  }
  
  return null;
}

/**
 * Stop observing for submission results
 */
function stopObserving() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (observerTimeout) {
    clearTimeout(observerTimeout);
    observerTimeout = null;
  }
}

/**
 * Check the current submission state and handle transitions
 */
/**
 * Check the current submission state and handle transitions
 */
function checkSubmissionState(onAccepted) {
  // 1. Check for RUNNING state (Pending/Judging)
  const isRunning = detectRunningState();
  if (isRunning) {
    if (submissionState !== STATES.RUNNING) {
      submissionState = STATES.RUNNING;
      console.log('[LeetCached] State: RUNNING');
      // If running, any previous result is definitely stale and waiting to be replaced
      staleResultString = null;
    }
    return; // Still running, wait
  }

  // 2. Check for FINISHED state (Result)
  if (submissionState === STATES.SUBMITTING || submissionState === STATES.RUNNING) {
    const result = detectFinalResult();
    
    // If we have a result, check if it's stale (present from before submit)
    if (result) {
      const resultString = JSON.stringify(result);
      if (staleResultString && resultString === staleResultString) {
        // Still seeing the old result, ignore
        return;
      }

      // Grace period check: If we are still in SUBMITTING (never saw RUNNING) 
      // and it's been less than 1s, ignore potential uncaptured stale results.
      if (submissionState === STATES.SUBMITTING && (Date.now() - submitTimestamp < 1000)) {
        console.log('[LeetCached] Ignoring result during grace period (potential uncaptured stale)');
        return;
      }
      
      submissionState = STATES.FINISHED;
      console.log(`[LeetCached] State: FINISHED (${result.status})`);
      
      stopObserving();
      
      if (result.status === 'ACCEPTED') {
        onAccepted();
      } else {
        console.log('[LeetCached] Submission Failed:', result.detail);
      }
    } else {
      // If result is null (e.g. cleared from DOM), we can clear the stale flag
      // This allows detecting the SAME result again if it reappears
      if (staleResultString) {
        staleResultString = null;
      }
    }
  }
}

/**
 * Start observing for submission results
 */
function observeSubmissionResults(onAccepted) {
  console.log('[LeetCached] Starting observation...');
  
  observer = new MutationObserver(() => {
    checkSubmissionState(onAccepted);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'src', 'alt']
  });
  
  // Auto-stop after 45 seconds to prevent memory leaks
  observerTimeout = setTimeout(() => {
    console.log('[LeetCached] Observation timed out - no result found.');
    stopObserving();
  }, 45000);
}

/**
 * Handle submit button click
 */
function handleSubmitClick(onAccepted) {
  console.log('[LeetCached] Submit button clicked');
  submissionState = STATES.SUBMITTING;
  submitTimestamp = Date.now();
  
  // Capture any existing result as "stale"
  const currentResult = detectFinalResult();
  if (currentResult) {
    staleResultString = JSON.stringify(currentResult);
    console.log('[LeetCached] Stale result detected:', staleResultString);
  } else {
    staleResultString = null;
  }
  
  console.log('[LeetCached] State: SUBMITTING');
  
  stopObserving();
  observeSubmissionResults(onAccepted);
}

/**
 * Get the auto-detect setting from storage
 */
export async function getAutoDetectSetting() {
  try {
    const result = await chrome.storage.local.get({ autoDetect: true });
    return result.autoDetect;
  } catch (error) {
    console.error('[LeetCached] Failed to get auto-detect setting:', error);
    return true; // Default to enabled
  }
}

/**
 * Initialize submission detection
 * @param {Function} onAccepted - Callback when submission is accepted
 */
export function initSubmissionDetection(onAccepted) {
  // Listen for submit button clicks via event delegation
  document.addEventListener('click', async (e) => {
    const submitBtn = e.target.closest('[data-e2e-locator="console-submit-button"]');
    if (submitBtn) {
      // Check if auto-detect is enabled
      const autoDetect = await getAutoDetectSetting();
      if (!autoDetect) {
        console.log('[LeetCached] Auto-detect disabled, not watching submission.');
        return;
      }
      
      handleSubmitClick(onAccepted);
    }
  });
  
  console.log('[LeetCached] Submission detection initialized');
}

/**
 * Cleanup function to stop all observers
 */
export function cleanupSubmissionDetection() {
  stopObserving();
  submissionState = STATES.IDLE;
}
