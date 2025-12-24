class SpacedRepCalendar {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.problems = {};
    this.editingProblemId = null;
    this.editingDates = [];
    
    this.init();
  }
  
  async init() {
    await this.loadProblems();
    this.renderCalendar();
    this.updateStats();
    this.setupEventListeners();
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
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
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
    
    // Day details close
    document.getElementById('close-details').addEventListener('click', () => {
      document.getElementById('day-details').classList.add('hidden');
      this.selectedDate = null;
    });
    
    // Edit Modal close
    document.querySelector('.modal-close').addEventListener('click', () => {
      this.closeEditModal();
    });
    
    document.getElementById('edit-modal').addEventListener('click', (e) => {
      if (e.target.id === 'edit-modal') this.closeEditModal();
    });
    
    // Add date button
    document.getElementById('add-date-btn').addEventListener('click', () => {
      this.addDateToEdit();
    });
    
    // Save changes button
    document.getElementById('save-changes-btn').addEventListener('click', () => {
      this.saveEditChanges();
    });
    
    // Delete problem button
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
    
    // Toggle custom intervals input
    document.getElementById('new-problem-interval').addEventListener('change', (e) => {
      const customGroup = document.getElementById('new-problem-custom-group');
      customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
  }
  
  switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
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
      
      const dayEl = this.createDayElement(day, dateStr, true, false, problemsForDay.length);
      calendarDays.appendChild(dayEl);
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      const isToday = date.getTime() === today.getTime();
      const problemsForDay = this.getProblemsForDate(dateStr);
      
      const dayEl = this.createDayElement(day, dateStr, false, isToday, problemsForDay.length);
      calendarDays.appendChild(dayEl);
    }
    
    // Next month leading days
    const remainingDays = 42 - (startingDay + totalDays);
    for (let day = 1; day <= remainingDays; day++) {
      const dateStr = this.formatDate(new Date(year, month + 1, day));
      const problemsForDay = this.getProblemsForDate(dateStr);
      
      const dayEl = this.createDayElement(day, dateStr, true, false, problemsForDay.length);
      calendarDays.appendChild(dayEl);
    }
  }
  
  createDayElement(day, dateStr, isOtherMonth, isToday, problemCount) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.dataset.date = dateStr;
    
    if (isOtherMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    if (problemCount > 0) dayEl.classList.add('has-problems');
    
    dayEl.innerHTML = `
      <span>${day}</span>
      ${problemCount > 0 ? `<span class="problem-count">${problemCount}</span>` : ''}
    `;
    
    dayEl.addEventListener('click', () => this.showDayDetails(dateStr));
    
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
  
  showDayDetails(dateStr) {
    this.selectedDate = dateStr;
    const problems = this.getProblemsForDate(dateStr);
    
    const detailsEl = document.getElementById('day-details');
    const dateDisplay = document.getElementById('selected-date');
    const problemsList = document.getElementById('problems-list');
    
    const date = new Date(dateStr + 'T00:00:00');
    dateDisplay.textContent = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (problems.length === 0) {
      problemsList.innerHTML = '<div class="no-problems">No problems scheduled for this day</div>';
    } else {
      problemsList.innerHTML = problems.map(problem => `
        <div class="problem-item ${problem.isCompleted ? 'completed' : ''}" data-problem-id="${problem.id}">
          <div class="problem-checkbox">
            <input type="checkbox" 
                   class="completion-checkbox" 
                   data-problem-id="${problem.id}" 
                   data-date="${dateStr}"
                   ${problem.isCompleted ? 'checked' : ''}>
          </div>
          <div class="problem-info">
            <a href="${problem.url}" target="_blank" class="problem-title ${problem.isCompleted ? 'completed-title' : ''}">${problem.title}</a>
            <div class="problem-meta">
              <span class="difficulty-${problem.difficulty?.toLowerCase() || 'medium'}">${problem.difficulty || 'Medium'}</span>
            </div>
          </div>
          <span class="repetition-badge">Rep ${problem.repetitionNumber}/${problem.totalRepetitions}</span>
          <button class="btn-icon btn-delete" data-problem-id="${problem.id}" title="Delete from this date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      `).join('');
      
      // Add event listeners for checkboxes
      problemsList.querySelectorAll('.completion-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => this.toggleCompletion(e));
      });
      
      // Add event listeners for delete buttons
      problemsList.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const problemId = btn.dataset.problemId;
          this.removeDateFromProblem(problemId, dateStr);
        });
      });
    }
    
    detailsEl.classList.remove('hidden');
  }
  
  async toggleCompletion(e) {
    const checkbox = e.target;
    const problemId = checkbox.dataset.problemId;
    const dateStr = checkbox.dataset.date;
    
    const problem = this.problems[problemId];
    if (!problem) return;
    
    if (!problem.completedDates) {
      problem.completedDates = [];
    }
    
    if (checkbox.checked) {
      if (!problem.completedDates.includes(dateStr)) {
        problem.completedDates.push(dateStr);
      }
    } else {
      problem.completedDates = problem.completedDates.filter(d => d !== dateStr);
    }
    
    await this.saveProblems();
    
    // Update UI
    const problemItem = checkbox.closest('.problem-item');
    const problemTitle = problemItem.querySelector('.problem-title');
    problemItem.classList.toggle('completed', checkbox.checked);
    problemTitle.classList.toggle('completed-title', checkbox.checked);
  }
  
  async removeDateFromProblem(problemId, dateStr) {
    const problem = this.problems[problemId];
    if (!problem) return;
    
    problem.scheduledDates = problem.scheduledDates.filter(d => d !== dateStr);
    
    // If no more scheduled dates, ask if they want to delete the problem entirely
    if (problem.scheduledDates.length === 0) {
      if (confirm(`"${problem.title}" has no more scheduled dates. Delete it entirely?`)) {
        delete this.problems[problemId];
      }
    }
    
    await this.saveProblems();
    this.renderCalendar();
    this.updateStats();
    this.showDayDetails(dateStr);
  }
  
  renderManageView() {
    const problemsList = document.getElementById('manage-problems-list');
    const countBadge = document.getElementById('manage-count');
    
    const problemsArray = Object.entries(this.problems);
    countBadge.textContent = problemsArray.length;
    
    if (problemsArray.length === 0) {
      problemsList.innerHTML = '<div class="no-problems">No problems in your schedule yet.<br>Solve problems on LeetCode and add them!</div>';
      return;
    }
    
    problemsList.innerHTML = problemsArray.map(([id, problem]) => {
      const nextDate = this.getNextScheduledDate(problem);
      const completedCount = problem.completedDates?.length || 0;
      const totalCount = problem.scheduledDates?.length || 0;
      
      return `
        <div class="manage-problem-item" data-problem-id="${id}">
          <div class="manage-problem-info">
            <a href="${problem.url}" target="_blank" class="problem-title">${problem.title}</a>
            <div class="problem-meta">
              <span class="difficulty-${problem.difficulty?.toLowerCase() || 'medium'}">${problem.difficulty || 'Medium'}</span>
              <span class="meta-separator">•</span>
              <span class="progress-text">${completedCount}/${totalCount} completed</span>
              ${nextDate ? `<span class="meta-separator">•</span><span class="next-date">Next: ${this.formatDisplayDate(nextDate)}</span>` : ''}
            </div>
          </div>
          <div class="manage-actions">
            <button class="btn-icon btn-edit" data-problem-id="${id}" title="Edit schedule">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon btn-delete-full" data-problem-id="${id}" title="Delete problem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    // Add event listeners
    problemsList.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => this.openEditModal(btn.dataset.problemId));
    });
    
    problemsList.querySelectorAll('.btn-delete-full').forEach(btn => {
      btn.addEventListener('click', () => this.deleteProblem(btn.dataset.problemId));
    });
  }
  
  getNextScheduledDate(problem) {
    if (!problem.scheduledDates || problem.scheduledDates.length === 0) return null;
    
    const today = this.formatDate(new Date());
    const futureDates = problem.scheduledDates
      .filter(d => d >= today && !problem.completedDates?.includes(d))
      .sort();
    
    return futureDates[0] || null;
  }
  
  formatDisplayDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  openEditModal(problemId) {
    const problem = this.problems[problemId];
    if (!problem) return;
    
    this.editingProblemId = problemId;
    this.editingDates = [...(problem.scheduledDates || [])];
    
    document.getElementById('edit-problem-title').textContent = problem.title;
    this.renderEditDates();
    
    document.getElementById('edit-modal').classList.remove('hidden');
  }
  
  closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    this.editingProblemId = null;
    this.editingDates = [];
  }
  
  renderEditDates() {
    const datesList = document.getElementById('edit-dates-list');
    const problem = this.problems[this.editingProblemId];
    
    if (this.editingDates.length === 0) {
      datesList.innerHTML = '<div class="no-dates">No dates scheduled</div>';
      return;
    }
    
    datesList.innerHTML = this.editingDates.sort().map((dateStr, index) => {
      const isCompleted = problem.completedDates?.includes(dateStr);
      return `
        <div class="edit-date-item ${isCompleted ? 'completed' : ''}">
          <span class="edit-date-text">
            ${isCompleted ? '✓ ' : ''}Rep ${index + 1}: ${this.formatDisplayDate(dateStr)}
          </span>
          <button class="btn-icon btn-remove-date" data-date="${dateStr}" title="Remove date">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');
    
    // Add event listeners for remove buttons
    datesList.querySelectorAll('.btn-remove-date').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateToRemove = btn.dataset.date;
        this.editingDates = this.editingDates.filter(d => d !== dateToRemove);
        this.renderEditDates();
      });
    });
  }
  
  addDateToEdit() {
    const input = document.getElementById('add-date-input');
    const dateStr = input.value;
    
    if (!dateStr) {
      alert('Please select a date');
      return;
    }
    
    if (this.editingDates.includes(dateStr)) {
      alert('This date is already scheduled');
      return;
    }
    
    this.editingDates.push(dateStr);
    this.editingDates.sort();
    this.renderEditDates();
    input.value = '';
  }
  
  async saveEditChanges() {
    if (!this.editingProblemId) return;
    
    const problem = this.problems[this.editingProblemId];
    if (!problem) return;
    
    problem.scheduledDates = [...this.editingDates];
    
    // If no dates left, ask to delete
    if (problem.scheduledDates.length === 0) {
      if (confirm(`"${problem.title}" has no scheduled dates. Delete it?`)) {
        delete this.problems[this.editingProblemId];
      }
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
    
    // Delete the problem directly (confirm dialog can cause issues in extension popups)
    delete this.problems[problemId];
    await this.saveProblems();
    this.renderManageView();
    this.renderCalendar();
    this.updateStats();
  }
  
  async deleteEditingProblem() {
    if (!this.editingProblemId) return;
    
    const problem = this.problems[this.editingProblemId];
    if (!problem) return;
    
    
    // Delete the problem directly
    delete this.problems[this.editingProblemId];
    await this.saveProblems();
    this.closeEditModal();
    this.renderManageView();
    this.renderCalendar();
    this.updateStats();
  }
  
  openAddProblemModal() {
    // Reset form
    document.getElementById('new-problem-url').value = '';
    document.getElementById('new-problem-title').value = '';
    document.getElementById('new-problem-difficulty').value = 'Medium';
    document.getElementById('new-problem-interval').value = 'default';
    document.getElementById('new-problem-custom-intervals').value = '';
    document.getElementById('new-problem-custom-group').style.display = 'none';
    
    document.getElementById('add-problem-modal').classList.add('active');
  }
  
  closeAddProblemModal() {
    document.getElementById('add-problem-modal').classList.remove('active');
  }
  
  async addNewProblem() {
    const url = document.getElementById('new-problem-url').value.trim();
    const title = document.getElementById('new-problem-title').value.trim();
    const difficulty = document.getElementById('new-problem-difficulty').value;
    const intervalPreset = document.getElementById('new-problem-interval').value;
    const customIntervals = document.getElementById('new-problem-custom-intervals').value.trim();
    
    // Validate URL
    if (!url) {
      alert('Please enter the LeetCode problem URL');
      return;
    }
    
    // Extract problem ID from URL
    const problemId = this.extractProblemId(url);
    if (!problemId) {
      alert('Invalid LeetCode URL. Please enter a valid problem URL (e.g., https://leetcode.com/problems/two-sum/)');
      return;
    }
    
    // Validate title
    if (!title) {
      alert('Please enter the problem title');
      return;
    }
    
    // Check if problem already exists
    if (this.problems[problemId]) {
      alert(`Problem "${this.problems[problemId].title}" already exists in your schedule`);
      return;
    }
    
    // Calculate intervals
    let intervals;
    if (intervalPreset === 'custom' && customIntervals) {
      intervals = customIntervals.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d >= 0);
      if (intervals.length === 0) {
        alert('Invalid custom intervals. Please enter comma-separated numbers (e.g., 1, 3, 7, 14)');
        return;
      }
    } else {
      const intervalPresets = {
        'default': [1, 3, 7, 14, 30],
        'aggressive': [1, 2, 4, 7, 14],
        'relaxed': [1, 7, 14, 30, 60]
      };
      intervals = intervalPresets[intervalPreset] || intervalPresets['default'];
    }
    
    // Calculate scheduled dates
    const today = new Date();
    const scheduledDates = intervals.map(days => {
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
    // Handle various LeetCode URL formats
    const patterns = [
      /leetcode\.com\/problems\/([^\/\?]+)/,
      /^([a-z0-9-]+)$/  // Just the slug
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    return null;
  }
  
  updateStats() {
    const today = this.formatDate(new Date());
    const todayProblems = this.getProblemsForDate(today);

    document.getElementById('today-count').textContent = todayProblems.length;
    document.getElementById('total-count').textContent = Object.keys(this.problems).length;
  }
}// Initialize when popup opens
document.addEventListener('DOMContentLoaded', () => {
  new SpacedRepCalendar();
});
