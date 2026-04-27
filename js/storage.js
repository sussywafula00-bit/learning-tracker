/**
 * 数据存储模块（localStorage版本）
 * Learning Tracker - Storage Module
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'lt_current_user',
  USERS: 'lt_users',
  BINDINGS: 'lt_bindings',
  TEMPLATES: 'lt_templates',
  RECORDS: 'lt_records',
  TRACKING: 'lt_tracking',
  POINTS: 'lt_points',
  WISHES: 'lt_wishes',
  SETTINGS: 'lt_settings',
  EXEMPT_REQUESTS: 'lt_exempt_requests'
};

class Storage {
  // ========== 用户相关 ==========
  static saveUser(user) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  static getUser(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  static getUsers() {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  static getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  static clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // ========== 绑定关系 ==========
  static saveBinding(binding) {
    const bindings = this.getBindings();
    bindings.push(binding);
    localStorage.setItem(STORAGE_KEYS.BINDINGS, JSON.stringify(bindings));
  }

  static getBindings() {
    const data = localStorage.getItem(STORAGE_KEYS.BINDINGS);
    return data ? JSON.parse(data) : [];
  }

  static getBindingByCode(code) {
    const bindings = this.getBindings();
    return bindings.find(b => b.inviteCode === code) || null;
  }

  static updateBinding(inviteCode, data) {
    const bindings = this.getBindings();
    const index = bindings.findIndex(b => b.inviteCode === inviteCode);
    if (index >= 0) {
      bindings[index] = { ...bindings[index], ...data };
      localStorage.setItem(STORAGE_KEYS.BINDINGS, JSON.stringify(bindings));
    }
  }

  // ========== 任务模板 ==========
  static getTemplates() {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return data ? JSON.parse(data) : [];
  }

  static saveTemplate(template) {
    const templates = this.getTemplates();
    templates.push(template);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }

  static deleteTemplate(templateId) {
    const templates = this.getTemplates().filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }

  // ========== 打卡记录 ==========
  static getRecords() {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  }

  static saveRecord(record) {
    const records = this.getRecords();
    records.push(record);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }

  static saveRecords(records) {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }

  static getRecordsByUser(userId) {
    return this.getRecords().filter(r => r.userId === userId);
  }

  // ========== 时长记录 ==========
  static getTracking() {
    const data = localStorage.getItem(STORAGE_KEYS.TRACKING);
    return data ? JSON.parse(data) : {};
  }

  static getTrackingByUser(userId) {
    const all = this.getTracking();
    return all[userId] || {};
  }

  static getStudentTracking(studentId) {
    const all = this.getTracking();
    const studentData = all[studentId] || {};
    const today = Utils.getToday();
    if (studentData.date === today) {
      return studentData;
    }
    return null;
  }

  static saveTrackingEntry(userId, date, entry) {
    const all = this.getTracking();
    if (!all[userId]) all[userId] = {};
    if (!all[userId][date]) all[userId][date] = { date: date, sessions: [], totalCount: 0, totalDuration: 0 };
    all[userId][date].sessions.push(entry);
    all[userId][date].totalCount++;
    all[userId][date].totalDuration += entry.duration;
    localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(all));
  }

  static saveTracking(studentId, data) {
    const all = this.getTracking();
    all[studentId] = data;
    localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(all));
  }

  // ========== 积分记录 ==========
  static getPoints() {
    const data = localStorage.getItem(STORAGE_KEYS.POINTS);
    return data ? JSON.parse(data) : [];
  }

  static getPointsByUser(userId) {
    return this.getPoints().filter(p => p.studentId === userId);
  }

  static savePoint(point) {
    const points = this.getPoints();
    points.push(point);
    localStorage.setItem(STORAGE_KEYS.POINTS, JSON.stringify(points));
  }

  // ========== 愿望池 ==========
  static getWishes() {
    const data = localStorage.getItem(STORAGE_KEYS.WISHES);
    return data ? JSON.parse(data) : [];
  }

  static getWishesByUser(userId) {
    return this.getWishes().filter(w => w.userId === userId);
  }

  static saveWish(wish) {
    const wishes = this.getWishes();
    wishes.push(wish);
    localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify(wishes));
  }

  static updateWish(wishId, data) {
    const wishes = this.getWishes();
    const index = wishes.findIndex(w => w.id === wishId);
    if (index >= 0) {
      wishes[index] = { ...wishes[index], ...data };
      localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify(wishes));
    }
  }

  // ========== 豁免申请 ==========
  static getExemptionRequests() {
    const data = localStorage.getItem(STORAGE_KEYS.EXEMPT_REQUESTS);
    return data ? JSON.parse(data) : [];
  }

  static saveExemptionRequest(request) {
    const requests = this.getExemptionRequests();
    requests.push(request);
    localStorage.setItem(STORAGE_KEYS.EXEMPT_REQUESTS, JSON.stringify(requests));
  }

  static updateExemptionRequest(requestId, data) {
    const requests = this.getExemptionRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index >= 0) {
      requests[index] = { ...requests[index], ...data };
      localStorage.setItem(STORAGE_KEYS.EXEMPT_REQUESTS, JSON.stringify(requests));
    }
  }

  // ========== 兑换奖励 ==========
  static getRewards() {
    const data = localStorage.getItem('lt_rewards');
    return data ? JSON.parse(data) : [];
  }

  static saveReward(reward) {
    const rewards = this.getRewards();
    rewards.push(reward);
    localStorage.setItem('lt_rewards', JSON.stringify(rewards));
  }

  // ========== 设置 ==========
  static getSettings() {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {};
  }

  static saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // ========== 数据导出 ==========
  static exportAllData() {
    return {
      users: this.getUsers(),
      bindings: this.getBindings(),
      templates: this.getTemplates(),
      records: this.getRecords(),
      tracking: this.getTracking(),
      points: this.getPoints(),
      wishes: this.getWishes(),
      settings: this.getSettings(),
      exemptRequests: this.getExemptionRequests()
    };
  }

  // ========== 数据清除 ==========
  static clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}