import React from 'react';
import { createRoot } from 'react-dom/client';
import AddButton from './AddButton';
import AddProblemModal from './AddProblemModal';
import { getProblemInfo } from './utils/problemInfo';
import { getPresets, addProblemToSchedule, DEFAULT_PRESETS } from './utils/storage';
import { initSubmissionDetection } from './utils/submissionDetection';
import './styles.css';

// Global state for the modal
let modalRoot = null;
let modalContainer = null;

// Button injection state
let buttonRoot = null;
let buttonContainer = null;
let buttonInjectionAttempted = false;

/**
 * Get the extension icon URL
 */
function getExtensionIconUrl() {
  return typeof chrome !== 'undefined' && chrome.runtime
    ? chrome.runtime.getURL('icons/icon48.png')
    : '';
}

/**
 * Show the add problem modal
 */
async function showAddProblemModal() {
  // Clean up existing modal if any
  hideModal();
  
  // Get problem info and presets
  const problemInfo = getProblemInfo();
  const presets = await getPresets();

  // Create container
  modalContainer = document.createElement('div');
  modalContainer.id = 'leetcached-react-modal';
  document.body.appendChild(modalContainer);

  // Create React root and render
  modalRoot = createRoot(modalContainer);
  
  const handleClose = () => {
    hideModal();
  };

  const handleAdd = async (info, intervals) => {
    await addProblemToSchedule(info, intervals);
  };

  const handleSkip = () => {
    console.log('[LeetCached] Problem skipped');
  };

  modalRoot.render(
    <AddProblemModal
      problemInfo={problemInfo}
      presets={presets}
      onClose={handleClose}
      onAdd={handleAdd}
      onSkip={handleSkip}
      extensionIconUrl={getExtensionIconUrl()}
    />
  );
}

/**
 * Hide the modal
 */
function hideModal() {
  if (modalRoot) {
    modalRoot.unmount();
    modalRoot = null;
  }
  if (modalContainer) {
    modalContainer.remove();
    modalContainer = null;
  }
}

/**
 * Inject the Add Button into the LeetCode toolbar
 */
function injectAddButton() {
  // Find the toolbar
  const toolbar = document.querySelector('#ide-top-btns');
  if (!toolbar) return false;
  
  // Don't inject if already exists
  if (document.querySelector('.leetcached-button-root')) return true;
  
  // Create container for the React button
  buttonContainer = document.createElement('div');
  buttonContainer.className = 'leetcached-button-root';
  
  // Insert after the Notes/Leet buttons area
  const notesLeetArea = toolbar.querySelector('[data-cid="2"]');
  if (notesLeetArea) {
    notesLeetArea.after(buttonContainer);
  } else {
    toolbar.appendChild(buttonContainer);
  }
  
  // Create React root and render button
  buttonRoot = createRoot(buttonContainer);
  buttonRoot.render(<AddButton extensionIconUrl={getExtensionIconUrl()} />);
  
  console.log('[LeetCached] React button injected');
  return true;
}

/**
 * Wait for toolbar and inject button
 */
function waitForToolbarAndInject() {
  if (buttonInjectionAttempted) return;
  
  const tryInject = () => {
    if (injectAddButton()) {
      buttonInjectionAttempted = true;
    } else {
      // Retry after a short delay
      setTimeout(tryInject, 500);
    }
  };
  
  tryInject();
  
  // Also observe for SPA navigation
  const observer = new MutationObserver(() => {
    if (!document.querySelector('.leetcached-button-root')) {
      buttonInjectionAttempted = false;
      tryInject();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Handle accepted submission - show modal after a brief delay
 */
function handleAcceptedSubmission() {
  console.log('[LeetCached] Showing modal for Accepted submission.');
  setTimeout(() => {
    showAddProblemModal();
  }, 500);
}

/**
 * Legacy API for backward compatibility
 * Can be removed once content.js is fully phased out
 */
window.LeetCachedModal = {
  show: function(problemInfo, options = {}) {
    const { presets = DEFAULT_PRESETS, onAdd, onSkip, onClose } = options;

    hideModal();

    modalContainer = document.createElement('div');
    modalContainer.id = 'leetcached-react-modal';
    document.body.appendChild(modalContainer);

    modalRoot = createRoot(modalContainer);
    
    const handleClose = () => {
      onClose?.();
      hideModal();
    };

    const handleAdd = async (info, intervals) => {
      await addProblemToSchedule(info, intervals);
      onAdd?.(info, intervals);
    };

    const handleSkip = () => {
      onSkip?.();
    };

    modalRoot.render(
      <AddProblemModal
        problemInfo={problemInfo}
        presets={presets}
        onClose={handleClose}
        onAdd={handleAdd}
        onSkip={handleSkip}
        extensionIconUrl={getExtensionIconUrl()}
      />
    );
  },

  hide: hideModal
};

/**
 * Initialize everything
 */
function initialize() {
  // Inject the toolbar button
  waitForToolbarAndInject();
  
  // Initialize submission detection (checks auto-detect setting internally)
  initSubmissionDetection(handleAcceptedSubmission);
  
  console.log('[LeetCached] React content script fully initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

console.log('[LeetCached] React content script loaded');
