/**
 * 认证模块（localStorage版本）
 * Learning Tracker - Auth Module
 */

class Auth {
  static ROLES = {
    PARENT: 'parent',
    STUDENT: 'student'
  };

  static currentUser = null;
  static userRole = null;

  static init() {
    // 从 localStorage 恢复登录状态
    const savedUser = Storage.getCurrentUser();
    if (savedUser) {
      this.currentUser = savedUser;
      this.userRole = savedUser.role;
    }
    return Promise.resolve();
  }

  static register(username, password, role, inviteCode = null) {
    console.log('Auth.register called:', { username, role, inviteCode });
    try {
      const users = Storage.getUsers();
      console.log('Users found:', users.length);

      // 检查用户名是否已存在
      if (users.find(u => u.username === username)) {
        return { success: false, error: '用户名已存在' };
      }

      // 生成用户ID
      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      if (role === this.ROLES.STUDENT && inviteCode) {
        // 验证邀请码
        const binding = Storage.getBindingByCode(inviteCode.toUpperCase());
        if (!binding) {
          return { success: false, error: '邀请码无效' };
        }
        if (binding.studentId) {
          return { success: false, error: '该邀请码已被使用' };
        }

        // 更新绑定关系
        Storage.updateBinding(inviteCode.toUpperCase(), {
          studentId: userId,
          studentUsername: username
        });

        // 创建学生用户
        const user = {
          id: userId,
          username: username,
          password: password,
          role: role,
          parentId: binding.parentId,
          inviteCode: inviteCode.toUpperCase(),
          points: 0,
          createdAt: Date.now()
        };
        Storage.saveUser(user);
        Storage.savePoint({
          studentId: userId,
          type: 'init',
          amount: 0,
          balance: 0,
          createdAt: Date.now()
        });

        this.currentUser = user;
        this.userRole = role;
        Storage.saveUser(user); // 保存到 localStorage

        return { success: true, user: user };
      } else if (role === this.ROLES.PARENT) {
        // 生成邀请码
        const code = this.generateInviteCode();
        const user = {
          id: userId,
          username: username,
          password: password,
          role: role,
          inviteCode: code,
          createdAt: Date.now()
        };
        Storage.saveUser(user);

        // 创建绑定关系
        Storage.saveBinding({
          parentId: userId,
          inviteCode: code,
          createdAt: Date.now()
        });

        this.currentUser = user;
        this.userRole = role;
        Storage.saveUser(user); // 保存到 localStorage

        return { success: true, user: user, inviteCode: code };
      }

      return { success: false, error: '无效的角色' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static login(username, password) {
    console.log('Auth.login called:', { username });
    const users = Storage.getUsers();
    console.log('Users found:', users.length);
    const user = users.find(u => u.username === username && u.password === password);
    console.log('User found:', user);

    if (user) {
      this.currentUser = user;
      this.userRole = user.role;
      Storage.saveUser(user); // 保存到 localStorage
      return { success: true, user: user };
    }

    return { success: false, error: '用户名或密码错误' };
  }

  static logout() {
    this.currentUser = null;
    this.userRole = null;
    Storage.clearCurrentUser();
  }

  static getCurrentUser() {
    return this.currentUser;
  }

  static getUserRole() {
    return this.userRole;
  }

  static isLoggedIn() {
    return !!this.currentUser;
  }

  static isParent() {
    return this.userRole === this.ROLES.PARENT;
  }

  static isStudent() {
    return this.userRole === this.ROLES.STUDENT;
  }

  static generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static async getInviteCode(parentId) {
    const bindings = Storage.getBindings();
    const binding = bindings.find(b => b.parentId === parentId);
    return binding ? binding.inviteCode : null;
  }

  static getInviteCodeSync(parentId) {
    const bindings = Storage.getBindings();
    const binding = bindings.find(b => b.parentId === parentId);
    return binding ? binding.inviteCode : null;
  }

  static async getParentStudents(parentId) {
    const users = Storage.getUsers();
    return users.filter(u => u.parentId === parentId);
  }

  static async getStudentParent(studentId) {
    const user = Storage.getUser(studentId);
    if (user && user.parentId) {
      return Storage.getUser(user.parentId);
    }
    return null;
  }
}