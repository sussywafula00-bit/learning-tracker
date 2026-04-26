/**
 * 家长端主逻辑（localStorage版本）
 * Learning Tracker - Parent App
 */

class ParentApp {
  static currentStudentId = null;
  static currentWishId = null;

  static init() {
    Auth.init();

    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }

    if (!Auth.isParent()) {
      window.location.href = 'student.html';
      return;
    }

    this.render();
    this.bindEvents();
  }

  static render() {
    const user = Auth.getCurrentUser();
    document.getElementById('currentUsername').textContent = user?.username || '家长';

    const inviteCode = Auth.getInviteCodeSync(user.id);
    document.getElementById('inviteCode').textContent = inviteCode || '------';

    const students = this.getParentStudents(user.id);

    if (students.length > 0) {
      if (!this.currentStudentId) {
        this.currentStudentId = students[0].id;
      }
      this.renderStudentTabs(students);
      this.renderStudentData();
    } else {
      this.currentStudentId = null;
      this.renderNoStudent();
    }

    this.renderSettings();
  }

  static getParentStudents(parentId) {
    return Storage.getUsers().filter(u => u.parentId === parentId);
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

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    document.getElementById('exportTrackingBtn').addEventListener('click', () => {
      this.exportTracking();
    });

    document.getElementById('filterTrackingBtn').addEventListener('click', () => {
      this.renderTrackingList();
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('closeWishModal').addEventListener('click', () => {
      this.closeWishModal();
    });

    document.getElementById('approveWishBtn').addEventListener('click', () => {
      this.approveWish();
    });

    document.getElementById('rejectWishBtn').addEventListener('click', () => {
      this.rejectWish();
    });

    document.getElementById('clearDataBtn').addEventListener('click', () => {
      this.clearData();
    });

    document.getElementById('closeExemptModal').addEventListener('click', () => {
      this.closeExemptModal();
    });

    document.getElementById('approveExemptBtn').addEventListener('click', () => {
      this.approveExempt();
    });

    document.getElementById('rejectExemptBtn').addEventListener('click', () => {
      this.rejectExempt();
    });

    document.getElementById('closeRedeemModal').addEventListener('click', () => {
      this.closeRedeemModal();
    });

    document.getElementById('approveRedeemBtn').addEventListener('click', () => {
      this.approveRedeem();
    });

    document.getElementById('rejectRedeemBtn').addEventListener('click', () => {
      this.rejectRedeem();
    });

    document.getElementById('addDropWishBtn').addEventListener('click', () => {
      this.openAddDropWishModal();
    });

    document.getElementById('closeAddDropWishModal').addEventListener('click', () => {
      this.closeAddDropWishModal();
    });

    document.getElementById('confirmAddDropWishBtn').addEventListener('click', () => {
      this.confirmAddDropWish();
    });
  }

  static switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabId + 'Tab');
    });

    if (tabId === 'overview') {
      this.renderStudentData();
    } else if (tabId === 'tracking') {
      this.initTrackingDates();
      this.renderTrackingList();
    } else if (tabId === 'wishes') {
      this.renderWishApprovalList();
    } else if (tabId === 'redeem') {
      this.renderRedeemApprovalList();
    } else if (tabId === 'drops') {
      this.renderDropWishList();
    } else if (tabId === 'exempt') {
      this.renderExemptApprovalList();
    }
  }

  static initTrackingDates() {
    const startDateInput = document.getElementById('trackingStartDate');
    const endDateInput = document.getElementById('trackingEndDate');

    if (!startDateInput.value) {
      const weekStart = Utils.getWeekStart();
      const today = new Date();
      startDateInput.value = Utils.formatDate(weekStart);
      endDateInput.value = Utils.formatDate(today);
    }
  }

  static renderStudentTabs(students) {
    const container = document.getElementById('studentTabs');

    container.innerHTML = students.map(student => `
      <button class="student-tab ${student.id === this.currentStudentId ? 'active' : ''}"
        data-student-id="${student.id}">
        ${student.username}
      </button>
    `).join('');

    container.querySelectorAll('.student-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentStudentId = tab.dataset.studentId;
        this.render();
      });
    });
  }

  static renderNoStudent() {
    const container = document.getElementById('studentTabs');
    container.innerHTML = '<span class="text-light">暂无关联学生</span>';

    document.getElementById('todayStudyTime').textContent = '-';
    document.getElementById('todaySportsTime').textContent = '-';
    document.getElementById('pointsBalance').textContent = '-';
    document.getElementById('pendingWishes').textContent = '-';
  }

  static renderStudentData() {
    if (!this.currentStudentId) return;

    const allRecords = Storage.getRecords();
    const studyRecords = allRecords.filter(r => r.studentId === this.currentStudentId);
    const today = Utils.getToday();
    const todayRecords = studyRecords.filter(r => r.date === today && r.status === 'completed');

    let totalStudyTime = 0;
    let totalSportsTime = 0;

    todayRecords.forEach(r => {
      if (r.taskCategory === 'study') {
        totalStudyTime += r.actualDuration || 0;
      } else if (r.taskCategory === 'sports') {
        totalSportsTime += r.actualDuration || 0;
      }
    });

    document.getElementById('todayStudyTime').textContent =
      (totalStudyTime / 3600).toFixed(1) + 'h';
    document.getElementById('todaySportsTime').textContent =
      (totalSportsTime / 3600).toFixed(1) + 'h';

    const balance = Points.getBalance(this.currentStudentId);
    document.getElementById('pointsBalance').textContent = balance;

    const pendingWishes = WishManager.getParentPendingWishes(Auth.getCurrentUser().id);
    const studentPending = pendingWishes.filter(w => w.studentId === this.currentStudentId);
    document.getElementById('pendingWishes').textContent = studentPending.length;

    this.renderOverview();
    this.renderDailyCompletion();
  }

  static renderOverview() {
    const container = document.getElementById('trackingSummary');
    const todayRecords = this.getTodayRecords();

    if (!todayRecords || todayRecords.totalCount === 0) {
      container.innerHTML = '<p class="text-light">今日暂无切出记录</p>';
      return;
    }

    container.innerHTML = `
      <div class="tracking-stat">
        <p class="tracking-stat-value">${todayRecords.totalCount}</p>
        <p class="tracking-stat-label">切出次数</p>
      </div>
      <div class="tracking-stat">
        <p class="tracking-stat-value">${Utils.formatDuration(todayRecords.totalDuration)}</p>
        <p class="tracking-stat-label">总时长</p>
      </div>
      <div class="tracking-stat">
        <p class="tracking-stat-value">${todayRecords.sessions.length}</p>
        <p class="tracking-stat-label">明细条数</p>
      </div>
    `;
  }

  static getTodayRecords() {
    if (!this.currentStudentId) return null;

    const allTracking = Storage.getTracking();
    const trackingData = allTracking[this.currentStudentId]?.[Utils.getToday()];
    const today = Utils.getToday();

    if (!trackingData) {
      return {
        date: today,
        sessions: [],
        totalCount: 0,
        totalDuration: 0
      };
    }

    return trackingData;
  }

  static renderDailyCompletion() {
    const container = document.getElementById('dailyCompletion');
    const tasks = TaskManager.getDailyTasks();

    if (tasks.required.length === 0 && tasks.optional.length === 0) {
      container.innerHTML = '<p class="text-light">今日暂无任务</p>';
      return;
    }

    container.innerHTML = `
      <div class="completion-section">
        <h4>必须项</h4>
        <div class="completion-list">
          ${tasks.required.map(t => `
            <div class="completion-item">
              <span class="completion-status ${t.status === 'completed' ? 'done' : 'pending'}">
                ${t.status === 'completed' ? '<i class="fas fa-check"></i>' : ''}
              </span>
              <span>${t.taskName}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="completion-section">
        <h4>选做项</h4>
        <div class="completion-list">
          ${tasks.optional.map(t => `
            <div class="completion-item">
              <span class="completion-status ${t.status === 'completed' ? 'done' : 'pending'}">
                ${t.status === 'completed' ? '<i class="fas fa-check"></i>' : ''}
              </span>
              <span>${t.taskName}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  static renderTrackingList() {
    const container = document.getElementById('trackingList');
    const startDate = document.getElementById('trackingStartDate').value;
    const endDate = document.getElementById('trackingEndDate').value;

    if (!this.currentStudentId) {
      container.innerHTML = '<p class="text-light">请先关联学生</p>';
      return;
    }

    if (!startDate || !endDate) {
      container.innerHTML = '<p class="text-light">请选择日期范围</p>';
      return;
    }

    const dates = Utils.getDateRange(startDate, endDate);
    let allSessions = [];

    const allTracking = Storage.getTracking();
    const studentTracking = allTracking[this.currentStudentId] || {};

    dates.forEach(date => {
      const dayData = studentTracking[date];
      if (dayData && dayData.sessions) {
        dayData.sessions.forEach(session => {
          allSessions.push({
            date: date,
            ...session
          });
        });
      }
    });

    if (allSessions.length === 0) {
      container.innerHTML = '<p class="text-light">所选日期范围内无记录</p>';
      return;
    }

    allSessions.sort((a, b) => {
      const timeA = `${a.date} ${a.startTime}`;
      const timeB = `${b.date} ${b.startTime}`;
      return timeB.localeCompare(timeA);
    });

    container.innerHTML = allSessions.map(s => `
      <div class="tracking-item">
        <div>
          <p class="tracking-time">${s.date} ${s.startTime} - ${s.endTime}</p>
        </div>
        <div class="tracking-duration">${Utils.formatDuration(s.duration)}</div>
      </div>
    `).join('');
  }

  static exportTracking() {
    const startDate = document.getElementById('trackingStartDate').value;
    const endDate = document.getElementById('trackingEndDate').value;

    if (!startDate || !endDate) {
      Utils.showToast('请选择导出日期范围', 'error');
      return;
    }

    Tracker.downloadCSV(startDate, endDate);
    Utils.showToast('导出成功', 'success');
  }

  static renderWishApprovalList() {
    const container = document.getElementById('wishApprovalList');
    const wishes = WishManager.getParentPendingWishes(Auth.getCurrentUser().id);
    const studentWishes = wishes.filter(w => w.studentId === this.currentStudentId);

    if (studentWishes.length === 0) {
      container.innerHTML = '<p class="text-light">暂无待审批愿望</p>';
      return;
    }

    container.innerHTML = studentWishes.map(wish => `
      <div class="wish-approval-item">
        <div class="wish-approval-header">
          <span class="wish-approval-student">${wish.studentUsername}</span>
          <span class="wish-approval-date">${Utils.formatDate(new Date(wish.createdAt))}</span>
        </div>
        <p class="wish-approval-content">${wish.description}</p>
        <div class="wish-approval-actions">
          <button class="btn btn-sm btn-success" onclick="ParentApp.openWishModal('${wish.id}')">
            <i class="fas fa-check"></i> 审批
          </button>
        </div>
      </div>
    `).join('');
  }

  static openWishModal(wishId) {
    this.currentWishId = wishId;
    document.getElementById('wishModal').classList.remove('hidden');
  }

  static closeWishModal() {
    document.getElementById('wishModal').classList.add('hidden');
    this.currentWishId = null;
  }

  static approveWish() {
    if (!this.currentWishId) return;

    WishManager.approveWish(this.currentWishId, Auth.getCurrentUser().id);
    this.closeWishModal();
    this.renderWishApprovalList();
    Utils.showToast('愿望已批准', 'success');
  }

  static rejectWish() {
    if (!this.currentWishId) return;

    WishManager.rejectWish(this.currentWishId);
    this.closeWishModal();
    this.renderWishApprovalList();
    Utils.showToast('愿望已拒绝', 'success');
  }

  static renderDropWishList() {
    const container = document.getElementById('dropWishList');
    const wishes = Storage.getWishes();
    const dropWishes = wishes.filter(w => w.canDrop === true);

    if (dropWishes.length === 0) {
      container.innerHTML = '<p class="text-light">暂无可掉落愿望</p>';
      return;
    }

    container.innerHTML = dropWishes.map(wish => `
      <div class="drop-wish-item">
        <div class="drop-wish-info">
          <p class="drop-wish-student">学生：${wish.studentUsername || '未知'}</p>
          <p class="drop-wish-content">${wish.description}</p>
        </div>
        <div class="drop-wish-actions">
          <button class="drop-wish-remove" onclick="ParentApp.removeDropWish('${wish.id}')">
            <i class="fas fa-trash"></i> 移除
          </button>
        </div>
      </div>
    `).join('');
  }

  static openAddDropWishModal() {
    const modal = document.getElementById('addDropWishModal');
    const studentSelect = document.getElementById('dropWishStudentSelect');
    const wishSelect = document.getElementById('dropWishSelect');

    const students = this.getParentStudents(Auth.getCurrentUser().id);

    studentSelect.innerHTML = '<option value="">请选择学生</option>' +
      students.map(s => `<option value="${s.id}">${s.username}</option>`).join('');

    wishSelect.innerHTML = '<option value="">请先选择学生</option>';

    studentSelect.onchange = () => {
      const studentId = studentSelect.value;
      if (!studentId) {
        wishSelect.innerHTML = '<option value="">请先选择学生</option>';
        return;
      }

      const approvedWishes = WishManager.getApprovedWishes(studentId);
      const available = approvedWishes.filter(w => !w.canDrop);

      if (available.length === 0) {
        wishSelect.innerHTML = '<option value="">该学生暂无可添加的愿望</option>';
      } else {
        wishSelect.innerHTML = '<option value="">请选择愿望</option>' +
          available.map(w => `<option value="${w.id}">${w.description}</option>`).join('');
      }
    };

    modal.classList.remove('hidden');
  }

  static closeAddDropWishModal() {
    document.getElementById('addDropWishModal').classList.add('hidden');
  }

  static confirmAddDropWish() {
    const wishId = document.getElementById('dropWishSelect').value;
    if (!wishId) {
      Utils.showToast('请选择愿望', 'error');
      return;
    }

    const wishes = Storage.getWishes();
    const wish = wishes.find(w => w.id === wishId);
    if (!wish) return;

    wish.canDrop = true;
    Storage.updateWish(wishId, wish);

    this.closeAddDropWishModal();
    this.renderDropWishList();
    Utils.showToast('已添加为可掉落愿望', 'success');
  }

  static removeDropWish(wishId) {
    const wishes = Storage.getWishes();
    const wish = wishes.find(w => w.id === wishId);
    if (!wish) return;

    wish.canDrop = false;
    Storage.updateWish(wishId, wish);

    this.renderDropWishList();
    Utils.showToast('已移除可掉落愿望', 'success');
  }

  static renderSettings() {
    const settings = Storage.getSettings();
    document.getElementById('makeupCount').value = settings.makeupCount || 3;
    document.getElementById('exemptCount').value = settings.exemptCount || 3;
  }

  static saveSettings() {
    const makeupCount = parseInt(document.getElementById('makeupCount').value) || 3;
    const exemptCount = parseInt(document.getElementById('exemptCount').value) || 3;

    const settings = Storage.getSettings();
    settings.makeupCount = makeupCount;
    settings.exemptCount = exemptCount;
    Storage.saveSettings(settings);

    Utils.showToast('设置已保存', 'success');
  }

  static clearData() {
    if (!confirm('确定要清空所有学习计划数据吗？此操作不可恢复！')) return;

    Storage.saveRecords([]);
    Utils.showToast('数据已清空', 'success');
    this.render();
  }

  static renderExemptApprovalList() {
    const container = document.getElementById('exemptApprovalList');
    const requests = Storage.getExemptionRequests();
    const parentStudents = this.getParentStudents(Auth.getCurrentUser().id);
    const studentIds = parentStudents.map(s => s.id);

    const pending = requests.filter(r =>
      r.status === 'pending' && studentIds.includes(r.studentId)
    );

    if (pending.length === 0) {
      container.innerHTML = '<p class="text-light">暂无待审批豁免申请</p>';
      return;
    }

    container.innerHTML = pending.map(req => `
      <div class="exempt-approval-item">
        <div class="exempt-approval-header">
          <span class="exempt-approval-student">${req.studentUsername}</span>
          <span class="exempt-approval-date">申请日期：${req.date}</span>
        </div>
        ${req.reason ? `<p class="exempt-approval-reason">原因：${req.reason}</p>` : ''}
        <div class="exempt-approval-actions">
          <button class="btn btn-sm btn-success" onclick="ParentApp.openExemptModal('${req.id}')">
            <i class="fas fa-check"></i> 审批
          </button>
        </div>
      </div>
    `).join('');
  }

  static openExemptModal(requestId) {
    this.currentExemptRequestId = requestId;
    document.getElementById('exemptModal').classList.remove('hidden');
  }

  static closeExemptModal() {
    document.getElementById('exemptModal').classList.add('hidden');
    this.currentExemptRequestId = null;
  }

  static approveExempt() {
    if (!this.currentExemptRequestId) return;

    const requests = Storage.getExemptionRequests();
    const request = requests.find(r => r.id === this.currentExemptRequestId);
    if (!request) return;

    request.status = 'approved';
    request.updatedAt = Date.now();
    Storage.updateExemptionRequest(this.currentExemptRequestId, request);

    const settings = Storage.getSettings();
    if (!settings.exemptDates) settings.exemptDates = [];
    if (!settings.exemptDates.includes(request.date)) {
      settings.exemptDates.push(request.date);
      Storage.saveSettings(settings);
    }

    this.closeExemptModal();
    this.renderExemptApprovalList();
    Utils.showToast('豁免已批准', 'success');
  }

  static rejectExempt() {
    if (!this.currentExemptRequestId) return;

    const requests = Storage.getExemptionRequests();
    const request = requests.find(r => r.id === this.currentExemptRequestId);
    if (!request) return;

    request.status = 'rejected';
    request.updatedAt = Date.now();
    Storage.updateExemptionRequest(this.currentExemptRequestId, request);

    this.closeExemptModal();
    this.renderExemptApprovalList();
    Utils.showToast('豁免已拒绝', 'success');
  }

  static renderRedeemApprovalList() {
    const container = document.getElementById('redeemApprovalList');
    const rewards = Storage.getRewards ? Storage.getRewards() : [];
    const pending = rewards.filter(r => r.status === 'pending');

    if (pending.length === 0) {
      container.innerHTML = '<p class="text-light">暂无待审批兑换申请</p>';
      return;
    }

    container.innerHTML = pending.map(reward => `
      <div class="redeem-approval-item">
        <div class="redeem-approval-header">
          <span class="redeem-approval-student">${reward.studentUsername || '未知'}</span>
          <span class="redeem-approval-date">${Utils.formatDate(new Date(reward.createdAt))}</span>
        </div>
        <div class="redeem-approval-content">${reward.name}</div>
        <div class="redeem-approval-points">消耗 ${reward.points} 积分</div>
        <div class="redeem-approval-actions">
          <button class="btn btn-sm btn-success" onclick="ParentApp.openRedeemModal('${reward.id}')">
            <i class="fas fa-check"></i> 审批
          </button>
        </div>
      </div>
    `).join('');
  }

  static openRedeemModal(rewardId) {
    this.currentRedeemId = rewardId;
    document.getElementById('redeemModal').classList.remove('hidden');
  }

  static closeRedeemModal() {
    document.getElementById('redeemModal').classList.add('hidden');
    this.currentRedeemId = null;
  }

  static approveRedeem() {
    if (!this.currentRedeemId) return;

    const rewards = Storage.getRewards ? Storage.getRewards() : [];
    const reward = rewards.find(r => r.id === this.currentRedeemId);
    if (!reward) return;

    Points.deduct(reward.points, '兑换奖励', reward.studentId);

    reward.status = 'redeemed';
    reward.redeemedAt = Date.now();
    Storage.saveReward ? Storage.saveReward(reward) : null;

    this.closeRedeemModal();
    this.renderRedeemApprovalList();
    Utils.showToast('兑换已批准', 'success');
  }

  static rejectRedeem() {
    if (!this.currentRedeemId) return;

    const rewards = Storage.getRewards ? Storage.getRewards() : [];
    const reward = rewards.find(r => r.id === this.currentRedeemId);
    if (!reward) return;

    reward.status = 'rejected';
    reward.redeemedAt = Date.now();
    Storage.saveReward ? Storage.saveReward(reward) : null;

    this.closeRedeemModal();
    this.renderRedeemApprovalList();
    Utils.showToast('兑换已拒绝', 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ParentApp.init();
});

window.ParentApp = ParentApp;