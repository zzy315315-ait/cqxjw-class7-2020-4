// ============================================================
// 配置文件 - 所有页面共享
// 修改密钥、管理员UID只需要改这一个文件
// ============================================================
var CONFIG = {
  // Supabase配置
  SUPABASE_URL: "https://ekfntkpjqzmkibdimtru.supabase.co",
  ANON_KEY: "sb_publishable_Z3wpxD9ZRbXm9-gPPQOGZg_KKhr_yIs",

  // 管理员UID白名单（两个管理员）
  ADMIN_UIDS: [
    "919f3af0-801d-4d7b-87b4-03bedc9d2896",  // 超级管理员
    "6522e17f-14ea-4f1f-b20d-10457d598fef"   // admin
  ],

  // 开发者学号
  DEV_SIDS: ["3", "12", "19"],

  // 老师邮箱
  TEACHER_EMAIL: "denglaoshi@class20207.com",

  // 四个仓库的域名
  DOMAINS: {
    login: "https://cqxjw-class7-2020.pages.dev",
    home: "https://cqxjw-class7-2020-2.pages.dev",
    others: "https://cqxjw-class7-2020-3.pages.dev",
    admin: "https://cqxjw-class7-2020-4.pages.dev"
  },

  // 页面跳转地址（跨仓库使用完整URL）
  PAGES: {
    // 登录页仓库
    login: "https://cqxjw-class7-2020.pages.dev/index.html",
    internalLogin: "https://cqxjw-class7-2020.pages.dev/internal-login.html",
    adminLogin: "https://cqxjw-class7-2020.pages.dev/admin-login.html",
    register: "https://cqxjw-class7-2020.pages.dev/register.html",
    // 主页仓库
    visitor: "https://cqxjw-class7-2020-2.pages.dev/visitor.html",
    userHome: "https://cqxjw-class7-2020-2.pages.dev/a3x7k2m9p4q8r3t6w1y5u0i2o4.html",
    adminHome: "https://cqxjw-class7-2020-2.pages.dev/admin-main.html",
    // 管理设置仓库（当前仓库4）
    adminSettings: "admin-settings.html",
    settings: "settings.html",
    changePassword: "change-password.html",
    adminFeedback: "admin-feedback.html",
    adminLeaderboard: "admin-leaderboard.html",
    pptViewer: "ppt-viewer.html",
    pptShow: "ppt-show.html",
    // 其他功能仓库（仓库3）
    message: "https://cqxjw-class7-2020-3.pages.dev/message.html",
    contactAdmin: "https://cqxjw-class7-2020-3.pages.dev/contact-admin.html",
    conversation: "https://cqxjw-class7-2020-3.pages.dev/conversation.html",
    about: "https://cqxjw-class7-2020-3.pages.dev/about.html",
    gallery: "https://cqxjw-class7-2020-3.pages.dev/gallery.html",
    videos: "https://cqxjw-class7-2020-3.pages.dev/videos.html",
    classwall: "https://cqxjw-class7-2020-3.pages.dev/classwall.html",
    developers: "https://cqxjw-class7-2020-3.pages.dev/developers.html",
    classmates: "https://cqxjw-class7-2020-3.pages.dev/classmates.html"
  },

  // 登录保持天数
  LOGIN_KEEP_DAYS: 30
};
