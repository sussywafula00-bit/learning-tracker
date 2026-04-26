/**
 * 掉落系统（localStorage版本）
 * Learning Tracker - Drop Module
 *
 * 积分掉落规则：
 * - 每完成一项日必须项：5-10积分
 * - 完成所有日必须项（最后一项时）：30-50积分（不触发单项掉落）
 * - 每完成一项日选做项：15-30积分
 * - 完成所有周必须项：10-20积分
 * - 完成周选做项：20-30积分
 * - 每周随机掉落：30-50积分+愿望卡（家长指定）
 */

class Drop {
  static triggerDailyRequiredItemDrop(recordId) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const points = Utils.randomInt(5, 10);
    Points.add(points, '完成日必须项');

    if (typeof StudentApp !== 'undefined') {
      StudentApp.showFloatingPoints(points);
    }
  }

  static triggerAllDailyRequiredComplete() {
    const today = Utils.getToday();
    const user = Auth.getCurrentUser();
    if (!user) return;

    this.markDailyRequiredDropped(today);

    const points = Utils.randomInt(30, 50);
    Points.add(points, '完成全部日必须项奖励');

    this.showDropModal('points', points);
    if (typeof StudentApp !== 'undefined') {
      StudentApp.showFloatingPoints(points);
    }
  }

  static triggerDailyOptionalItemDrop() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const points = Utils.randomInt(15, 30);
    Points.add(points, '完成日选做项');

    this.showDropModal('points', points);
    if (typeof StudentApp !== 'undefined') {
      StudentApp.showFloatingPoints(points);
    }
  }

  static triggerWeeklyRequiredDrop() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const points = Utils.randomInt(10, 20);
    Points.add(points, '完成周必须项');

    if (typeof StudentApp !== 'undefined') {
      StudentApp.showFloatingPoints(points);
    }
  }

  static triggerWeeklyOptionalDrop() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const points = Utils.randomInt(20, 30);
    Points.add(points, '完成周选做项');

    if (typeof StudentApp !== 'undefined') {
      StudentApp.showFloatingPoints(points);
    }
  }

  static triggerWeeklyPointsDrop() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const points = Utils.randomInt(30, 50);
    Points.add(points, '每周随机掉落');

    const wishes = this.getParentWishCards();
    if (wishes && wishes.length > 0) {
      const selectedWish = Utils.randomChoice(wishes);
      selectedWish.status = 'dropped';
      selectedWish.droppedAt = Date.now();
      Storage.saveWish(selectedWish);

      this.showDropModal('points_wish', { points, wish: selectedWish.description });
    } else {
      this.showDropModal('points', points);
    }
  }

  static getParentWishCards() {
    const user = Auth.getCurrentUser();
    if (!user) return [];

    const students = Storage.getUsers().filter(u => u.parentId === user.id);
    if (students.length === 0) return [];

    const wishes = Storage.getWishes();
    const studentIds = students.map(s => s.id);

    return wishes.filter(w =>
      studentIds.includes(w.studentId) &&
      w.status === 'approved' &&
      w.canDrop === true
    );
  }

  static markDailyRequiredDropped(date) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const settings = Storage.getSettings();
    if (!settings.dailyDrops) settings.dailyDrops = {};
    if (!settings.dailyDrops[user.id]) settings.dailyDrops[user.id] = {};

    settings.dailyDrops[user.id][date] = settings.dailyDrops[user.id][date] || {};
    settings.dailyDrops[user.id][date].allCompleteDropped = true;

    Storage.saveSettings(settings);
  }

  static hasDailyRequiredDropped(date) {
    const user = Auth.getCurrentUser();
    if (!user) return false;

    const settings = Storage.getSettings();
    return settings.dailyDrops?.[user.id]?.[date]?.allCompleteDropped === true;
  }

  static checkWeeklyDrop() {
    const user = Auth.getCurrentUser();
    if (!user || !Auth.isStudent()) return;

    const settings = Storage.getSettings();
    if (!settings.weeklyDrops) settings.weeklyDrops = {};

    const lastDrop = settings.weeklyDrops[user.id];
    const today = Utils.getToday();
    const weekStart = Utils.formatDate(Utils.getWeekStart());

    if (lastDrop && lastDrop.week === weekStart && lastDrop.count >= 2) {
      return;
    }

    if (Math.random() > 0.4) return;

    const dropCount = (lastDrop && lastDrop.week === weekStart) ? lastDrop.count : 0;

    this.triggerWeeklyPointsDrop();

    settings.weeklyDrops[user.id] = {
      week: weekStart,
      date: today,
      count: dropCount + 1
    };
    Storage.saveSettings(settings);
  }

  static scheduleWeeklyDrop() {
    const now = new Date();

    const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
    nextSaturday.setHours(20, 0, 0, 0);

    if (daysUntilSaturday === 0 && now > nextSaturday) {
      nextSaturday.setDate(nextSaturday.getDate() + 7);
    }

    let delay = nextSaturday.getTime() - now.getTime();
    const randomDelay = Math.random() * 60 * 60 * 1000;
    delay += randomDelay;

    if (delay < 0) {
      nextSaturday.setDate(nextSaturday.getDate() + 7);
      delay = nextSaturday.getTime() - now.getTime() + Math.random() * 60 * 60 * 1000;
    }

    setTimeout(() => {
      this.checkWeeklyDrop();
      this.scheduleWeeklyDrop();
    }, delay);
  }

  static showDropModal(type, content) {
    const modal = document.getElementById('dropModal');
    const dropContent = document.getElementById('dropContent');

    if (!modal || !dropContent) return;

    const dropIconEl = modal.querySelector('.drop-icon');
    const dropIconInner = modal.querySelector('.drop-icon-inner');

    if (dropIconEl) {
      dropIconEl.classList.remove('shake', 'open');
    }
    if (dropIconInner) {
      dropIconInner.classList.remove('animate-enter');
      void dropIconInner.offsetWidth;
      dropIconInner.classList.add('animate-enter');
    }

    if (type === 'points') {
      dropContent.innerHTML = `
        <div class="drop-reward-container">
          <div class="drop-points">+${content}</div>
          <div class="drop-label">积分</div>
        </div>
      `;
    } else if (type === 'points_wish') {
      dropContent.innerHTML = `
        <div class="drop-reward-container">
          <div class="drop-points">+${content.points}</div>
          <div class="drop-label">积分</div>
          <div class="drop-wish">
            <span class="drop-wish-icon">🎁</span>
            <span>愿望卡：${content.wish}</span>
          </div>
        </div>
      `;
    }

    modal.classList.remove('hidden');

    setTimeout(() => {
      dropIconEl?.classList.add('shake');
    }, 1000);

    setTimeout(() => {
      dropIconEl?.classList.remove('shake');
      dropIconEl?.classList.add('open');
      this.createParticles();
    }, 1600);

    setTimeout(() => {
      this.hideDropModal();
    }, 5500);
  }

  static createParticles() {
    const modal = document.getElementById('dropModal');
    if (!modal) return;

    const existingParticles = modal.querySelector('.drop-particles');
    if (existingParticles) existingParticles.remove();

    const particles = document.createElement('div');
    particles.className = 'drop-particles';

    const colorClasses = ['gold', 'red', 'blue', 'purple'];

    for (let i = 0; i < 24; i++) {
      const particle = document.createElement('div');
      const size = 8 + Math.random() * 12;
      particle.className = `particle ${colorClasses[i % colorClasses.length]}`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = '50%';
      particle.style.top = '50%';

      const angle = (Math.random() * 360) * (Math.PI / 180);
      const distance = 100 + Math.random() * 120;
      particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);

      particles.appendChild(particle);
    }

    modal.querySelector('.drop-modal').appendChild(particles);

    setTimeout(() => {
      particles.remove();
    }, 1000);
  }

  static hideDropModal() {
    const modal = document.getElementById('dropModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }
}