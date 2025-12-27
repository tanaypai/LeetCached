// LeetCached Content Script - Tokyo Night Theme
// Detects accepted LeetCode submissions and shows add-to-schedule modal

class LeetCodeSubmissionDetector {
  constructor() {
    this.extensionIconUrl = chrome.runtime.getURL('icons/icon48.png');
    // Default presets structure (will be overwritten by storage)
    this.schedulePresets = [
       { id: 'standard', name: 'Standard', intervals: [1, 3, 7] },
       { id: 'intensive', name: 'Intensive', intervals: [1, 2, 4] },
       { id: 'relaxed', name: 'Relaxed', intervals: [2, 7, 14] }
    ];
    this.currentPresetId = 'standard';
    this.isEditMode = false;
    this.customIntervals = [1, 3, 7];
    this.modal = null;
    this.init();
  }

  init() {
    // Inject toolbar button
    this.injectToolbarButton();
    
    // Setup submit button listener for auto-detection
    this.setupSubmitListener();
    
    // Initialize state
    this.submissionState = 'IDLE'; 
    
    // Load presets from storage
    chrome.storage.local.get(['schedulePresets']).then(result => {
        if (result.schedulePresets && Array.isArray(result.schedulePresets) && result.schedulePresets.length > 0) {
            this.schedulePresets = result.schedulePresets;
             // Ensure current default exists, else pick first
            if (!this.schedulePresets.find(p => p.id === this.currentPresetId)) {
                this.currentPresetId = this.schedulePresets[0]?.id || 'custom';
            }
        }
    });
  }

  setupSubmitListener() {
    // Use event delegation to handle dynamic button rendering
    document.addEventListener('click', (e) => {
      const submitBtn = e.target.closest('[data-e2e-locator="console-submit-button"]');
      if (submitBtn) {
        this.handleSubmitClick();
      }
    });
  }

  handleSubmitClick() {
    console.log('[LeetCached] Submit button clicked');
    // Reset state to SUBMITTING
    this.submissionState = 'SUBMITTING';
    console.log('[LeetCached] State: SUBMITTING');
    
    this.stopObserving();
    this.observeSubmissionResults();
  }

