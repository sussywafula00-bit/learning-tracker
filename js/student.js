/**
 * 学生端主逻辑（localStorage版本）
 * Learning Tracker - Student App
 */

class StudentApp {
  static currentTimerRecord = null;
  static timerInterval = null;

  static init() {
    try {
      console.log('StudentApp.init starting...');

      Auth.init();
      console.log('Auth init done, currentUser:', Auth.currentUser);
      console.log('isLoggedIn:', Auth.isLoggedIn());

      if (!Auth.isLoggedIn()) {
        console.log('Redirecting to login - not logged in');
        window.location.href = 'login.html';
        return;
      }

      if (Auth.isParent()) {
        console.log('Redirecting to parent - is parent');
        window.location.href = 'parent.html';
        return;
      }

      Tracker.init();

      const shouldPunish = TaskManager.shouldApplySundayPunishment();
      if (shouldPunish) {
        TaskManager.applyWeeklyPunishment();
      }

      this.render();
      this.bindEvents();

      // 检查并触发本周掉落
      Drop.checkAndTriggerWeeklyDrop();
      // 设置每周掉落定时器
      Drop.scheduleWeeklyDrop();
    } catch (error) {
      console.error('StudentApp.init error:', error);
    }
  }

  static render() {
    const user = Auth.getCurrentUser();
    document.getElementById('currentUsername').textContent = user?.username || '学生';

    this.renderDailyTasks();
    this.renderWeeklyTasks();
    this.renderStats();
    this.renderTemplateSelect();
  }

  static bindEvents() {
    document.getElementById('accountBtn').addEventListener('click', () => {
      document.getElementById('accountMenu').classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.account-dropdown')) {
        document.getElementById('accountMenu').classList.remove('show');
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      Auth.logout();
      window.location.href = 'login.html';
    });

    document.getElementById('addDailyTaskBtn').addEventListener('click', () => {
      this.openTaskModal('daily_required');
    });

    document.getElementById('refreshTasksBtn').addEventListener('click', () => {
      this.regenerateTasksFromYesterday();
    });

    document.getElementById('addWeeklyTaskBtn').addEventListener('click', () => {
      this.openTaskModal('weekly_required');
    });

    document.getElementById('taskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTask();
    });

    document.getElementById('cancelTaskBtn').addEventListener('click', () => {
      this.closeTaskModal();
    });

    document.getElementById('closeTaskModal').addEventListener('click', () => {
      this.closeTaskModal();
    });

    document.getElementById('pauseTimerBtn').addEventListener('click', () => {
      this.pauseTimer();
    });

    document.getElementById('stopTimerBtn').addEventListener('click', () => {
      this.stopTimer();
    });

    this.bindRatingStars();

    document.getElementById('skipSummaryBtn').addEventListener('click', () => {
      this.completeTaskWithoutSummary();
    });

    document.getElementById('saveSummaryBtn').addEventListener('click', () => {
      this.saveTaskSummary();
    });

    document.getElementById('closeSummaryModal').addEventListener('click', () => {
      this.closeSummaryModal();
    });

    document.getElementById('closeDropBtn').addEventListener('click', () => {
      Drop.hideDropModal();
    });

    document.getElementById('wishCardCard').addEventListener('click', () => {
      this.openWishModal();
    });

    document.getElementById('closeWishModal').addEventListener('click', () => {
      this.closeWishModal();
    });

    document.getElementById('addWishBtn').addEventListener('click', () => {
      this.addWish();
    });

    document.getElementById('templateSelect').addEventListener('change', (e) => {
      if (e.target.value) {
        this.fillFromTemplate(e.target.value);
      }
    });

    document.getElementById('makeupBtn').addEventListener('click', () => {
      this.openMakeupModal();
    });

    document.getElementById('closeMakeupModal').addEventListener('click', () => {
      this.closeMakeupModal();
    });

    document.getElementById('exemptItem').addEventListener('click', () => {
      this.openExemptModal();
    });

    document.getElementById('closeExemptModal').addEventListener('click', () => {
      this.closeExemptModal();
    });

    document.getElementById('submitExemptBtn').addEventListener('click', () => {
      this.submitExemptRequest();
    });

