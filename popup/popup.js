/**
 * LeetCached - Popup Controller
 * Tokyo Night Theme Edition
 */

class LeetCachedPopup {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.problems = {};
    this.editingProblemId = null;
    this.editingDates = [];
    this.newProblemDates = [];
    this.searchQuery = '';
    
    // Manage view state
    this.sortColumn = 'nextReview';
    this.sortDirection = 'asc';
    
    this.init();
  }
  
  async init() {
    await this.loadProblems();
    this.renderCalendar();
    this.updateStats();
    this.setupEventListeners();
    // Show today's problems in sidebar by default
    this.showSidebarProblems(this.formatDate(new Date()));
  }
  
  async loadProblems() {
    const result = await chrome.storage.local.get(['spacedRepProblems']);
    this.problems = result.spacedRepProblems || {};
  }
  
  async saveProblems() {
    await chrome.storage.local.set({ spacedRepProblems: this.problems });
  }
  
  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });
    
    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });
    
    document.getElementById('today-btn').addEventListener('click', () => {
      this.currentDate = new Date();
      this.renderCalendar();
      this.showSidebarProblems(this.formatDate(new Date()));
    });
    
    // Add custom review button
    document.getElementById('add-custom-review-btn')?.addEventListener('click', () => {
      this.openAddProblemModal();
    });
    
    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderManageView();
    });
    
    // Sortable headers
    this.setupSortableHeaders();
    
    // Edit Modal
    document.querySelector('.modal-close').addEventListener('click', () => {
      this.closeEditModal();
    });
    
    document.getElementById('edit-modal').addEventListener('click', (e) => {
      if (e.target.id === 'edit-modal') this.closeEditModal();
    });
    
    document.getElementById('add-date-btn').addEventListener('click', () => {
      this.addDateToEdit();
    });
    
    document.getElementById('save-changes-btn').addEventListener('click', () => {
      this.saveEditChanges();
    });
    
    document.getElementById('delete-problem-btn').addEventListener('click', () => {
      this.deleteEditingProblem();
    });
    
    // Add Problem Modal
    document.getElementById('add-problem-btn').addEventListener('click', () => {
      this.openAddProblemModal();
    });
    
    document.querySelector('.add-modal-close').addEventListener('click', () => {
      this.closeAddProblemModal();
    });
    
    document.getElementById('add-problem-modal').addEventListener('click', (e) => {
      if (e.target.id === 'add-problem-modal') this.closeAddProblemModal();
    });
    
    document.getElementById('cancel-add-btn').addEventListener('click', () => {
      this.closeAddProblemModal();
    });
    
    document.getElementById('confirm-add-btn').addEventListener('click', () => {
      this.addNewProblem();
    });
    
    document.getElementById('add-problem-add-date-btn').addEventListener('click', () => {
      this.addDateToNewProblem();
    });
    
    // Help navigation
    document.querySelectorAll('.help-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        this.switchHelpSection(section);
      });
    });
  }
  
  switchHelpSection(section) {
    // Update nav items
    document.querySelectorAll('.help-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });
    
    // Update content sections
    document.querySelectorAll('.help-section-content').forEach(content => {
      content.classList.toggle('active', content.id === `help-${section}`);
    });
  }
  
  switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.toggle('active', view.id === `${tab}-view`);
    });
    
    // Render manage view if switching to it
    if (tab === 'manage') {
      this.renderManageView();
    }
  }
  
  // ========================================
  // Calendar Methods
  // ========================================
  
  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
    
    // Calculate calendar days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Previous month trailing days
    for (let i = startingDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dateStr = this.formatDate(new Date(year, month - 1, day));
      const problemsForDay = this.getProblemsForDate(dateStr);
      
      const dayEl = this.createDayElement(day, dateStr, true, false, problemsForDay);
      calendarDays.appendChild(dayEl);
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      const isToday = date.getTime() === today.getTime();
      const problemsForDay = this.getProblemsForDate(dateStr);
      
      const dayEl = this.createDayElement(day, dateStr, false, isToday, problemsForDay);
      calendarDays.appendChild(dayEl);
    }
    
    // Next month leading days
    const remainingDays = 42 - (startingDay + totalDays);
    for (let day = 1; day <= remainingDays; day++) {
      const dateStr = this.formatDate(new Date(year, month + 1, day));
      const problemsForDay = this.getProblemsForDate(dateStr);
      
      const dayEl = this.createDayElement(day, dateStr, true, false, problemsForDay);
      calendarDays.appendChild(dayEl);
    }
  }
  
  createDayElement(day, dateStr, isOtherMonth, isToday, problems) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.dataset.date = dateStr;
    
    if (isOtherMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    if (problems.length > 0) dayEl.classList.add('has-problems');
    if (this.selectedDate === dateStr) dayEl.classList.add('selected');
    
    // Create day number
    const dayNumber = document.createElement('span');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayEl.appendChild(dayNumber);
    
    // Create problem dots
    if (problems.length > 0) {
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'problem-dots';
      
      const maxDots = Math.min(problems.length, 3);
      const today = this.formatDate(new Date());
      
      for (let i = 0; i < maxDots; i++) {
        const dot = document.createElement('span');
        dot.className = 'problem-dot';
        
        if (problems[i].isCompleted) {
          dot.classList.add('completed');
        } else if (dateStr < today) {
          dot.classList.add('overdue');
        }
        
        dotsContainer.appendChild(dot);
      }
      
      dayEl.appendChild(dotsContainer);
    }
    
    dayEl.addEventListener('click', () => this.showSidebarProblems(dateStr));
    
    return dayEl;
  }
  
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }
  
  getProblemsForDate(dateStr) {
    const problems = [];
    
    for (const [problemId, problem] of Object.entries(this.problems)) {
      if (problem.scheduledDates && problem.scheduledDates.includes(dateStr)) {
        const repIndex = problem.scheduledDates.indexOf(dateStr);
        const isCompleted = problem.completedDates && problem.completedDates.includes(dateStr);
        problems.push({
          ...problem,
          id: problemId,
          repetitionNumber: repIndex + 1,
          totalRepetitions: problem.scheduledDates.length,
          isCompleted
        });
      }
    }
    
    return problems;
  }
  
  showSidebarProblems(dateStr) {
    this.selectedDate = dateStr;
    const problems = this.getProblemsForDate(dateStr);
    
    const dateDisplay = document.getElementById('sidebar-date');
    const countBadge = document.getElementById('sidebar-count');
    const problemsList = document.getElementById('sidebar-problems-list');
    
    const date = new Date(dateStr + 'T00:00:00');
    dateDisplay.textContent = date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
    
    countBadge.textContent = `${problems.length} problem${problems.length !== 1 ? 's' : ''}`;
    
    const today = this.formatDate(new Date());
    
    if (problems.length === 0) {
      problemsList.innerHTML = `
        <div class="empty-sidebar">
          <span class="material-symbols-outlined">event_available</span>
          <p>No problems scheduled for this day</p>
        </div>
      `;
    } else {
      problemsList.innerHTML = problems.map(problem => {
        const difficultyClass = (problem.difficulty || 'Medium').toLowerCase();
        const isOverdue = !problem.isCompleted && dateStr < today;
        const topics = problem.topics || [];
        const displayTopics = topics.slice(0, 2);
        
        return `
          <div class="sidebar-problem-card ${problem.isCompleted ? 'completed' : ''}" data-problem-id="${problem.id}">
            <div class="sidebar-problem-header">
              <div class="sidebar-problem-icon ${difficultyClass}">
                <span class="material-symbols-outlined">code</span>
              </div>
              <div class="sidebar-problem-info">
                <a href="${problem.url}" target="_blank" class="sidebar-problem-title">${problem.title}</a>
                <div class="sidebar-problem-meta">
                  <span class="difficulty-badge ${difficultyClass}">${problem.difficulty || 'Medium'}</span>
                  <span class="review-badge">Review #${problem.repetitionNumber}</span>
                  ${isOverdue ? '<span class="overdue-dot" title="Overdue"></span>' : ''}
                </div>
              </div>
            </div>
            ${displayTopics.length > 0 ? `
              <div class="sidebar-problem-topics">
                ${displayTopics.map(t => `<span class="sidebar-topic-tag">${t}</span>`).join('')}
                ${topics.length > 2 ? `<span class="sidebar-topic-tag">+${topics.length - 2}</span>` : ''}
              </div>
            ` : ''}
            <div class="sidebar-problem-actions">
              <a href="${problem.url}" target="_blank" class="sidebar-btn-solve">${isOverdue ? 'Solve Now' : 'Solve'}</a>
              <button class="sidebar-btn-action btn-check" data-problem-id="${problem.id}" data-date="${dateStr}" title="${problem.isCompleted ? 'Mark incomplete' : 'Mark complete'}">
                <span class="material-symbols-outlined">${problem.isCompleted ? 'undo' : 'check'}</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
      
      // Add event listeners for action buttons
      problemsList.querySelectorAll('.btn-check').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleCompletion(btn.dataset.problemId, btn.dataset.date);
        });
      });
    }
    
    this.renderCalendar();
  }
  
  // Legacy method kept for compatibility
  showDayDetails(dateStr) {
    this.showSidebarProblems(dateStr);
  }
  
  async toggleCompletion(problemId, dateStr) {
    const problem = this.problems[problemId];
    if (!problem) return;
    
    if (!problem.completedDates) {
      problem.completedDates = [];
    }
    
    const isCompleted = problem.completedDates.includes(dateStr);
    
    if (isCompleted) {
      problem.completedDates = problem.completedDates.filter(d => d !== dateStr);
    } else {
      problem.completedDates.push(dateStr);
    }
    
    await this.saveProblems();
    this.showSidebarProblems(dateStr);
    this.updateStats();
  }
  
  async removeDateFromProblem(problemId, dateStr) {
    const problem = this.problems[problemId];
    if (!problem) return;
    
    problem.scheduledDates = problem.scheduledDates.filter(d => d !== dateStr);
    
    // If no more scheduled dates, delete the problem
    if (problem.scheduledDates.length === 0) {
      delete this.problems[problemId];
    }
    
    await this.saveProblems();
    this.renderCalendar();
    this.updateStats();
    this.showDayDetails(dateStr);
  }
  
  // ========================================
  // Sort Methods
  // ========================================
  
  setupSortableHeaders() {
    document.querySelectorAll('.manage-table-header .sortable').forEach(header => {
      header.addEventListener('click', () => {
        const column = header.dataset.sort;
        
        if (this.sortColumn === column) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = column;
          this.sortDirection = 'asc';
        }
        
        // Update UI
        document.querySelectorAll('.manage-table-header .sortable').forEach(h => {
          h.classList.remove('active');
          const icon = h.querySelector('.sort-icon');
          if (icon) icon.textContent = 'unfold_more';
        });
        
        header.classList.add('active');
        const icon = header.querySelector('.sort-icon');
        if (icon) icon.textContent = this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
        
        this.renderManageView();
      });
    });
  }

  // ========================================
  // Manage View Methods
  // ========================================
  
  renderManageView() {
    const problemsList = document.getElementById('manage-problems-list');
    const countEl = document.getElementById('manage-count');
    
    let problemsArray = Object.entries(this.problems);
    
    // Filter by search query (search in title AND topics)
    if (this.searchQuery) {
      problemsArray = problemsArray.filter(([id, problem]) => {
        const titleMatch = problem.title.toLowerCase().includes(this.searchQuery);
        const topicsMatch = (problem.topics || []).some(t => 
          t.toLowerCase().includes(this.searchQuery)
        );
        return titleMatch || topicsMatch;
      });
    }
    
    // Sort
    problemsArray.sort(([, a], [, b]) => {
      let comparison = 0;
      
      switch (this.sortColumn) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'difficulty':
          const diffOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          comparison = (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2);
          break;
        case 'nextReview':
        default:
          const nextA = this.getNextScheduledDate(a);
          const nextB = this.getNextScheduledDate(b);
          if (!nextA && !nextB) comparison = 0;
          else if (!nextA) comparison = 1;
          else if (!nextB) comparison = -1;
          else comparison = nextA.localeCompare(nextB);
          break;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    countEl.textContent = problemsArray.length;
    
    if (problemsArray.length === 0) {
      problemsList.innerHTML = `
        <div class="no-problems" style="padding: 40px; text-align: center; color: var(--tn-text-dim);">
          <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 12px; display: block; opacity: 0.5;">search_off</span>
          ${this.searchQuery ? 'No problems match your search' : 'No problems scheduled yet. Solve problems on LeetCode to add them!'}
        </div>
      `;
      return;
    }
    
    problemsList.innerHTML = problemsArray.map(([id, problem]) => {
      const nextDate = this.getNextScheduledDate(problem);
      const nextDateDisplay = this.getNextDateDisplay(nextDate);
      const difficultyClass = (problem.difficulty || 'Medium').toLowerCase();
      const topics = problem.topics || [];
      const displayTopics = topics.slice(0, 3);
      const hasMoreTopics = topics.length > 3;
      
      return `
        <div class="manage-problem-item" data-problem-id="${id}">
          <div class="manage-problem-info">
            <span class="problem-title">${problem.title}</span>
            <div class="problem-tags">
              ${displayTopics.map(t => `<span class="problem-tag">${t}</span>`).join('')}
              ${hasMoreTopics ? `<span class="problem-tag">+${topics.length - 3}</span>` : ''}
            </div>
          </div>
          <div class="manage-difficulty">
            <span class="difficulty-badge ${difficultyClass}">${problem.difficulty || 'Medium'}</span>
          </div>
          <div class="manage-next ${nextDateDisplay.class}">
            ${nextDateDisplay.text}
          </div>
          <div class="manage-actions">
            <a href="${problem.url}" target="_blank" class="icon-btn" title="Open problem">
              <span class="material-symbols-outlined">open_in_new</span>
            </a>
          </div>
        </div>
      `;
    }).join('');
    
    // Add click listener for the whole row to open edit modal
    problemsList.querySelectorAll('.manage-problem-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger on link clicks
        if (e.target.closest('a')) return;
        this.openEditModal(item.dataset.problemId);
      });
      item.style.cursor = 'pointer';
    });
  }
  
  getProblemStatus(problem) {
    const nextDate = this.getNextScheduledDate(problem);
    if (!nextDate) return 'completed';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(nextDate + 'T00:00:00');
    const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'due';
    return 'upcoming';
  }
  
  getNextScheduledDate(problem) {
    if (!problem.scheduledDates || problem.scheduledDates.length === 0) return null;
    
    const today = this.formatDate(new Date());
    const futureDates = problem.scheduledDates
      .filter(d => d >= today && !problem.completedDates?.includes(d))
      .sort();
    
    return futureDates[0] || null;
  }
  
  getNextDateDisplay(dateStr) {
    if (!dateStr) {
      return { text: 'Completed', class: 'completed' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Overdue', class: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'Today', class: 'due-now' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', class: '' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days`, class: '' };
    } else {
      return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), class: '' };
    }
  }
  
  formatDisplayDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  // ========================================
  // Edit Modal Methods
  // ========================================
  
  openEditModal(problemId) {
    const problem = this.problems[problemId];
    if (!problem) return;
    
    this.editingProblemId = problemId;
    this.editingDates = [...(problem.scheduledDates || [])];
    
    document.getElementById('edit-problem-title').textContent = problem.title;
    this.renderEditDates();
    
    document.getElementById('edit-modal').classList.remove('hidden');
    document.getElementById('edit-modal').classList.add('active');
  }
  
  closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('edit-modal').classList.remove('active');
    this.editingProblemId = null;
    this.editingDates = [];
  }
  
  renderEditDates() {
    const datesList = document.getElementById('edit-dates-list');
    const problem = this.problems[this.editingProblemId];
    
    if (this.editingDates.length === 0) {
      datesList.innerHTML = '<div class="no-dates">No dates scheduled. Add a repetition below.</div>';
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    datesList.innerHTML = this.editingDates.sort().map((dateStr, index) => {
      const isCompleted = problem.completedDates?.includes(dateStr);
      const date = new Date(dateStr + 'T00:00:00');
      const diffDays = Math.round((date - today) / (1000 * 60 * 60 * 24));
      
      return `
        <div class="timeline-item ${isCompleted ? 'completed' : ''}" data-index="${index}">
          <div class="timeline-dot"></div>
          <span class="timeline-rep">${isCompleted ? '✓' : ''} Rep ${index + 1}</span>
          <div class="timeline-inputs">
            <input type="number" class="timeline-input days-input" value="${diffDays}" min="-365" max="365" data-field="days" ${isCompleted ? 'disabled' : ''}>
            <span class="timeline-label">days</span>
            <input type="date" class="timeline-input date-input" value="${dateStr}" data-field="date" ${isCompleted ? 'disabled' : ''}>
          </div>
          ${!isCompleted ? `
            <button class="btn-remove-timeline" data-date="${dateStr}" title="Remove">
              <span class="material-symbols-outlined">close</span>
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
    
    // Add event listeners for inputs
    datesList.querySelectorAll('.timeline-item').forEach(item => {
      const index = parseInt(item.dataset.index);
      const daysInput = item.querySelector('.days-input');
      const dateInput = item.querySelector('.date-input');
      
      if (daysInput && !daysInput.disabled) {
        daysInput.addEventListener('change', (e) => {
          const days = parseInt(e.target.value);
          const newDate = new Date(today);
          newDate.setDate(newDate.getDate() + days);
          this.editingDates[index] = this.formatDate(newDate);
          this.renderEditDates();
        });
      }
      
      if (dateInput && !dateInput.disabled) {
        dateInput.addEventListener('change', (e) => {
          this.editingDates[index] = e.target.value;
          this.renderEditDates();
        });
      }
    });
    
    // Add event listeners for remove buttons
    datesList.querySelectorAll('.btn-remove-timeline').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateToRemove = btn.dataset.date;
        this.editingDates = this.editingDates.filter(d => d !== dateToRemove);
        this.renderEditDates();
      });
    });
  }
  
  addDateToEdit() {
    const today = new Date();
    // Default to 7 days from now, or 7 days after the last date
    let defaultDays = 7;
    if (this.editingDates.length > 0) {
      const lastDate = new Date(this.editingDates[this.editingDates.length - 1] + 'T00:00:00');
      const daysSinceLast = Math.round((lastDate - today) / (1000 * 60 * 60 * 24));
      defaultDays = daysSinceLast + 7;
    }
    
    const newDate = new Date(today);
    newDate.setDate(newDate.getDate() + defaultDays);
    const dateStr = this.formatDate(newDate);
    
    if (!this.editingDates.includes(dateStr)) {
      this.editingDates.push(dateStr);
      this.editingDates.sort();
    }
    this.renderEditDates();
  }
  
  async saveEditChanges() {
    if (!this.editingProblemId) return;
    
    const problem = this.problems[this.editingProblemId];
    if (!problem) return;
    
    problem.scheduledDates = [...this.editingDates];
    
    // If no dates left, delete problem
    if (problem.scheduledDates.length === 0) {
      delete this.problems[this.editingProblemId];
    }
    
    await this.saveProblems();
    this.closeEditModal();
    this.renderManageView();
    this.renderCalendar();
    this.updateStats();
  }
  
  async deleteProblem(problemId) {
    const problem = this.problems[problemId];
    if (!problem) return;
    
    delete this.problems[problemId];
    await this.saveProblems();
    this.renderManageView();
    this.renderCalendar();
    this.updateStats();
  }
  
  async deleteEditingProblem() {
    if (!this.editingProblemId) return;
    
    delete this.problems[this.editingProblemId];
    await this.saveProblems();
    this.closeEditModal();
    this.renderManageView();
    this.renderCalendar();
    this.updateStats();
  }
  
  // ========================================
  // Add Problem Modal Methods
  // ========================================
  
  openAddProblemModal() {
    // Reset form
    document.getElementById('new-problem-url').value = '';
    document.getElementById('new-problem-title').value = '';
    document.getElementById('new-problem-difficulty').value = 'Medium';
    
    // Initialize with default schedule intervals (1, 3, 7, 14, 30 days)
    this.newProblemDates = [1, 3, 7, 14, 30];
    this.renderNewProblemDates();
    
    document.getElementById('add-problem-modal').classList.add('active');
  }
  
  closeAddProblemModal() {
    document.getElementById('add-problem-modal').classList.remove('active');
    this.newProblemDates = [];
  }
  
  renderNewProblemDates() {
    const datesList = document.getElementById('add-problem-dates-list');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (this.newProblemDates.length === 0) {
      datesList.innerHTML = '<div class="no-dates">No dates scheduled. Add a repetition below.</div>';
      return;
    }
    
    datesList.innerHTML = this.newProblemDates.map((days, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      const dateStr = this.formatDate(date);
      
      return `
        <div class="timeline-item" data-index="${index}">
          <div class="timeline-dot"></div>
          <span class="timeline-rep">Rep ${index + 1}</span>
          <div class="timeline-inputs">
            <input type="number" class="timeline-input days-input" value="${days}" min="1" max="365" data-field="days">
            <span class="timeline-label">days</span>
            <input type="date" class="timeline-input date-input" value="${dateStr}" data-field="date">
          </div>
          <button class="btn-remove-timeline" data-index="${index}" title="Remove">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      `;
    }).join('');
    
    // Add event listeners for inputs
    datesList.querySelectorAll('.timeline-item').forEach(item => {
      const index = parseInt(item.dataset.index);
      const daysInput = item.querySelector('.days-input');
      const dateInput = item.querySelector('.date-input');
      
      daysInput.addEventListener('change', (e) => {
        const days = parseInt(e.target.value) || 1;
        this.newProblemDates[index] = Math.max(1, days);
        this.renderNewProblemDates();
      });
      
      dateInput.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value + 'T00:00:00');
        const diffDays = Math.round((selectedDate - today) / (1000 * 60 * 60 * 24));
        this.newProblemDates[index] = Math.max(1, diffDays);
        this.renderNewProblemDates();
      });
    });
    
    // Add event listeners for remove buttons
    datesList.querySelectorAll('.btn-remove-timeline').forEach(btn => {
      btn.addEventListener('click', () => {
        const indexToRemove = parseInt(btn.dataset.index);
        this.newProblemDates.splice(indexToRemove, 1);
        this.renderNewProblemDates();
      });
    });
  }
  
  addDateToNewProblem() {
    // Default to 7 days after the last date, or 7 days from now
    let defaultDays = 7;
    if (this.newProblemDates.length > 0) {
      defaultDays = this.newProblemDates[this.newProblemDates.length - 1] + 7;
    }
    
    this.newProblemDates.push(defaultDays);
    this.renderNewProblemDates();
  }
  
  async addNewProblem() {
    const url = document.getElementById('new-problem-url').value.trim();
    const title = document.getElementById('new-problem-title').value.trim();
    const difficulty = document.getElementById('new-problem-difficulty').value;
    
    // Validate URL
    if (!url) {
      alert('Please enter the LeetCode problem URL');
      return;
    }
    
    // Extract problem ID from URL
    const problemId = this.extractProblemId(url);
    if (!problemId) {
      alert('Invalid LeetCode URL. Please enter a valid problem URL');
      return;
    }
    
    // Validate title
    if (!title) {
      alert('Please enter the problem title');
      return;
    }
    
    // Check if problem already exists
    if (this.problems[problemId]) {
      alert(`Problem "${this.problems[problemId].title}" already exists`);
      return;
    }
    
    // Validate dates
    if (this.newProblemDates.length === 0) {
      alert('Please add at least one review date');
      return;
    }
    
    // Calculate scheduled dates from intervals
    const today = new Date();
    const scheduledDates = this.newProblemDates.map(days => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return this.formatDate(date);
    });
    
    // Create problem entry
    this.problems[problemId] = {
      title: title,
      difficulty: difficulty,
      url: url.includes('leetcode.com') ? url : `https://leetcode.com/problems/${problemId}/`,
      addedDate: this.formatDate(today),
      scheduledDates: scheduledDates,
      completedDates: []
    };
    
    await this.saveProblems();
    this.closeAddProblemModal();
    this.renderManageView();
    this.renderCalendar();
    this.updateStats();
  }
  
  extractProblemId(url) {
    const patterns = [
      /leetcode\.com\/problems\/([^\/\?]+)/,
      /^([a-z0-9-]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    return null;
  }
  
  // ========================================
  // Stats Methods
  // ========================================
  
  updateStats() {
    const today = this.formatDate(new Date());
    const todayProblems = this.getProblemsForDate(today);
    
    // Calculate upcoming (next 7 days)
    let upcomingCount = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = this.formatDate(date);
      upcomingCount += this.getProblemsForDate(dateStr).filter(p => !p.isCompleted).length;
    }
    
    document.getElementById('today-count').textContent = todayProblems.filter(p => !p.isCompleted).length;
    document.getElementById('upcoming-count').textContent = upcomingCount;
    document.getElementById('total-count').textContent = Object.keys(this.problems).length;
  }
}

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', () => {
  new LeetCachedPopup();
});
