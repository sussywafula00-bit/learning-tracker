/**
 * 愿望卡系统（localStorage版本）
 * Learning Tracker - Wishes Module
 */

class WishManager {
  static addWish(description) {
    const user = Auth.getCurrentUser();
    if (!user) return null;

    const wish = {
      id: Utils.generateId(),
      studentId: user.id,
      description: description,
      status: 'pending',
      createdAt: Date.now(),
      droppedAt: null,
      approvedAt: null,
      rejectedAt: null,
      redeemedAt: null,
      approvedBy: null,
      rejectedReason: null
    };

    Storage.saveWish(wish);
    return wish;
  }

  static getWishes(studentId = null) {
    const user = Auth.getCurrentUser();
    const targetId = studentId || user?.id;
    if (!targetId) return [];

    const wishes = Storage.getWishes();
    return wishes
      .filter(w => w.studentId === targetId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  static getPendingWishes(studentId = null) {
    const wishes = this.getWishes(studentId);
    return wishes.filter(w => w.status === 'pending' || w.status === 'dropped');
  }

  static getApprovedWishes(studentId = null) {
    const wishes = this.getWishes(studentId);
    return wishes.filter(w => w.status === 'approved');
  }

  static getRedeemedWishes(studentId = null) {
    const wishes = this.getWishes(studentId);
    return wishes.filter(w => w.status === 'redeemed');
  }

  static getRejectedWishes(studentId = null) {
    const wishes = this.getWishes(studentId);
    return wishes.filter(w => w.status === 'rejected');
  }

  static deleteWish(wishId) {
    const wishes = Storage.getWishes().filter(w => w.id !== wishId);
    localStorage.setItem('lt_wishes', JSON.stringify(wishes));
    return true;
  }

  static getParentPendingWishes(parentId) {
    const students = Storage.getUsers().filter(u => u.parentId === parentId);
    if (students.length === 0) return [];

    const allWishes = Storage.getWishes();

    const result = [];
    for (const student of students) {
      const pending = allWishes.filter(w =>
        w.studentId === student.id &&
        (w.status === 'pending' || w.status === 'dropped')
      );
      pending.forEach(w => {
        w.studentUsername = student.username;
        w.studentId = student.id;
      });
      result.push(...pending);
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  static approveWish(wishId, parentId) {
    const wish = Storage.getWishes().find(w => w.id === wishId);
    if (wish) {
      wish.status = 'approved';
      wish.approvedAt = Date.now();
      wish.approvedBy = parentId;
      Storage.updateWish(wishId, wish);
    }
    return wish;
  }

  static rejectWish(wishId, reason = '') {
    const wish = Storage.getWishes().find(w => w.id === wishId);
    if (wish) {
      wish.status = 'rejected';
      wish.rejectedAt = Date.now();
      wish.rejectedReason = reason;
      Storage.updateWish(wishId, wish);
    }
    return wish;
  }

  static redeemWish(wishId) {
    const wish = Storage.getWishes().find(w => w.id === wishId);
    if (wish) {
      wish.status = 'redeemed';
      wish.redeemedAt = Date.now();
      Storage.updateWish(wishId, wish);
    }
    return wish;
  }

  static getStats(studentId = null) {
    const wishes = this.getWishes(studentId);

    return {
      pending: wishes.filter(w => w.status === 'pending' || w.status === 'dropped').length,
      approved: wishes.filter(w => w.status === 'approved').length,
      redeemed: wishes.filter(w => w.status === 'redeemed').length,
      rejected: wishes.filter(w => w.status === 'rejected').length,
      total: wishes.length
    };
  }
}