    document.getElementById('openShopBtn').addEventListener('click', () => {
      this.openShopModal();
    });

    document.getElementById('closeShopModal').addEventListener('click', () => {
      this.closeShopModal();
    });

    document.getElementById('submitRedeemBtn').addEventListener('click', () => {
      this.submitRedeemRequest();
    });
  }

  static renderDailyTasks() {
    const tasks = TaskManager.getDailyTasks();
    const stats = TaskManager.getDailyStats();

    document.getElementById('dailyRequiredCount').textContent =
      `${stats.required.completed}/${stats.required.total}`;
    this.renderTaskList('dailyRequiredList', tasks.required);

    document.getElementById('dailyOptionalCount').textContent =
      `${stats.optional.completed}/${stats.optional.total}`;
    this.renderTaskList('dailyOptionalList', tasks.optional);
  }

  static renderWeeklyTasks() {
    const tasks = TaskManager.getWeeklyTasks();
    const stats = TaskManager.getWeeklyStats();

    const weeklyRequiredCount = `${stats.weeklyRequired.completed}/${stats.weeklyRequired.total}`;
    document.getElementById('weeklyRequiredCount').textContent = weeklyRequiredCount;
    this.renderTaskList('weeklyRequiredList', tasks.required);

    const optionalCount = `${stats.optional.completed}/${stats.optional.total}`;
    document.getElementById('weeklyOptionalCount').textContent = optionalCount;
    this.renderTaskList('weeklyOptionalList', tasks.optional);

    const totalRequired = stats.requiredDays.total + stats.weeklyRequired.total;
    const completedRequired = stats.requiredDays.completed + stats.weeklyRequired.completed;
    const progressPercent = totalRequired > 0
      ? Math.round((completedRequired / totalRequired) * 100)
      : 0;
    document.getElementById('weekProgressPercent').textContent = `${progressPercent}%`;
    document.getElementById('weekProgressFill').style.width = `${progressPercent}%`;
  }

  static renderTaskList(containerId, tasks) {
    const container = document.getElementById(containerId);

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-text">暂无任务</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.map(task => {
      const isCompleted = task.status === 'completed';
      const typeClass = task.taskType.includes('required') ? 'required' : 'optional';
      const isAutoGenerated = task.autoGenerated ? '<span class="auto-tag">自动</span>' : '';

      return `
        <div class="task-item ${typeClass} ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
          <input type="checkbox" class="task-checkbox"
            ${isCompleted ? 'checked' : ''}
            onchange="StudentApp.toggleTask('${task.id}')">
          <div class="task-info">
            <div class="task-name">${task.taskName} ${isAutoGenerated}</div>
            <div class="task-meta">
              ${task.plannedDuration}分钟 |
              ${task.taskCategory === 'study' ? '学习' : '运动'}
            </div>
          </div>
          <div class="task-actions">
            ${!isCompleted ? `
              <button class="task-btn task-btn-start" onclick="StudentApp.startTask('${task.id}')">
                <i class="fas fa-play"></i>
              </button>
            ` : ''}
            <button class="task-btn task-btn-delete" onclick="StudentApp.deleteTask('${task.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  static renderStats() {
    const studyTime = TaskManager.getTodayStudyTime();
    document.getElementById('todayStudyTime').textContent = `${studyTime}h`;

    const sportsTime = TaskManager.getTodaySportsTime();
    document.getElementById('sportsTime').textContent = `${sportsTime}h`;

    const balance = Points.getBalance();
    document.getElementById('pointsBalance').textContent = balance;
    document.getElementById('displayPoints').textContent = balance;

    const stats = WishManager.getStats();
    document.getElementById('wishPendingCount').textContent = stats.approved;

    const makeupInfo = TaskManager.getMakeupCount();
    document.getElementById('makeupCountDisplay').textContent =
      `${makeupInfo.used}/${makeupInfo.total}`;

    const exemptCount = TaskManager.getRemainingExemptCount();
    document.getElementById('exemptCountDisplay').textContent = exemptCount;
  }

  static renderTemplateSelect() {
    const templates = TaskManager.getTemplates();
    const select = document.getElementById('templateSelect');

    select.innerHTML = '<option value="">-- 不使用模板 --</option>' +
      templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }

  static openTaskModal(type) {
    document.getElementById('taskId').value = '';
    document.getElementById('taskName').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDuration').value = '';
    document.getElementById('taskCategory').value = 'study';
    document.getElementById('taskType').value = type;
    document.getElementById('templateSelect').value = '';

    const isDaily = type.includes('daily');
    document.getElementById('taskModalTitle').textContent = isDaily ? '添加日任务' : '添加周任务';

    const requiredSelect = document.getElementById('taskRequired');
    requiredSelect.value = type.includes('required') ? 'required' : 'optional';

    document.getElementById('taskModal').classList.remove('hidden');
  }

  static closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
  }

  static saveTask() {
    const taskName = document.getElementById('taskName').value.trim();
    const taskDescription = document.getElementById('taskDescription').value.trim();
    const taskDuration = parseInt(document.getElementById('taskDuration').value) || 30;
    const taskCategory = document.getElementById('taskCategory').value;
    const taskRequired = document.getElementById('taskRequired').value;
    const taskTypeValue = document.getElementById('taskType').value;

    if (!taskName) {
      Utils.showToast('请输入任务名称', 'error');
      return;
    }

    const taskType = taskTypeValue.includes('daily')
      ? (taskRequired === 'required' ? 'daily_required' : 'daily_optional')
      : (taskRequired === 'required' ? 'weekly_required' : 'weekly_optional');

    const task = TaskManager.createTask({
      name: taskName,
      description: taskDescription,
      category: taskCategory,
      type: taskType,
      plannedDuration: taskDuration
    });

    TaskManager.createFromTemplate(task.id, {
      start: Utils.getToday(),
      end: Utils.getToday()
    });

    Utils.showToast('任务已添加', 'success');
    this.closeTaskModal();
    this.render();
  }

  static fillFromTemplate(templateId) {
    const templates = TaskManager.getTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    document.getElementById('taskName').value = template.name;
    document.getElementById('taskDescription').value = template.description || '';
    document.getElementById('taskDuration').value = template.plannedDuration || 30;
    document.getElementById('taskCategory').value = template.category || 'study';
  }

  static toggleTask(recordId) {
    const record = TaskManager.getRecord(recordId);
    if (!record) return;

    if (record.status === 'completed') {
      record.status = 'pending';
      record.completedAt = null;
      const records = Storage.getRecords();
      const index = records.findIndex(r => r.id === recordId);
      if (index >= 0) {
        records[index] = record;
        Storage.saveRecords(records);
      }
      this.render();
    } else {
      this.startTask(recordId);
    }
  }

  static startTask(recordId) {
    const record = TaskManager.startTask(recordId);
    if (!record) return;

    this.currentTimerRecord = record;

    document.getElementById('timerTaskName').textContent = record.taskName;
    document.getElementById('timerTarget').textContent = `目标: ${record.plannedDuration}分钟`;
    document.getElementById('timerDisplay').textContent = '00:00:00';
    document.getElementById('timerModal').classList.remove('hidden');

    this.startTimer();
  }

  static startTimer() {
    const startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      document.getElementById('timerDisplay').textContent =
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  static pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  static stopTimer() {
    this.pauseTimer();

    if (!this.currentTimerRecord) return;

    const timerDisplay = document.getElementById('timerDisplay').textContent;
    const parts = timerDisplay.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    document.getElementById('timerModal').classList.add('hidden');

    TaskManager.completeTask(this.currentTimerRecord.id, {
      actualDuration: totalSeconds
    });

    this.currentTimerRecord = null;
    this.openSummaryModal();
  }

  static openSummaryModal() {
    this.bindRatingStars();
    document.getElementById('summaryContent').value = '';
    document.getElementById('summaryModal').classList.remove('hidden');
  }

  static closeSummaryModal() {
    document.getElementById('summaryModal').classList.add('hidden');
    this.render();
  }

  static bindRatingStars() {
    document.querySelectorAll('.star-rating').forEach(container => {
      container.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', () => {
          const value = parseInt(star.dataset.value);
          container.querySelectorAll('.star').forEach((s, i) => {
            s.classList.toggle('active', i < value);
          });
          container.dataset.value = value;
        });
      });
    });
  }

  static getRatings() {
    const ratings = {};
    document.querySelectorAll('.star-rating').forEach(container => {
      const type = container.dataset.type;
      ratings[type] = parseInt(container.dataset.value) || 0;
    });
    return ratings;
  }

  static saveTaskSummary() {
    const ratings = this.getRatings();
    const summary = document.getElementById('summaryContent').value.trim();

    if (this.currentTimerRecord) {
      const records = Storage.getRecords();
      const index = records.findIndex(r => r.id === this.currentTimerRecord.id);
      if (index >= 0) {
        records[index].ratings = ratings;
        records[index].summary = summary;
        Storage.saveRecords(records);
      }
    }

    this.closeSummaryModal();
  }

  static completeTaskWithoutSummary() {
    this.closeSummaryModal();
  }

  static deleteTask(recordId) {
    TaskManager.deleteRecord(recordId);
    Utils.showToast('任务已删除', 'success');
    this.render();
  }

  static regenerateTasksFromYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = Utils.formatDate(yesterday);

    const records = Storage.getRecords();
    const yesterdayRequired = records.filter(r =>
      r.date === yesterdayStr &&
      r.taskType === 'daily_required'
    );

    if (yesterdayRequired.length === 0) {
      Utils.showToast('昨日没有必须项任务', 'error');
      return;
    }

    for (const record of yesterdayRequired) {
      const task = {
        id: Utils.generateId(),
        studentId: record.studentId,
        templateId: record.templateId,
        taskName: record.taskName,
        taskDescription: record.taskDescription,
        taskCategory: record.taskCategory,
        taskType: 'daily_required',
        plannedDuration: record.plannedDuration,
        pointsReward: record.pointsReward,
        pointsPenalty: record.pointsPenalty,
        date: Utils.getToday(),
        status: 'pending',
        actualDuration: null,
        startTime: null,
        endTime: null,
        ratings: null,
        summary: null,
        completedAt: null,
        autoGenerated: true
      };

      Storage.saveRecord(task);
    }

    Utils.showToast('已按昨日任务生成', 'success');
    this.render();
  }

  static openWishModal() {
    this.renderWishList();
    document.getElementById('wishModal').classList.remove('hidden');
  }

  static closeWishModal() {
    document.getElementById('wishModal').classList.add('hidden');
  }

  static renderWishList() {
    const container = document.getElementById('wishList');
    const wishes = WishManager.getWishes();

    if (wishes.length === 0) {
      container.innerHTML = '<p class="text-light">暂无愿望</p>';
      return;
    }

    container.innerHTML = wishes.map(wish => `
      <div class="wish-item ${wish.status}">
        <span class="wish-content">${wish.description}</span>
        <span class="wish-status">${this.getWishStatusText(wish.status)}</span>
      </div>
    `).join('');
  }

  static getWishStatusText(status) {
    const map = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      redeemed: '已兑现',
      dropped: '已掉落'
    };
    return map[status] || status;
  }

  static addWish() {
    const input = document.getElementById('wishInput');
    const content = input.value.trim();

    if (!content) {
      Utils.showToast('请输入愿望', 'error');
      return;
    }

    WishManager.addWish(content);
    input.value = '';
    Utils.showToast('愿望已添加', 'success');
    this.renderWishList();
  }

  static openMakeupModal() {
    const makeupInfo = TaskManager.getMakeupCount();
    document.getElementById('makeupRemaining').textContent = makeupInfo.remaining;

    const container = document.getElementById('makeupList');
    const tasks = TaskManager.getIncompleteRequiredTasks();

    if (tasks.length === 0) {
      container.innerHTML = '<p class="text-light">没有可补打卡的任务</p>';
    } else {
      container.innerHTML = tasks.map(task => `
        <div class="makeup-item">
          <span>${task.taskName} (${task.date})</span>
          <button class="btn btn-sm btn-primary" onclick="StudentApp.makeupTask('${task.id}')">
            补打卡
          </button>
        </div>
      `).join('');
    }

    document.getElementById('makeupModal').classList.remove('hidden');
  }

  static closeMakeupModal() {
    document.getElementById('makeupModal').classList.add('hidden');
  }

  static makeupTask(recordId) {
    const result = TaskManager.makeupTask(recordId);

    if (result.success) {
      Utils.showToast('补打卡成功', 'success');
      this.openMakeupModal();
      this.render();
    } else {
      Utils.showToast(result.error, 'error');
    }
  }

  static openExemptModal() {
    const exemptCount = TaskManager.getRemainingExemptCount();
    document.getElementById('exemptRemaining').textContent = exemptCount;

    document.getElementById('exemptDate').value = Utils.getToday();
    document.getElementById('exemptReason').value = '';

    const container = document.getElementById('exemptRequestList');
    const requests = TaskManager.getExemptionRequests();

    if (requests.length === 0) {
      container.innerHTML = '<p class="text-light">暂无申请记录</p>';
    } else {
      container.innerHTML = requests.slice(0, 5).map(req => `
        <div class="exempt-request-item">
          <span>${req.date}</span>
          <span>${req.status === 'pending' ? '待审批' : req.status === 'approved' ? '已批准' : '已拒绝'}</span>
        </div>
      `).join('');
    }

    document.getElementById('exemptModal').classList.remove('hidden');
  }

  static closeExemptModal() {
    document.getElementById('exemptModal').classList.add('hidden');
  }

  static submitExemptRequest() {
    const date = document.getElementById('exemptDate').value;
    const reason = document.getElementById('exemptReason').value.trim();

    if (!date) {
      Utils.showToast('请选择日期', 'error');
      return;
    }

    TaskManager.requestExemption(date, reason);
    Utils.showToast('申请已提交', 'success');
    this.openExemptModal();
    this.render();
  }

  static openShopModal() {
    const balance = Points.getBalance();
    document.getElementById('shopPointsBalance').textContent = balance;

    const approvedWishes = WishManager.getApprovedWishes();
    const container = document.getElementById('shopItems');

    if (approvedWishes.length === 0) {
      container.innerHTML = '<p class="text-light">暂无可兑换的愿望</p>';
    } else {
      container.innerHTML = approvedWishes.map(wish => `
        <div class="shop-item">
          <span>${wish.description}</span>
        </div>
      `).join('');
    }

    document.getElementById('redeemName').value = '';
    document.getElementById('redeemPoints').value = '';

    document.getElementById('shopModal').classList.remove('hidden');
  }

  static closeShopModal() {
    document.getElementById('shopModal').classList.add('hidden');
  }

  static submitRedeemRequest() {
    const name = document.getElementById('redeemName').value.trim();
    const points = parseInt(document.getElementById('redeemPoints').value);

    if (!name || !points) {
      Utils.showToast('请填写完整信息', 'error');
      return;
    }

    const balance = Points.getBalance();
    if (points > balance) {
      Utils.showToast('积分不足', 'error');
      return;
    }

    const user = Auth.getCurrentUser();
    const reward = {
      id: Utils.generateId(),
      studentId: user.id,
      studentUsername: user.username,
      name: name,
      points: points,
      status: 'pending',
      createdAt: Date.now()
    };
    Storage.saveReward(reward);

    Utils.showToast('兑换申请已提交', 'success');
    document.getElementById('redeemName').value = '';
    document.getElementById('redeemPoints').value = '';
    this.closeShopModal();
  }

  static showFloatingPoints(points) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = `+${points} 积分`;
      toast.className = 'toast show success';
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    }
    // 更新余额显示
    const balance = Points.getBalance();
    document.getElementById('pointsBalance').textContent = balance;
    document.getElementById('displayPoints').textContent = balance;
  }

  static refreshPointsBalance() {
    const balance = Points.getBalance();
    document.getElementById('pointsBalance').textContent = balance;
    document.getElementById('displayPoints').textContent = balance;
    Utils.showToast(`积分余额：${balance}`, 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  StudentApp.init();
});

window.StudentApp = StudentApp;