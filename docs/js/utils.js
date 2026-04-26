/**
 * 工具函数
 * Learning Tracker - Utils Module
 */

const Utils = {
  /**
   * 格式化日期为 YYYY-MM-DD
   */
  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 格式化时间为 HH:mm:ss
   */
  formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },

  /**
   * 格式化时长（秒）为 mm:ss 或 hh:mm:ss
   */
  formatDuration(seconds) {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  /**
   * 格式化时长为中文描述
   */
  formatDurationChinese(seconds) {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h > 0) {
      return `${h}小时${m}分钟`;
    }
    return `${m}分钟`;
  },

  /**
   * 获取今天的日期字符串
   */
  getToday() {
    return Utils.formatDate(new Date());
  },

  /**
   * 获取本周开始日期（周一）
   */
  getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  },

  /**
   * 获取本周结束日期（周日）
   */
  getWeekEnd(date = new Date()) {
    const start = Utils.getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  },

  /**
   * 判断是否是同一天
   */
  isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  },

  /**
   * 获取日期范围内所有日期
   */
  getDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(Utils.formatDate(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  },

  /**
   * 获取今天是一周中的第几天（1=周一, 7=周日）
   */
  getDayOfWeek(date = new Date()) {
    let day = date.getDay();
    return day === 0 ? 7 : day;
  },

  /**
   * 获取本周的所有日期
   */
  getWeekDates(weekStart = Utils.getWeekStart()) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      dates.push(Utils.formatDate(d));
    }
    return dates;
  },

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * 随机整数
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * 随机选择数组元素
   */
  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /**
   * 显示Toast提示
   */
  showToast(message, duration = 2000) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  },

  /**
   * 确认对话框
   */
  confirm(message) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content confirm-modal">
          <p>${message}</p>
          <div class="modal-buttons">
            <button class="btn-cancel">取消</button>
            <button class="btn-confirm">确定</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('.btn-cancel').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };

      modal.querySelector('.btn-confirm').onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
      };
    });
  },

  /**
   * 防抖函数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * 节流函数
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * 计算年龄
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  },

  /**
   * 获取中文星期几
   */
  getChineseDayName(date = new Date()) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[new Date(date).getDay()];
  },

  /**
   * 获取本周是第几周
   */
  getWeekNumber(date = new Date()) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
};
