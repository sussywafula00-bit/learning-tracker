/**
 * 积分系统（localStorage版本）
 * Learning Tracker - Points Module
 */

class Points {
  static getBalance(studentId = null) {
    const user = Auth.getCurrentUser();
    const targetId = studentId || user?.id;
    if (!targetId) return 0;

    const pointsRecords = Storage.getPointsByUser(targetId);
    if (pointsRecords.length === 0) return 0;

    pointsRecords.sort((a, b) => a.createdAt - b.createdAt);
    return pointsRecords[pointsRecords.length - 1].balance || 0;
  }

  static add(amount, reason, studentId = null) {
    const user = Auth.getCurrentUser();
    const targetId = studentId || user?.id;
    if (!targetId) return null;

    const currentBalance = this.getBalance(targetId);
    const newBalance = currentBalance + amount;

    const record = {
      id: Utils.generateId(),
      studentId: targetId,
      type: 'reward',
      amount: amount,
      balance: newBalance,
      reason: reason,
      createdAt: Date.now()
    };

    Storage.savePoint(record);
    return record;
  }

  static deduct(amount, reason, studentId = null) {
    const user = Auth.getCurrentUser();
    const targetId = studentId || user?.id;
    if (!targetId) return null;

    const currentBalance = this.getBalance(targetId);
    const newBalance = Math.max(0, currentBalance - amount);

    const record = {
      id: Utils.generateId(),
      studentId: targetId,
      type: 'deduct',
      amount: -amount,
      balance: newBalance,
      reason: reason,
      createdAt: Date.now()
    };

    Storage.savePoint(record);
    return record;
  }

  static getRecords(studentId = null, limit = 50) {
    const user = Auth.getCurrentUser();
    const targetId = studentId || user?.id;
    if (!targetId) return [];

    const records = Storage.getPointsByUser(targetId);
    return records.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  static getRecordsByDateRange(startDate, endDate, studentId = null) {
    const user = Auth.getCurrentUser();
    const targetId = studentId || user?.id;
    if (!targetId) return [];

    const records = Storage.getPointsByUser(targetId);
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;

    return records
      .filter(r => r.createdAt >= start && r.createdAt < end)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  static deleteRecordsInRange(startDate, endDate, studentId = null) {
    const user = Auth.getCurrentUser();
    const targetId = studentId || user?.id;
    if (!targetId) return false;

    const allPoints = Storage.getPoints();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;

    const kept = allPoints.filter(r =>
      r.studentId !== targetId ||
      r.createdAt < start ||
      r.createdAt >= end
    );

    localStorage.setItem('lt_points', JSON.stringify(kept));
    return true;
  }

  static getWeeklyStats(studentId = null) {
    const user = Auth.getCurrentUser();
    const targetId = studentId || user?.id;
    if (!targetId) return { earned: 0, spent: 0, net: 0 };

    const weekStart = Utils.getWeekStart();
    const weekStartTime = weekStart.getTime();
    const records = Storage.getPointsByUser(targetId);
    const weekRecords = records.filter(r => r.createdAt >= weekStartTime);

    let earned = 0;
    let spent = 0;

    weekRecords.forEach(r => {
      if (r.amount > 0) earned += r.amount;
      else spent += Math.abs(r.amount);
    });

    return {
      earned,
      spent,
      net: earned - spent
    };
  }
}