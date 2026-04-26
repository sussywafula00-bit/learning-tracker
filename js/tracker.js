/**
 * 时长监控系统（localStorage版本）
 * Learning Tracker - Tracker Module
 */

class Tracker {
  static tracking = false;
  static startTime = null;
  static timerId = null;

  static init() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.startTracking();
      } else {
        this.endTracking();
      }
    });

    window.addEventListener('blur', () => {
      this.startTracking();
    });

    window.addEventListener('focus', () => {
      if (!document.hidden) {
        this.endTracking();
      }
    });

    window.addEventListener('beforeunload', () => {
      if (this.tracking) {
        this.endTracking();
      }
    });

    Drop.checkWeeklyDrop();
  }

  static startTracking() {
    if (this.tracking) return;

    const user = Auth.getCurrentUser();
    if (!user) return;

    this.tracking = true;
    this.startTime = Date.now();
    this.sessionId = Utils.generateId();
  }

  static endTracking() {
    if (!this.tracking || !this.startTime) return;

    const user = Auth.getCurrentUser();
    if (!user) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - this.startTime) / 1000);

    if (duration < 1) {
      this.tracking = false;
      this.startTime = null;
      return;
    }

    const today = Utils.getToday();
    const currentTime = Utils.formatTime(endTime);

    const allTracking = Storage.getTracking();
    let trackingData = allTracking[user.id]?.[today];

    if (!trackingData) {
      trackingData = {
        date: today,
        sessions: [],
        totalCount: 0,
        totalDuration: 0
      };
    }

    trackingData.sessions.push({
      id: this.sessionId,
      startTime: Utils.formatTime(this.startTime),
      endTime: currentTime,
      duration: duration
    });

    trackingData.totalCount++;
    trackingData.totalDuration += duration;

    if (!allTracking[user.id]) allTracking[user.id] = {};
    allTracking[user.id][today] = trackingData;
    localStorage.setItem('lt_tracking', JSON.stringify(allTracking));

    this.tracking = false;
    this.startTime = null;
    this.sessionId = null;

    if (this.onTrackEnd) {
      this.onTrackEnd(duration);
    }
  }

  static getTodayRecords() {
    const user = Auth.getCurrentUser();
    if (!user) return null;

    const today = Utils.getToday();
    const allTracking = Storage.getTracking();
    const trackingData = allTracking[user.id]?.[today];

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

  static getTodayDurationHours() {
    const records = this.getTodayRecords();
    if (!records) return 0;
    return (records.totalDuration / 3600).toFixed(1);
  }

  static getRecordsByDate(date) {
    const user = Auth.getCurrentUser();
    if (!user) return null;

    const allTracking = Storage.getTracking();
    const trackingData = allTracking[user.id]?.[date];

    if (!trackingData) {
      return {
        date: date,
        sessions: [],
        totalCount: 0,
        totalDuration: 0
      };
    }

    return trackingData;
  }

  static getWeeklySummary() {
    const user = Auth.getCurrentUser();
    if (!user) return null;

    const weekStart = Utils.getWeekStart();
    const weekDates = Utils.getWeekDates(weekStart);
    const allTracking = Storage.getTracking();
    const userTracking = allTracking[user.id] || {};

    const summary = {
      weekStart: Utils.formatDate(weekStart),
      dailyRecords: [],
      totalCount: 0,
      totalDuration: 0
    };

    for (const date of weekDates) {
      const trackingData = userTracking[date];
      if (trackingData) {
        summary.dailyRecords.push(trackingData);
        summary.totalCount += trackingData.totalCount;
        summary.totalDuration += trackingData.totalDuration;
      } else {
        summary.dailyRecords.push({
          date: date,
          sessions: [],
          totalCount: 0,
          totalDuration: 0
        });
      }
    }

    return summary;
  }

  static exportToCSV(startDate, endDate) {
    const dates = Utils.getDateRange(startDate, endDate);
    let csv = '日期,切出次数,总时长(秒),总时长(格式),明细\n';

    for (const date of dates) {
      const records = this.getRecordsByDate(date);
      if (records && records.totalCount > 0) {
        const details = records.sessions.map(s =>
          `${s.startTime}-${s.endTime}(${s.duration}秒)`
        ).join('; ');

        csv += `${date},${records.totalCount},${records.totalDuration},${Utils.formatDuration(records.totalDuration)},"${details}"\n`;
      } else {
        csv += `${date},0,0,0,\n`;
      }
    }

    return csv;
  }

  static downloadCSV(startDate, endDate) {
    const csv = this.exportToCSV(startDate, endDate);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tracking_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}