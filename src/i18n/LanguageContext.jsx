import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGE_KEY = "bookhub-language";
const LEGACY_LANGUAGE_KEY = "admin-language";
const SUPPORTED_LANGUAGES = ["en", "km", "zh"];
const DEFAULT_LANGUAGE = "en";

const translations = {
  km: {
    "Admin Portal": "វិបផតថលអ្នកគ្រប់គ្រង",
    Dashboard: "ផ្ទាំងគ្រប់គ្រង",
    Users: "អ្នកប្រើប្រាស់",
    Approvals: "ការអនុម័ត",
    Categories: "ប្រភេទ",
    Books: "សៀវភៅ",
    "Top Readers": "អ្នកអានកំពូល",
    "System Monitor": "ត្រួតពិនិត្យប្រព័ន្ធ",
    Settings: "ការកំណត់",
    Admin: "អ្នកគ្រប់គ្រង",
    "Admin Dashboard": "ផ្ទាំងអ្នកគ្រប់គ្រង",
    "Manages Users": "គ្រប់គ្រងអ្នកប្រើប្រាស់",
    "Book Approvals": "អនុម័តសៀវភៅ",
    "All Books": "សៀវភៅទាំងអស់",
    "Admin control center": "មជ្ឈមណ្ឌលគ្រប់គ្រងអ្នកគ្រប់គ្រង",
    Logout: "ចាកចេញ",
    "Total Users": "អ្នកប្រើប្រាស់សរុប",
    "Total Books": "សៀវភៅសរុប",
    "Pending Approvals": "ការអនុម័តកំពុងរង់ចាំ",
    Authors: "អ្នកនិពន្ធ",
    "Platform Activity": "សកម្មភាពប្រព័ន្ធ",
    "Last 7 days": "៧ ថ្ងៃចុងក្រោយ",
    "Last 30 days": "៣០ ថ្ងៃចុងក្រោយ",
    "System Health": "សុខភាពប្រព័ន្ធ",
    "99.98% uptime": "ដំណើរការ 99.98%",
    "API Server": "ម៉ាស៊ីនមេ API",
    "12ms latency": "ពន្យារពេល 12ms",
    Database: "មូលដ្ឋានទិន្នន័យ",
    "4ms query time": "ពេលសួរ 4ms",
    "File Storage": "ឃ្លាំងឯកសារ",
    "78% used": "បានប្រើ 78%",
    "Email Service": "សេវាអ៊ីមែល",
    "67ms response": "ឆ្លើយតប 67ms",
    "Platform engagement is at an all-time high. Keep up the good work.":
      "ការចូលរួមលើប្រព័ន្ធកំពុងខ្ពស់បំផុត។ សូមបន្តការងារល្អនេះ។",
    "this month": "ខែនេះ",
    Online: "អនឡាញ",
    Warning: "ព្រមាន",
    Error: "កំហុស",
    "Search books, authors, categories...": "ស្វែងរកសៀវភៅ អ្នកនិពន្ធ ប្រភេទ...",
    All: "ទាំងអស់",
    Approved: "អនុម័ត",
    Pending: "កំពុងរង់ចាំ",
    Rejected: "បដិសេធ",
    Total: "សរុប",
    Book: "សៀវភៅ",
    Author: "អ្នកនិពន្ធ",
    Category: "ប្រភេទ",
    Status: "ស្ថានភាព",
    Downloads: "ការទាញយក",
    Actions: "សកម្មភាព",
    "No books found for this filter.": "មិនមានសៀវភៅត្រូវនឹងតម្រងនេះទេ។",
    "Pending (24)": "កំពុងរង់ចាំ (24)",
    Reviewed: "បានពិនិត្យ",
    "2 Pending Review": "២ កំពុងរង់ចាំពិនិត្យ",
    by: "ដោយ",
    "A deep dive into the themes of {category} and how it shapes our modern digital age.":
      "ការវិភាគជ្រាលជ្រៅអំពីប្រធានបទ {category} និងរបៀបដែលវាបង្កើតយុគសម័យឌីជីថលទំនើបរបស់យើង។",
    Preview: "មើលជាមុន",
    Approve: "អនុម័ត",
    "Manage book categories and genres": "គ្រប់គ្រងប្រភេទ និងចំណាត់ថ្នាក់សៀវភៅ",
    "Add Category": "បន្ថែមប្រភេទ",
    "Total Categories": "ប្រភេទសរុប",
    "Average Books": "មធ្យមសៀវភៅ",
    "Category List": "បញ្ជីប្រភេទ",
    "Create Category": "បង្កើតប្រភេទ",
    "No categories yet.": "មិនទាន់មានប្រភេទនៅឡើយទេ។",
    "Add New Category": "បន្ថែមប្រភេទថ្មី",
    "Category Name": "ឈ្មោះប្រភេទ",
    "Book Count": "ចំនួនសៀវភៅ",
    Icon: "រូបតំណាង",
    Technology: "បច្ចេកវិទ្យា",
    Education: "អប់រំ",
    Business: "អាជីវកម្ម",
    History: "ប្រវត្តិសាស្ត្រ",
    "Please complete all category fields.": "សូមបំពេញព័ត៌មានប្រភេទទាំងអស់។",
    "Please enter category name.": "សូមបញ្ចូលឈ្មោះប្រភេទ។",
    "Category added successfully.": "បានបន្ថែមប្រភេទដោយជោគជ័យ។",
    "Save Category": "រក្សាទុកប្រភេទ",
    books: "សៀវភៅ",
    "Books Read": "សៀវភៅបានអាន",
    "Complete Leaderboard": "តារាងចំណាត់ថ្នាក់ពេញលេញ",
    "All Time": "គ្រប់ពេល",
    "This Month": "ខែនេះ",
    "This Week": "សប្តាហ៍នេះ",
    Rank: "ចំណាត់ថ្នាក់",
    Reader: "អ្នកអាន",
    "Member Since": "ជាសមាជិកចាប់តាំងពី",
    Trend: "និន្នាការ",
    "CPU Usage": "ការប្រើប្រាស់ CPU",
    Memory: "អង្គចងចាំ",
    "Disk Usage": "ការប្រើប្រាស់ឌីស",
    "Network I/O": "បណ្តាញ I/O",
    "System Resources": "ធនធានប្រព័ន្ធ",
    "Live Activity Log": "កំណត់ត្រាសកម្មភាពបន្តផ្ទាល់",
    "Services Status": "ស្ថានភាពសេវាកម្ម",
    "Gutenberg API": "Gutenberg API",
    Timeout: "អស់ពេលរង់ចាំ",
    "Open Library API": "Open Library API",
    Notifications: "ការជូនដំណឹង",
    "New Reader": "អ្នកអានថ្មី",
    "When someone starts reading your book": "នៅពេលនរណាម្នាក់ចាប់ផ្តើមអានសៀវភៅរបស់អ្នក",
    "Book Approved": "សៀវភៅបានអនុម័ត",
    "When admin approves your submission": "នៅពេលអ្នកគ្រប់គ្រងអនុម័តការដាក់ស្នើរបស់អ្នក",
    "Weekly Report": "របាយការណ៍ប្រចាំសប្តាហ៍",
    "Weekly analytics summary email": "អ៊ីមែលសង្ខេបវិភាគប្រចាំសប្តាហ៍",
    "New Comment": "មតិយោបល់ថ្មី",
    "When someone comments on your book": "នៅពេលនរណាម្នាក់ផ្តល់មតិលើសៀវភៅរបស់អ្នក",
    "Save Notifications": "រក្សាទុកការជូនដំណឹង",
    "Change Password": "ប្ដូរពាក្យសម្ងាត់",
    "Current password": "ពាក្យសម្ងាត់បច្ចុប្បន្ន",
    "New password": "ពាក្យសម្ងាត់ថ្មី",
    "Confirm new password": "បញ្ជាក់ពាក្យសម្ងាត់ថ្មី",
    "Update Password": "ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់",
    "Missing login token. Please login again.": "បាត់សញ្ញាសម្គាល់ចូលប្រើ។ សូមចូលឡើងវិញ។",
    "Password updated successfully.": "បានធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់ដោយជោគជ័យ។",
    "Network error. Please try again.": "កំហុសបណ្តាញ។ សូមព្យាយាមម្តងទៀត។",
    Preferences: "ចំណូលចិត្ត",
    "Preferred Language": "ភាសាដែលចូលចិត្ត",
    English: "អង់គ្លេស",
    Khmer: "ខ្មែរ",
    "Chinese (China)": "ចិន (ចិន)",
    Theme: "រចនាប័ទ្ម",
    Dark: "ងងឹត",
    Light: "ភ្លឺ",
    "Search users...": "ស្វែងរកអ្នកប្រើប្រាស់...",
    "All Roles": "តួនាទីទាំងអស់",
    User: "អ្នកប្រើប្រាស់",
    ID: "លេខសម្គាល់",
    Role: "តួនាទី",
    "First Name": "នាមខ្លួន",
    "Last Name": "នាមត្រកូល",
    Email: "អ៊ីមែល",
    "Created At": "បង្កើតនៅ",
    "Loading users...": "កំពុងផ្ទុកអ្នកប្រើប្រាស់...",
    Save: "រក្សាទុក",
    Cancel: "បោះបង់",
    Edit: "កែសម្រួល",
    Delete: "លុប",
    "No users found.": "មិនមានអ្នកប្រើប្រាស់ទេ។",
    "First name, last name, and email are required.": "ត្រូវការនាមខ្លួន នាមត្រកូល និងអ៊ីមែល។",
    "Failed to update user.": "បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់។",
    "User updated successfully.": "បានធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់ដោយជោគជ័យ។",
    "Failed to delete user.": "បរាជ័យក្នុងការលុបអ្នកប្រើប្រាស់។",
    "User deleted successfully.": "បានលុបអ្នកប្រើប្រាស់ដោយជោគជ័យ។",
    "Delete user \"{name}\"?": "លុបអ្នកប្រើប្រាស់ \"{name}\" ?",
    "Failed to load users.": "បរាជ័យក្នុងការផ្ទុកអ្នកប្រើប្រាស់។",
  },
  zh: {
    "Admin Portal": "管理门户",
    Dashboard: "仪表盘",
    Users: "用户",
    Approvals: "审批",
    Categories: "分类",
    Books: "图书",
    "Top Readers": "顶级读者",
    "System Monitor": "系统监控",
    Settings: "设置",
    Admin: "管理员",
    "Admin Dashboard": "管理员仪表盘",
    "Manages Users": "用户管理",
    "Book Approvals": "图书审批",
    "All Books": "全部图书",
    "Admin control center": "管理员控制中心",
    Logout: "退出登录",
    "Total Users": "用户总数",
    "Total Books": "图书总数",
    "Pending Approvals": "待审批",
    Authors: "作者",
    "Platform Activity": "平台活动",
    "Last 7 days": "最近7天",
    "Last 30 days": "最近30天",
    "System Health": "系统健康",
    "99.98% uptime": "99.98% 在线率",
    "API Server": "API 服务器",
    "12ms latency": "12ms 延迟",
    Database: "数据库",
    "4ms query time": "4ms 查询时间",
    "File Storage": "文件存储",
    "78% used": "已使用 78%",
    "Email Service": "邮件服务",
    "67ms response": "67ms 响应",
    "Platform engagement is at an all-time high. Keep up the good work.":
      "平台参与度达到历史新高。请继续保持。",
    "this month": "本月",
    Online: "在线",
    Warning: "警告",
    Error: "错误",
    "Search books, authors, categories...": "搜索图书、作者、分类...",
    All: "全部",
    Approved: "已批准",
    Pending: "待处理",
    Rejected: "已拒绝",
    Total: "总计",
    Book: "图书",
    Author: "作者",
    Category: "分类",
    Status: "状态",
    Downloads: "下载量",
    Actions: "操作",
    "No books found for this filter.": "未找到符合筛选条件的图书。",
    "Pending (24)": "待处理 (24)",
    Reviewed: "已审核",
    "2 Pending Review": "2 条待审核",
    by: "作者",
    "A deep dive into the themes of {category} and how it shapes our modern digital age.":
      "深入探讨 {category} 主题及其如何塑造现代数字时代。",
    Preview: "预览",
    Approve: "批准",
    "Manage book categories and genres": "管理图书分类与题材",
    "Add Category": "添加分类",
    "Total Categories": "分类总数",
    "Average Books": "平均图书数",
    "Category List": "分类列表",
    "Create Category": "创建分类",
    "No categories yet.": "暂无分类。",
    "Add New Category": "新增分类",
    "Category Name": "分类名称",
    "Book Count": "图书数量",
    Icon: "图标",
    Technology: "科技",
    Education: "教育",
    Business: "商业",
    History: "历史",
    "Please complete all category fields.": "请完整填写分类信息。",
    "Please enter category name.": "请输入分类名称。",
    "Category added successfully.": "分类添加成功。",
    "Save Category": "保存分类",
    books: "本图书",
    "Books Read": "已读图书",
    "Complete Leaderboard": "完整排行榜",
    "All Time": "全部时间",
    "This Month": "本月",
    "This Week": "本周",
    Rank: "排名",
    Reader: "读者",
    "Member Since": "注册时间",
    Trend: "趋势",
    "CPU Usage": "CPU 使用率",
    Memory: "内存",
    "Disk Usage": "磁盘使用率",
    "Network I/O": "网络 I/O",
    "System Resources": "系统资源",
    "Live Activity Log": "实时活动日志",
    "Services Status": "服务状态",
    "Gutenberg API": "Gutenberg API",
    Timeout: "超时",
    "Open Library API": "Open Library API",
    Notifications: "通知",
    "New Reader": "新读者",
    "When someone starts reading your book": "当有人开始阅读你的图书时",
    "Book Approved": "图书已批准",
    "When admin approves your submission": "当管理员批准你的提交时",
    "Weekly Report": "每周报告",
    "Weekly analytics summary email": "每周分析摘要邮件",
    "New Comment": "新评论",
    "When someone comments on your book": "当有人评论你的图书时",
    "Save Notifications": "保存通知设置",
    "Change Password": "修改密码",
    "Current password": "当前密码",
    "New password": "新密码",
    "Confirm new password": "确认新密码",
    "Update Password": "更新密码",
    "Missing login token. Please login again.": "缺少登录令牌，请重新登录。",
    "Password updated successfully.": "密码更新成功。",
    "Network error. Please try again.": "网络错误，请重试。",
    Preferences: "偏好设置",
    "Preferred Language": "首选语言",
    English: "英语",
    Khmer: "高棉语",
    "Chinese (China)": "中文（中国）",
    Theme: "主题",
    Dark: "深色",
    Light: "浅色",
    "Search users...": "搜索用户...",
    "All Roles": "全部角色",
    User: "用户",
    ID: "编号",
    Role: "角色",
    "First Name": "名",
    "Last Name": "姓",
    Email: "邮箱",
    "Created At": "创建时间",
    "Loading users...": "正在加载用户...",
    Save: "保存",
    Cancel: "取消",
    Edit: "编辑",
    Delete: "删除",
    "No users found.": "未找到用户。",
    "First name, last name, and email are required.": "名字、姓氏和邮箱为必填项。",
    "Failed to update user.": "更新用户失败。",
    "User updated successfully.": "用户更新成功。",
    "Failed to delete user.": "删除用户失败。",
    "User deleted successfully.": "用户删除成功。",
    "Delete user \"{name}\"?": "删除用户“{name}”吗？",
    "Failed to load users.": "加载用户失败。",
  },
};

function getSavedLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const candidate =
    window.localStorage.getItem(LANGUAGE_KEY) ||
    window.localStorage.getItem(LEGACY_LANGUAGE_KEY) ||
    DEFAULT_LANGUAGE;

  return SUPPORTED_LANGUAGES.includes(candidate) ? candidate : DEFAULT_LANGUAGE;
}

function formatTemplate(template, vars) {
  if (!vars || typeof vars !== "object") {
    return template;
  }

  return String(template).replace(/\{(\w+)\}/g, (_, token) => {
    const replacement = vars[token];
    return replacement == null ? `{${token}}` : String(replacement);
  });
}

function translate(language, key, vars) {
  const langMap = translations[language] || {};
  const text = langMap[key] || key;
  return formatTemplate(text, vars);
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => getSavedLanguage());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const resolvedLanguage = SUPPORTED_LANGUAGES.includes(language)
      ? language
      : DEFAULT_LANGUAGE;
    window.localStorage.setItem(LANGUAGE_KEY, resolvedLanguage);
    window.localStorage.setItem(LEGACY_LANGUAGE_KEY, resolvedLanguage);
    document.documentElement.setAttribute("data-language", resolvedLanguage);
    document.documentElement.lang = resolvedLanguage;
  }, [language]);

  const setLanguage = (nextLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) {
      setLanguageState(DEFAULT_LANGUAGE);
      return;
    }
    setLanguageState(nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => translate(language, key, vars),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return context;
}