  injectToolbarButton() {
    // Wait for the toolbar to be available
    const waitForToolbar = () => {
      const toolbar = document.querySelector('#ide-top-btns');
      if (toolbar) {
        this.addToolbarButton(toolbar);
      } else {
        // Retry after a short delay
        setTimeout(waitForToolbar, 500);
      }
    };
    
    // Start checking for toolbar
    waitForToolbar();
    
    // Also observe for SPA navigation (LeetCode is a SPA)
    const observer = new MutationObserver(() => {
      const toolbar = document.querySelector('#ide-top-btns');
      if (toolbar && !document.querySelector('.leetcached-toolbar-btn')) {
        this.addToolbarButton(toolbar);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addToolbarButton(toolbar) {
    // Don't add if already exists
    if (document.querySelector('.leetcached-toolbar-btn')) return;
    
    // Create the button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'leetcached-toolbar-btn';
    buttonContainer.innerHTML = `
      <div class="relative flex overflow-hidden rounded bg-fill-tertiary dark:bg-fill-tertiary ml-1.5">
        <div class="group flex flex-none items-center justify-center hover:bg-fill-quaternary dark:hover:bg-fill-quaternary rounded">
          <button class="leetcached-add-btn py-1.5 font-medium items-center whitespace-nowrap focus:outline-none inline-flex relative select-none rounded-none px-3 bg-transparent dark:bg-transparent" style="color: var(--tn-purple, #bb9af7);">
            <img src="${this.extensionIconUrl}" alt="LeetCached" style="width: 16px; height: 16px; margin-right: 8px;">
            <span class="text-sm font-medium">Add to LeetCached</span>
          </button>
        </div>
      </div>
    `;
    
    // Add click handler
    const button = buttonContainer.querySelector('.leetcached-add-btn');
    button.addEventListener('click', () => {
      const problemInfo = this.getProblemInfo();
      this.showAddToScheduleModal(problemInfo);
    });
    
    // Insert after the Notes/Leet buttons area (div with data-cid="2")
    const notesLeetArea = toolbar.querySelector('[data-cid="2"]');
    if (notesLeetArea) {
      notesLeetArea.after(buttonContainer);
    } else {
      // Fallback: append to toolbar
      toolbar.appendChild(buttonContainer);
    }
  }

  observeSubmissionResults() {
    console.log('[LeetCached] Starting observation...');
    
    // Observe body for changes to detect Pending/Judging or Result
    this.observer = new MutationObserver((mutations) => {
      this.checkSubmissionState();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'src', 'alt']
    });
    
    // Auto-stop after 45 seconds to prevent memory leaks if result never appears
    this.observerTimeout = setTimeout(() => {
      console.log('[LeetCached] Observation timed out - no result found.');
      this.stopObserving();
    }, 45000);
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.observerTimeout) {
      clearTimeout(this.observerTimeout);
      this.observerTimeout = null;
    }
  }

  checkSubmissionState() {
    // 1. Check for RUNNING state (Pending/Judging)
    const isRunning = this.detectRunningState();
    if (isRunning) {
        if (this.submissionState !== 'RUNNING') {
            this.submissionState = 'RUNNING';
            console.log('[LeetCached] State: RUNNING');
        }
        return; // Still running, wait.
    }

    // 2. Check for FINISHED state (Result)
    // We only accept a result if we were previously SUBMITTING or RUNNING.
    if (this.submissionState === 'SUBMITTING' || this.submissionState === 'RUNNING') {
        const result = this.detectFinalResult();
        
        if (result) {
            this.submissionState = 'FINISHED';
            console.log(`[LeetCached] State: FINISHED (${result.status})`);
            
            this.stopObserving();
            
            if (result.status === 'ACCEPTED') {
                this.handleAcceptedSubmission();
            } else {
                console.log('[LeetCached] Submission Failed:', result.detail);
            }
        }
    }
  }

  detectRunningState() {
    // Look for "Pending" or "Judging" indicators
    // 1. Images with alt text
    const pendingImages = document.querySelectorAll('img[alt="Pending..."], img[alt="Judging..."]');
    for (const img of pendingImages) {
        // Ensure it's visible / in the DOM
        if (this.isVisible(img)) {
            return true;
        }
    }
    
    // 2. Text content in the result area that says "Pending" or "Judging"
    const resultContainer = document.querySelector('[data-e2e-locator="submission-result"]');
    if (resultContainer && this.isVisible(resultContainer)) {
        const text = resultContainer.textContent;
        if (text.includes('Pending') || text.includes('Judging')) {
            return true;
        }
    }

    return false;
  }

  detectFinalResult() {
    // Accepted Check
    const greenElements = document.querySelectorAll('.text-green-s, .text-green-60, .dark\\:text-dark-green-s, .dark\\:text-dark-green-60');
    for (const el of greenElements) {
        if (el.textContent.includes('Accepted')) {
            // CRITICAL: Check visibility to ignore hidden templates or previous results
            if (this.isVisible(el) && this.verifySubmissionContext(el)) {
                 return { status: 'ACCEPTED', detail: 'Accepted' };
            }
        }
    }

    // Failed Check
    const redElements = document.querySelectorAll('.text-red-s, .text-red-60, .dark\\:text-dark-red-s, .dark\\:text-dark-red-60');
    // Common failure texts
    const failureTexts = ['Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Memory Limit Exceeded', 'Compile Error', 'Output Limit Exceeded'];
    for (const el of redElements) {
        const text = el.textContent;
        // Check if the element contains any of the failure texts
        const failureType = failureTexts.find(ft => text.includes(ft));
        if (failureType) {
             if (this.isVisible(el) && this.verifySubmissionContext(el)) {
                 return { status: 'FAILED', detail: failureType };
            }
        }
    }
    
    return null;
  }
  
  isVisible(elem) {
    if (!elem) return false;
    return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
  }
  
  verifySubmissionContext(element) {
    if (!element) return false;
    
    // Checks:
    // 1. Is it inside the submission result container? (Strongest check)
    if (element.closest('[data-e2e-locator="submission-result"]')) {
        console.log('[LeetCached] Context Verified: Inside submission-result container');
        return true;
    }

    // 2. Proximity to other result keywords (Legacy check)
    let parent = element.parentElement;
    for (let i = 0; i < 5; i++) {
        if (!parent) break;
        const text = parent.textContent || '';
        if (text.includes('Runtime') || text.includes('Memory') || text.includes('Test Cases Passed') || text.includes('Detail') || text.includes('Use Testcase')) {
             console.log(`[LeetCached] Context Verified: Found keyword near element at depth ${i}`);
             return true;
        }
        parent = parent.parentElement;
    }
    
    // 3. Relaxed check for RUNNING state
    if (this.submissionState === 'RUNNING') {
         console.log('[LeetCached] Context Verified: Creating lenient pass due to RUNNING state');
         return true;
    }

    console.log('[LeetCached] Context Verification Failed');
    return false;
  }

  handleAcceptedSubmission() {
    // Check auto-detect setting
    chrome.storage.local.get({ autoDetect: true }).then((res) => {
      if (!res.autoDetect) {
        console.log('[LeetCached] Auto-detect disabled.');
        return;
      }
      
      console.log('[LeetCached] Showing modal for Accepted submission.');
      // Delay slightly
      setTimeout(() => {
        const problemInfo = this.getProblemInfo();
        this.showAddToScheduleModal(problemInfo);
      }, 500);
    });
  }

  getProblemInfo() {
    // Get problem title from multiple possible sources
    let title = 'Unknown Problem';
    const titleSelectors = [
      '[data-cy="question-title"]',
      'div[class*="text-title-large"]',
      'a[class*="text-title-large"]',
      'div[data-track-load="description_content"] h4',
      '.text-lg.font-medium',
      'div[class*="title"]',
      'a[href*="/problems/"]'
    ];

    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent) {
        const text = el.textContent.trim();
        if (text && text !== 'Unknown Problem' && text.length > 0 && text.length < 200) {
          title = text;
          // Extract just the problem name if it includes number
          const match = title.match(/^\d+\.\s*(.+)$/);
          if (match) title = match[1];
          break;
        }
      }
    }

    // Fallback: try to get title from page title
    if (title === 'Unknown Problem') {
      const pageTitle = document.title;
      const titleMatch = pageTitle.match(/^(.+?)\s*[-–|]/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }

    // Get problem number from URL
    const urlMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    const problemSlug = urlMatch ? urlMatch[1] : '';
    const problemNumber = this.extractProblemNumber();

    // If still unknown, try to format from slug
    if (title === 'Unknown Problem' && problemSlug) {
      title = problemSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Get difficulty
    let difficulty = 'Medium';
    const difficultySelectors = [
      'div[class*="text-difficulty-easy"]',
      'div[class*="text-difficulty-medium"]', 
      'div[class*="text-difficulty-hard"]',
      'div[class*="text-olive"]',
      'div[class*="text-yellow"]',
      'div[class*="text-pink"]',
      '[class*="difficulty"]',
      '[diff]'
    ];
    
    for (const selector of difficultySelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent?.toLowerCase() || '';
        const className = el.className?.toLowerCase() || '';
        if (text.includes('easy') || className.includes('easy') || className.includes('olive')) {
          difficulty = 'Easy';
          break;
        } else if (text.includes('hard') || className.includes('hard') || className.includes('pink')) {
          difficulty = 'Hard';
          break;
        } else if (text.includes('medium') || className.includes('medium') || className.includes('yellow')) {
          difficulty = 'Medium';
          break;
        }
      }
    }

    // Try to get category/topics
    let category = 'Algorithm';
    let topics = [];
    
    // Look for topic links with href="/tag/..."
    const topicLinks = document.querySelectorAll('a[href^="/tag/"]');
    if (topicLinks.length > 0) {
      topics = Array.from(topicLinks).map(el => el.textContent?.trim()).filter(Boolean);
      category = topics[0] || 'Algorithm';
    }
    
    // Fallback to old method if no topics found
    if (topics.length === 0) {
      const tagEls = document.querySelectorAll('[class*="tag"], [class*="topic"]');
      if (tagEls.length > 0) {
        topics = Array.from(tagEls).map(el => el.textContent?.trim()).filter(Boolean);
        category = topics[0] || 'Algorithm';
      }
    }

    return {
      title: problemNumber ? `${problemNumber}. ${title}` : title,
      slug: problemSlug,
      difficulty,
      category,
      topics,
      url: window.location.href
    };
  }

  extractProblemNumber() {
    // Try to get problem number from various sources
    const titleEl = document.querySelector('[data-cy="question-title"]');
    if (titleEl) {
      const match = titleEl.textContent?.match(/^(\d+)\./);
      if (match) return match[1];
    }
    return '';
  }

  showAddToScheduleModal(problemInfo) {
    // Remove any existing modal
    this.closeModal();

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'lsr-modal-overlay';
    overlay.innerHTML = this.getModalHTML(problemInfo);

    document.body.appendChild(overlay);
    this.modal = overlay;

    // Setup event listeners
    this.setupModalEvents(problemInfo);
  }

  getModalHTML(problemInfo) {
    const difficultyClass = problemInfo.difficulty.toLowerCase();
    
    // Find current preset object
    const currentPreset = this.schedulePresets.find(p => p.id === this.currentPresetId) || this.schedulePresets[0];
    const previewDates = this.getPreviewDates(currentPreset ? currentPreset.intervals : []);
    
    // Generate Schedule Options HTML
    const scheduleOptionsHtml = this.schedulePresets.map(preset => {
        const isChecked = preset.id === this.currentPresetId ? 'checked' : '';
        // Format intervals string e.g. "1, 3, 7 days"
        const intervalText = preset.intervals.join(', ') + ' days';
        
        return `
            <label class="lsr-schedule-option">
              <input type="radio" name="schedule" value="${preset.id}" ${isChecked}>
              <div class="lsr-schedule-card">
                <div class="lsr-schedule-card-header">
                  <span class="lsr-schedule-card-title">${preset.name}</span>
                  <div class="lsr-radio-indicator"></div>
                </div>
                <span class="lsr-schedule-card-desc">${intervalText}</span>
              </div>
            </label>
        `;
    }).join('');
    
    // Add "Custom" option explicitly if we want it always available, 
    // or assume it's part of presets if the user added it. 
    // The previous code had a specific "Custom" block. 
    // Let's explicitly add the Legacy Custom option for now at the end
    const customChecked = this.currentPresetId === 'custom' ? 'checked' : '';
    const customOptionHtml = `
        <label class="lsr-schedule-option">
          <input type="radio" name="schedule" value="custom" ${customChecked}>
          <div class="lsr-schedule-card">
            <div class="lsr-schedule-card-header">
              <span class="lsr-schedule-card-title">Custom</span>
              <div class="lsr-radio-indicator"></div>
            </div>
            <span class="lsr-schedule-card-desc">Set your own intervals</span>
          </div>
        </label>
    `;

    const topicsHtml = problemInfo.topics && problemInfo.topics.length > 0
      ? problemInfo.topics.map(topic => `<span class="lsr-topic-tag">${topic}</span>`).join('')
      : `<span class="lsr-topic-tag">${problemInfo.category}</span>`;

    return `
      <div class="lsr-modal">
        <div class="lsr-modal-header">
          <div class="lsr-header-brand">
            <img src="${this.extensionIconUrl}" alt="LeetCached" class="lsr-logo">
            <h2>LeetCached</h2>
          </div>
          <button class="lsr-close-btn" data-action="close">&times;</button>
        </div>

        <div class="lsr-modal-body">
          <!-- Problem Info -->
          <div class="lsr-problem-info">
            <div class="lsr-problem-meta">
              <span class="lsr-difficulty lsr-${difficultyClass}">${problemInfo.difficulty}</span>
            </div>
            <h3>${problemInfo.title}</h3>
            <div class="lsr-topics-row">${topicsHtml}</div>
          </div>

          <!-- Schedule Options -->
          <span class="lsr-section-label">Schedule Preset</span>
          <div class="lsr-schedule-grid">
            ${scheduleOptionsHtml}
            ${customOptionHtml}
          </div>

          <!-- Preview / Edit Section -->
          <div class="lsr-preview">
            <div class="lsr-preview-header">
              <span class="lsr-preview-title">Upcoming Reviews</span>
              <a class="lsr-edit-link" data-action="toggle-edit">${this.isEditMode ? 'Done' : 'Edit'}</a>
            </div>
            <div class="lsr-timeline-container">
              ${this.isEditMode ? this.getEditTimelineHTML() : this.getPreviewTimelineHTML(previewDates)}
            </div>
          </div>
        </div>

        <div class="lsr-modal-footer">
          <button class="lsr-btn lsr-btn-secondary" data-action="skip">Skip Problem</button>
          <button class="lsr-btn lsr-btn-primary" data-action="add">
            ${this.isEditMode ? 'Save Schedule' : 'Add to Schedule'}
          </button>
        </div>
      </div>
    `;
  }

  getPreviewTimelineHTML(previewDates) {
    return `
      <div class="lsr-timeline">
        ${previewDates.map((item, index) => `
          <div class="lsr-timeline-item">
            <div class="lsr-timeline-dot"></div>
            <span class="lsr-timeline-label">${item.label}</span>
            <span class="lsr-timeline-date">${item.dateStr}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  getEditTimelineHTML() {
    let intervals;
    if (this.currentPresetId === 'custom') {
        intervals = this.customIntervals;
    } else {
        const preset = this.schedulePresets.find(p => p.id === this.currentPresetId);
        intervals = preset ? preset.intervals : [];
    }

    return `
      <div class="lsr-timeline-edit">
        ${intervals.map((days, index) => {
          const date = new Date();
          date.setDate(date.getDate() + days);
          const dateValue = date.toISOString().split('T')[0];
          
          return `
            <div class="lsr-timeline-edit-item" data-index="${index}">
              <div class="lsr-timeline-edit-dot"></div>
              <input type="number" class="lsr-edit-input number" value="${days}" min="1" max="365" data-field="days">
              <select class="lsr-edit-input unit" data-field="unit">
                <option value="days" selected>Days</option>
                <option value="weeks">Weeks</option>
              </select>
              <input type="date" class="lsr-edit-input date" value="${dateValue}" data-field="date">
              <button class="lsr-remove-btn" data-action="remove-interval" title="Remove">&times;</button>
            </div>
          `;
        }).join('')}
        <button class="lsr-add-repetition" data-action="add-interval">
          <span>+</span> Add Repetition
        </button>
      </div>
    `;
  }

  getPreviewDates(intervals) {
    const today = new Date();
    
    return intervals.map(days => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      
      let label;
      if (days === 1) {
        label = 'Tomorrow';
      } else if (days < 7) {
        label = `In ${days} days`;
      } else if (days === 7) {
        label = 'In 1 week';
      } else if (days < 30) {
        const weeks = Math.round(days / 7);
        label = `In ${weeks} week${weeks > 1 ? 's' : ''}`;
      } else {
        const months = Math.round(days / 30);
        label = `In ${months} month${months > 1 ? 's' : ''}`;
      }

      const options = { month: 'short', day: 'numeric' };
      const dateStr = date.toLocaleDateString('en-US', options);

      return { days, label, dateStr, date };
    });
  }

  setupModalEvents(problemInfo) {
    if (!this.modal) return;

    // Close button
    this.modal.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Schedule radio buttons
    this.modal.querySelectorAll('input[name="schedule"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.currentPresetId = e.target.value;
        this.updatePreview();
      });
    });

    // Edit toggle
    this.modal.querySelector('[data-action="toggle-edit"]')?.addEventListener('click', () => {
      this.isEditMode = !this.isEditMode;
      this.updatePreview();
    });

    // Skip button
    this.modal.querySelector('[data-action="skip"]')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Add button
    this.modal.querySelector('[data-action="add"]')?.addEventListener('click', () => {
      this.addProblemToSchedule(problemInfo);
    });

    // Handle edit mode specific events
    this.setupEditModeEvents();
  }

  setupEditModeEvents() {
    // Add interval button
    this.modal?.querySelector('[data-action="add-interval"]')?.addEventListener('click', () => {
      this.addInterval();
    });

    // Remove interval buttons
    this.modal?.querySelectorAll('[data-action="remove-interval"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.lsr-timeline-edit-item');
        const index = parseInt(item.dataset.index);
        this.removeInterval(index);
      });
    });

    // Number input changes
    this.modal?.querySelectorAll('.lsr-edit-input.number').forEach(input => {
      input.addEventListener('change', (e) => {
        const item = e.target.closest('.lsr-timeline-edit-item');
        const index = parseInt(item.dataset.index);
        this.updateIntervalDays(index, parseInt(e.target.value));
      });
    });

    // Date input changes
    this.modal?.querySelectorAll('.lsr-edit-input.date').forEach(input => {
      input.addEventListener('change', (e) => {
        const item = e.target.closest('.lsr-timeline-edit-item');
        const index = parseInt(item.dataset.index);
        this.updateIntervalFromDate(index, e.target.value);
      });
    });

    // Unit changes
    this.modal?.querySelectorAll('.lsr-edit-input.unit').forEach(select => {
      select.addEventListener('change', (e) => {
        const item = e.target.closest('.lsr-timeline-edit-item');
        const index = parseInt(item.dataset.index);
        const numberInput = item.querySelector('.lsr-edit-input.number');
        const days = parseInt(numberInput.value);
        
        if (e.target.value === 'weeks') {
          this.updateIntervalDays(index, days * 7);
        }
      });
    });
  }

  addInterval() {
    if (this.currentPresetId === 'custom') {
      const lastInterval = this.customIntervals[this.customIntervals.length - 1] || 30;
      this.customIntervals.push(lastInterval + 14);
    } else {
      // Switch to custom mode
      const preset = this.schedulePresets.find(p => p.id === this.currentPresetId);
      this.customIntervals = preset ? [...preset.intervals] : [1, 3, 7]; // fallback
      
      const lastInterval = this.customIntervals[this.customIntervals.length - 1] || 30;
      this.customIntervals.push(lastInterval + 14);
      this.currentPresetId = 'custom';
      
      // Update radio button
      const customRadio = this.modal?.querySelector('input[value="custom"]');
      if (customRadio) customRadio.checked = true;
    }
    this.updatePreview();
  }

  removeInterval(index) {
    if (this.currentPresetId !== 'custom') {
      const preset = this.schedulePresets.find(p => p.id === this.currentPresetId);
      this.customIntervals = preset ? [...preset.intervals] : [1, 3, 7];
      this.currentPresetId = 'custom';
      const customRadio = this.modal?.querySelector('input[value="custom"]');
      if (customRadio) customRadio.checked = true;
    }
    
    this.customIntervals.splice(index, 1);
    this.updatePreview();
  }

  updateIntervalDays(index, days) {
    if (this.currentPresetId !== 'custom') {
      const preset = this.schedulePresets.find(p => p.id === this.currentPresetId);
      this.customIntervals = preset ? [...preset.intervals] : [1, 3, 7];
      this.currentPresetId = 'custom';
      const customRadio = this.modal?.querySelector('input[value="custom"]');
      if (customRadio) customRadio.checked = true;
    }
    
    this.customIntervals[index] = Math.max(1, Math.min(365, days));
    // Sort intervals
    this.customIntervals.sort((a, b) => a - b);
    this.updatePreview();
  }

  updateIntervalFromDate(index, dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateStr);
    const diffTime = selectedDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      this.updateIntervalDays(index, diffDays);
    }
  }

  updatePreview() {
    if (!this.modal) return;

    const container = this.modal.querySelector('.lsr-timeline-container');
    const editLink = this.modal.querySelector('[data-action="toggle-edit"]');
    const addBtn = this.modal.querySelector('[data-action="add"]');

    if (container) {
      let intervals;
      if (this.currentPresetId === 'custom') {
          intervals = this.customIntervals;
      } else {
          const preset = this.schedulePresets.find(p => p.id === this.currentPresetId);
          intervals = preset ? preset.intervals : [];
      }
    
      const previewDates = this.getPreviewDates(intervals);
      
      container.innerHTML = this.isEditMode 
        ? this.getEditTimelineHTML() 
        : this.getPreviewTimelineHTML(previewDates);
      
      if (this.isEditMode) {
        this.setupEditModeEvents();
      }
    }

    if (editLink) {
      editLink.textContent = this.isEditMode ? 'Done' : 'Edit';
    }

    if (addBtn) {
      addBtn.textContent = this.isEditMode ? 'Save Schedule' : 'Add to Schedule';
    }
  }

  async addProblemToSchedule(problemInfo) {
    let intervals;
    if (this.currentPresetId === 'custom') {
        intervals = this.customIntervals;
    } else {
        const preset = this.schedulePresets.find(p => p.id === this.currentPresetId);
        intervals = preset ? preset.intervals : [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduledDates = intervals.map(days => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    });
    
    // ... rest of method logic ...
    // Since I can't easily preserve the rest without reading it all, I will just replace the beginning lines if possible. 
    // Wait, replace_file_content requires exact TargetContent match.
    // I know the rest of the method from previous view, but let's be safe. 
    // I will read the full method first to ensure I have the exact content for replacement.


    // Use slug as the problem ID (matches popup format)
    const problemId = problemInfo.slug;

    const problem = {
      title: problemInfo.title,
      difficulty: problemInfo.difficulty,
      category: problemInfo.category,
      topics: problemInfo.topics || [],
      url: problemInfo.url,
      addedDate: today.toISOString().split('T')[0],
      scheduledDates,
      completedDates: []
    };

    try {
      // Get existing problems (use same key as popup: spacedRepProblems)
      const result = await chrome.storage.local.get(['spacedRepProblems']);
      const problems = result.spacedRepProblems || {};

      // Add or update problem using slug as key
      problems[problemId] = problem;

      // Save updated problems
      await chrome.storage.local.set({ spacedRepProblems: problems });

      // Show success feedback
      this.showSuccessFeedback();
    } catch (error) {
      console.error('Failed to save problem:', error);
      
      // Handle extension context invalidated error
      if (error.message && error.message.includes('Extension context invalidated')) {
        alert('LeetCached was updated. Please refresh the page to continue.');
        this.closeModal();
      } else {
        alert('Failed to save problem. Please try again.');
      }
    }
  }

  showSuccessFeedback() {
    const addBtn = this.modal?.querySelector('[data-action="add"]');
    if (addBtn) {
      addBtn.innerHTML = '✓ Added';
      addBtn.disabled = true;
      addBtn.style.background = 'var(--tn-green)';
    }

    // Close modal after delay
    setTimeout(() => {
      this.closeModal();
    }, 1200);
  }

  closeModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    // Reset edit mode for next time
    this.isEditMode = false;
  }
}

// Initialize
new LeetCodeSubmissionDetector();
