// ═══════════════════════════════════════════════════════════════════════════
// BOT KARED STUDIO v13.3 — FULL (Fix Lỗi + Tính Năng Mới)
// ═══════════════════════════════════════════════════════════════════════════
const fs = require("fs");
const path = require("path");
const login = require("ws3-fca");

const {
  KHUNG_GIO, XOA_REGEX,
  findMatches, getMatchDetail, findPlayer,
  toTimestamp, todayVN,
} = require("./ffGarena");
const { computeChampionBoard, mergeTeams } = require("./ffChampion");
const ffImg = require("./ffImages");
const { handleTuTien } = require("./tutien");
const { handleHoSo } = require("./hs");
const { handleQrLogic } = require("./qr");

function loadConfigFile() {
  try {
    const configPath = require.resolve("./config");
    delete require.cache[configPath];
    return require("./config");
  } catch (e) { return {}; }
}
let CONFIG_FILE = loadConfigFile();

process.on("unhandledRejection", (r) => console.error("⚠️ Unhandled:", r));
process.on("uncaughtException", (e) => console.error("⚠️ Uncaught:", e));

let BOT_NAME = CONFIG_FILE.BOT_NAME || "KARED STUDIO BOT";
let BOT_VERSION = CONFIG_FILE.BOT_VERSION || "13.3.0";
let ADMIN_IDS = (Array.isArray(CONFIG_FILE.ADMIN_IDS) ? CONFIG_FILE.ADMIN_IDS : []).map(s => String(s).trim()).filter(Boolean);
const SERVER_STARTED_AT = Date.now();

const loadJson = (name, fallback) => {
  const f = path.join(__dirname, name);
  try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf-8")); }
  catch (e) { console.error(`loadJson(${name}):`, e.message); }
  return fallback;
};
const saveJson = (name, data) => {
  try { fs.writeFileSync(path.join(__dirname, name), JSON.stringify(data, null, 2), "utf-8"); }
  catch (e) { console.error(`saveJson(${name}):`, e.message); }
};

const CONFIG = loadJson("config.json", { prefix: CONFIG_FILE.PREFIX || ".", botName: BOT_NAME });
const USERS = loadJson("users.json", {});
const GROUPS = loadJson("groups.json", {});
const CTV = loadJson("ctv.json", []);
let KEYS = loadJson("keys.json", {});
const BANS = loadJson("bans.json", {});
const TX_DATA = loadJson("taixiu.json", {});
const AUTOKICK_DATA = loadJson("autokick.json", {});
const OTT_ROOMS = {};
const MESSAGE_CACHE = {}; // Bộ nhớ đệm chống thu hồi

const CDM_LIST = loadJson("cdm.json", [
  "Mày là thằng ngu nhất tao từng gặp 😂", "Bớt xàm đi, kiếm gì làm đi 💩",
  "Ngu thì đừng nói nhiều 🤡", "Đần độn vừa thôi, nhức đầu quá 🤮",
  "Sủa ít thôi con chó 🐕", "Về học lại lớp 1 đi 📚",
  "Tao đéo rảnh nghe mày sủa 💤", "Mày nói nhiều mà chả ai nghe đâu 🗣️",
]);

const QTV_CAM_LIST = [
  "┏━━━━━━━━━━━━━┓\n┃ ⚠️ TỪ CHỐI TRUY CẬP ┃\n┗━━━━━━━━━━━━━┛\nĐạo hữu thân mến,\nCăn cơ ngươi còn kém, tu vi chưa tới. Chưa đủ tư cách vận hành pháp bảo của bản môn!\n👉 Hãy quay về động phủ tu luyện thêm ngàn năm nữa, hoặc xin Trưởng Lão (QTV) cấp lệnh bài!",
  "┏━━━━━━━━━━━━━┓\n┃ 🛑 PHONG ẤN BẢO VẬT ┃\n┗━━━━━━━━━━━━━┛\nNgươi là phàm nhân, lại dám xông vào Đại Trận hộ sơn?\nPháp bảo này chỉ dành cho Trưởng Lão (QTV). Cố tình vượt quyền, cẩn thận Thiên Lôi giáng xuống đầu! ⚡",
  "┏━━━━━━━━━━━━━┓\n┃ 🧘 CĂN CƠ BẤT ỔN ┃\n┗━━━━━━━━━━━━━┛\nHỡi tiểu bối,\nLinh lực cạn kiệt, thần thức mờ nhạt, không thể điều khiển lệnh bài này đâu. Về rửa bát, quét lá đa thêm ngàn năm nữa rồi hãy quay lại! 🍵",
  "┏━━━━━━━━━━━━━┓\n┃ 🔒 KẾT GIỚI CHẶN ┃\n┗━━━━━━━━━━━━━┛\nNày phàm nhân,\nNgươi tưởng đây là chợ đời chắc mà muốn bấm gì thì bấm? Trận pháp này do chính tay QTV bố trí, kẻ không có lệnh bài dám xông vào đều bị đánh bay ra ngoài! 🌪️",
  "┏━━━━━━━━━━━━━┓\n┃ 💀 THIÊN LÔI CẢNH BÁO ┃\n┗━━━━━━━━━━━━━┛\nNgươi dám vượt quyền?\nTu vi Luyện Khí kỳ mà đòi dùng lệnh của Nguyên Anh kỳ, thật nực cười! Mau quỳ xuống xin lỗi QTV đi! 🙇‍♂️",
  "┏━━━━━━━━━━━━━┓\n┃ 🛡️ LỆNH BÀI KHÔNG HỢP LỆ ┃\n┗━━━━━━━━━━━━━┛\nThần thức của ta đã quét qua, ngươi không phải người của bản môn.\nHãy về động phủ của mình mà tu luyện, đừng phá rối thanh tịnh của QTV! 🧘‍♀️",
  "┏━━━━━━━━━━━━━┓\n┃ 🌪️ PHONG BA BÃO TÁP ┃\n┗━━━━━━━━━━━━━┛\nNgươi đang cố dùng pháp lực của mình để đấu với thiên đạo QTV sao?\nBớt ảo tưởng sức mạnh đi, tu vi của ngươi còn thua cả con linh thú giữ nhà! 🐶",
  "┏━━━━━━━━━━━━━┓\n┃ ⛩️ ĐẠI TRẬN HỘ SƠN ┃\n┗━━━━━━━━━━━━━┛\nDừng tay!\nTrận pháp này không phải ai muốn bấm là bấm đâu. Ngươi tưởng mình là Thiên Tôn chắc? Mau quỳ xuống gọi QTV đi! 🙇‍♂️",
  "┏━━━━━━━━━━━━━┓\n┃ 🐉 LONG UY ┃\n┗━━━━━━━━━━━━━┛\nNgươi đang ở địa bàn của QTV, là rồng thì phải cuộn, là hổ thì phải nằm!\nMới nhú được tí linh khí mà đã lên mặt, đúng là không biết lượng sức! 🐜",
  "┏━━━━━━━━━━━━━┓\n┃ 💊 HẾT THUỐC CHỮA ┃\n┗━━━━━━━━━━━━━┛\nHết thuốc chữa rồi!\nĐan dược cũng không cứu nổi sự ngu ngốc của ngươi. Ngoan ngoãn nhìn QTV xài lệnh đi, đừng có bon chen! 🍿",
  "┏━━━━━━━━━━━━━┓\n┃ 🧙‍♂️ TRƯỞNG LÃO ĐANG BẬN ┃\n┗━━━━━━━━━━━━━┛\nTiểu bối, ngươi làm ta nhớ đến mấy tên tán tu nghèo rớt mồng tơi mà hay sĩ diện!\nCút! Đừng làm bẩn đạo tràng thanh tịnh của bổn tọa! 🍃"
];

const saveUsers = () => saveJson("users.json", USERS);
const saveGroups = () => saveJson("groups.json", GROUPS);
const saveConfig = () => saveJson("config.json", CONFIG);
const saveCtv = () => saveJson("ctv.json", CTV);
const saveKeys = () => saveJson("keys.json", KEYS);
const saveBans = () => saveJson("bans.json", BANS);
const saveTx = () => saveJson("taixiu.json", TX_DATA);
const saveAutokick = () => saveJson("autokick.json", AUTOKICK_DATA);

let globalDelayUntil = 0;

let cleanedCount = 0;
for (const [code, k] of Object.entries(KEYS)) {
  if (k.usedBy || k.stopped) { delete KEYS[code]; cleanedCount++; }
}
if (cleanedCount > 0) { saveKeys(); console.log(`🧹 Đã tự động xóa ${cleanedCount} key!`); }

function ensureUser(uid, name = "") {
  const id = String(uid);
  if (!USERS[id]) USERS[id] = { name, createdAt: Date.now() };
  if (name && !USERS[id].name) USERS[id].name = name;
  saveUsers();
  return USERS[id];
}
function ensureGroup(tid, name = "") {
  const id = String(tid);
  if (!GROUPS[id]) {
    GROUPS[id] = {
      name, prefix: CONFIG.prefix, anti: { spam: false, link: false, tagall: false, boxname: false, theme: false, thuhoi: false, warns: {} },
      lockchat: false, qtvonly: false, key: null, expiresAt: 0, rentedAt: 0, rentedBy: null,
      blacklist: {}, notified1Day: false
    };
  } else {
    if (!GROUPS[id].anti) GROUPS[id].anti = { spam: false, link: false, tagall: false, boxname: false, theme: false, thuhoi: false, warns: {} };
    if (GROUPS[id].anti.boxname === undefined) GROUPS[id].anti.boxname = false;
    if (GROUPS[id].anti.theme === undefined) GROUPS[id].anti.theme = false;
    if (GROUPS[id].anti.thuhoi === undefined) GROUPS[id].anti.thuhoi = false;
    if (!GROUPS[id].anti.warns) GROUPS[id].anti.warns = {};
  }
  if (name && !GROUPS[id].name) GROUPS[id].name = name;
  saveGroups();
  return GROUPS[id];
}
function getPrefix(tid, isGroup) {
  if (isGroup && GROUPS[tid]?.prefix) return GROUPS[tid].prefix;
  return CONFIG.prefix || ".";
}
const isAdmin = (id) => ADMIN_IDS.includes(String(id));
const isCtv = (id) => CTV.includes(String(id));
const isStaff = (id) => isAdmin(id) || isCtv(id);

async function isGroupAdmin(api, threadId, userId) {
  try {
    const threadInfo = await new Promise((resolve) => api.getThreadInfo(threadId, (e, r) => resolve(e ? null : r)));
    if (threadInfo && threadInfo.adminIDs) {
      return threadInfo.adminIDs.some(admin => String(admin.id) === String(userId));
    }
  } catch (e) { }
  return false;
}

function isBoxRented(tid) {
  const g = GROUPS[String(tid)];
  return !!(g?.expiresAt && g.expiresAt > Date.now());
}
function boxTimeLeft(tid) {
  const g = GROUPS[String(tid)];
  if (!g?.expiresAt || g.expiresAt <= Date.now()) return 0;
  return g.expiresAt - Date.now();
}

function getBanInfo(userId) {
  const b = BANS[String(userId)];
  if (b && b.expiresAt > Date.now()) return b;
  return null;
}

function parseCustomDateTime(dateStr, timeStr) {
  try {
    const [d, m, y] = dateStr.split("/");
    const timeClean = timeStr.toLowerCase().replace("h", ":");
    let [h, min] = timeClean.split(":");
    if (!min) min = "00";
    h = String(h).padStart(2, "0");
    min = String(min).padStart(2, "0");
    return Math.floor(new Date(`${y}-${m}-${d}T${h}:${min}:00+07:00`).getTime() / 1000);
  } catch (e) { return null; }
}

async function updateBotNickname(api, threadId, expiresAt) {
  try {
    let newNickname = "";
    if (!expiresAt || expiresAt <= Date.now()) {
      newNickname = `🤖KARED STUDIO BOT🤖 | CHƯA THUÊ`;
    } else {
      const msLeft = expiresAt - Date.now();
      let daysLeft = Math.ceil(msLeft / 86400000);
      if (daysLeft < 0) daysLeft = 0;
      newNickname = `🤖KARED STUDIO BOT🤖 | HSD ${daysLeft} Ngày`;
    }
    
    const botID = api.getCurrentUserID();
    if (newNickname.length <= 50) {
      api.changeNickname(newNickname, threadId, botID, (err) => {
        if (err) console.log(`[CẢNH BÁO] Không thể đổi tên Bot tại box ${threadId}:`, err.error || err);
      });
    }
  } catch (e) { console.error("Lỗi hàm updateBotNickname:", e); }
}

function formatUptime(msVal) {
  const s = Math.floor(msVal / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const p = [];
  if (d) p.push(`${d} ngày`);
  if (h) p.push(`${h} giờ`);
  if (m) p.push(`${m} phút`);
  if (!d && !h) p.push(`${s % 60} giây`);
  return p.join(" ");
}
function todayName() {
  return ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][new Date().getDay()];
}
function timeVN() {
  const n = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const hh = String(n.getHours()).padStart(2, "0");
  const mm = String(n.getMinutes()).padStart(2, "0");
  const ss = String(n.getSeconds()).padStart(2, "0");
  const dd = String(n.getDate()).padStart(2, "0");
  const mo = String(n.getMonth() + 1).padStart(2, "0");
  return { t: `${hh}:${mm}:${ss}`, d: `${dd}/${mo}/${n.getFullYear()}` };
}
function fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

let api = null;

const reactMessage = (emoji, msgId, tid) => {
  if (!msgId) return;
  try {
    api.setMessageReaction(emoji, msgId, tid, (err) => {
      if (err) console.error("Lỗi thả icon:", err);
    });
  } catch (e) {}
};

const sendText = (tid, msg, unsendDelay = 120000) => new Promise((res) => {
  api.sendMessage(msg, tid, (e, info) => { 
    if (e) { console.error(`sendText→${tid}:`, e.message); return res(null); }
    if (unsendDelay > 0) {
      setTimeout(() => {
        if (info && info.messageID) api.unsendMessage(info.messageID, () => {});
      }, unsendDelay);
    }
    res(info ? info.messageID : null); 
  });
});

const sendPhoto = (tid, buffer, caption = "") => new Promise((res) => {
  const tmp = path.join(__dirname, `temp_image_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`);
  try { fs.writeFileSync(tmp, buffer); } catch (e) { return res(null); }
  api.sendMessage({ body: caption, attachment: fs.createReadStream(tmp) }, tid, (e, info) => {
    setTimeout(() => { try { fs.unlinkSync(tmp); } catch {} }, 5000);
    if (e) console.error(`sendPhoto→${tid}:`, e.message);
    res(info ? info.messageID : null);
  });
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function boxNotRentedMessage(prefix) {
  return (
    "┏━━━━━━━━━━━━━┓\n" +
    "┃ 🔒 BOX CHƯA THUÊ ┃\n" +
    "┗━━━━━━━━━━━━━┛\n\n" +
    "⚠️ Box này chưa kích hoạt dịch vụ bot!\n" +
    "🚫 Vui lòng liên hệ Admin để thuê bot.\n\n" +
    `📋 Sau khi mua KEY, gõ:\n` +
    `   ${prefix}key nhap <MÃ_KEY>\n` +
    "để kích hoạt box ngay lập tức.\n\n" +
    "────────────────────\n" +
    "💡 Xem hướng dẫn: " + prefix + "help\n" +
    `👑 Liên hệ Admin: ${ADMIN_IDS.length ? "\n" + ADMIN_IDS.map(a => "   • " + a).join("\n") : "chưa cấu hình"}\n` +
    "────────────────────"
  );
}

const COMMANDS = [
  { name: "boxinfo",   group: "tienich", desc: "Xem thông tin box hiện tại" },
  { name: "boxlist",   group: "tienich", desc: "Xem tất cả box bot đang ở" },
  { name: "cdm",       group: "tienich", desc: "Chửi đổng mồm" },
  { name: "hs",        group: "tienich", desc: "Quản lý tên team" },
  { name: "hsg",       group: "tienich", desc: "Xem hồ sơ nhóm" },
  { name: "id",        group: "tienich", desc: "Xem ID người dùng" },
  { name: "menu",      group: "tienich", desc: "Xem menu bot" },
  { name: "td",        group: "tienich", desc: "Xem BXH Free Fire" },
  { name: "tdlg",      group: "tienich", desc: "Xem BXH (Áp dụng tên Team)" },
  { name: "tt",        group: "tienich", desc: "Hệ thống Tu Tiên" },
  { name: "tx",        group: "tienich", desc: "Hệ thống Tài Xỉu Tiên Ảo" },
  { name: "ott",       group: "tienich", desc: "Game Oẳn Tù Tì" },
  { name: "unsend",    group: "tienich", desc: "Thu hồi tin nhắn Bot (Reply)" },
  { name: "setqr",     group: "tienich", desc: "Cấu hình QR chuyển khoản cho box" },
  { name: "qtv",       group: "nhom", desc: "Xem DS QTV trong nhóm" },
  { name: "addqtv",    group: "nhom", desc: "Thêm QTV (Reply)" },
  { name: "anti",      group: "nhom", desc: "Bật/tắt chống phá nhóm" },
  { name: "canhbao",   group: "nhom", desc: "Cảnh báo thành viên (Đủ 5 lần tự kick)" },
  { name: "resetcanhbao", group: "nhom", desc: "Reset cảnh báo anti-spam (Reply)" },
  { name: "capnhom",   group: "nhom", desc: "Cấp quyền thủ công (admin)" },
  { name: "lockchat",  group: "nhom", desc: "Khoá chat nhóm" },
  { name: "out",       group: "nhom", desc: "Bot rời nhóm" },
  { name: "qtvonly",   group: "nhom", desc: "Chỉ QTV được chat" },
  { name: "setprefix", group: "nhom", desc: "Đổi prefix bot trong nhóm" },
  { name: "setname",   group: "nhom", desc: "Đổi/Gỡ biệt danh (bản thân/Reply)" },
  { name: "key",       group: "admin", desc: "Quản lý KEY thuê box" },
  { name: "ban",       group: "admin", desc: "Ban người dùng (admin)" },
  { name: "unban",     group: "admin", desc: "Gỡ ban (admin)" },
  { name: "delay",     group: "admin", desc: "Tạm dừng bot (admin)" },
  { name: "xtg",       group: "admin", desc: "Xóa thời gian thuê box" },
  { name: "tb",        group: "admin", desc: "Thông báo đến tất cả nhóm (admin)" },
  { name: "nd",        group: "admin", desc: "Gửi thông báo (text/ảnh) đến nhóm (admin)" },
  { name: "lineup",    group: "admin", desc: "Lên lịch bắn Cus cho nhóm (admin)" },
  { name: "setmoney",  group: "admin", desc: "Set tiền tài xỉu cho người chơi (admin)" },
  { name: "autokick",  group: "admin", desc: "Auto kick (Blacklist) người dùng (admin)" },
  { name: "admin",        group: "hethong", desc: "Xem admin bot" },
  { name: "command",      group: "hethong", desc: "Chạy lệnh shell (admin)" },
  { name: "reloadconfig", group: "hethong", desc: "Reload config" },
  { name: "restart",      group: "hethong", desc: "Khởi động lại bot" },
  { name: "upt",          group: "hethong", desc: "Uptime bot" },
  { name: "kick",    group: "group", desc: "Kick 1 thành viên" },
  { name: "kickall", group: "group", desc: "Kick toàn bộ (admin)" },
  { name: "nhanvien", group: "admin", desc: "Quản lý nhân viên (CTV)" },
  { name: "thuebot",  group: "admin", desc: "Hướng dẫn thuê bot" },
  { name: "backup", group: "khac", desc: "Backup dữ liệu" },
  { name: "uptime", group: "thongtin", desc: "Thời gian hoạt động bot" },
  { name: "bank", group: "tienich", desc: "Hệ thống Ngân hàng" },
  { name: "sodu", group: "tienich", desc: "Xem số dư" },
  { name: "lichsu", group: "tienich", desc: "Lịch sử giao dịch" },
];

const GROUPS_INFO = {
  tienich:  { label: "TIỆN ÍCH",  emoji: "🛠️" }, nhom: { label: "NHÓM", emoji: "👥" },
  hethong:  { label: "HỆ THỐNG",  emoji: "⚙️" }, group: { label: "GROUP", emoji: "🎛️" },
  admin:    { label: "ADMIN",     emoji: "👑" }, khac: { label: "KHÁC", emoji: "📦" },
  tutien:   { label: "TU TIÊN",   emoji: "🧙" }, thongtin: { label: "THÔNG TIN", emoji: "ℹ️" },
};

function buildMenu() {
  const { t, d } = timeVN();
  const order = ["tienich", "nhom", "hethong", "group", "admin", "khac", "thongtin"];
  let out = "", total = 0;
  for (const g of order) {
    const list = COMMANDS.filter(c => c.group === g).map(c => c.name);
    if (!list.length) continue;
    total += list.length;
    out += `[ ${GROUPS_INFO[g].label} ]\n📝 Tổng lệnh: ${list.length} lệnh\n${list.join(", ")}\n\n`;
  }
  out += `📝 Tổng số lệnh: ${total} lệnh\n👤 Tổng số admin bot: ${ADMIN_IDS.length}\n👾 Tên Bot: ${BOT_NAME}\n⏰ Hôm nay là: ${todayName()}\n⏱️ Thời gian: ${t} | ${d}\n\n📌 Prefix: "${CONFIG.prefix}"\n.help + tên lệnh để xem chi tiết\n.help + all để xem tất cả lệnh`;
  return out;
}

function buildHelpAll() {
  const order = ["tienich", "nhom", "hethong", "group", "admin", "khac", "thongtin"];
  let out = `📖 TẤT CẢ LỆNH — ${BOT_NAME}\n\n`;
  for (const g of order) {
    const list = COMMANDS.filter(c => c.group === g);
    if (!list.length) continue;
    out += `${GROUPS_INFO[g].emoji} [ ${GROUPS_INFO[g].label} ]\n`;
    for (const c of list) out += `▫️ ${c.name} — ${c.desc}\n`;
    out += "\n";
  }
  return out.trim();
}

function buildHelpCmd(name) {
  const c = COMMANDS.find(x => x.name.toLowerCase() === name.toLowerCase());
  if (!c) return null;
  let extra = "";
  if (c.name === "key") {
    extra = "\n\n📋 CÁCH DÙNG:\n  👑 ADMIN:\n" +
      `    ${CONFIG.prefix}key tao <mã> <ngày>       — Tạo key mới\n` +
      `    ${CONFIG.prefix}key tao auto <ngày>       — Tạo key auto (VIP1...)\n` +
      `    ${CONFIG.prefix}key list                  — Danh sách key\n` +
      `    ${CONFIG.prefix}key info <mã>             — Chi tiết key\n` +
      `    ${CONFIG.prefix}key xoa <mã>              — Xoá key\n` +
      `    ${CONFIG.prefix}key stop <mã>             — Dừng/Huỷ key vĩnh viễn\n` +
      `    ${CONFIG.prefix}key giahan <mã> <ngày>    — Gia hạn key\n` +
      `    ${CONFIG.prefix}key giahan box <ngày>     — Gia hạn box hiện tại\n` +
      `    ${CONFIG.prefix}key box                   — DS box đang thuê\n\n` +
      "  👤 THÀNH VIÊN:\n" +
      `    ${CONFIG.prefix}key nhap <mã>             — Nhập key thuê box (1 lần)`;
  }
  if (c.name === "td") {
    extra = "\n\n📋 VÍ DỤ:\n" +
      `  ${CONFIG.prefix}td 4252953187                — BXH thường\n` +
      `  ${CONFIG.prefix}td 4252953187 cpr            — BXH Vô Địch (≥50đ)\n` +
      `  ${CONFIG.prefix}td 4252953187 cpr40          — ngưỡng 40đ\n` +
      `  ${CONFIG.prefix}td 4252953187 cpr40 xoa3     — bỏ trận #3\n` +
      `  ${CONFIG.prefix}td 4252953187 02/11/2026 21h50 02/11/2026 23h00 — Tính giờ tự do\n\n` +
      `🖼️ Bot sẽ hỏi chọn mẫu ảnh (1-47).`;
  }
  if (c.name === "tdlg") {
    extra = "\n\n📋 VÍ DỤ:\n" +
      `  ${CONFIG.prefix}tdlg 4252953187               — BXH thường (Áp dụng tên Team)\n` +
      `  ${CONFIG.prefix}tdlg 4252953187 cpr           — BXH Vô Địch (Áp dụng tên Team)\n` +
      `  ${CONFIG.prefix}tdlg 4252953187 cpr40 xoa3    — bỏ trận #3\n\n` +
      `🖼️ Bot sẽ hỏi chọn mẫu ảnh (1-47).`;
  }
  if (c.name === "nhanvien") {
    extra = "\n\n📋 CÁCH DÙNG (hỗ trợ Reply):\n" +
      `  • ${CONFIG.prefix}nhanvien                        — Xem DS CTV\n` +
      `  • Reply tin ai đó + ${CONFIG.prefix}nhanvien add     — Thêm CTV\n` +
      `  • Reply tin ai đó + ${CONFIG.prefix}nhanvien remove  — Gỡ CTV\n` +
      `  • ${CONFIG.prefix}nhanvien add <ID>               — Thêm bằng ID`;
  }
  if (c.name === "setname") {
    extra = "\n\n📋 VÍ DỤ:\n" + 
      `  ${CONFIG.prefix}setname Kared Đẹp Trai — Đổi tên của chính bạn\n` +
      `  ${CONFIG.prefix}setname — (Gõ không có tên) để GỠ TÊN, trả về tên thật\n` +
      `  Reply tin nhắn ai đó + ${CONFIG.prefix}setname Ngu Ngốc — Đổi tên người đó\n` +
      `  Reply tin nhắn ai đó + ${CONFIG.prefix}setname — Gỡ tên người đó\n\n` +
      `💡 Lệnh này dùng để đổi/gỡ biệt danh trong nhóm (Chỉ QTV nhóm/Admin/CTV).`;
  }
  if (c.name === "tt") { extra = `\n\n📋 Gõ ${CONFIG.prefix}tt menu để xem toàn bộ lệnh Tu Tiên.`; }
  if (c.name === "tx") {
    extra = `\n\n📋 HƯỚNG DẪN:\n` +
      `  🎁 ${CONFIG.prefix}tx diemdanh — Nhận 100$ - 1000$\n` +
      `  🎲 ${CONFIG.prefix}tx tai <tiền> — Cược Tài (11-18)\n` +
      `  🎲 ${CONFIG.prefix}tx xiu <tiền> — Cược Xỉu (3-10)\n` +
      `  📌 VD: ${CONFIG.prefix}tx tai 500`;
  }
  if (c.name === "ott") {
    extra = `\n\n📋 CÁCH CHƠI:\n` +
      `  1️⃣ Tạo bàn: ${CONFIG.prefix}ott <tiền> <kèo> (VD: ${CONFIG.prefix}ott 10000 3kq)\n` +
      `  2️⃣ Tham gia: Reply tin nhắn tạo bàn + ${CONFIG.prefix}ott join\n` +
      `  3️⃣ Chọn: Reply tin nhắn bắt đầu + ${CONFIG.prefix}ott bua / bao / keo\n` +
      `  *Cược tối thiểu 2.000$, tối đa: 5.000.000$*`;
  }
  if (c.name === "hs") { extra = `\n\n📋 Gõ ${CONFIG.prefix}hs add <ID>, <tên> để lưu tên team.`; }
  if (c.name === "unsend") { extra = `\n\n📋 Reply vào tin nhắn của Bot rồi gõ ${CONFIG.prefix}unsend để thu hồi.`; }
  if (c.name === "addqtv") { extra = `\n\n📋 Reply vào tin nhắn của người muốn thêm rồi gõ ${CONFIG.prefix}addqtv.`; }
  if (c.name === "ban") { extra = `\n\n📋 Cú pháp: ${CONFIG.prefix}ban <ID/tag/reply> <số ngày> [lý do]\n📋 Xem DS: ${CONFIG.prefix}ban list`; }
  if (c.name === "delay") { extra = `\n\n📋 Cú pháp: ${CONFIG.prefix}delay <số giây>\nVD: ${CONFIG.prefix}delay 10`; }
  if (c.name === "xtg") { extra = `\n\n📋 Cú pháp:\n  ${CONFIG.prefix}xtg list\n  ${CONFIG.prefix}xtg all\n  Reply STT để xóa.`; }
  if (c.name === "boxlist") { extra = `\n\n📋 Xem danh sách tất cả các box bot đang ở.`; }
  if (c.name === "setqr") { extra = `\n\n📋 CÁCH DÙNG:\n  ${CONFIG.prefix}setqr\n  Nhập: <Ngân hàng> | <STK> | <Tên chủ TK>\n  Sau đó gửi ảnh QR.`; }
  if (c.name === "tb") { extra = `\n\n📋 Cú pháp: ${CONFIG.prefix}tb <nội dung>`; }
  if (c.name === "nd") { extra = `\n\n📋 CÁCH DÙNG:\n  ${CONFIG.prefix}nd list\n  Reply STT nhóm.\n  Reply nội dung.`; }
  if (c.name === "lineup") { extra = `\n\n📋 CÁCH DÙNG:\n  ${CONFIG.prefix}lineup <STT> <Giờ> - <Tên 1>, <Tên 2>...`; }
  if (c.name === "setmoney") { extra = `\n\n📋 Cú pháp:\n  ${CONFIG.prefix}setmoney <ID/tag/reply> <số tiền>`; }
  if (c.name === "autokick") { extra = `\n\n📋 Cú pháp:\n  Reply + ${CONFIG.prefix}autokick <số ngày>\n  Reply + ${CONFIG.prefix}autokick all <số ngày>`; }
  if (c.name === "anti") {
    extra = `\n\n📋 CÁCH DÙNG:\n` +
      `  ${CONFIG.prefix}anti on/off — Bật/tắt toàn bộ\n` +
      `  ${CONFIG.prefix}anti link on/off — Chống gửi link\n` +
      `  ${CONFIG.prefix}anti tagall on/off — Chống tag all\n` +
      `  ${CONFIG.prefix}anti boxname on/off — Chống đổi tên nhóm\n` +
      `  ${CONFIG.prefix}anti cxn on/off — Chống đổi theme & thu hồi\n` +
      `  ${CONFIG.prefix}anti spam on/off — Chống spam (3 tin/5s)\n` +
      `  ${CONFIG.prefix}resetcanhbao (Reply) — Reset cảnh báo spam`;
  }
  if (c.name === "canhbao") {
    extra = `\n\n📋 Cú pháp:\n  Reply + ${CONFIG.prefix}canhbao [lý do]\n  (Đủ 5 lần cảnh báo sẽ tự động kick)`;
  }
  return `📖 CHI TIẾT LỆNH: ${c.name}\n\n${GROUPS_INFO[c.group].emoji} Nhóm: ${GROUPS_INFO[c.group].label}\n📝 Mô tả: ${c.desc}\n\nGõ ${CONFIG.prefix}${c.name} để dùng.${extra}`;
}

const spamTracker = {};
function checkSpam(tid, uid) {
  const k = `${tid}:${uid}`;
  const now = Date.now();
  const recent = (spamTracker[k] || []).filter(t => now - t < 5000); // Sửa thành 5s
  recent.push(now); spamTracker[k] = recent;
  return recent.length >= 3;
}
setInterval(() => {
  const now = Date.now();
  for (const k of Object.keys(spamTracker)) {
    spamTracker[k] = spamTracker[k].filter(t => now - t < 5000);
    if (!spamTracker[k].length) delete spamTracker[k];
  }
}, 30000);
const hasLink = (text) => /(https?:\/\/|www\.)\S+/i.test(text);
const hasTagAll = (text) => /@all\b|@everyone\b|@m[oọ]i\s*ng[uư][oờ]i/i.test(text);

async function drawSelectedTemplate(selected, sortedTeams, subtitle) {
  const map = {
    2:  () => ffImg.drawStandingsTemplateImage(sortedTeams, { subtitle }),
    3:  () => ffImg.drawBluelockTemplateImage(sortedTeams),
    4:  () => ffImg.drawHkTemplateImage(sortedTeams),
    5:  () => ffImg.drawChainTemplateImage(sortedTeams),
    6:  () => ffImg.drawFreefireTemplateImage(sortedTeams),
    7:  () => ffImg.drawFreefire2TemplateImage(sortedTeams),
    8:  () => ffImg.drawHxhTemplateImage(sortedTeams),
    9:  () => ffImg.drawMinecraftTemplateImage(sortedTeams),
    10: () => ffImg.drawKittyScrimTemplateImage(sortedTeams),
    11: () => ffImg.drawFreefireClassicTemplateImage(sortedTeams),
    12: () => ffImg.drawBluelockScrimTemplateImage(sortedTeams),
    13: () => ffImg.drawOverallStandingTemplateImage(sortedTeams),
    14: () => ffImg.drawSimpleBxhTemplateImage(sortedTeams),
    15: () => ffImg.drawBxhTongTemplateImage(sortedTeams),
    16: () => ffImg.drawKaitoDarkTemplateImage(sortedTeams),
    17: () => ffImg.drawKaitoLightTemplateImage(sortedTeams),
    18: () => ffImg.drawTetBxhTongTemplateImage(sortedTeams),
    19: () => ffImg.drawOnepieceTemplateImage(sortedTeams),
    20: () => ffImg.drawSrimTemplateImage(sortedTeams),
    21: () => ffImg.drawZoroTemplateImage(sortedTeams),
    22: () => ffImg.drawOverallStandingsAnimeTemplateImage(sortedTeams),
    23: () => ffImg.drawPurpleCatTemplateImage(sortedTeams),
    24: () => ffImg.drawPinkAnimeTemplateImage(sortedTeams),
    25: () => ffImg.drawOverallStandingRedTemplateImage(sortedTeams),
    26: () => ffImg.drawCyberCatTemplateImage(sortedTeams),
    27: () => ffImg.drawJjkTemplateImage(sortedTeams),
    28: () => ffImg.drawDragonballTemplateImage(sortedTeams),
    29: () => ffImg.drawSoldierTemplateImage(sortedTeams),
    30: () => ffImg.drawAnimeBlueBxhTongTemplateImage(sortedTeams),
    31: () => ffImg.drawDemonslayerTemplateImage(sortedTeams),
    32: () => ffImg.drawFfScrimYellowTemplateImage(sortedTeams),
    33: () => ffImg.drawNeonOverallStandingsTemplateImage(sortedTeams),
    34: () => ffImg.drawGreenBxhTemplateImage(sortedTeams),
    35: () => ffImg.drawOnepiece2TemplateImage(sortedTeams),
    36: () => ffImg.drawPurpleMhaTemplateImage(sortedTeams),
    37: () => ffImg.drawSpaceAnimeOverallStandingsTemplateImage(sortedTeams),
    38: () => ffImg.drawTodayStandingTemplateImage(sortedTeams),
    39: () => ffImg.drawBlue2PanelTemplateImage(sortedTeams),
    40: () => ffImg.drawPink2PanelTemplateImage(sortedTeams),
    41: () => ffImg.drawRedDemon2PanelTemplateImage(sortedTeams),
    42: () => ffImg.drawBlueRedSoccerTemplateImage(sortedTeams),
    43: () => ffImg.drawFfwsSeaTemplateImage(sortedTeams),
    44: () => ffImg.drawTokudaTemplateImage(sortedTeams),
    45: () => ffImg.drawFfwsVnTemplateImage(sortedTeams),
    46: () => ffImg.drawCr7TemplateImage(sortedTeams),
    47: () => ffImg.drawPeBaRoTemplateImage(sortedTeams),
  };
  if (map[selected]) {
    try { return await map[selected](); }
    catch (err) { return null; }
  }
  return null;
}

const pendingStep = {};
const tdPendingMsgs = {};

async function handleMessage({ threadId, userId, text, isGroup, senderName, message }) {
  if (Date.now() < globalDelayUntil && !isAdmin(userId)) return;

  try {
    const cfg = loadConfigFile(); CONFIG_FILE = cfg;
    if (cfg.BOT_NAME) BOT_NAME = cfg.BOT_NAME;
    if (cfg.BOT_VERSION) BOT_VERSION = cfg.BOT_VERSION;
    if (Array.isArray(cfg.ADMIN_IDS)) ADMIN_IDS = cfg.ADMIN_IDS.map(s => String(s).trim()).filter(Boolean);
  } catch (e) {}

  ensureUser(userId, senderName);
  if (isGroup) ensureGroup(threadId);

  const prefix = getPrefix(threadId, isGroup);
  const pendingKey = `${threadId}:${userId}`;
  const pending = pendingStep[pendingKey];

  // ═══════════ XỬ LÝ QR ═══════════
  const isOttCommand = text.toLowerCase().startsWith(`${prefix}ott`);

  if (isGroup && isBoxRented(threadId) && !isOttCommand) {
    try {
      const qrHandled = await handleQrLogic(
        userId, text, sendText, sendPhoto, threadId, prefix, message, pendingStep, pendingKey, ADMIN_IDS, CTV, api, isGroup
      );
      if (qrHandled !== false) return; 
    } catch (e) {
      console.error("QR handler error:", e.message);
    }
  }

  if (text.startsWith(prefix)) {
    const banInfo = getBanInfo(userId);
    if (banInfo && !isAdmin(userId)) {
      const daysLeft = Math.ceil((banInfo.expiresAt - Date.now()) / 86400000);
      return sendText(threadId, 
        `⛔ BẠN ĐANG BỊ BAN!\n\n` +
        `╭────────────────────────────╮\n` +
        `│ 🔒 Trạng thái: Đang bị khóa\n` +
        `│ 🚫 Lý do: ${banInfo.reason || "Không rõ"}\n` +
        `│ ⏳ Còn lại: ${daysLeft} ngày\n` +
        `│ 📆 Hết hạn: ${fmtDate(banInfo.expiresAt)}\n` +
        `╰────────────────────────────╯\n\n` +
        `⚠️ Bạn không thể sử dụng bot cho đến khi hết hạn ban.`
      );
    }
  }

  if (isGroup && !isBoxRented(threadId) && !isAdmin(userId)) {
    const t = text.toLowerCase().trim();
    const isAllowed = t === `${prefix}key` || t.startsWith(`${prefix}key `) ||
      t === `${prefix}help` || t.startsWith(`${prefix}help `) || t === `${prefix}menu` || t === `${prefix}id`;
    if (!isAllowed && text.startsWith(prefix)) return sendText(threadId, boxNotRentedMessage(prefix));
  }

  if (isGroup && GROUPS[threadId]?.qtvonly && text.startsWith(prefix)) {
    const isGroupQtv = await isGroupAdmin(api, threadId, userId);
    if (!isAdmin(userId) && !isCtv(userId) && !isGroupQtv) {
      const randomCam = QTV_CAM_LIST[Math.floor(Math.random() * QTV_CAM_LIST.length)];
      return sendText(threadId, `🚫 ${senderName || "Đạo hữu"} ơi,\n${randomCam}`, 120000);
    }
  }

  // ANTI SPAM VÀ CÁC ANTI KHÁC
  if (isGroup && !isStaff(userId)) {
    const g = GROUPS[threadId];
    const anti = g?.anti || {};

    if (anti.spam && checkSpam(threadId, userId)) {
      if (!anti.warns) anti.warns = {};
      anti.warns[userId] = (anti.warns[userId] || 0) + 1;
      
      if (anti.warns[userId] >= 5) {
        delete anti.warns[userId]; saveGroups();
        api.removeUserFromGroup(userId, threadId, () => {});
        return sendText(threadId, `🚫 ${senderName || userId} đã bị kick vì spam quá 5 lần!`, 120000);
      } else {
        saveGroups();
        return sendText(threadId, `🚫 ${senderName || userId} spam! Cảnh cáo lần ${anti.warns[userId]}/5.`, 120000);
      }
    }

    if (anti.link && hasLink(text)) {
      api.removeUserFromGroup(userId, threadId, () => {});
      return sendText(threadId, `🚫 ${senderName || userId} đã bị kick vì gửi link!`, 120000);
    }

    if (anti.tagall && hasTagAll(text)) {
      api.removeUserFromGroup(userId, threadId, () => {});
      return sendText(threadId, `🚫 ${senderName || userId} đã bị kick vì tag all!`, 120000);
    }
  }

  if (pending?.step === "khung") {
    const cleanText = text.trim();
    if (cleanText.startsWith(prefix)) {
      delete pendingStep[pendingKey];
      reactMessage("❌", message.messageID, threadId);
    } else if (/^[1-8]$/.test(cleanText)) {
      reactMessage("✅", message.messageID, threadId);
      pendingStep[pendingKey] = { ...pending, step: "date", soKhung: parseInt(cleanText) };
      const msgId = await sendText(threadId, `📅 Nhập ngày (DD/MM/YYYY)\nVD: ${todayVN()}`);
      if (msgId && pending.msgIdList) pending.msgIdList.push(msgId);
      return;
    } else {
      delete pendingStep[pendingKey];
      reactMessage("❌", message.messageID, threadId);
      return sendText(threadId, `❌ Bạn đã nhập sai. Vui lòng gõ lại lệnh ${prefix}${pending.command}`);
    }
  }
  
  if (pending?.step === "date") {
    const cleanText = text.trim();
    if (cleanText.startsWith(prefix)) {
      delete pendingStep[pendingKey];
      reactMessage("❌", message.messageID, threadId);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanText)) {
      reactMessage("✅", message.messageID, threadId);
      pendingStep[pendingKey] = { ...pending, step: "template", ngay: cleanText };
      const msgId = await sendText(threadId, "🖼️ CHỌN MẪU ẢNH BẢNG XẾP HẠNG (1-47)\n\n✏️ Nhập số từ 1 đến 47:");
      if (msgId && pending.msgIdList) pending.msgIdList.push(msgId);
      return;
    } else {
      delete pendingStep[pendingKey];
      reactMessage("❌", message.messageID, threadId);
      return sendText(threadId, `❌ Sai định dạng ngày. Vui lòng gõ lại lệnh ${prefix}${pending.command}`);
    }
  }
  
  if (pending?.step === "template") {
    const cleanText = text.trim();
    if (!/^([1-9]|[1-3][0-9]|4[0-7])$/.test(cleanText)) {
      reactMessage("❌", message.messageID, threadId);
      return sendText(threadId, "❌ Vui lòng nhập số từ 1 đến 47!");
    }
    reactMessage("✅", message.messageID, threadId);
    delete pendingStep[pendingKey];
    return await runTD(threadId, userId, pending, parseInt(cleanText), pending.command === "tdlg");
  }

  if (pending?.step === "ban_select" && !text.startsWith(prefix)) {
    const ids = text.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const banList = pending.banList;
    if (!ids.length) {
      reactMessage("❌", message.messageID, threadId);
      return sendText(threadId, `❌ Cú pháp: 1 hoặc 1,2,3`);
    }

    let removed = 0;
    for (const idx of ids) {
      if (idx >= 1 && idx <= banList.length) {
        const targetId = banList[idx - 1];
        if (BANS[targetId]) { delete BANS[targetId]; removed++; }
      }
    }
    if (removed > 0) reactMessage("✅", message.messageID, threadId);
    else reactMessage("❌", message.messageID, threadId);

    saveBans();
    delete pendingStep[pendingKey];
    return sendText(threadId, `✅ Đã gỡ ban cho ${removed} người!`);
  }

  if (pending?.step === "xtg_select" && !text.startsWith(prefix)) {
    const ids = text.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const boxList = pending.boxList;
    if (!ids.length) {
      reactMessage("❌", message.messageID, threadId);
      return sendText(threadId, `❌ Cú pháp: 1 hoặc 1,2,3`);
    }

    let removed = 0;
    for (const idx of ids) {
      if (idx >= 1 && idx <= boxList.length) {
        const tid = boxList[idx - 1];
        const g = GROUPS[tid];
        if (g) {
          g.expiresAt = 0;
          g.key = null;
          saveGroups();
          await updateBotNickname(api, tid, 0);
          removed++;
          await delay(500);
        }
      }
    }
    if (removed > 0) reactMessage("✅", message.messageID, threadId);
    else reactMessage("❌", message.messageID, threadId);
    
    delete pendingStep[pendingKey];
    return sendText(threadId, `✅ Đã xóa thời gian thuê của ${removed} box!`);
  }

  if (pending?.step === "autokick_select" && !text.startsWith(prefix)) {
    const ids = text.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const listIds = pending.listIds;
    if (!ids.length) {
      reactMessage("❌", message.messageID, threadId);
      return sendText(threadId, `❌ Cú pháp: 1 hoặc 1,2,3`);
    }

    let removed = 0;
    for (const idx of ids) {
      if (idx >= 1 && idx <= listIds.length) {
        const target = listIds[idx - 1];
        if (target.type === "global") {
          if (AUTOKICK_DATA[target.id]) { delete AUTOKICK_DATA[target.id]; removed++; }
        } else if (target.type === "group") {
          if (GROUPS[threadId]?.blacklist?.[target.id]) { delete GROUPS[threadId].blacklist[target.id]; removed++; }
        }
      }
    }
    
    if (removed > 0) reactMessage("✅", message.messageID, threadId);
    else reactMessage("❌", message.messageID, threadId);

    saveAutokick();
    saveGroups();
    delete pendingStep[pendingKey];
    return sendText(threadId, `✅ Đã xóa ${removed} người khỏi Sổ Tử Thần!`);
  }

  if (pending?.step === "nd_select" && !text.startsWith(prefix)) {
    const ids = text.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const boxList = pending.boxList;
    if (!ids.length) {
      reactMessage("❌", message.messageID, threadId);
      return sendText(threadId, `❌ Cú pháp: 1 hoặc 1,2,3`);
    }

    let selectedTids = [];
    for (const idx of ids) {
      if (idx >= 1 && idx <= boxList.length) selectedTids.push(boxList[idx - 1]);
    }

    if (!selectedTids.length) return sendText(threadId, "❌ Số thứ tự không hợp lệ!");

    pendingStep[pendingKey] = { step: "nd_content", selectedTids };
    return sendText(threadId, 
      `✅ Đã chọn ${selectedTids.length} nhóm.\n\n` +
      `👉 Bây giờ hãy **Reply (Trả lời)** vào tin nhắn này:\n` +
      `- Gửi **chữ** để thông báo văn bản.\n` +
      `- Gửi **ảnh** (kèm caption) để thông báo kèm ảnh.\n` +
      `- Gõ "huy" để hủy bỏ.`, 
      0
    );
  }

  if (pending?.step === "nd_content" && pending.selectedTids) {
    if (text.toLowerCase() === "huy") {
      delete pendingStep[pendingKey];
      return sendText(threadId, "✅ Đã hủy lệnh gửi thông báo.");
    }

    let photoUrl = null;
    if (message?.attachments && Object.keys(message.attachments).length > 0) {
      for (const att of Object.values(message.attachments)) {
        const list = Array.isArray(att) ? att : [att];
        for (const a of list) {
          if (a?.type === "photo" && a.url) { photoUrl = a.url; break; }
        }
        if (photoUrl) break;
      }
    }

    if (!photoUrl && message?.messageReply?.attachments) {
      for (const att of Object.values(message.messageReply.attachments)) {
        const list = Array.isArray(att) ? att : [att];
        for (const a of list) {
          if (a?.type === "photo" && a.url) { photoUrl = a.url; break; }
        }
        if (photoUrl) break;
      }
    }

    const content = text.trim();
    if (!content && !photoUrl) return sendText(threadId, "❌ Bạn chưa gửi nội dung hoặc ảnh!");

    delete pendingStep[pendingKey];
    const selectedTids = pending.selectedTids;

    await sendText(threadId, `⏳ Đang gửi thông báo đến ${selectedTids.length} nhóm...`, 0);

    let success = 0;
    const ndCaption = `📢 THÔNG BÁO TỪ ADMIN\n────────────────────\n${content ? `💬 Nội dung: ${content}\n────────────────────` : ""}`;

    for (const tid of selectedTids) {
      try {
        if (photoUrl) {
          api.sendMessage({ body: ndCaption, url: photoUrl }, tid, (err) => { if (!err) success++; });
        } else {
          api.sendMessage(ndCaption, tid, (err) => { if (!err) success++; });
        }
        await delay(1000);
      } catch (e) {}
    }

    return sendText(threadId, `✅ Đã gửi thành công đến ${success}/${selectedTids.length} nhóm!`);
  }

  if (!text.startsWith(prefix)) return;
  const args = text.slice(prefix.length).trim().split(/\s+/);
  const cmd = (args[0] || "").toLowerCase();

  if (cmd === "help" || cmd === "menu") {
    const sub = (args[1] || "").toLowerCase();
    if (!sub && cmd === "help") return sendText(threadId, buildMenu(), 60000);
    if (sub === "all") return sendText(threadId, buildHelpAll(), 60000);
    if (cmd === "menu") return sendText(threadId, buildMenu(), 60000);
    return sendText(threadId, buildHelpCmd(sub) || `❌ Không có lệnh "${sub}".`, 60000);
  }

  if (cmd === "resetcanhbao") {
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!", 120000);
    if (!isStaff(userId)) return sendText(threadId, "🚫 Chỉ admin/CTV!", 120000);
    if (!message?.messageReply) return sendText(threadId, `⚠️ Hãy Reply vào tin nhắn của người cần reset!`, 120000);
    
    const targetId = String(message.messageReply.senderID);
    if (GROUPS[threadId].anti?.warns?.[targetId]) {
      GROUPS[threadId].anti.warns[targetId] = 0;
      saveGroups();
      return sendText(threadId, `✅ Đã reset cảnh báo spam cho ${USERS[targetId]?.name || targetId}!`, 120000);
    } else {
      return sendText(threadId, `⚠️ Người này không có cảnh báo spam nào!`, 120000);
    }
  }

  if (cmd === "canhbao") {
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!", 120000);
    
    const isQtv = await isGroupAdmin(api, threadId, userId);
    if (!isAdmin(userId) && !isCtv(userId) && !isQtv) {
      return sendText(threadId, "🚫 Chỉ Admin/CTV/QTV nhóm mới được dùng lệnh này!", 120000);
    }
    
    let targetId = null;
    let reason = args.slice(1).join(" ");
    
    if (message?.messageReply) {
      targetId = String(message.messageReply.senderID);
    } 
    else if (message?.mentions && Object.keys(message.mentions).length > 0) {
      targetId = Object.keys(message.mentions)[0];
    }
    
    if (!targetId || !/^\d+$/.test(targetId)) {
      return sendText(threadId, `❌ Cú pháp:\n👉 Reply tin nhắn người đó + ${prefix}canhbao [lý do]\n👉 Hoặc tag @Tên + ${prefix}canhbao [lý do]`, 120000);
    }
    
    if (isStaff(targetId)) return sendText(threadId, "❌ Không thể cảnh báo Admin/CTV!", 120000);
    if (String(targetId) === String(userId)) return sendText(threadId, "❌ Không thể tự cảnh báo chính mình!", 120000);
    
    const g = GROUPS[threadId];
    if (!g.anti) g.anti = {};
    if (!g.anti.warns) g.anti.warns = {};
    
    g.anti.warns[targetId] = (g.anti.warns[targetId] || 0) + 1;
    const warnCount = g.anti.warns[targetId];
    const targetName = USERS[targetId]?.name || targetId;
    
    if (warnCount >= 5) {
      delete g.anti.warns[targetId];
      saveGroups();
      
      api.removeUserFromGroup(targetId, threadId, (err) => {
        if (err) return sendText(threadId, `❌ Không thể kick ${targetName}. Có thể bot thiếu quyền QTV!`, 120000);
      });
      
      return sendText(threadId, 
        `┏━━━━━━━━━━━━━━┓\n` +
        `┃ ⚔️ THÁNH CHỈ TRỪNG PHẠT ┃\n` +
        `┗━━━━━━━━━━━━━━┛\n\n` +
        `Nhà ngươi (${targetName}) đã nhận đủ 5 lần cảnh báo!\n` +
        `Lý do cuối cùng: ${reason || "Vi phạm quy định"}\n\n` +
        `Theo đúng thánh chỉ, ta đã tiễn hắn rời khỏi động phủ!\n` +
        `👑 Người thi hành: ${BOT_NAME}`, 
        120000
      );
    } else {
      saveGroups();
      return sendText(threadId, 
        `⚠️ CẢNH BÁO VI PHẠM\n` +
        `────────────────────\n` +
        `👤 Đối tượng: ${targetName}\n` +
        `📝 Lý do: ${reason || "Vi phạm quy định"}\n` +
        `🔢 Số lần cảnh cáo: ${warnCount}/5\n\n` +
        `⚠️ Nếu đủ 5 lần, bạn sẽ bị trục xuất khỏi nhóm!`, 
        120000
      );
    }
  }

  if (cmd === "anti") {
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!", 120000);
    if (!isStaff(userId)) return sendText(threadId, "🚫 Chỉ admin/CTV!", 120000);
    
    const sub = (args[1] || "").toLowerCase(); 
    const type = (args[2] || "").toLowerCase(); 
    const g = GROUPS[threadId];
    
    if (!sub) {
      let msg = `🛡️ BẢNG ĐIỀU KHIỂN ANTI (CHỐNG PHÁ)\n────────────────────\n`;
      msg += `👑 Anti đổi tên nhóm: ${g.anti.boxname ? "✅ BẬT" : "❌ TẮT"}\n`;
      msg += `🔗 Anti gửi link: ${g.anti.link ? "✅ BẬT" : "❌ TẮT"}\n`;
      msg += `🏷️ Anti tag all: ${g.anti.tagall ? "✅ BẬT" : "❌ TẮT"}\n`;
      msg += `🎨 Anti Cảm xúc & Thu hồi (cxn): ${(g.anti.theme && g.anti.thuhoi) ? "✅ BẬT" : "❌ TẮT"}\n`;
      msg += `💬 Anti spam (3 tin/5s): ${g.anti.spam ? "✅ BẬT" : "❌ TẮT"}\n`;
      msg += `────────────────────\n`;
      msg += `👉 Cú pháp: ${prefix}anti <tên> on/off\n`;
      msg += `📌 VD: ${prefix}anti cxn on`;
      return sendText(threadId, msg, 0);
    }

    if (sub === "on" || sub === "off") {
      const val = sub === "on";
      g.anti.boxname = val; g.anti.link = val; g.anti.tagall = val; g.anti.theme = val; g.anti.spam = val; g.anti.thuhoi = val;
      saveGroups();
      return sendText(threadId, `✅ Đã ${val ? "BẬT" : "TẮT"} TOÀN BỘ ANTI!`, 120000);
    }

    if (sub === "cxn" && (type === "on" || type === "off")) {
      g.anti.theme = type === "on";
      g.anti.thuhoi = type === "on";
      saveGroups();
      return sendText(threadId, `✅ Đã ${type === "on" ? "BẬT" : "TẮT"} Anti Cảm Xúc Nhanh & Thu Hồi Tin Nhắn!`, 120000);
    }

    if (["link", "tagall", "boxname", "spam"].includes(sub) && (type === "on" || type === "off")) {
      g.anti[sub] = type === "on";
      saveGroups();
      return sendText(threadId, `✅ Đã ${type === "on" ? "BẬT" : "TẮT"} Anti-${sub}!`, 120000);
    }

    return sendText(threadId, `❌ Cú pháp không hợp lệ! Gõ ${prefix}anti để xem menu.`, 120000);
  }

  if (cmd === "ott") {
    const sub = (args[1] || "").toLowerCase();
    const uid = String(userId);
    
    if (!TX_DATA[uid]) { TX_DATA[uid] = { money: 0, lastDaily: 0 }; saveTx(); }
    const userTx = TX_DATA[uid];
    const moneyFmt = (num) => num.toLocaleString("vi-VN") + " $";

    const getMatchMessage = (room, roomId, timeLeft, resultText = "") => {
      let msg = "";
      if (resultText) msg += `${resultText}\n────────────────────\n\n`;
      const p1Status = room.p1Choice ? "✅ Đã ra" : "⏳ Chưa ra";
      const p2Status = room.p2Choice ? "✅ Đã ra" : "⏳ Chưa ra";
      msg += `🔥 TRẬN ĐẤU ĐANG DIỄN RA 🔥\n` +
        `────────────────────\n` +
        `🆔 Bàn: #${roomId}\n` +
        `⚔️ ${USERS[room.p1]?.name || room.p1} VS ${USERS[room.p2]?.name || room.p2}\n` +
        `💰 Cược: ${moneyFmt(room.bet)} | BO${room.maxRounds}\n` +
        `────────────────────\n` +
        `👉 Vòng ${room.currentRound}: Reply tin nhắn này và gõ:\n` +
        `   ${prefix}ott bua / bao / keo\n\n` +
        `⏳ Thời gian: ${timeLeft}s\n` +
        `👤 ${USERS[room.p1]?.name || room.p1}: ${p1Status}\n` +
        `👤 ${USERS[room.p2]?.name || room.p2}: ${p2Status}`;
      return msg;
    };

    const updateMatchMessage = (roomId, resultText = "") => {
      const room = OTT_ROOMS[roomId];
      if (!room || !room.msgId) return;
      api.editMessage(getMatchMessage(room, roomId, room.timeLeft, resultText), room.msgId);
    };

    const startRound = async (threadId, roomId, room, resultText = "") => {
      if (room.timer) clearInterval(room.timer);
      room.timeLeft = 10;
      const startMsg = await sendText(threadId, getMatchMessage(room, roomId, room.timeLeft, resultText), 0);
      if (startMsg) room.msgId = startMsg;
      
      room.timer = setInterval(async () => {
        const currentRoom = OTT_ROOMS[roomId];
        if (!currentRoom || currentRoom.status !== "playing") {
          clearInterval(room.timer);
          return;
        }

        currentRoom.timeLeft--;
        
        if (currentRoom.timeLeft > 0) {
          updateMatchMessage(roomId, resultText);
        } else {
          clearInterval(room.timer);
          updateMatchMessage(roomId, resultText);
          
          if (!currentRoom.p1Choice || !currentRoom.p2Choice) {
            let p1Timeout = !currentRoom.p1Choice;
            let p2Timeout = !currentRoom.p2Choice;
            let timeoutMsg = `⏰ HẾT GIỜ! Quá 10 giây không chọn.\n`;
            let winnerId, loserId;

            if (p1Timeout && p2Timeout) {
              timeoutMsg += `🤝 Cả 2 đều không chọn. Hòa, hoàn tiền!`;
              if (TX_DATA[currentRoom.p1]) TX_DATA[currentRoom.p1].money += currentRoom.bet;
              if (TX_DATA[currentRoom.p2]) TX_DATA[currentRoom.p2].money += currentRoom.bet;
              saveTx();
              delete OTT_ROOMS[roomId];
              return sendText(threadId, timeoutMsg, 0);
            } else if (p1Timeout) {
              winnerId = currentRoom.p2; loserId = currentRoom.p1;
              timeoutMsg += `🏆 ${USERS[winnerId]?.name || winnerId} thắng do đối thủ không chọn!`;
            } else {
              winnerId = currentRoom.p1; loserId = currentRoom.p2;
              timeoutMsg += `🏆 ${USERS[winnerId]?.name || winnerId} thắng do đối thủ không chọn!`;
            }

            if (TX_DATA[winnerId]) TX_DATA[winnerId].money += currentRoom.bet * 2;
            saveTx();
            
            timeoutMsg += `\n💰 Nhận: +${moneyFmt(currentRoom.bet * 2)}\n💸 ${USERS[loserId]?.name || loserId} mất: -${moneyFmt(currentRoom.bet)}`;
            delete OTT_ROOMS[roomId];
            return sendText(threadId, timeoutMsg, 0);
          }
        }
      }, 1000);
    };

    if (!sub) {
      return sendText(threadId, `✊✋✌️ OẲN TÙ TÌ (OTT) ✊✋✌️\n────────────────────\n` +
      `💰 Số dư của bạn: ${moneyFmt(userTx.money)}\n\n` +
      `📋 HƯỚNG DẪN:\n` +
      `👉 ${prefix}ott <số tiền> <số kèo> — Tạo bàn đấu\n   (VD: ${prefix}ott 10000 3kq)\n` +
      `👉 ${prefix}ott join — Tham gia (Reply tin nhắn tạo bàn)\n` +
      `👉 ${prefix}ott bua / bao / keo — Chọn kéo búa bao\n` +
      `👉 ${prefix}ott huy — Hủy bàn / Trận đấu\n` +
      `👉 ${prefix}ott sodu — Xem số dư\n` +
      `👉 ${prefix}ott top — BXH cao thủ\n\n` +
      `*Cược tối thiểu: 2.000$, tối đa: 5.000.000$*`, 120000);
    }

    if (sub === "sodu" || sub === "money") {
      return sendText(threadId, `💰 SỐ DƯ CỦA BẠN: ${moneyFmt(userTx.money)}`, 120000);
    }

    if (sub === "top" || sub === "rank") {
      const topUsers = Object.entries(TX_DATA).sort((a, b) => b[1].money - a[1].money).slice(0, 5);
      let topMsg = `🏆 TOP 5 CAO THỦ OTT\n────────────────────\n`;
      topUsers.forEach(([id, data], index) => { 
        const name = USERS[id]?.name || "Ẩn danh"; 
        topMsg += `${index + 1}. ${name}: ${moneyFmt(data.money)}\n`; 
      });
      return sendText(threadId, topMsg, 120000);
    }

    if (sub === "huy") {
      let foundRoomId = null;
      for (const [rId, r] of Object.entries(OTT_ROOMS)) {
        if (r.p1 === uid || r.p2 === uid) { foundRoomId = rId; break; }
      }
      if (!foundRoomId) return sendText(threadId, `❌ Bạn không có bàn OTT nào đang hoạt động!`, 120000);

      const room = OTT_ROOMS[foundRoomId];
      if (room.timer) clearInterval(room.timer);
      delete OTT_ROOMS[foundRoomId];
      
      if (TX_DATA[room.p1]) { TX_DATA[room.p1].money += room.bet; saveTx(); }
      if (room.p2 && TX_DATA[room.p2]) { TX_DATA[room.p2].money += room.bet; saveTx(); }
      
      return sendText(threadId, `✅ Đã hủy bàn chơi #${foundRoomId}. Tiền cược đã được hoàn trả!`, 120000);
    }

    if (/^\d+$/.test(sub) && parseInt(sub) >= 2000) {
      const bet = parseInt(sub);
      let maxRounds = 1;
      if (args[2]) {
        const roundMatch = /(\d+)kq/i.exec(args[2]);
        if (roundMatch) maxRounds = parseInt(roundMatch[1]);
      }
      
      if (![1, 3, 5, 7].includes(maxRounds)) maxRounds = 1;
      
      if (bet > 5000000) return sendText(threadId, `❌ Cược tối đa là 5.000.000$!`, 120000);
      if (userTx.money < bet) return sendText(threadId, `❌ Bạn không đủ tiền! Số dư: ${moneyFmt(userTx.money)}`, 120000);

      for (const r of Object.values(OTT_ROOMS)) {
        if (r.p1 === uid || r.p2 === uid) return sendText(threadId, `❌ Bạn đang ở trong một bàn OTT khác! Hãy hủy bàn đó trước.`, 120000);
      }

      userTx.money -= bet;
      saveTx();

      const roomId = Math.floor(1000 + Math.random() * 9000);
      OTT_ROOMS[roomId] = {
        p1: uid, p2: null, bet: bet, maxRounds: maxRounds,
        currentRound: 1, p1Score: 0, p2Score: 0,
        p1Choice: null, p2Choice: null, status: "waiting",
        joinMsgId: null, msgId: null, timeLeft: 10, createdAt: Date.now(), timer: null
      };

      const sentMsg = await sendText(threadId, 
        `✊✋✌️ BÀN OẲN TÙ TÌ ĐÃ ĐƯỢC TẠO ✊✋✌️\n` +
        `────────────────────\n` +
        `🆔 Mã bàn: #${roomId}\n` +
        `👤 Người tạo: ${senderName || uid}\n` +
        `💰 Mức cược: ${moneyFmt(bet)}\n` +
        `🎮 Thể thức: BO${maxRounds}\n\n` +
        `👉 Reply (Trả lời) tin nhắn này với cú pháp:\n` +
        `   ${prefix}ott join\n` +
        `để tham gia thách đấu!`, 0);

      if (sentMsg) OTT_ROOMS[roomId].joinMsgId = sentMsg;
      return;
    }

    if (sub === "join") {
      if (!message?.messageReply) return sendText(threadId, `❌ Hãy Reply vào tin nhắn tạo bàn để tham gia!`, 120000);
      const repliedMsgId = message.messageReply.messageID;
      
      const roomId = Object.keys(OTT_ROOMS).find(k => OTT_ROOMS[k].joinMsgId === repliedMsgId);
      if (!roomId) return sendText(threadId, `❌ Không tìm thấy bàn chơi này hoặc bàn đã bị hủy!`, 120000);

      const room = OTT_ROOMS[roomId];
      if (room.p1 === uid) return sendText(threadId, `❌ Bạn không thể tự tham gia bàn của chính mình!`, 120000);
      if (room.p2) return sendText(threadId, `❌ Bàn này đã đủ người chơi rồi!`, 120000);
      if (userTx.money < room.bet) return sendText(threadId, `❌ Bạn không đủ tiền cược (${moneyFmt(room.bet)})!`, 120000);

      userTx.money -= room.bet;
      saveTx();
      
      room.p2 = uid;
      room.status = "playing";

      const countdownMsg = await sendText(threadId, `🔥 TRẬN ĐẤU BẮT ĐẦU! 🔥\n⏳ Chuẩn bị: 3...`, 0);
      await delay(1000);
      if (countdownMsg) api.editMessage(`🔥 TRẬN ĐẤU BẮT ĐẦU! 🔥\n⏳ Chuẩn bị: 2...`, countdownMsg);
      await delay(1000);
      if (countdownMsg) api.editMessage(`🔥 TRẬN ĐẤU BẮT ĐẦU! 🔥\n⏳ Chuẩn bị: 1...`, countdownMsg);
      await delay(1000);
      
      if (countdownMsg) api.unsendMessage(countdownMsg, () => {});

      await startRound(threadId, roomId, room);
      return;
    }

    if (["bua", "bao", "keo"].includes(sub)) {
      if (!message?.messageReply) return sendText(threadId, `❌ Hãy Reply vào tin nhắn bắt đầu trận đấu để chọn!`, 120000);
      const repliedMsgId = message.messageReply.messageID;
      
      const roomId = Object.keys(OTT_ROOMS).find(k => OTT_ROOMS[k].msgId === repliedMsgId);
      if (!roomId) return sendText(threadId, `❌ Trận đấu không tồn tại hoặc đã kết thúc!`, 120000);
      
      const room = OTT_ROOMS[roomId];
      if (room.status !== "playing") return sendText(threadId, `❌ Trận đấu chưa bắt đầu hoặc đã kết thúc!`, 120000);

      const isP1 = room.p1 === uid;
      const isP2 = room.p2 === uid;
      if (!isP1 && !isP2) return sendText(threadId, `❌ Bạn không phải người chơi trong bàn này!`, 120000);

      if (isP1) {
        if (room.p1Choice) return sendText(threadId, `❌ Bạn đã chọn rồi!`, 120000);
        room.p1Choice = sub;
        reactMessage("✅", message.messageID, threadId);
      } else {
        if (room.p2Choice) return sendText(threadId, `❌ Bạn đã chọn rồi!`, 120000);
        room.p2Choice = sub;
        reactMessage("✅", message.messageID, threadId);
      }

      updateMatchMessage(roomId);

      if (!room.p1Choice || !room.p2Choice) return;
      if (room.timer) clearInterval(room.timer);

      const c1 = room.p1Choice;
      const c2 = room.p2Choice;
      let resultText = "";
      const emojiMap = { bua: "✊ Búa", bao: "✋ Bao", keo: "✌️ Kéo" };

      if (c1 === c2) {
        resultText = `🤝 Hòa! Cả 2 cùng ra ${emojiMap[c1]}`;
      } else if ((c1 === "bua" && c2 === "keo") || (c1 === "keo" && c2 === "bao") || (c1 === "bao" && c2 === "bua")) {
        room.p1Score++;
        resultText = `🏆 ${USERS[room.p1]?.name || room.p1} thắng vòng này! (${emojiMap[c1]} > ${emojiMap[c2]})`;
      } else {
        room.p2Score++;
        resultText = `🏆 ${USERS[room.p2]?.name || room.p2} thắng vòng này! (${emojiMap[c2]} > ${emojiMap[c1]})`;
      }

      const neededWins = Math.ceil(room.maxRounds / 2);

      let finalMsg = `🎮 KẾT QUẢ VÒNG ${room.currentRound}\n────────────────────\n`;
      finalMsg += `👤 P1: ${emojiMap[c1]}\n👤 P2: ${emojiMap[c2]}\n`;
      finalMsg += `${resultText}\n────────────────────\n`;
      finalMsg += `📊 Tỷ số: ${USERS[room.p1]?.name || room.p1} ${room.p1Score} - ${room.p2Score} ${USERS[room.p2]?.name || room.p2}`;

      if (room.p1Score >= neededWins || room.p2Score >= neededWins) {
        const winner = room.p1Score >= neededWins ? room.p1 : room.p2;
        const loser = winner === room.p1 ? room.p2 : room.p1;
        const prize = room.bet * 2;

        if (TX_DATA[winner]) TX_DATA[winner].money += prize;
        saveTx();
        
        finalMsg += `\n\n🎉 TRẬN ĐẤU KẾT THÚC!\n`;
        finalMsg += `👑 Người chiến thắng: ${USERS[winner]?.name || winner}\n`;
        finalMsg += `💰 Nhận được: +${moneyFmt(prize)}\n`;
        finalMsg += `💸 ${USERS[loser]?.name || loser} mất: -${moneyFmt(room.bet)}`;
        delete OTT_ROOMS[roomId];
        
        if (room.msgId) api.unsendMessage(room.msgId, () => {});
        return sendText(threadId, finalMsg, 0);
      } else {
        room.currentRound++;
        room.p1Choice = null;
        room.p2Choice = null;
        await startRound(threadId, roomId, room, finalMsg);
        return;
      }
    }
    return sendText(threadId, `❌ Cú pháp không hợp lệ! Gõ ${prefix}ott để xem hướng dẫn.`, 120000);
  }
  if (cmd === "tb") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin mới được dùng lệnh này!");
    
    const content = args.slice(1).join(" ");
    if (!content) return sendText(threadId, `❌ Cú pháp: ${prefix}tb <nội dung thông báo>`);

    const allGroups = Object.keys(GROUPS);
    
    const previewMsg = 
      `📬 [XEM TRƯỚC THÔNG BÁO]\n` +
      `────────────────────\n` +
      `📝 Nội dung:\n` +
      `${content}\n` +
      `────────────────────\n` +
      `⏳ Đang gửi đến ${allGroups.length} nhóm...`;

    await sendText(threadId, previewMsg, 0);

    const broadcastMsg = 
      `📜 THÔNG BÁO TỪ ADMIN\n` +
      `────────────────────\n` +
      `📩 Gửi đến: Tất cả thành viên\n` +
      `💬 Nội dung: ${content.replace(/\n/g, '\n💬 ')}\n\n` +
      `────────────────────\n` +
      `👑 Người gửi: ADMIN\n` +
      `⏰ Thời gian: ${timeVN().t} - ${timeVN().d}\n` +
      `────────────────────`;

    let success = 0;
    for (const tid of allGroups) {
      if (String(tid) === String(threadId)) continue; 
      api.sendMessage(broadcastMsg, tid, (err) => {
        if (!err) success++;
      });
      await delay(1500); 
    }

    return sendText(threadId, `✅ Đã gửi thành công đến ${success}/${allGroups.length - 1} nhóm!`);
  }

  if (cmd === "nd") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ Admin mới được dùng lệnh này!", 120000);
    const sub = (args[1] || "").toLowerCase();

    if (sub === "list" || sub === "ds") {
      let allGroups = Object.entries(GROUPS);
      if (allGroups.length === 0) return sendText(threadId, "📦 Bot chưa tham gia nhóm nào!");

      allGroups.sort((a, b) => (b[1].expiresAt || 0) - (a[1].expiresAt || 0));

      const loadingMsg = await sendText(threadId, "⏳ Đang tải tên các nhóm, vui lòng đợi...", 0);

      for (let i = 0; i < allGroups.length; i++) {
        const tid = allGroups[i][0];
        const g = allGroups[i][1];
        if (!g.name || g.name.trim() === "" || g.name === "Box chưa có tên") {
          try {
            const info = await new Promise((resolve) => api.getThreadInfo(tid, (e, r) => resolve(e ? null : r)));
            if (info && info.threadName) {
              g.name = info.threadName;
              saveGroups();
            }
          } catch (e) {}
          await delay(300);
        }
      }

      if (loadingMsg) api.unsendMessage(loadingMsg, () => {});

      let msg = `📋 DANH SÁCH NHÓM ĐỂ GỬI THÔNG BÁO\n`;
      msg += `────────────────────\n`;
      msg += `👉 Reply (Trả lời) tin nhắn này: <STT>\n`;
      msg += `VD: 1 (Chọn nhóm 1) hoặc 1,2,3 (Chọn nhiều nhóm)\n`;
      msg += `────────────────────\n`;

      allGroups.forEach(([tid, g], i) => {
        const isRented = g.expiresAt && g.expiresAt > Date.now();
        const status = isRented ? `(Còn ${Math.ceil((g.expiresAt - Date.now()) / 86400000)} ngày)` : "(Chưa thuê)";
        msg += `${i + 1}. ${g.name || "Box chưa có tên"} ${status}\n`;
      });

      msg += `────────────────────`;
      pendingStep[pendingKey] = { step: "nd_select", boxList: allGroups.map(([tid]) => tid) };
      return sendText(threadId, msg, 0);
    }

    if (!isNaN(sub) && args[1]) {
      const stt = parseInt(sub);
      const content = args.slice(2).join(" ");
      if (!content) return sendText(threadId, `❌ Cú pháp: ${prefix}nd <STT> <Nội dung>\nVD: ${prefix}nd 1 Tối nay bảo trì nhé!`);

      let allGroups = Object.entries(GROUPS).sort((a, b) => (b[1].expiresAt || 0) - (a[1].expiresAt || 0));
      if (stt - 1 < 0 || stt - 1 >= allGroups.length) return sendText(threadId, "❌ Số thứ tự nhóm không hợp lệ! Gõ .nd list để xem lại.");

      const targetId = allGroups[stt - 1][0];
      const targetGroup = allGroups[stt - 1][1];

      const ndMsg = `📢 THÔNG BÁO TỪ ADMIN\n────────────────────\n💬 Nội dung: ${content}\n────────────────────`;

      api.sendMessage(ndMsg, targetId, (err) => {
        if (err) return sendText(threadId, `❌ Lỗi không thể gửi đến nhóm ${targetGroup.name}: ${err.message}`);
      });

      return sendText(threadId, `✅ Đã gửi thông báo đến nhóm:\n📦 ${targetGroup.name || "Không tên"}`, 0);
    }

    return sendText(threadId, 
      `📢 HƯỚNG DẪN GỬI THÔNG BÁO:\n` +
      `────────────────────\n` +
      `1️⃣ ${prefix}nd list — Xem danh sách nhóm\n` +
      `2️⃣ Reply STT nhóm (VD: 1 hoặc 1,2,3) để chọn nhóm\n` +
      `3️⃣ Reply chữ hoặc ảnh vào tin nhắn tiếp theo để gửi đi.`, 
      120000
    );
  }

  if (cmd === "lineup") {
    if (!isAdmin(userId) && !isCtv(userId)) return sendText(threadId, "🚫 Chỉ Admin/CTV mới được dùng lệnh này!");

    const stt = parseInt(args[1]);
    const content = args.slice(2).join(" ");
    
    if (stt && content) {
      let allGroups = Object.entries(GROUPS).sort((a, b) => (b[1].expiresAt || 0) - (a[1].expiresAt || 0));
      
      if (stt - 1 < 0 || stt - 1 >= allGroups.length) {
        return sendText(threadId, "❌ Số thứ tự nhóm không hợp lệ! Gõ .lineup để xem lại danh sách.");
      }

      const targetId = allGroups[stt - 1][0];
      const targetGroup = allGroups[stt - 1][1];

      const parts = content.split("-");
      const timeStr = parts[0] ? parts[0].trim() : "Chưa rõ giờ";
      const playersStr = parts.slice(1).join("-").trim(); 

      let playersList = "";
      if (playersStr) {
        const arr = playersStr.split(/[,-]/).map(p => p.trim()).filter(Boolean);
        playersList = arr.map((p) => `👤 ${p}`).join("\n");
      } else {
        playersList = `👤 Chưa có tên`;
      }

      const lineupMsg = 
        `╭─────── ⋆⋅☆⋅⋆ ───────╮\n` +
        `     🎯 LINEUP CUSTOM 🎯\n` +
        `╰─────── ⋆⋅☆⋅⋆ ───────╯\n` +
        `⏰ Giờ bắn: ${timeStr.toUpperCase()}\n` +
        `────────────────────\n` +
        `📋 Danh sách tham gia:\n` +
        `${playersList}\n` +
        `────────────────────\n` +
        `👑 Người lên lịch: ${senderName || userId}\n` +
        `📅 Ngày: ${timeVN().d}`;

      api.sendMessage(lineupMsg, targetId, (err) => {
        if (err) return sendText(threadId, `❌ Lỗi không thể gửi đến nhóm ${targetGroup.name || "Không tên"}: ${err.message}`);
      });

      return sendText(threadId, 
        `✅ Đã gửi Lineup thành công đến nhóm:\n` +
        `📦 ${targetGroup.name || "Không tên"}`, 
        0
      );
    }

    let allGroups = Object.entries(GROUPS);
    if (allGroups.length === 0) return sendText(threadId, "📦 Bot chưa tham gia nhóm nào!");

    allGroups.sort((a, b) => (b[1].expiresAt || 0) - (a[1].expiresAt || 0));

    const loadingMsg = await sendText(threadId, "⏳ Đang tải tên các nhóm, vui lòng đợi...", 0);

    for (let i = 0; i < allGroups.length; i++) {
      const tid = allGroups[i][0];
      const g = allGroups[i][1];
      if (!g.name || g.name.trim() === "" || g.name === "Box chưa có tên") {
        try {
          const info = await new Promise((resolve) => api.getThreadInfo(tid, (e, r) => resolve(e ? null : r)));
          if (info && info.threadName) {
            g.name = info.threadName;
            saveGroups();
          }
        } catch (e) {}
        await delay(300);
      }
    }

    if (loadingMsg) api.unsendMessage(loadingMsg, () => {});

    let msg = `📋 DANH SÁCH NHÓM ĐỂ LÊN LINEUP\n`;
    msg += `────────────────────\n`;
    msg += `👉 Cú pháp gửi:\n`;
    msg += `   .lineup <STT> <Giờ> - <Tên 1>, <Tên 2>...\n`;
    msg += `   📌 VD: .lineup 4 20h - Nhân, Bảo, Minh, Nam\n`;
    msg += `────────────────────\n`;

    allGroups.forEach(([tid, g], i) => {
      const isRented = g.expiresAt && g.expiresAt > Date.now();
      const status = isRented ? `(Còn ${Math.ceil((g.expiresAt - Date.now()) / 86400000)} ngày)` : "(Chưa thuê)";
      msg += `${i + 1}. ${g.name || "Box chưa có tên"} ${status}\n`;
    });

    msg += `────────────────────`;
    return sendText(threadId, msg, 0);
  }

  if (cmd === "setmoney") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ Admin mới được dùng lệnh này!", 120000);
    let targetId = args[1];
    let amount = parseInt(args[2]);
    if (message?.messageReply) {
      targetId = String(message.messageReply.senderID);
      amount = parseInt(args[1]);
    } else if (message?.mentions && Object.keys(message.mentions).length > 0) {
      targetId = Object.keys(message.mentions)[0];
      amount = parseInt(args[1]);
    }
    if (!targetId || !/^\d+$/.test(targetId) || isNaN(amount)) {
      return sendText(threadId, 
        `❌ Cú pháp: ${prefix}setmoney <ID/tag/reply> <số tiền>\n` +
        `📌 Ví dụ 1: ${prefix}setmoney 100095311641059 5000\n` +
        `📌 Ví dụ 2: Reply tin nhắn ai đó + ${prefix}setmoney 5000\n` +
        `💡 Mẹo: Nhập số âm (vd: -500) để trừ tiền của người đó.`, 120000);
    }
    if (!TX_DATA[targetId]) TX_DATA[targetId] = { money: 0, lastDaily: 0 };
    const oldMoney = TX_DATA[targetId].money;
    TX_DATA[targetId].money += amount;
    if (TX_DATA[targetId].money < 0) TX_DATA[targetId].money = 0;
    const newMoney = TX_DATA[targetId].money;
    saveTx();
    const targetName = USERS[targetId]?.name || targetId;
    const moneyFmt = (num) => num.toLocaleString("vi-VN") + " $";
    const actionStr = amount >= 0 ? "CỘNG" : "TRỪ";
    return sendText(threadId, 
      `👑 CAN THIỆP HỆ THỐNG THÀNH CÔNG!\n────────────────────\n` +
      `👤 Người chơi: ${targetName}\n🆔 ID: ${targetId}\n` +
      `📉 Số dư cũ: ${moneyFmt(oldMoney)}\n` +
      `⚖️ Hành động: ${actionStr} ${moneyFmt(Math.abs(amount))}\n` +
      `📈 Số dư mới: ${moneyFmt(newMoney)}\n────────────────────`, 120000);
  }

  if (cmd === "autokick") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ Admin mới được dùng lệnh này!", 120000);
    const sub = (args[1] || "").toLowerCase();
    if (sub === "list" || sub === "ds") {
      const now = Date.now();
      let activeGlobal = Object.entries(AUTOKICK_DATA).filter(([id, b]) => b.expiresAt === 0 || b.expiresAt > now);
      let activeGroup = Object.entries(GROUPS[threadId]?.blacklist || {}).filter(([id, b]) => b.expiresAt === 0 || b.expiresAt > now);
      if (activeGlobal.length === 0 && activeGroup.length === 0) return sendText(threadId, "🔓 Hiện không có ai trong Sổ Tử Thần.", 120000);
      let msg = `🔒 SỔ TỬ THẦN (AUTO KICK)\n────────────────────\n`;
      let listIds = [];
      if (activeGlobal.length > 0) {
        msg += `🌐 [TOÀN CẦU]\n`;
        activeGlobal.forEach(([id, b]) => {
          listIds.push({ type: "global", id });
          const daysLeft = b.expiresAt === 0 ? "Vĩnh viễn" : `${Math.ceil((b.expiresAt - now) / 86400000)} ngày`;
          msg += `${listIds.length}. ${USERS[id]?.name || "Ẩn danh"} (${id})\n   ⏳ Hạn: ${daysLeft}\n`;
        });
      }
      if (activeGroup.length > 0) {
        msg += `\n📦 [BOX NÀY]\n`;
        activeGroup.forEach(([id, b]) => {
          listIds.push({ type: "group", id });
          const daysLeft = b.expiresAt === 0 ? "Vĩnh viễn" : `${Math.ceil((b.expiresAt - now) / 86400000)} ngày`;
          msg += `${listIds.length}. ${USERS[id]?.name || "Ẩn danh"} (${id})\n   ⏳ Hạn: ${daysLeft}\n`;
        });
      }
      msg += `────────────────────\n👉 Reply (Trả lời) tin nhắn này: <STT>\nVD: 1 (Xóa người 1) hoặc 1,2,3 (Xóa nhiều người)`;
      pendingStep[pendingKey] = { step: "autokick_select", listIds };
      return sendText(threadId, msg, 0);
    }
    let targetId = null;
    let days = null;
    let isAll = false;
    if (sub === "all") { isAll = true; days = parseInt(args[2]); } else { days = parseInt(args[1]); }
    if (message?.messageReply) targetId = String(message.messageReply.senderID);
    else if (message?.mentions && Object.keys(message.mentions).length > 0) targetId = Object.keys(message.mentions)[0];
    else targetId = isAll ? args[2] : args[1];
    if (!targetId || !/^\d+$/.test(targetId)) {
      return sendText(threadId, `❌ Cú pháp:\n👉 Reply tin nhắn người đó + ${prefix}autokick <số ngày>\n👉 Reply tin nhắn người đó + ${prefix}autokick all <số ngày>\n👉 Xem danh sách: ${prefix}autokick list\n(Để trống số ngày = vĩnh viễn)`, 120000);
    }
    const expiresAt = isNaN(days) || days <= 0 ? 0 : Date.now() + days * 86400000;
    const reasonStr = expiresAt === 0 ? "Vĩnh viễn" : `${days} ngày`;
    const targetName = USERS[targetId]?.name || targetId;
    if (isAll) {
      AUTOKICK_DATA[targetId] = { expiresAt, reason: "Vi phạm quy định" };
      saveAutokick();
      await sendText(threadId, `⏳ Đang tiến hành càn quét toàn bộ động phủ...`, 0);
      let kickCount = 0;
      for (const [tid, g] of Object.entries(GROUPS)) {
        try {
          await new Promise((resolve, reject) => { api.removeUserFromGroup(targetId, tid, (err) => err ? reject(err) : resolve()); });
          kickCount++; await delay(1000);
        } catch (e) {}
      }
      return sendText(threadId, `┏━━━━━━━━━━━━━━┓\n┃ ⚔️ THÁNH CHỈ TRỪNG PHẠT ┃\n┗━━━━━━━━━━━━━━┛\n\nNhà ngươi đã bị đưa vào Sổ Tử Thần toàn cõi!\nĐã trục xuất khỏi ${kickCount} động phủ!\n\n👤 Đối tượng: ${targetName}\n⏳ Thời hạn: ${reasonStr}\n⚡ Người thi hành: ${BOT_NAME}`, 120000);
    } else {
      if (!GROUPS[threadId].blacklist) GROUPS[threadId].blacklist = {};
      GROUPS[threadId].blacklist[targetId] = { expiresAt };
      saveGroups();
      try {
        await new Promise((resolve, reject) => { api.removeUserFromGroup(targetId, threadId, (err) => err ? reject(err) : resolve()); });
        return sendText(threadId, `┏━━━━━━━━━━━━━━┓\n┃ ⚔️ THÁNH CHỈ TRỪNG PHẠT ┃\n┗━━━━━━━━━━━━━━┛\n\nNhà ngươi đã bị đưa vào Sổ Tử Thần của động phủ này!\n\n👤 Đối tượng: ${targetName}\n⏳ Thời hạn: ${reasonStr}\n⚡ Người thi hành: ${BOT_NAME}\n\n⚠️ Nếu ngươi dám quay lại, ta sẽ tiễn ngươi đi một lần nữa!`, 120000);
      } catch (e) {
        return sendText(threadId, `┏━━━━━━━━━━━━━━┓\n┃ ⚠️ ĐÃ GHI VÀO SỔ ĐEN ┃\n┗━━━━━━━━━━━━━━┛\n\nNhà ngươi đã bị đưa vào Sổ Tử Thần của động phủ này!\n\n👤 Đối tượng: ${targetName}\n⏳ Thời hạn: ${reasonStr}\n\n⚠️ (Không thể kick ngay do người này không ở trong nhóm hoặc bot thiếu quyền. Sẽ tự động kick khi họ vào lại!)`, 120000);
      }
    }
  }

  // ═══════════════════════════════════════════════
  // LỆNH .tx (TÀI XỈU)
  // ═══════════════════════════════════════════════
  if (cmd === "tx") {
    const sub = (args[1] || "").toLowerCase();
    const uid = String(userId);
    if (!TX_DATA[uid]) { TX_DATA[uid] = { money: 0, lastDaily: 0 }; saveTx(); }
    const userTx = TX_DATA[uid];
    const moneyFmt = (num) => num.toLocaleString("vi-VN") + " $";

    const WIN_RATE = 0.45;
    const TAX_RATE = 0.05;

    if (sub === "diemdanh" || sub === "dd") {
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000; 
      if (now - userTx.lastDaily < cooldown) {
        const timeLeft = cooldown - (now - userTx.lastDaily);
        const hours = Math.floor(timeLeft / 3600000); const mins = Math.floor((timeLeft % 3600000) / 60000);
        return sendText(threadId, `⏳ Bạn đã điểm danh rồi!\nVui lòng quay lại sau: ${hours} giờ ${mins} phút nữa.`, 120000);
      }
      const randomMoney = Math.floor(Math.random() * 900) + 100;
      userTx.money += randomMoney; userTx.lastDaily = now; saveTx();
      return sendText(threadId, `🎁 ĐIỂM DANH THÀNH CÔNG!\n────────────────────\n💰 Bạn nhận được: +${moneyFmt(randomMoney)}\n💳 Số dư hiện tại: ${moneyFmt(userTx.money)}\n────────────────────\n👉 Gõ ${prefix}tx để xem hướng dẫn chơi Tài Xỉu.`, 120000);
    }

    if (sub === "tai" || sub === "xiu") {
      const betAmount = parseInt(args[2]);
      if (!betAmount || betAmount <= 0) return sendText(threadId, `❌ Cú pháp: ${prefix}tx tai <số tiền> hoặc ${prefix}tx xiu <số tiền>\n📌 VD: ${prefix}tx tai 100`, 120000);
      if (userTx.money < betAmount) return sendText(threadId, `❌ Bạn không đủ tiền! Số dư: ${moneyFmt(userTx.money)}\n👉 Gõ ${prefix}tx diemdanh để nhận thêm tiền.`, 120000);
      
      userTx.money -= betAmount; saveTx();

      let isWin = Math.random() < WIN_RATE;
      
      let finalD1, finalD2, finalD3, finalTotal, finalIsTai;
      if (isWin) {
        if (sub === "tai") { do { finalD1 = Math.ceil(Math.random()*6); finalD2 = Math.ceil(Math.random()*6); finalD3 = Math.ceil(Math.random()*6); finalTotal = finalD1+finalD2+finalD3; } while(finalTotal < 11); } 
        else { do { finalD1 = Math.ceil(Math.random()*6); finalD2 = Math.ceil(Math.random()*6); finalD3 = Math.ceil(Math.random()*6); finalTotal = finalD1+finalD2+finalD3; } while(finalTotal > 10); }
        finalIsTai = sub === "tai";
      } else {
        if (sub === "tai") { do { finalD1 = Math.ceil(Math.random()*6); finalD2 = Math.ceil(Math.random()*6); finalD3 = Math.ceil(Math.random()*6); finalTotal = finalD1+finalD2+finalD3; } while(finalTotal > 10); } 
        else { do { finalD1 = Math.ceil(Math.random()*6); finalD2 = Math.ceil(Math.random()*6); finalD3 = Math.ceil(Math.random()*6); finalTotal = finalD1+finalD2+finalD3; } while(finalTotal < 11); }
        finalIsTai = sub === "xiu";
      }

      const diceIcons = ["", "[ 1 ]", "[ 2 ]", "[ 3 ]", "[ 4 ]", "[ 5 ]", "[ 6 ]"]; 
      
      const getRollingMsg = (tLeft) => {
        return `╭─────── ⋆⋅☆⋅⋆ ───────╮\n` +
               `     🎲 BÀN XÚC XẮC 🎲\n` +
               `╰─────── ⋆⋅☆⋅⋆ ───────╯\n` +
               `🎲 Kết quả: [ ? ]  [ ? ]  [ ? ]\n` +
               `🎯 Tổng điểm: ???\n` +
               `────────────────────\n` +
               `💰 Cược: ${moneyFmt(betAmount)}\n` +
               `⏳ Đang lắc... (${tLeft}s)`;
      };

      const rollMsg = await sendText(threadId, getRollingMsg(5), 0);

      if (rollMsg) {
        for (let t = 5; t >= 1; t--) {
          const d1 = Math.ceil(Math.random()*6);
          const d2 = Math.ceil(Math.random()*6);
          const d3 = Math.ceil(Math.random()*6);
          const tempTotal = d1 + d2 + d3;

          api.editMessage(
            `╭─────── ⋆⋅☆⋅⋆ ───────╮\n` +
            `     🎲 BÀN XÚC XẮC 🎲\n` +
            `╰─────── ⋆⋅☆⋅⋆ ───────╯\n` +
            `🎲 Kết quả: ${diceIcons[d1]}  ${diceIcons[d2]}  ${diceIcons[d3]}\n` +
            `🎯 Tổng điểm: ${tempTotal}\n` +
            `────────────────────\n` +
            `💰 Cược: ${moneyFmt(betAmount)}\n` +
            `⏳ Đang lắc... (${t}s)`, 
            rollMsg
          );
          await delay(1000);
        }

        api.unsendMessage(rollMsg, () => {});

        const resultStr = finalIsTai ? "TÀI" : "XỈU";
        let msg = `🎲 KẾT QUẢ LẮC XÚC XẮC 🎲\n────────────────────\n`;
        msg += `🎰 Kết quả: ${diceIcons[finalD1]}  ${diceIcons[finalD2]}  ${diceIcons[finalD3]}\n`;
        msg += `🎯 Tổng điểm: ${finalTotal} (${resultStr})\n────────────────────\n`;
        
        if (isWin) { 
          const winAmount = betAmount * 2;
          const taxAmount = Math.floor(betAmount * TAX_RATE);
          const finalWin = winAmount - taxAmount;

          userTx.money += finalWin; 
          
          msg += `✅ BẠN ĐÃ THẮNG!\n`;
          msg += `💰 Tiền nhận: +${moneyFmt(winAmount)}\n`; 
          if (taxAmount > 0) msg += `💸 Thuế (${TAX_RATE * 100}%): -${moneyFmt(taxAmount)}\n`;
          msg += `💵 Thực nhận: +${moneyFmt(finalWin)}\n`;
          reactMessage("🎉", message.messageID, threadId); 
        } else { 
          msg += `❌ BẠN ĐÃ THUA!\n💸 Mất: -${moneyFmt(betAmount)}\n`; 
          reactMessage("😭", message.messageID, threadId); 
        }
        
        msg += `💳 Số dư hiện tại: ${moneyFmt(userTx.money)}`;
        saveTx();
        return sendText(threadId, msg, 120000);
      }
      return;
    }

    const topUsers = Object.entries(TX_DATA).sort((a, b) => b[1].money - a[1].money).slice(0, 5);
    let topMsg = `🏆 TOP 5 ĐẠI GIA TÀI XỈU\n────────────────────\n`;
    topUsers.forEach(([id, data], index) => { const name = USERS[id]?.name || "Ẩn danh"; topMsg += `${index + 1}. ${name}: ${moneyFmt(data.money)}\n`; });
    topMsg += `────────────────────\n`;
    return sendText(threadId, `🎰 HỆ THỐNG TÀI XỈU TIÊN ẢO 🎰\n────────────────────\n👤 Người chơi: ${senderName || userId}\n💳 Số dư: ${moneyFmt(userTx.money)}\n────────────────────\n📋 HƯỚNG DẪN:\n🎁 ${prefix}tx diemdanh — Điểm danh (nhận 100-1000$)\n🎲 ${prefix}tx tai <tiền> — Cược Tài (11-18)\n🎲 ${prefix}tx xiu <tiền> — Cược Xỉu (3-10)\n📌 VD: ${prefix}tx tai 500\n────────────────────\n${topMsg}`, 120000);
  }

  if (cmd === "boxlist") {
    const allBoxes = Object.entries(GROUPS);
    if (!allBoxes.length) return sendText(threadId, "📦 Bot chưa tham gia nhóm nào!");
    let msg = `📦 DANH SÁCH BOX CỦA BOT (${allBoxes.length})\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    allBoxes.forEach(([tid, g], i) => {
      const isRented = g.expiresAt && g.expiresAt > Date.now();
      const daysLeft = isRented ? Math.ceil((g.expiresAt - Date.now()) / 86400000) : 0;
      msg += `${i + 1}. ${g.name || "Box " + tid}\n   🆔 ID: ${tid}\n   🔑 Trạng thái: ${isRented ? `✅ ĐÃ THUÊ (còn ${daysLeft} ngày)` : "❌ CHƯA THUÊ"}\n   ⏳ Hết hạn: ${isRented ? fmtDate(g.expiresAt) : "—"}\n\n`;
    });
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    return sendText(threadId, msg, 120000);
  }

  if (cmd === "xtg") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin mới được dùng lệnh này!");
    const sub = (args[1] || "").toLowerCase();
    if (sub === "all") {
      let count = 0;
      for (const [tid, g] of Object.entries(GROUPS)) {
        if ((g.expiresAt && g.expiresAt > 0) || g.key) {
          g.expiresAt = 0; g.key = null; saveGroups();
          await updateBotNickname(api, tid, 0); count++; await delay(500);
        }
      }
      return sendText(threadId, `✅ Đã xóa thời gian thuê của TOÀN BỘ ${count} box!`, 120000);
    }
    if (sub === "list" || sub === "ds") {
      const now = Date.now();
      const activeBoxes = Object.entries(GROUPS).filter(([tid, g]) => g.expiresAt && g.expiresAt > now).sort((a, b) => b[1].expiresAt - a[1].expiresAt);
      if (!activeBoxes.length) return sendText(threadId, "📦 Chưa có box nào đang thuê!", 120000);
      let msg = `📦 DANH SÁCH BOX ĐANG THUÊ (${activeBoxes.length})\n────────────────────────\n`;
      activeBoxes.forEach(([tid, g], i) => { const daysLeft = Math.ceil((g.expiresAt - now) / 86400000); msg += `${i + 1}. ${g.name || "Box " + tid} — Còn ${daysLeft} ngày\n`; });
      msg += `────────────────────────\n👉 Reply (Trả lời) tin nhắn này: <STT>\nVD: 1 (Xóa box 1) hoặc 1,2,3 (Xóa nhiều box)`;
      pendingStep[pendingKey] = { step: "xtg_select", boxList: activeBoxes.map(([tid]) => tid) };
      return sendText(threadId, msg, 120000);
    }
    if (!isGroup) return sendText(threadId, "❌ Lệnh này chỉ dùng trong NHÓM!");
    const g = GROUPS[threadId];
    if (!g || !g.expiresAt || g.expiresAt <= Date.now()) return sendText(threadId, "⚠️ Box này hiện không được thuê!");
    g.expiresAt = 0; g.key = null; saveGroups();
    await updateBotNickname(api, threadId, 0);
    return sendText(threadId, `✅ Đã xóa thời gian thuê của box này!`, 120000);
  }

  if (cmd === "delay") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin mới được dùng lệnh này!");
    const secs = parseInt(args[1]);
    if (!secs || secs <= 0) return sendText(threadId, `❌ Cú pháp: ${prefix}delay <số giây>`);
    globalDelayUntil = Date.now() + secs * 1000;
    return sendText(threadId, `⏳ Đã bật chế độ IM LẶNG TOÀN CẦU trong ${secs} giây!\n(Chỉ Admin mới có thể ra lệnh trong lúc này)`, 120000);
  }

  if (cmd === "ban") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin mới được dùng lệnh ban!");
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!");
    const sub = (args[1] || "").toLowerCase();
    if (sub === "list" || sub === "ds") {
      const now = Date.now();
      const activeBans = Object.entries(BANS).filter(([id, b]) => b.expiresAt > now);
      if (activeBans.length === 0) return sendText(threadId, "🔓 Hiện không có ai đang bị ban.", 120000);
      let msg = `🔒 DANH SÁCH NGƯỜI BỊ BAN (${activeBans.length})\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      activeBans.forEach(([id, b], i) => {
        const daysLeft = Math.ceil((b.expiresAt - now) / 86400000); const name = USERS[id]?.name || `Người dùng ẩn danh`; const maskedId = id.length > 8 ? id.slice(0, 8) + "**" : id;
        msg += `${i + 1}. ${name}\n   🆔 ID: ${maskedId}\n   ⏳ Còn: ${daysLeft} ngày (Hết hạn: ${fmtDate(b.expiresAt)})\n   📝 Lý do: ${b.reason || "Không rõ"}\n\n`;
      });
      msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n👉 Reply (Trả lời) tin nhắn này: <STT>\nVD: 1 (Gỡ người 1) hoặc 1,2,3 (Gỡ nhiều người)`;
      pendingStep[pendingKey] = { step: "ban_select", banList: activeBans.map(([id]) => id) };
      return sendText(threadId, msg, 120000);
    }
    let targetId = args[1]; let days = parseInt(args[2]); let reason = args.slice(3).join(" ");
    if (message?.messageReply) { targetId = String(message.messageReply.senderID); days = parseInt(args[1]); reason = args.slice(2).join(" "); } 
    else if (message?.mentions && Object.keys(message.mentions).length > 0) { targetId = Object.keys(message.mentions)[0]; days = parseInt(args[1]); reason = args.slice(2).join(" "); }
    if (!targetId || !/^\d+$/.test(targetId) || !days || days <= 0) return sendText(threadId, `❌ Cú pháp: ${prefix}ban <ID/tag/reply> <số ngày> [lý do]\nVD: ${prefix}ban 100095311641059 7 Spam`, 120000);
    if (String(targetId) === String(userId)) return sendText(threadId, "❌ Không thể tự ban chính mình!", 120000);
    if (isAdmin(targetId)) return sendText(threadId, "❌ Không thể ban Admin!", 120000);
    const expiresAt = Date.now() + days * 86400000;
    BANS[targetId] = { expiresAt, reason: reason || "Vi phạm quy định" };
    saveBans();
    const targetName = USERS[targetId]?.name || "Người dùng"; const maskedId = targetId.length > 8 ? targetId.slice(0, 8) + "**" : targetId;
    return sendText(threadId, `✅ ĐÃ BAN THÀNH CÔNG!\n\n╭────────────────────────────╮\n│ 👤 Đối tượng: ${targetName}\n│ 🆔 ID: ${maskedId}\n│ ⏳ Thời hạn: ${days} ngày\n│ 📆 Đến ngày: ${fmtDate(expiresAt)}\n│ 📝 Lý do: ${reason || "Không rõ"}\n╰────────────────────────────╯\n\n🔒 Đã khóa quyền sử dụng bot của người này!`, 120000);
  }

  if (cmd === "unban") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin mới được dùng lệnh unban!");
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!");
    let targetId = args[1];
    if (message?.messageReply) targetId = String(message.messageReply.senderID);
    else if (message?.mentions && Object.keys(message.mentions).length > 0) targetId = Object.keys(message.mentions)[0];
    if (!targetId || !/^\d+$/.test(targetId)) return sendText(threadId, `❌ Cú pháp: ${prefix}unban <ID/tag/reply>`, 120000);
    if (!BANS[targetId]) return sendText(threadId, `⚠️ Người này không có trong danh sách bị ban!`, 120000);
    delete BANS[targetId]; saveBans();
    return sendText(threadId, `✅ Đã gỡ ban cho ${targetId}!`, 120000);
  }

  if (cmd === "qtv") {
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!");
    const sub = (args[1] || "").toLowerCase();
    if (sub !== "list" && sub !== "ds") return sendText(threadId, `❌ Cú pháp: ${prefix}qtv list`);
    try {
      const threadInfo = await new Promise((resolve) => api.getThreadInfo(threadId, (e, r) => resolve(e ? null : r)));
      if (!threadInfo || !threadInfo.adminIDs || threadInfo.adminIDs.length === 0) return sendText(threadId, "ℹ️ Nhóm này không có QTV nào.", 120000);
      let msg = `👑 DANH SÁCH QTV TRONG NHÓM (${threadInfo.adminIDs.length})\n────────────────────────\n`;
      threadInfo.adminIDs.forEach((admin, i) => { const user = threadInfo.userInfo.find(u => u.id === admin.id); const name = user ? user.name : admin.id; msg += `${i + 1}. ${name}\n`; });
      msg += `────────────────────────`;
      return sendText(threadId, msg, 120000);
    } catch (e) { return sendText(threadId, `❌ Lỗi lấy danh sách QTV: ${e.message}`, 120000); }
  }

  if (cmd === "unsend") {
    if (message?.messageReply) {
      const repliedSenderId = message.messageReply.senderID; const botId = api.getCurrentUserID();
      if (String(repliedSenderId) === String(botId)) {
        const repliedMsgId = message.messageReply.messageID;
        api.unsendMessage(repliedMsgId, (err) => { if (err) return sendText(threadId, "❌ Không thể thu hồi tin nhắn này (có thể đã quá 24h).", 120000); });
      } else { return sendText(threadId, "❌ Chỉ có thể thu hồi tin nhắn do BOT gửi!", 120000); }
    } else { return sendText(threadId, `⚠️ Hãy Reply (Trả lời) vào tin nhắn của BOT mà bạn muốn thu hồi, sau đó gõ: ${prefix}unsend`, 120000); }
    return;
  }

  if (cmd === "addqtv") {
    if (!isGroup) return sendText(threadId, "❌ Lệnh này chỉ dùng trong NHÓM!");
    if (!isStaff(userId)) return sendText(threadId, "🚫 Chỉ admin/CTV mới được thêm QTV!", 120000);
    if (!message?.messageReply) return sendText(threadId, `⚠️ Hãy Reply (Trả lời) vào tin nhắn của người bạn muốn thêm làm QTV, sau đó gõ: ${prefix}addqtv`, 120000);
    const targetId = message.messageReply.senderID; const botId = api.getCurrentUserID();
    if (String(targetId) === String(botId)) return sendText(threadId, "❌ Không thể thêm BOT làm QTV!", 120000);
    if (String(targetId) === String(userId)) return sendText(threadId, "❌ Bạn không thể tự thêm chính mình!", 120000);
    api.changeAdminStatus(threadId, targetId, true, (err) => {
      if (err) return sendText(threadId, `❌ Không thể thêm QTV. Lỗi: ${err.error || "Không xác định"}`, 120000);
      return sendText(threadId, `✅ Đã thêm ${targetId} làm Quản Trị Viên (QTV) trong nhóm!`, 120000);
    });
    return;
  }

  if (cmd === "setname") {
    if (!isGroup) return sendText(threadId, "❌ Lệnh này chỉ dùng trong nhóm!", 120000);
    const isQtv = await isGroupAdmin(api, threadId, userId);
    if (!isAdmin(userId) && !isCtv(userId) && !isQtv) return sendText(threadId, "🚫 Chỉ Admin/CTV/QTV nhóm mới được dùng lệnh này!", 120000);
    const newName = args.slice(1).join(" ").trim();
    let targetId = String(userId); let targetName = senderName || userId;
    if (message?.messageReply) { targetId = String(message.messageReply.senderID); targetName = message.messageReply.senderName || USERS[targetId]?.name || targetId; }
    const isReset = !newName || ["reset", "go", "xoa", "gỡ", "xóa"].includes(newName.toLowerCase());
    if (isReset) {
      try {
        await new Promise((resolve, reject) => { api.changeNickname("", threadId, targetId, (err) => err ? reject(err) : resolve()); });
        reactMessage("✅", message.messageID, threadId);
        return sendText(threadId, `┏━━━━━━━━━━━━━┓\n┃ ✅ ĐÃ GỠ TÊN  ┃\n┗━━━━━━━━━━━━━┛\n\n👤 Người được gỡ: ${targetName}\n📛 Trạng thái: Đã trở về tên thật\n👑 Người thực hiện: ${senderName || userId}\n⏰ ${timeVN().t} ${timeVN().d}`, 120000);
      } catch (e) { reactMessage("❌", message.messageID, threadId); return sendText(threadId, `❌ Lỗi gỡ tên (Có thể Bot không có quyền QTV): ${e.message || e.error}`, 120000); }
    }
    if (newName.length > 50) return sendText(threadId, `❌ Tên quá dài! Tối đa 50 ký tự.`, 120000);
    try {
      await new Promise((resolve, reject) => { api.changeNickname(newName, threadId, targetId, (err) => err ? reject(err) : resolve()); });
      reactMessage("✅", message.messageID, threadId);
      return sendText(threadId, `┏━━━━━━━━━━━━━┓\n┃ ✅ ĐÃ ĐỔI TÊN  ┃\n┗━━━━━━━━━━━━━┛\n\n👤 Người được đổi: ${targetName}\n📛 Tên mới: ${newName}\n👑 Người thực hiện: ${senderName || userId}\n⏰ ${timeVN().t} ${timeVN().d}`, 120000);
    } catch (e) { reactMessage("❌", message.messageID, threadId); return sendText(threadId, `❌ Lỗi đổi tên (Có thể Bot không có quyền QTV): ${e.message || e.error}`, 120000); }
  }

  if (cmd === "hs") {
    const hsContent = text.substring(prefix.length + 2).trim(); 
    return await handleHoSo(userId, senderName, hsContent, sendText, threadId, prefix);
  }

  if (cmd === "key") {
    const sub = (args[1] || "").toLowerCase();
    if (!sub) {
      const g = isGroup ? GROUPS[threadId] : null; const rented = isGroup && isBoxRented(threadId);
      return sendText(threadId, `🔑 QUẢN LÝ KEY — ${isGroup ? "BOX NHÓM" : "CHAT RIÊNG"}\n\n` + (isGroup ? `📦 Box: ${g.name || threadId}\n📅 Trạng thái: ${rented ? `✅ ĐÃ THUÊ (còn ${formatUptime(boxTimeLeft(threadId))})` : "❌ CHƯA THUÊ"}\n` + (rented ? `🔑 Key đã dùng: ${g.key || "?"}\n📆 Hết hạn: ${fmtDate(g.expiresAt)}\n` : "") + "\n" : "") + "📋 HƯỚNG DẪN:\n" + `  👤 Thành viên:\n     ${prefix}key nhap <mã key>       — Nhập key thuê box\n\n` + `  👑 Admin:\n     ${prefix}key tao <mã> <ngày>      — Tạo key thủ công\n     ${prefix}key tao auto <ngày>      — Tạo key tự động\n     ${prefix}key list                 — Danh sách key\n     ${prefix}key info <mã>            — Chi tiết key\n     ${prefix}key xoa <mã>             — Xoá key\n     ${prefix}key stop <mã>            — Dừng/Huỷ key vĩnh viễn\n     ${prefix}key giahan <mã> <ngày>   — Gia hạn key\n     ${prefix}key giahan box <ngày>    — Gia hạn box hiện tại\n     ${prefix}key box                  — Xem box đang thuê`, 120000);
    }
    if (sub === "tao" || sub === "create" || sub === "new") {
      if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin mới được tạo key!", 120000);
      let keyCode = args[2]; let days = parseInt(args[3]);
      if (keyCode?.toLowerCase() === "auto") { let maxStt = 0; for (const k of Object.keys(KEYS)) { const match = /^NHTN-VIP(\d+)$/i.exec(k); if (match) { const num = parseInt(match[1]); if (num > maxStt) maxStt = num; } } keyCode = `NHTN-VIP${maxStt + 1}`; }
      if (keyCode && /^\d+$/.test(keyCode) && !days) { days = parseInt(keyCode); let maxStt = 0; for (const k of Object.keys(KEYS)) { const match = /^NHTN-VIP(\d+)$/i.exec(k); if (match) { const num = parseInt(match[1]); if (num > maxStt) maxStt = num; } } keyCode = `NHTN-VIP${maxStt + 1}`; }
      if (!days) days = 30;
      if (!keyCode || !days || days <= 0) return sendText(threadId, `❌ Cú pháp: ${prefix}key tao <mã> <ngày> | ${prefix}key tao auto <ngày>`, 120000);
      keyCode = keyCode.toUpperCase().trim();
      if (KEYS[keyCode]) return sendText(threadId, `⚠️ Key "${keyCode}" đã tồn tại!`, 120000);
      KEYS[keyCode] = { days, createdAt: Date.now(), createdBy: String(userId), usedBy: null, usedAt: null, usedInBox: null, expiresAt: null, stopped: false };
      saveKeys();
      return sendText(threadId, `✅ ĐÃ TẠO KEY MỚI!\n\n🔑 Mã key: ${keyCode}\n📅 Số ngày: ${days} ngày\n👑 Người tạo: ${senderName || userId}\n⏰ ${timeVN().t} ${timeVN().d}\n\n📋 Giao key này cho khách. Họ gõ:\n   ${prefix}key nhap ${keyCode}`, 120000);
    }
    if (sub === "nhap" || sub === "input" || sub === "use" || sub === "active") {
      if (!isGroup) return sendText(threadId, "❌ Lệnh này chỉ dùng trong NHÓM!", 120000);
      const keyCode = (args[2] || "").toUpperCase().trim();
      if (!keyCode) return sendText(threadId, `❌ Cú pháp: ${prefix}key nhap <mã key>`, 120000);
      const k = KEYS[keyCode];
      if (!k) return sendText(threadId, `❌ KEY KHÔNG TỒN TẠI!\n🔑 Mã bạn nhập: ${keyCode}`, 120000);
      if (k.stopped) return sendText(threadId, `❌ KEY NÀY ĐÃ BỊ DỪNG/HUỶ BỞI ADMIN!`, 120000);
      if (k.usedBy) return sendText(threadId, `❌ KEY NÀY ĐÃ ĐƯỢC SỬ DỤNG RỒI!`, 120000);
      const g = GROUPS[threadId]; const now = Date.now();
      g.expiresAt = Math.max(now, g.expiresAt || 0) + k.days * 86400000;
      g.key = keyCode; g.rentedAt = now; g.rentedBy = String(userId); saveGroups();
      KEYS[keyCode] = { ...k, usedBy: String(userId), usedAt: now, usedInBox: String(threadId), expiresAt: g.expiresAt };
      saveKeys();
      await sendText(threadId, `✅ KÍCH HOẠT THÀNH CÔNG!\n🔑 Key: ${keyCode}\n📅 Hạn: ${k.days} ngày\n📆 Hết hạn: ${fmtDate(g.expiresAt)}`, 120000);
      setTimeout(async () => { await updateBotNickname(api, threadId, g.expiresAt); }, 1500);
      return;
    }
    if (sub === "list" || sub === "ds") {
      if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
      const entries = Object.entries(KEYS);
      if (!entries.length) return sendText(threadId, "📋 Chưa có key nào.", 120000);
      const now = Date.now();
      const lines = entries.slice(0, 30).map(([code, k], i) => { let status = "🟢 Chưa dùng"; if (k.stopped) status = "🚫 Đã dừng"; else if (k.usedBy) status = (k.expiresAt > now ? `🟡 Đang dùng` : "🔴 Hết hạn"); return `${i + 1}. ${code} | ${k.days}d | ${status}`; });
      return sendText(threadId, `🔑 DANH SÁCH KEY (${entries.length})\n\n` + lines.join("\n"), 120000);
    }
    if (sub === "info" || sub === "xem") {
      if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
      const keyCode = (args[2] || "").toUpperCase().trim();
      if (!keyCode) return sendText(threadId, `❌ ${prefix}key info <mã>`, 120000);
      const k = KEYS[keyCode];
      if (!k) return sendText(threadId, `❌ Key không tồn tại!`, 120000);
      const now = Date.now(); let statusStr = "🟢 Chưa dùng";
      if (k.stopped) statusStr = "🚫 Đã dừng (Admin huỷ)"; else if (k.usedBy) statusStr = (k.expiresAt > now ? "🟡 Đang hoạt động" : "🔴 Hết hạn");
      return sendText(threadId, `🔑 CHI TIẾT: ${keyCode}\n📅 Ngày: ${k.days}\n📦 Trạng thái: ${statusStr}\n` + (k.usedBy ? `👤 Box: ${k.usedInBox}\n📅 Dùng lúc: ${fmtDate(k.usedAt)}\n📆 Hết hạn: ${fmtDate(k.expiresAt)}` : ""), 120000);
    }
    if (sub === "xoa" || sub === "del" || sub === "remove") {
      if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
      const keyCode = (args[2] || "").toUpperCase().trim();
      if (!KEYS[keyCode]) return sendText(threadId, `❌ Key không tồn tại!`, 120000);
      delete KEYS[keyCode]; saveKeys();
      return sendText(threadId, `✅ Đã xoá key "${keyCode}".`, 120000);
    }
    if (sub === "stop") {
      if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
      const keyCode = (args[2] || "").toUpperCase().trim();
      if (!keyCode) return sendText(threadId, `❌ Cú pháp: ${prefix}key stop <mã key>`, 120000);
      const k = KEYS[keyCode];
      if (!k) return sendText(threadId, `❌ Key không tồn tại!`, 120000);
      if (k.stopped) return sendText(threadId, `⚠️ Key này đã bị dừng từ trước rồi!`, 120000);
      k.stopped = true; k.stoppedAt = Date.now(); saveKeys();
      let boxNote = "";
      if (k.usedInBox) {
        const g = GROUPS[k.usedInBox];
        if (g) { g.expiresAt = 0; g.key = null; saveGroups(); await updateBotNickname(api, k.usedInBox, 0); boxNote = `\n⚠️ Đã huỷ kích hoạt box: ${g.name || k.usedInBox}`; }
      }
      return sendText(threadId, `✅ ĐÃ DỪNG KEY!\n🔑 Mã: ${keyCode}\n🚫 Trạng thái: Không thể sử dụng lại.${boxNote}`, 120000);
    }
    if (sub === "giahan" || sub === "extend" || sub === "gh") {
      if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
      if ((args[2] || "").toLowerCase() === "box") {
        if (!isGroup) return sendText(threadId, `❌ Dùng trong NHÓM!`, 120000);
        const days = parseInt(args[3]);
        if (!days || days <= 0) return sendText(threadId, `❌ ${prefix}key giahan box <ngày>`, 120000);
        const g = GROUPS[threadId];
        if (!g.expiresAt || g.expiresAt <= Date.now()) return sendText(threadId, `⚠️ Box chưa thuê!`, 120000);
        g.expiresAt += days * 86400000; saveGroups();
        if (g.key && KEYS[g.key]) { KEYS[g.key].expiresAt = g.expiresAt; saveKeys(); }
        await updateBotNickname(api, threadId, g.expiresAt);
        return sendText(threadId, `✅ GIA HẠN BOX THÀNH CÔNG\n➕ Thêm: ${days} ngày\n📆 Hạn mới: ${fmtDate(g.expiresAt)}`, 120000);
      }
      const keyCode = (args[2] || "").toUpperCase().trim(); const days = parseInt(args[3]);
      if (!keyCode || !days || days <= 0) return sendText(threadId, `❌ Cú pháp: ${prefix}key giahan <mã> <ngày>`, 120000);
      const k = KEYS[keyCode];
      if (!k) return sendText(threadId, `❌ Key không tồn tại!`, 120000);
      if (k.stopped) return sendText(threadId, `⚠️ Key này đã bị dừng, không thể gia hạn!`, 120000);
      if (!k.usedBy) { k.days += days; saveKeys(); return sendText(threadId, `✅ ĐÃ GIA HẠN (CHƯA DÙNG)\n➕ Thêm: ${days} ngày\n📅 Tổng ngày: ${k.days}`, 120000); }
      const g = GROUPS[k.usedInBox];
      if (!g) return sendText(threadId, `⚠️ Box không còn tồn tại!`, 120000);
      g.expiresAt = (g.expiresAt || Date.now()) + days * 86400000; saveGroups();
      k.expiresAt = g.expiresAt; k.days += days; saveKeys();
      if (k.usedInBox === String(threadId)) { await updateBotNickname(api, threadId, g.expiresAt); }
      return sendText(threadId, `✅ GIA HẠN KEY THÀNH CÔNG\n➕ Thêm: ${days} ngày\n📆 Hạn mới: ${fmtDate(g.expiresAt)}`, 120000);
    }
    if (sub === "box" || sub === "boxes" || sub === "dsbox") {
      if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
      const now = Date.now();
      const activeBoxes = Object.entries(GROUPS).filter(([tid, g]) => g.expiresAt && g.expiresAt > now).sort((a, b) => b[1].expiresAt - a[1].expiresAt);
      if (!activeBoxes.length) return sendText(threadId, "📦 Chưa có box nào đang thuê!", 120000);
      const lines = activeBoxes.slice(0, 20).map(([tid, g], i) => `${i + 1}. ${g.name || tid} | Key: ${g.key || "?"} | Còn: ${formatUptime(g.expiresAt - now)}`);
      return sendText(threadId, `📦 DS BOX ĐANG THUÊ (${activeBoxes.length})\n\n` + lines.join("\n"), 120000);
    }
    return sendText(threadId, `❌ Sub lệnh không hỗ trợ!`, 120000);
  }

  // ═══════════════════════════════════════════════
  // LỆNH BANK & CHUYỂN KHOẢN
  // ═══════════════════════════════════════════════
  if (["bank", "vay", "naptien", "ruttien", "trano", "hanmuc", "ck", "sodu", "lichsu"].includes(cmd)) {
    const uid = String(userId);
    if (!TX_DATA[uid]) { TX_DATA[uid] = { money: 0, lastDaily: 0 }; saveTx(); }
    const userTx = TX_DATA[uid];
    
    if (userTx.bank === undefined) userTx.bank = 0;
    if (userTx.debt === undefined) userTx.debt = 0;
    if (userTx.debtOrigin === undefined) userTx.debtOrigin = 0;
    if (userTx.debtTime === undefined) userTx.debtTime = 0;
    if (userTx.debtThread === undefined) userTx.debtThread = null;
    if (userTx.debtNotified === undefined) userTx.debtNotified = false;
    if (userTx.totalPay === undefined) userTx.totalPay = 0;
    if (userTx.historySend === undefined) userTx.historySend = [];
    if (userTx.historyReceive === undefined) userTx.historyReceive = [];

    const moneyFmt = (num) => num.toLocaleString("vi-VN") + " $";

    const getBankTier = (total) => {
      if (total >= 50) return { level: 5, name: "Kim Cương", emoji: "👑", max: 500000, req: 50, nextReq: null };
      if (total >= 30) return { level: 4, name: "Bạch Kim", emoji: "💎", max: 300000, req: 30, nextReq: 50 };
      if (total >= 15) return { level: 3, name: "Vàng", emoji: "🥇", max: 200000, req: 15, nextReq: 30 };
      if (total >= 5)  return { level: 2, name: "Bạc", emoji: "🥈", max: 150000, req: 5, nextReq: 15 };
      return { level: 1, name: "Đồng", emoji: "🥉", max: 100000, req: 0, nextReq: 5 };
    };

    const getProgressBar = (total) => {
      const tier = getBankTier(total);
      if (tier.level === 5) return "[■■■■■■■■■■] (MAX)";
      const currentInLevel = total - tier.req;
      const neededInLevel = tier.nextReq - tier.req;
      let filled = Math.floor((currentInLevel / neededInLevel) * 10);
      if (filled > 10) filled = 10;
      const empty = 10 - filled;
      return `[${"■".repeat(filled)}${"□".repeat(empty)}] (${currentInLevel}/${neededInLevel} lần)`;
    };

    const userTier = getBankTier(userTx.totalPay);

    if (cmd === "ck") {
      let targetId = null;
      if (message?.messageReply) targetId = String(message.messageReply.senderID);
      else if (message?.mentions && Object.keys(message.mentions).length > 0) targetId = Object.keys(message.mentions)[0];
      
      if (!targetId) return sendText(threadId, `❌ Hãy **Reply** hoặc **Tag** tên người bạn muốn chuyển khoản!\n📌 VD: ${prefix}ck @Tên 10000 Tiền nợ`, 120000);
      if (targetId === uid) return sendText(threadId, `❌ Không thể tự chuyển khoản cho chính mình!`, 120000);
      if (targetId === api.getCurrentUserID()) return sendText(threadId, `❌ Không thể chuyển khoản cho Bot!`, 120000);
      
      if (!TX_DATA[targetId]) { TX_DATA[targetId] = { money: 0, lastDaily: 0, bank: 0, debt: 0 }; saveTx(); }
      const targetTx = TX_DATA[targetId];
      if (targetTx.historyReceive === undefined) targetTx.historyReceive = [];

      const amount = parseInt(args[1]);
      if (!amount || amount <= 0) return sendText(threadId, `❌ Số tiền chuyển không hợp lệ!`, 120000);
      if (userTx.money < amount) return sendText(threadId, `❌ Ví của bạn không đủ ${moneyFmt(amount)} để chuyển!`, 120000);

      const content = args.slice(2).join(" ") || "Không có nội dung";
      const timeStr = timeVN().t + " " + timeVN().d;

      userTx.money -= amount;
      targetTx.money += amount;

      userTx.historySend.unshift({ to: targetId, amount, content, time: timeStr });
      if (userTx.historySend.length > 10) userTx.historySend.pop();
      
      targetTx.historyReceive.unshift({ from: uid, amount, content, time: timeStr });
      if (targetTx.historyReceive.length > 10) targetTx.historyReceive.pop();

      saveTx();

      const senderNameStr = USERS[uid]?.name || senderName || uid;
      const targetNameStr = USERS[targetId]?.name || targetId;

      return sendText(threadId, 
        `╭─────── ⋆⋅☆⋅⋆ ───────╮\n` +
        `     💸 CHUYỂN KHOẢN 💸\n` +
        `╰─────── ⋆⋅☆⋅⋆ ───────╯\n` +
        `📤 Người gửi: ${senderNameStr}\n` +
        `📥 Người nhận: ${targetNameStr}\n` +
        `💵 Số tiền: ${moneyFmt(amount)}\n` +
        `📝 Nội dung: ${content}\n` +
        `────────────────────\n` +
        `✅ Giao dịch thành công!\n` +
        `💳 Số dư còn lại: ${moneyFmt(userTx.money)}`, 120000);
    }

    if (cmd === "sodu") {
      let debtStatus = userTx.debt > 0 ? `⚠️ Nợ: ${moneyFmt(userTx.debt)}` : `✅ Không nợ`;
      return sendText(threadId, 
        `╭─────── ⋆⋅☆⋅⋆ ───────╮\n` +
        `     💳 VÍ CỦA BẠN 💳\n` +
        `╰─────── ⋆⋅☆⋅⋆ ───────╯\n` +
        `👤 Chủ thẻ: ${senderName || uid}\n` +
        `────────────────────\n` +
        `💵 Ví Game: ${moneyFmt(userTx.money)}\n` +
        `🏦 Trong Bank: ${moneyFmt(userTx.bank)}\n` +
        `💸 Trạng thái: ${debtStatus}\n` +
        `────────────────────\n` +
        `📊 Hạn mức vay: ${moneyFmt(userTier.max)}`, 120000);
    }

    if (cmd === "lichsu") {
      const type = (args[1] || "").toLowerCase();
      
      if (type === "ck") {
        if (userTx.historySend.length === 0) return sendText(threadId, `📭 Lịch sử chuyển khoản của bạn đang trống.`, 120000);
        let msg = `╭─────── ⋆⋅☆⋅⋆ ───────╮\n     📜 LỊCH SỬ CHUYỂN ĐI 📜\n╰─────── ⋆⋅☆⋅⋆ ───────╯\n`;
        userTx.historySend.forEach((h, i) => {
          const tName = USERS[h.to]?.name || "Ẩn danh";
          msg += `${i + 1}. Đến: ${tName}\n   💵 ${moneyFmt(h.amount)}\n   📝 ${h.content}\n   ⏰ ${h.time}\n────────────────────\n`;
        });
        return sendText(threadId, msg, 120000);
      }
      
      if (type === "nhan") {
        if (userTx.historyReceive.length === 0) return sendText(threadId, `📭 Lịch sử nhận tiền của bạn đang trống.`, 120000);
        let msg = `╭─────── ⋆⋅☆⋅⋆ ───────╮\n     📜 LỊCH SỬ NHẬN TIỀN 📜\n╰─────── ⋆⋅☆⋅⋆ ───────╯\n`;
        userTx.historyReceive.forEach((h, i) => {
          const fName = USERS[h.from]?.name || "Ẩn danh";
          msg += `${i + 1}. Từ: ${fName}\n   💵 ${moneyFmt(h.amount)}\n   📝 ${h.content}\n   ⏰ ${h.time}\n────────────────────\n`;
        });
        return sendText(threadId, msg, 120000);
      }
      
      return sendText(threadId, `❌ Cú pháp:\n👉 ${prefix}lichsu ck — Xem lịch sử chuyển đi\n👉 ${prefix}lichsu nhan — Xem lịch sử nhận tiền`, 120000);
    }

    if (cmd === "bank") {
      let debtStatus = "✅ Không có nợ";
      if (userTx.debt > 0) {
        const tax = userTx.debt - userTx.debtOrigin;
        debtStatus = `⚠️ Đang nợ: ${moneyFmt(userTx.debt)}\n   (Gốc: ${moneyFmt(userTx.debtOrigin)} + Thuế: ${moneyFmt(tax)})`;
      }
      
      return sendText(threadId, 
        `╭─────── ⋆⋅☆⋅⋆ ───────╮\n` +
        `     🏦 KARED BANK 🏦\n` +
        `╰─────── ⋆⋅☆⋅⋆ ───────╯\n` +
        `👤 Chủ thẻ: ${senderName || uid}\n` +
        `────────────────────\n` +
        `💳 Ví Game: ${moneyFmt(userTx.money)}\n` +
        `🏦 Trong Bank: ${moneyFmt(userTx.bank)}\n` +
        `💸 Trạng thái: ${debtStatus}\n` +
        `────────────────────\n` +
        `📜 LỆNH GIAO DỊCH:\n` +
        `💳 ${prefix}sodu — Xem số dư\n` +
        `💸 ${prefix}ck <tag/reply> <tiền> <nội dung>\n` +
        `📥 ${prefix}naptien <tiền> — Nạp (Min 50k)\n` +
        `📤 ${prefix}ruttien <tiền> — Rút (Min 50k)\n` +
        `💰 ${prefix}vay <tiền> — Vay (Max: ${moneyFmt(userTier.max)})\n` +
        `💵 ${prefix}trano <tiền> — Trả nợ\n` +
        `📊 ${prefix}hanmuc — Xem hạn mức\n` +
        `📜 ${prefix}lichsu ck / nhan — Xem lịch sử\n` +
        `────────────────────\n` +
        `⚠️ Lưu ý: Vay có thuế 20%. Trả đủ (gốc + thuế) mới được tính uy tín!`, 120000);
    }

    if (cmd === "hanmuc") {
      let maxMsg = userTier.level === 5 ? `🎉 Bạn đã đạt hạn mức vay tối đa của hệ thống!` : `👉 Hãy trả nợ đúng hạn (gồm 20% thuế) để lên Cấp ${userTier.level + 1} (Hạn mức ${moneyFmt(userTier.level === 1 ? 150000 : userTier.level === 2 ? 200000 : userTier.level === 3 ? 300000 : 500000)})!`;
      return sendText(threadId,
        `╭─────── ⋆⋅☆⋅⋆ ───────╮\n` +
        `     📊 HẠN MỨC TÍN DỤNG 📊\n` +
        `╰─────── ⋆⋅☆⋅⋆ ───────╯\n` +
        `👤 Chủ thẻ: ${senderName || uid}\n` +
        `────────────────────\n` +
        `${userTier.emoji} Hạng hiện tại: Cấp ${userTier.level} (${userTier.name})\n` +
        `💰 Hạn mức vay: ${moneyFmt(userTier.max)}\n` +
        `📈 Tiến độ thăng hạng:\n` +
        `   ${getProgressBar(userTx.totalPay)}\n` +
        `────────────────────\n` +
        `${maxMsg}`, 120000);
    }

    if (cmd === "naptien") {
      const amount = parseInt(args[1]);
      if (!amount || amount < 50000) return sendText(threadId, `❌ Số tiền nạp tối thiểu là 50.000$!`, 120000);
      if (userTx.money < amount) return sendText(threadId, `❌ Ví của bạn không đủ ${moneyFmt(amount)} để nạp!`, 120000);
      userTx.money -= amount; userTx.bank += amount; saveTx();
      return sendText(threadId, `✅ NẠP TIỀN THÀNH CÔNG!\n📥 Đã nạp: ${moneyFmt(amount)}\n🏦 Số dư Bank: ${moneyFmt(userTx.bank)}\n💳 Ví còn lại: ${moneyFmt(userTx.money)}`, 120000);
    }

    if (cmd === "ruttien") {
      const amount = parseInt(args[1]);
      if (!amount || amount < 50000) return sendText(threadId, `❌ Số tiền rút tối thiểu là 50.000$!`, 120000);
      if (userTx.bank < amount) return sendText(threadId, `❌ Bank của bạn không đủ ${moneyFmt(amount)} để rút!`, 120000);
      userTx.bank -= amount; userTx.money += amount; saveTx();
      return sendText(threadId, `✅ RÚT TIỀN THÀNH CÔNG!\n📤 Đã rút: ${moneyFmt(amount)}\n💳 Ví hiện tại: ${moneyFmt(userTx.money)}\n🏦 Bank còn lại: ${moneyFmt(userTx.bank)}`, 120000);
    }

    if (cmd === "vay") {
      if (userTx.debt > 0) return sendText(threadId, `❌ Bạn đang nợ ${moneyFmt(userTx.debt)}. Hãy trả hết nợ trước khi vay tiếp!`, 120000);
      const amount = parseInt(args[1]);
      if (!amount || amount <= 0) return sendText(threadId, `❌ Cú pháp: ${prefix}vay <số tiền>\n📊 Hạn mức của bạn: ${moneyFmt(userTier.max)}`, 120000);
      if (amount > userTier.max) return sendText(threadId, `❌ Hạn mức của bạn chỉ là ${moneyFmt(userTier.max)}. Hãy trả nợ để tăng hạn mức!`, 120000);
      
      const tax = Math.floor(amount * 0.2);
      const totalDebt = amount + tax;
      userTx.money += amount;
      userTx.debt = totalDebt;
      userTx.debtOrigin = amount;
      userTx.debtTime = Date.now();
      userTx.debtThread = threadId;
      userTx.debtNotified = false;
      saveTx();
      
      return sendText(threadId, 
        `╭─────── ⋆⋅☆⋅⋆ ───────╮\n` +
        `     💰 GIẢI NGÂN THÀNH CÔNG 💰\n` +
        `╰─────── ⋆⋅☆⋅⋆ ───────╯\n` +
        `💵 Số tiền vay: ${moneyFmt(amount)}\n` +
        `📉 Thuế (20%): ${moneyFmt(tax)}\n` +
        `💸 Tổng nợ phải trả: ${moneyFmt(totalDebt)}\n` +
        `⏳ Hạn chót: 1 Tiếng đồng hồ.\n\n` +
        `⚠️ Sau 1 tiếng, Bot sẽ tag tên bạn để đòi nợ. Trả đủ ${moneyFmt(totalDebt)} mới được cộng uy tín!`, 120000);
    }

    if (cmd === "trano") {
      if (userTx.debt <= 0) return sendText(threadId, `✅ Bạn hiện không có khoản nợ nào!`, 120000);
      const amount = parseInt(args[1]);
      if (!amount || amount <= 0) return sendText(threadId, `❌ Cú pháp: ${prefix}trano <số tiền>\n💸 Bạn đang nợ: ${moneyFmt(userTx.debt)}`, 120000);
      if (userTx.money < amount) return sendText(threadId, `❌ Ví của bạn không đủ ${moneyFmt(amount)} để trả!`, 120000);
      
      const payAmount = Math.min(amount, userTx.debt);
      userTx.money -= payAmount;
      userTx.debt -= payAmount;
      
      let msg = `💸 ĐÃ THANH TOÁN: ${moneyFmt(payAmount)}\n`;
      
      if (userTx.debt === 0) {
        userTx.debtTime = 0;
        userTx.debtOrigin = 0;
        userTx.debtNotified = false;
        userTx.totalPay = (userTx.totalPay || 0) + 1;
        
        const oldTier = getBankTier(userTx.totalPay - 1);
        const newTier = getBankTier(userTx.totalPay);
        
        msg += `✅ Chúc mừng! Bạn đã TRẢ HẾT NỢ (cả thuế).\n`;
        msg += `📈 Uy tín của bạn: +1 (Tổng: ${userTx.totalPay} lần)\n`;
        
        if (newTier.level > oldTier.level) {
          msg += `\n🎉 CHÚC MỪNG THĂNG HẠNG!\n`;
          msg += `👑 Bạn đã đạt Cấp ${newTier.level} (${newTier.emoji} ${newTier.name})\n`;
          msg += `💰 Hạn mức vay mới: ${moneyFmt(newTier.max)}`;
        }
      } else {
        msg += `⚠️ Vẫn còn nợ: ${moneyFmt(userTx.debt)}\n👉 Hãy trả đủ để được tính uy tín!`;
      }
      
      saveTx();
      return sendText(threadId, msg, 120000);
    }
  }
  if (cmd === "td" || cmd === "tdlg") {
    const isTdlg = (cmd === "tdlg"); const acc = args[1];
    if (!acc || !/^\d+$/.test(acc)) { reactMessage("❌", message.messageID, threadId); return sendText(threadId, `❌ Cú pháp: ${prefix}${cmd} [ID] | ${prefix}${cmd} [ID] cpr | ${prefix}${cmd} [ID] cprN | xoaN`, 120000); }
    tdPendingMsgs[pendingKey] = [];
    reactMessage("✅", message.messageID, threadId);
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/; const timeRegex = /^\d{1,2}(h\d{0,2})?$/i;
    if (args[2] && dateRegex.test(args[2]) && timeRegex.test(args[3]) && args[4] && dateRegex.test(args[4]) && args[5] && timeRegex.test(args[5])) {
      const startTs = parseCustomDateTime(args[2], args[3]); const endTs = parseCustomDateTime(args[4], args[5]);
      if (!startTs || !endTs) return sendText(threadId, "❌ Định dạng ngày giờ không hợp lệ! VD: 02/11/2026 21h50 02/11/2026 23h00", 120000);
      if (startTs >= endTs) return sendText(threadId, "❌ Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc!", 120000);
      let isCpr = false, cprThreshold = 50, excludeMatchIndex = null;
      for (const a of args.slice(6)) {
        const cm = /^cpr(\d+)?$/i.exec(a); if (cm) { isCpr = true; if (cm[1]) cprThreshold = parseInt(cm[1]); continue; }
        const xm = XOA_REGEX.exec(a); if (xm) excludeMatchIndex = parseInt(xm[1]);
      }
      const customKhung = { label: "Tùy chỉnh", start: args[3], end: args[5], startTs: startTs, endTs: endTs };
      pendingStep[pendingKey] = { step: "template", accountId: acc, mode: isCpr ? "bxhcpr" : "td", excludeMatchIndex, cprThreshold, customKhung: customKhung, customNgay: `${args[2]} - ${args[4]}`, command: isTdlg ? "tdlg" : "td", msgIdList: tdPendingMsgs[pendingKey] };
      const msgId = await sendText(threadId, "🖼️ CHỌN MẪU ẢNH BẢNG XẾP HẠNG (1-47)\n\n✏️ Nhập số từ 1 đến 47:", 120000);
      if (msgId) tdPendingMsgs[pendingKey].push(msgId);
      return;
    }
    let isCpr = false, cprThreshold = 50, excludeMatchIndex = null;
    for (const a of args.slice(2)) {
      const cm = /^cpr(\d+)?$/i.exec(a); if (cm) { isCpr = true; if (cm[1]) cprThreshold = parseInt(cm[1]); continue; }
      const xm = XOA_REGEX.exec(a); if (xm) excludeMatchIndex = parseInt(xm[1]);
    }
    pendingStep[pendingKey] = { step: "khung", accountId: acc, mode: isCpr ? "bxhcpr" : "td", excludeMatchIndex, cprThreshold, command: isTdlg ? "tdlg" : "td", msgIdList: tdPendingMsgs[pendingKey] };
    const list = Object.entries(KHUNG_GIO).map(([k, v]) => `${k} — ${v.label}`).join("\n");
    const msgId = await sendText(threadId, `📋 CHỌN KHUNG GIỜ${isCpr ? " (CPR)" : ""}\n${list}\n\n✏️ Nhập 1-8` + (isCpr ? `\n(ngưỡng ${cprThreshold}đ)` : "") + (excludeMatchIndex ? `\n(bỏ trận #${excludeMatchIndex})` : ""), 120000);
    if (msgId) tdPendingMsgs[pendingKey].push(msgId);
    return;
  }

  if (cmd === "tt" || cmd === "tutien") { return await handleTuTien(userId, senderName, args.slice(1), sendText, threadId, prefix, USERS, isAdmin); }

  if (cmd === "boxinfo") {
    const { t, d } = timeVN(); const g = isGroup ? GROUPS[threadId] : null; const rented = isGroup && isBoxRented(threadId);
    return sendText(threadId, `📦 THÔNG TIN BOX\n\n🆔 ID: ${threadId}\n👤 Người gõ: ${senderName || userId}\n🏷️ Loại: ${isGroup ? "Nhóm" : "Chat riêng"}\n` + (isGroup ? `📛 Tên: ${g.name || "?"}\n🔑 Thuê bot: ${rented ? `✅ ĐÃ THUÊ (còn ${formatUptime(boxTimeLeft(threadId))})` : "❌ CHƯA THUÊ"}\n📆 Hết hạn: ${rented ? fmtDate(g.expiresAt) : "—"}\n🔤 Prefix: ${g.prefix || CONFIG.prefix}\n` : "") + `⏰ ${t} | ${d}`, 120000);
  }

  if (cmd === "cdm") { const target = args.slice(1).join(" ") || (isGroup ? "cả nhóm" : "bạn"); return sendText(threadId, `🤬 ${target}: ${CDM_LIST[Math.floor(Math.random() * CDM_LIST.length)]}`, 120000); }

  if (cmd === "hsg") {
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!", 120000);
    const g = GROUPS[threadId]; const rented = isBoxRented(threadId);
    return sendText(threadId, `📛 HỒ SƠ NHÓM\n\n🆔 ID: ${threadId}\n📝 Tên: ${g.name || "?"}\n🔑 Trạng thái: ${rented ? `✅ ĐÃ THUÊ (còn ${formatUptime(boxTimeLeft(threadId))})` : "❌ CHƯA THUÊ"}\n` + (rented ? `🔑 Key: ${g.key}\n📆 Hết hạn: ${fmtDate(g.expiresAt)}\n👤 Thuê bởi: ${g.rentedBy}\n` : "") + `🔤 Prefix: ${g.prefix || CONFIG.prefix}\n🛡️ Anti-spam: ${g.anti.spam ? "BẬT" : "TẮT"}\n🛡️ Anti-link: ${g.anti.link ? "BẬT" : "TẮT"}\n🛡️ Anti-tagall: ${g.anti.tagall ? "BẬT" : "TẮT"}\n🔒 Lockchat: ${g.lockchat ? "BẬT" : "TẮT"}\n👮 QtvOnly: ${g.qtvonly ? "BẬT" : "TẮT"}`, 120000);
  }

  if (cmd === "id") {
    let targetId = String(userId); let note = "🆔 ID CỦA BẠN:";
    if (message?.messageReply) { targetId = String(message.messageReply.senderID); note = "🆔 ID NGƯỜI ĐƯỢC REPLY:"; } 
    else if (message?.mentions && Object.keys(message.mentions).length > 0) { targetId = Object.keys(message.mentions)[0]; note = "🆔 ID NGƯỜI ĐƯỢC TAG:"; }
    return sendText(threadId, `${note} ${targetId}\n🆔 ID Box (nhóm): ${threadId}\n👤 Người gõ lệnh: ${senderName || "Ẩn danh"} (${userId})`, 120000);
  }

  if (cmd === "capnhom") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!", 120000);
    const days = parseInt(args[1]);
    if (!days || days <= 0) return sendText(threadId, `❌ ${prefix}capnhom <số ngày>`, 120000);
    const g = GROUPS[threadId]; const base = Math.max(Date.now(), g.expiresAt || 0);
    g.expiresAt = base + days * 86400000; g.key = g.key || "ADMIN-CAP"; saveGroups();
    await updateBotNickname(api, threadId, g.expiresAt);
    return sendText(threadId, `┏━━━━━━━━━━━━━━┓\n┃ 👑 HOÀNG ÂN BAN XUỐNG ┃\n┗━━━━━━━━━━━━━━┛\n\nTrẫm - Đấng Tối Cao, nay ban lộc cho box này!\n\n📜 Chiếu chỉ:\n🎁 Thọ thêm: ${days} ngày\n⏳ Long mạch kéo dài đến:\n👉 ${fmtDate(g.expiresAt)}\n\n────────────────────\nKhâm thử! Các khanh hãy tận hưởng ân điển này!`, 120000);
  }

  if (cmd === "lockchat") {
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!", 120000);
    if (!isStaff(userId)) return sendText(threadId, "🚫 Chỉ admin/CTV!", 120000);
    const val = (args[1] || "").toLowerCase();
    if (val !== "on" && val !== "off") return sendText(threadId, `❌ ${prefix}lockchat on/off`, 120000);
    GROUPS[threadId].lockchat = val === "on"; saveGroups();
    return sendText(threadId, `✅ LockChat: ${val === "on" ? "BẬT" : "TẮT"}`, 120000);
  }

  if (cmd === "out") {
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!", 120000);
    if (!isStaff(userId)) return sendText(threadId, "🚫 Chỉ admin/CTV!", 120000);
    await sendText(threadId, "👋 Tạm biệt! Bot rời nhóm sau 3s...", 120000);
    setTimeout(() => { try { api.removeUserFromGroup(api.getCurrentUserID(), threadId, () => {}); } catch (e) { console.error(e.message); } }, 3000);
    return;
  }

  if (cmd === "qtvonly") {
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!", 120000);
    if (!isStaff(userId)) return sendText(threadId, "🚫 Chỉ admin/CTV!", 120000);
    const val = (args[1] || "").toLowerCase();
    if (val !== "on" && val !== "off") return sendText(threadId, `❌ ${prefix}qtvonly on/off`, 120000);
    GROUPS[threadId].qtvonly = val === "on"; saveGroups();
    return sendText(threadId, `✅ QtvOnly: ${val === "on" ? "BẬT" : "TẮT"}`, 120000);
  }

  if (cmd === "setprefix") {
    if (!isStaff(userId)) return sendText(threadId, "🚫 Chỉ admin/CTV!", 120000);
    const newPrefix = args[1];
    if (!newPrefix || newPrefix.length > 3) return sendText(threadId, `❌ ${prefix}setprefix <ký tự, tối đa 3>`, 120000);
    if (isGroup) { GROUPS[threadId].prefix = newPrefix; saveGroups(); return sendText(threadId, `✅ Prefix nhóm → "${newPrefix}"`, 120000); }
    CONFIG.prefix = newPrefix; saveConfig(); return sendText(threadId, `✅ Prefix GLOBAL → "${newPrefix}"`, 120000);
  }

  if (cmd === "admin") return sendText(threadId, `👑 ADMIN — ${BOT_NAME}\n\n` + (ADMIN_IDS.length ? ADMIN_IDS.map((a, i) => `${i + 1}. ${a}`).join("\n") : "Chưa cấu hình.") + `\n\n👥 CTV: ${CTV.length} người`, 120000);

  if (cmd === "command") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
    const shellCmd = args.slice(1).join(" ");
    if (!shellCmd) return sendText(threadId, `❌ ${prefix}command <lệnh shell>`, 120000);
    try {
      const { execSync } = require("child_process");
      const out = execSync(shellCmd, { encoding: "utf-8", timeout: 15000 });
      return sendText(threadId, `💻 KẾT QUẢ:\n\`\`\`\n${out.slice(0, 4000)}\n\`\`\``, 120000);
    } catch (e) { return sendText(threadId, `❌ Lỗi:\n${e.message.slice(0, 500)}`, 120000); }
  }

  if (cmd === "reloadconfig") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
    try {
      const cfg = loadConfigFile(); CONFIG_FILE = cfg;
      if (cfg.BOT_NAME) BOT_NAME = cfg.BOT_NAME;
      if (cfg.BOT_VERSION) BOT_VERSION = cfg.BOT_VERSION;
      if (Array.isArray(cfg.ADMIN_IDS)) ADMIN_IDS = cfg.ADMIN_IDS.map(s => String(s).trim()).filter(Boolean);
      return sendText(threadId, `✅ Đã reload config.js\n\n📛 Tên bot: ${BOT_NAME}\n🔤 Prefix: ${CONFIG.prefix}\n👑 Admin: ${ADMIN_IDS.length} người`, 120000);
    } catch (e) { return sendText(threadId, `❌ Lỗi reload: ${e.message}`, 120000); }
  }

  if (cmd === "restart") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
    await sendText(threadId, "🔄 Bot đang khởi động lại...", 120000);
    setTimeout(() => {
      const { spawn } = require("child_process");
      spawn(process.argv[0], process.argv.slice(1), { detached: true, stdio: "inherit", env: process.env }).unref();
      process.exit(0);
    }, 2000);
    return;
  }

  if (cmd === "upt" || cmd === "uptime") {
    const ms = Date.now() - SERVER_STARTED_AT; const d = Math.floor(ms / 86400000); const h = Math.floor((ms % 86400000) / 3600000); const m = Math.floor((ms % 3600000) / 60000); const s = Math.floor((ms % 60000) / 1000);
    const pad = (n) => String(n).padStart(2, "0"); const timeStr = `${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`;
    return sendText(threadId, `Chấm Con Đỉ Mẹ Mày\n────────────────────\n|› ⏳ Uptime: ${timeStr}`, 120000);
  }

  if (cmd === "kick") {
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!", 120000);
    if (!isStaff(userId)) return sendText(threadId, "🚫 Chỉ admin/CTV!", 120000);
    const mentions = Object.keys(message?.mentions || {}); let targetId = mentions[0] || args[1];
    if (!targetId && message?.messageReply) targetId = String(message.messageReply.senderID);
    if (!targetId || !/^\d+$/.test(targetId)) return sendText(threadId, `❌ Không xác định được người cần kick!\n\n📋 2 cách:\n  1️⃣ Reply tin nhắn người đó rồi gõ "${prefix}kick"\n  2️⃣ Gõ: "${prefix}kick <ID>"`, 120000);
    if (targetId === api.getCurrentUserID()) return sendText(threadId, "❌ Không thể kick bot!", 120000);
    if (targetId === String(userId)) return sendText(threadId, "❌ Không thể tự kick chính mình!", 120000);
    try {
      await new Promise((resolve, reject) => api.removeUserFromGroup(targetId, threadId, (err) => err ? reject(err) : resolve()));
      return sendText(threadId, `✅ Đã kick ${targetId} khỏi nhóm.`, 120000);
    } catch (e) { return sendText(threadId, `❌ Lỗi: ${e.message}`, 120000); }
  }

  if (cmd === "kickall") {
    if (!isGroup) return sendText(threadId, "❌ Chỉ dùng trong nhóm!", 120000);
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ ADMIN!", 120000);
    if ((args[1] || "").toLowerCase() !== "yes") return sendText(threadId, `⚠️ KICK TOÀN BỘ! Gõ lại: ${prefix}kickall yes`, 120000);
    try {
      const info = await new Promise((resolve) => api.getThreadInfo(threadId, (e, r) => resolve(e ? null : r)));
      if (!info) return sendText(threadId, "❌ Không lấy được danh sách!", 120000);
      const botId = api.getCurrentUserID(); const members = (info.participantIDs || []).filter(id => id !== botId && id !== String(userId));
      await sendText(threadId, `🔄 Kick ${members.length} thành viên...`, 120000);
      for (const mid of members) { try { await new Promise((r) => api.removeUserFromGroup(mid, threadId, () => r())); await new Promise(r => setTimeout(r, 500)); } catch {} }
      return sendText(threadId, `✅ Xong ${members.length} thành viên.`, 120000);
    } catch (e) { return sendText(threadId, `❌ Lỗi: ${e.message}`, 120000); }
  }

  if (cmd === "nhanvien") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
    const sub = (args[1] || "").toLowerCase();
    if (!sub || sub === "list") return sendText(threadId, `👥 DANH SÁCH CTV (${CTV.length})\n\n` + (CTV.length ? CTV.map((id, i) => `${i + 1}. ${id} (${USERS[id]?.name || "?"})`).join("\n") : "Chưa có ai.") + `\n\n📋 CÁCH DÙNG:\n  • Reply tin nhắn ai đó + "${prefix}nhanvien add"\n  • Reply tin nhắn ai đó + "${prefix}nhanvien remove"\n  • Hoặc gõ thẳng: "${prefix}nhanvien add <ID>"`, 120000);
    if (sub === "add" || sub === "remove" || sub === "del") {
      let targetId = args[2];
      if (!targetId && message?.messageReply) targetId = String(message.messageReply.senderID);
      if (!targetId && message?.mentions) { const mentions = Object.keys(message.mentions); if (mentions.length > 0) targetId = mentions[0]; }
      if (!targetId) return sendText(threadId, `❌ Không xác định được người cần ${sub === "add" ? "thêm" : "gỡ"}!\n\n📋 2 cách:\n  1️⃣ Reply tin nhắn của người đó rồi gõ: ${prefix}nhanvien ${sub}\n  2️⃣ Gõ: ${prefix}nhanvien ${sub} <ID>`, 120000);
      if (targetId === String(userId)) return sendText(threadId, `⚠️ Bạn là admin, không cần thêm CTV cho chính mình!`, 120000);
      if (targetId === api.getCurrentUserID()) return sendText(threadId, `⚠️ Không thể thêm BOT làm CTV!`, 120000);
      if (sub === "add") {
        if (CTV.includes(targetId)) return sendText(threadId, `⚠️ ${targetId} đã là CTV rồi!`, 120000);
        CTV.push(targetId); saveCtv();
        return sendText(threadId, `✅ ĐÃ THÊM CTV!\n\n👤 ID: ${targetId}\n📛 Tên: ${USERS[targetId]?.name || "?"}\n👑 Người thêm: ${senderName || userId}\n⏰ ${timeVN().t} ${timeVN().d}\n\n💡 CTV có quyền: kick, out, anti, lockchat, qtvonly, setprefix\n🚫 CTV KHÔNG được: tạo key, backup, restart, command, quản lý CTV khác`, 120000);
      }
      if (sub === "remove" || sub === "del") {
        const idx = CTV.indexOf(targetId);
        if (idx === -1) return sendText(threadId, `⚠️ ${targetId} không có trong danh sách CTV!`, 120000);
        CTV.splice(idx, 1); saveCtv();
        return sendText(threadId, `✅ ĐÃ GỠ CTV!\n\n👤 ID: ${targetId}\n📛 Tên: ${USERS[targetId]?.name || "?"}\n👑 Người gỡ: ${senderName || userId}\n⏰ ${timeVN().t} ${timeVN().d}`, 120000);
      }
    }
    return sendText(threadId, `❌ Sub lệnh không hỗ trợ!\n\n📋 Cách dùng:\n  • ${prefix}nhanvien\n  • Reply + ${prefix}nhanvien add\n  • Reply + ${prefix}nhanvien remove\n  • ${prefix}nhanvien add <ID>\n  • ${prefix}nhanvien remove <ID>`, 120000);
  }

  if (cmd === "thuebot") {
    const rented = isGroup && isBoxRented(threadId);
    return sendText(threadId, `💼 THUÊ BOT — ${BOT_NAME}\n\n` + (isGroup ? `📦 Box: ${rented ? `✅ ĐÃ THUÊ (còn ${formatUptime(boxTimeLeft(threadId))})` : "❌ CHƯA THUÊ"}\n\n` : "") + `📋 CÁCH THUÊ:\n  1️⃣ Liên hệ Admin để MUA KEY\n  2️⃣ Admin đưa mã key dạng: NHTN-XXXX-XXXX-XXXX\n  3️⃣ Trong nhóm, gõ: ${prefix}key nhap <MÃ_KEY>\n  4️⃣ Box kích hoạt ngay!\n\n👑 ADMIN:\n` + (ADMIN_IDS.length ? ADMIN_IDS.map(a => `   • ${a}`).join("\n") : "   (chưa cấu hình)"), 120000);
  }

  if (cmd === "backup") {
    if (!isAdmin(userId)) return sendText(threadId, "🚫 Chỉ admin!", 120000);
    try {
      const files = ["users.json", "groups.json", "config.json", "ctv.json", "keys.json", "tutien.json", "hoso.json", "qrdata.json", "autokick.json"];
      const backup = {};
      for (const f of files) { const p = path.join(__dirname, f); if (fs.existsSync(p)) backup[f] = JSON.parse(fs.readFileSync(p, "utf-8")); }
      const outPath = path.join(__dirname, `backup_${Date.now()}.json`);
      fs.writeFileSync(outPath, JSON.stringify(backup, null, 2));
      await new Promise((resolve) => { api.sendMessage({ body: `📦 Backup ${new Date().toLocaleString("vi-VN")}`, attachment: fs.createReadStream(outPath) }, threadId, () => { setTimeout(() => { try { fs.unlinkSync(outPath); } catch {} }, 10000); resolve(); }); });
      return;
    } catch (e) { return sendText(threadId, `❌ ${e.message}`, 120000); }
  }

  const notFoundMsg = [
    `🤔 Hỡi phàm nhân, ngươi đang muốn hỏi gì bổn tọa?\n👉 Gõ ${prefix}help để xem các pháp thuật (lệnh) ta có thể thi triển!`,
    `⚠️ Lệnh này ta không hiểu! Ngươi định dùng tà thuật gì đây?\n👉 Gõ ${prefix}help để xem lại bí kíp!`,
    `❓ Đạo hữu muốn tìm gì ở bản môn?\n👉 Bí kíp (lệnh) có tại ${prefix}help!`,
    `🌀 Ta không nhận ra lệnh này. Ngươi đang nói tiếng người hay tiếng yêu thú vậy?\n👉 Gõ ${prefix}help để ta chỉ cho!`,
    `📜 Thánh chỉ không có lệnh này! Mau gõ ${prefix}help để xem lại đi!`,
    `🧘‍♂️ Căn cơ bất ổn, gõ lệnh cũng sai. Về tu luyện thêm đi rồi hẵng dùng bot!`,
    `⚡ Thiên lôi đánh vào tay ngươi vì tội gõ linh tinh! Gõ ${prefix}help đi!`,
    `🛑 Dừng lại! Trận pháp bị phá vỡ vì lệnh này không tồn tại.`,
    `🕵️‍♂️ Bổn tọa đã dùng thần thức quét qua, hoàn toàn không có lệnh này trong bí kíp.`,
    `🤷‍♂️ Pháp bảo không tìm thấy. Có thể ngươi đang mộng du?`,
    `🧐 Lệnh này lạ quá, ta phải về bẩm báo Ngọc Hoàng!`,
    `🥲 Đạo hữu ơi, lệnh này ta chịu, ta không có học phép này!`,
    `🙏 A Di Đà Phật, thí chủ gõ sai rồi!`,
    `🌪️ Gió thổi bay mất lệnh của ngươi rồi, gõ lại ${prefix}help xem sao!`,
    `🧙‍♂️ Ta là pháp sư, không phải thần đèn, lệnh này ta không độ được!`,
    `🧟 Ngươi gọi ta ra chỉ để gõ sai lệnh thôi à?`,
    `🐉 Long mạch đang bị nghẽn, lệnh này không thông được.`,
    `🌙 Đêm nay trăng sáng, nhưng lệnh ngươi gõ thì tối thui!`,
    `💀 Ngươi chán sống rồi đúng không, dám gõ lệnh không tồn tại trước mặt ta?`,
    `🔮 Ta bói một quẻ, thấy ngươi đang gõ sai lệnh!`,
    `😅 Úi, lệnh này bot chưa cập nhật rồi. Bạn gõ ${prefix}help xem có gì nhé!`,
    `🤖 Bot không hiểu bạn đang nói gì. Hãy gõ ${prefix}help để được trợ giúp!`,
    `🤔 Bạn gõ sai cú pháp rồi. Xem lại ${prefix}help nhé!`,
    `😵 Lệnh này lạ quá, mình chịu! Bạn xem ${prefix}help thử xem.`,
    `🙏 Xin lỗi, mình không biết lệnh này. Bạn cần giúp gì không?`,
    `👀 Mình tìm muốn nát màn hình mà không thấy lệnh này đâu.`,
    `🚫 Lệnh không hợp lệ. Vui lòng gõ ${prefix}help để xem danh sách lệnh!`,
    `📝 Bạn có thể gõ sai chính tả? Thử lại hoặc xem ${prefix}help nhé.`,
    `😅 Bot ngu ngơ không hiểu. Bạn gõ ${prefix}help giúp mình với!`,
    `💡 Có vẻ bạn cần trợ giúp. Gõ ${prefix}help ngay nhé!`,
    `🕵️‍♀️ Bot đang điều tra lệnh này... nhưng không tìm thấy manh mối!`,
    `📵 Lệnh này chưa được hỗ trợ. Bạn xem qua ${prefix}help nhé.`,
    `🤷 Lệnh gì lạ vậy ta? Bot xin phép từ chối thực hiện.`,
    `😴 Bot đang ngủ, lệnh này không đánh thức được bot!`,
    `🧐 Có phải bạn gõ nhầm không? Thử lại hoặc gõ ${prefix}help xem sao.`,
    `🛠️ Lệnh này đang bảo trì, bạn gõ ${prefix}help để dùng lệnh khác nhé.`,
    `🐣 Lệnh này còn non lắm, chưa ra đời đâu bạn ơi!`,
    `🧩 Bot đang bối rối với lệnh này. Hãy gõ ${prefix}help nhé.`,
    `📞 Alo, tổng đài không có lệnh này. Vui lòng bấm ${prefix}help!`,
    `🍵 Bình tĩnh bạn ơi, lệnh này không có thật.`,
    `🎈 Lệnh bay màu rồi, bạn gõ ${prefix}help thay thế nhé.`,
    `😅 Có lẽ bạn cần một ly trà để bình tĩnh lại và gõ ${prefix}help.`,
    `🚀 Lệnh này đã bay vào vũ trụ, không quay lại nữa.`,
    `🧸 Bot không tìm thấy lệnh này. Đừng buồn, gõ ${prefix}help nhé!`,
    `🎮 Sai lệnh rồi, chơi lại ván mới bằng ${prefix}help đi!`,
    `🍄 Lệnh này độc lắm, bot không dám thực hiện!`,
    `🦄 Lệnh này chỉ có trong truyền thuyết thôi bạn ơi.`,
    `🌻 Bạn gõ lệnh gì mà bot không hiểu luôn vậy?`,
    `🎯 Trượt rồi! Mời bạn gõ ${prefix}help để bắn lại!`,
    `🎨 Bot không vẽ được lệnh này, bạn xem ${prefix}help nhé.`,
    `🙄 Gõ lệnh cũng sai, chán bạn ghê!`,
    `🤦‍♂️ Bó tay với bạn luôn, lệnh cơ bản cũng không biết.`,
    `😑 Mắt bạn để làm cảnh à? Nhìn lại ${prefix}help đi!`,
    `🤡 Bạn đang định làm trò hề gì thế?`,
    `🧠 Não bạn có vấn đề không? Lệnh này không có thật đâu!`,
    `🗣️ Nói ít thôi, gõ ${prefix}help đi!`,
    `🤫 Im lặng và gõ ${prefix}help, cảm ơn!`,
    `🤨 Bạn mới từ trên núi xuống à?`,
    `🤷‍♀️ Lệnh này không có thật, đừng mơ mộng nữa!`,
    `😒 Thật là hết nói nổi với bạn!`,
    `😮‍💨 Mệt mỏi với mấy đứa gõ sai lệnh ghê!`,
    `🤦‍♀️ Đi học lại đi bạn ơi, lệnh cơ bản mà cũng sai.`,
    `🙅‍♂️ Bot từ chối trả lời vì lệnh này quá vô nghĩa.`,
    `😪 Chán chả buồn nói, gõ ${prefix}help đi!`,
    `📉 Chỉ số thông minh của bạn đang tụt dốc đấy!`,
    `🤬 Đừng có thách thức sự kiên nhẫn của tao!`,
    `🖕 Gõ sai lệnh rồi cưng, xem lại đi!`,
    `🤥 Đừng có xạo, làm gì có lệnh này!`,
    `🤥 Lêu lêu, gõ sai lệnh rồi, nhục chưa!`,
    `🗑️ Lệnh rác rưởi, không có trong hệ thống!`,
    `💩 Bạn gõ cái quái gì thế này?`,
    `🤯 Bot sốc toàn tập với lệnh của bạn!`,
    `🫠 Tan chảy vì độ ngơ của bạn!`,
    `🐌 Chậm hiểu quá, gõ ${prefix}help đi bạn trẻ!`,
    `🦥 Lười đọc hướng dẫn à? Gõ ${prefix}help đi!`,
    `🐒 Đừng bắt chước, gõ ${prefix}help đi!`,
    `🦆 Vịt nghe sấm, không hiểu gì cả!`,
    `🐸 Ếch ngồi đáy giếng, không biết lệnh này!`,
    `🐷 Heo quá, gõ ${prefix}help đi bạn!`,
    `🐔 Gà thế, lệnh này không có đâu!`,
    `🥚 Trứng khôn hơn vịt, gõ ${prefix}help đi!`
  ];
  
  const randomNotFound = notFoundMsg[Math.floor(Math.random() * notFoundMsg.length)];
  return sendText(threadId, randomNotFound, 120000);
}

async function runTD(threadId, userId, pending, selectedTemplate, useHoso = false) {
  const { accountId, soKhung, mode, ngay, excludeMatchIndex, cprThreshold, customKhung, customNgay, msgIdList } = pending;
  let kg, startTs, endTs;
  if (customKhung) { kg = customKhung; ngay = customNgay; startTs = customKhung.startTs; endTs = customKhung.endTs; } 
  else { kg = KHUNG_GIO[soKhung]; startTs = toTimestamp(ngay, kg.start); endTs = toTimestamp(ngay, kg.end); if (soKhung === 6) endTs += 86400; if (soKhung === 7) { startTs += 86400; endTs += 86400; } }
  try {
    const loadMsgId = await sendText(threadId, `⏳ Đang lấy dữ liệu khung ${kg.label} ngày ${ngay}...`, 120000);
    if (loadMsgId && msgIdList) msgIdList.push(loadMsgId);
    const matches = await findMatches(accountId, startTs, endTs);
    const idToBigInt = (v) => { try { return BigInt(String(v).replace(/\D/g, "") || "0"); } catch { return 0n; } };
    matches.sort((a, b) => { const ta = idToBigInt(a.id), tb = idToBigInt(b.id); return ta < tb ? -1 : ta > tb ? 1 : 0; });
    let removedNote = "";
    if (excludeMatchIndex) { if (excludeMatchIndex >= 1 && excludeMatchIndex <= matches.length) { matches.splice(excludeMatchIndex - 1, 1); removedNote = `🗑️ Đã xoá trận #${excludeMatchIndex}.\n`; } else removedNote = `⚠️ Không có trận #${excludeMatchIndex}.\n`; }
    if (!matches.length) { if (msgIdList) for (const mid of msgIdList) { try { api.unsendMessage(mid, () => {}); } catch {} } return sendText(threadId, `${removedNote}❌ Không có trận nào!`, 120000); }
    let idToTeamName = {};
    if (useHoso) { let HoSoData = {}; const hosoPath = path.join(__dirname, "hoso.json"); if (fs.existsSync(hosoPath)) { try { HoSoData = JSON.parse(fs.readFileSync(hosoPath, "utf-8")); } catch (e) {} } for (const key in HoSoData) { const team = HoSoData[key]; if (team.ids && Array.isArray(team.ids)) { team.ids.forEach(id => { idToTeamName[id] = team.name; }); } } }
    const teamTotals = {}; const matchDetails = []; let playerName = null;
    for (let i = 0; i < matches.length; i++) {
      try {
        const match = await getMatchDetail(matches[i].id); if (!match) continue;
        matchDetails.push(match); const found = findPlayer(match, accountId); if (found && !playerName && found.name) playerName = found.name;
        for (const team of (match.ranks || [])) {
          const cleanIdsArray = team.playerAccountIds.map(p => p.replace(/\*+$/, "")); const cleanIds = cleanIdsArray.sort().join("|"); let repName = team.accountNames[0] || cleanIds;
          if (useHoso) { for (const pid of cleanIdsArray) { const matchedHosoId = Object.keys(idToTeamName).find(hosoId => hosoId.startsWith(pid)); if (matchedHosoId) { repName = idToTeamName[matchedHosoId]; break; } } }
          if (!teamTotals[cleanIds]) teamTotals[cleanIds] = { rep: repName, by: 0, kill: 0, score: 0 };
          teamTotals[cleanIds].by += Number(team.booyah) || 0; teamTotals[cleanIds].kill += Number(team.kill) || 0; teamTotals[cleanIds].score += Number(team.score) || 0;
        }
      } catch (e) { console.error("Match error:", e.message); }
      await new Promise(r => setTimeout(r, 400));
    }
    if (useHoso && idToTeamName[accountId]) { playerName = idToTeamName[accountId]; }
    playerName = playerName || `ID_${accountId}`;
    let caption = `🤖 ${BOT_NAME} 🤖\n\n📊 ID: ${accountId}\n🎯 Số Trận: ${matchDetails.length}\n`;
    const startClean = kg.start.length > 5 ? kg.start.slice(0, 5) : kg.start; const endClean = kg.end.length > 5 ? kg.end.slice(0, 5) : kg.end;
    caption += `⌛ Khung Giờ: ${startClean} | ${endClean} ${ngay}\n\n`;
    if (msgIdList && msgIdList.length > 0) { for (const mid of msgIdList) { try { api.unsendMessage(mid, () => {}); } catch {} } }
    if (mode === "bxhcpr") {
      const { sortedTeams, hasChampion } = computeChampionBoard(matchDetails, cprThreshold || 50); const usedMatches = Math.min(matchDetails.length, 5);
      caption += `🏆 Vô địch Cpr: ${hasChampion ? sortedTeams[0]?.rep : "Chưa có"}\n`; caption += `🔹 CPR: ${cprThreshold || 50} Điểm`;
      const buffer = selectedTemplate === 1 ? ffImg.drawBxhImage(sortedTeams, { title: hasChampion ? "👑 BXH — VÔ ĐỊCH" : "🔥 BXH", subtitle: `${kg.label} • ${ngay} • ${usedMatches} trận`, playerName }) : (await drawSelectedTemplate(selectedTemplate, sortedTeams, `${kg.label} • ${ngay} • ${usedMatches} trận`)) || ffImg.drawBxhImage(sortedTeams, { title: "👑 BXH", subtitle: `${kg.label}`, playerName });
      await new Promise(r => setTimeout(r, 1500)); await sendPhoto(threadId, buffer, caption); return;
    }
    const merged = mergeTeams(teamTotals); const sorted = merged.sort((a, b) => b.score - a.score).slice(0, 12);
    const buffer = selectedTemplate === 1 ? ffImg.drawBxhImage(sorted, { title: "🔥 BXH TỔNG", subtitle: `${kg.label} • ${ngay}`, playerName }) : (await drawSelectedTemplate(selectedTemplate, sorted, `${kg.label} • ${ngay}`)) || ffImg.drawBxhImage(sorted, { title: "🔥 BXH", subtitle: `${kg.label}`, playerName });
    await new Promise(r => setTimeout(r, 1500)); await sendPhoto(threadId, buffer, caption); 
  } catch (err) {
    if (msgIdList) for (const mid of msgIdList) { try { api.unsendMessage(mid, () => {}); } catch {} }
    return sendText(threadId, `❌ Lỗi: ${err.response?.status || err.message}`, 120000);
  }
}

const APPSTATE = path.join(__dirname, "appstate.json");
if (!fs.existsSync(APPSTATE)) { console.error("❌ Thiếu appstate.json!"); process.exit(1); }
const appState = JSON.parse(fs.readFileSync(APPSTATE, "utf-8"));

login({ appState }, (err, _api) => {
  if (err) { console.error("❌ Login:", err); process.exit(1); }
  api = _api;
  console.log(`✅ ${BOT_NAME} đăng nhập thành công!`);
  console.log(`📌 Prefix: "${CONFIG.prefix}" | Admin: ${ADMIN_IDS.length} | CTV: ${CTV.length}`);
  console.log(`💡 Sửa config.js là bot tự đổi — không cần restart!`);

  api.setOptions({ listenEvents: true, selfListen: false, logLevel: "silent", online: true, autoMarkRead: true, autoReconnect: true });

  api.listenMqtt(async (err, event) => {
    if (err) return console.error("listenMqtt:", err);
    
    try {
      // 1. LƯU TIN NHẮN VÀO BỘ NHỚ ĐỆM (Để chống thu hồi)
      if (event.type === "message" || event.type === "message_reply") {
        if (event.messageID && (event.body || event.attachments)) {
          MESSAGE_CACHE[event.messageID] = { 
            body: event.body || "[File/Ảnh/Sticker]", 
            senderID: event.senderID 
          };
          if (Object.keys(MESSAGE_CACHE).length > 500) {
            delete MESSAGE_CACHE[Object.keys(MESSAGE_CACHE)[0]];
          }
        }
      }

      // 2. SỰ KIỆN CHỐNG ĐỔI CẢM XÚC & THU HỒI (GỘP)
      if (event.logMessageType === "log:thread-color" || event.logMessageType === "log:thread-icon" || event.type === "message_unsend" || event.logMessageType === "log:unsend") {
        const threadId = event.threadID;
        const authorId = String(event.author || event.senderID);
        
        if (!authorId || authorId === "undefined" || authorId === api.getCurrentUserID()) return; 
        
        const g = GROUPS[threadId];
        if (!g) return;

        const authorName = USERS[authorId]?.name || "Ai đó";

        // Xử lý Cảm xúc / Theme
        if ((event.logMessageType === "log:thread-color" || event.logMessageType === "log:thread-icon") && g.anti?.theme) {
          const threadInfo = await new Promise(r => api.getThreadInfo(threadId, (e, info) => r(e ? null : info)));
          let isAuthorQtv = false;
          if (threadInfo) {
            if (threadInfo.userInfo) {
               const user = threadInfo.userInfo.find(u => String(u.id) === authorId);
               if (user && (user.isAdmin || user.isGroupCreator)) isAuthorQtv = true;
            }
            if (threadInfo.adminIDs && threadInfo.adminIDs.some(admin => String(admin.id) === authorId)) {
               isAuthorQtv = true;
            }
          }

          if (isAdmin(authorId) || isCtv(authorId) || isAuthorQtv) {
            return sendText(threadId, `⚙️ Đã cập nhật cảm xúc nhanh (theme) mới! (Bởi QTV/Admin)`, 120000);
          } else {
            api.removeUserFromGroup(authorId, threadId, () => {});
            api.changeThreadColor("#0084FF", threadId, () => {});
            if (api.changeThreadEmoji) api.changeThreadEmoji("", threadId, () => {});
            return sendText(threadId, `🚫 Đã kick ${authorName} vì tự ý đổi cảm xúc nhanh!\n⚙️ Đã khôi phục lại trạng thái cũ.`, 120000);
          }
        }

        // Xử lý Thu hồi
        if ((event.type === "message_unsend" || event.logMessageType === "log:unsend") && g.anti?.thuhoi) {
          const threadInfo = await new Promise(r => api.getThreadInfo(threadId, (e, info) => r(e ? null : info)));
          let isAuthorQtv = false;
          if (threadInfo && threadInfo.adminIDs) {
            isAuthorQtv = threadInfo.adminIDs.some(admin => String(admin.id) === authorId);
          }

          if (!isAdmin(authorId) && !isCtv(authorId) && !isAuthorQtv) {
            const messageID = event.messageID || event.logMessageData?.messageID;
            let originalText = "Không thể xác định (File/Ảnh)";
            
            if (MESSAGE_CACHE[messageID]) {
              originalText = MESSAGE_CACHE[messageID].body;
            }
            
            api.sendMessage({
              body: `🚨 PHÁT HIỆN THU HỒI TIN NHẮN!\n────────────────────\n👤 Người thu hồi: ${authorName}\n📝 Nội dung gốc: "${originalText}"\n👉 Hành vi thu hồi tin nhắn bị cấm!`,
              mentions: [{ tag: authorName, id: authorId }]
            }, threadId, () => {});
          }
        }
        return;
      }

      // 3. SỰ KIỆN ĐỔI TÊN NHÓM
      if (event.logMessageType === "log:thread-name") {
        const threadId = event.threadID;
        const authorId = String(event.author);
        if (authorId === api.getCurrentUserID()) return;
        
        const g = GROUPS[threadId];
        const newName = event.logMessageData.name;
        
        if (g && g.anti?.boxname) {
          const isQtv = await isGroupAdmin(api, threadId, authorId);
          
          if (isAdmin(authorId) || isCtv(authorId) || isQtv) {
            g.name = newName;
            saveGroups();
            return sendText(threadId, `⚙️ Đã cập nhật tên box thành: "${newName}" (Bởi QTV)`, 120000);
          } else {
            const oldName = g.name || "Nhóm";
            await new Promise(r => api.setTitle(oldName, threadId, () => r()));
            api.removeUserFromGroup(authorId, threadId, () => {});
            
            const authorName = USERS[authorId]?.name || "Ai đó";
            return sendText(threadId, `🚫 Đã kick ${authorName} vì tự ý đổi tên nhóm trái phép!\n⚙️ Đã khôi phục lại tên cũ: "${oldName}"`, 120000);
          }
        } else {
          if (g) { g.name = newName; saveGroups(); }
        }
        return;
      }

      // 4. SỰ KIỆN THÀNH VIÊN VÀO NHÓM
      if (event.logMessageType === "log:subscribe") {
        const threadId = event.threadID;
        const botId = api.getCurrentUserID();
        const addedUsers = event.logMessageData.addedParticipants || [];
        
        const currentGroup = GROUPS[threadId];
        for (const u of addedUsers) {
          const uid = String(u.userFbId);
          if (uid === String(botId)) continue; 

          const groupBan = currentGroup?.blacklist?.[uid];
          const globalBan = AUTOKICK_DATA[uid];
          const isGroupBanned = groupBan && (groupBan.expiresAt === 0 || groupBan.expiresAt > Date.now());
          const isGlobalBanned = globalBan && (globalBan.expiresAt === 0 || globalBan.expiresAt > Date.now());

          if (isGroupBanned || isGlobalBanned) {
            api.removeUserFromGroup(uid, threadId, (err) => {
              if (!err) {
                sendText(threadId, 
                  `┏━━━━━━━━━━━━━━┓\n┃ ⚔️ TRẪM ĐÃ RA TAY ┃\n┗━━━━━━━━━━━━━━┛\n\nTên phản tặc ${u.fullName || uid} vừa lén lút quay lại!\nTheo đúng thánh chỉ, ta đã tiễn hắn rời khỏi động phủ!\n\n👑 Người thi hành: ${BOT_NAME}`, 
                  120000
                );
              }
            });
          }
        }

        if (addedUsers.some(u => String(u.userFbId) === String(botId))) {
          await delay(3000);
          
          const g = GROUPS[threadId];
          await updateBotNickname(api, threadId, g ? g.expiresAt : 0);

          try {
            const threadInfo = await new Promise((resolve) => api.getThreadInfo(threadId, (e, r) => resolve(e ? null : r)));
            let qtvCount = threadInfo && threadInfo.adminIDs ? threadInfo.adminIDs.length : 0;
            const isRented = g && g.expiresAt && g.expiresAt > Date.now();
            const statusMsg2 = isRented ? `✅ Đã thuê (còn ${Math.ceil((g.expiresAt - Date.now()) / 86400000)} ngày)` : `❌ Chưa thuê`;

            const msg = 
              `┏━━━━━━━━━━━━━┓\n┃ 👑 THÁNH CHỈ BAN XUỐNG ┃\n┗━━━━━━━━━━━━━┛\n\nThừa Thiên Thừa Vận,\nHoàng Đế Chiếu Viết:\n\nTrẫm - KARED STUDIO BOT, nay đã ban giá đến động phủ này!\n\n📜 Tuyên chỉ:\n🛡️ Tổng số QTV hộ vệ: ${qtvCount}\n📦 Long mạch (Box): ${statusMsg2}\n\n────────────────────\n` +
              (isRented ? `Khâm thử! Các khanh hãy tuân theo thánh chỉ, gõ ${CONFIG.prefix}help để xem luật lệ!` : `⚠️ Long mạch chưa kích hoạt! Khẩn cầu các khanh gõ ${CONFIG.prefix}key nhap <MÃ_KEY> để khai thông!`);
            
            await sendText(threadId, msg, 0);
          } catch (e) { 
            console.error("Lỗi lấy thông tin nhóm khi vào:", e); 
          }
        }
        return;
      }

      // 5. NHẬN TIN NHẮN VÀ CHUYỂN VÀO HANDLEMESSAGE
      if (event.type !== "message" && event.type !== "message_reply") return;
      const hasAttachment = event.attachments && Object.keys(event.attachments).length > 0;
      if (!event.body && !hasAttachment) return;
      const threadId = event.threadID;
      const userId = event.senderID;
      const isGroup = String(threadId) !== String(userId);
      const text = (event.body || "").trim();
      let senderName = "";
      try { const info = await new Promise((res) => api.getUserInfo([userId], (e, r) => res(e ? null : r))); senderName = info?.[userId]?.name || ""; } catch {}
      console.log(`[MSG] ${isGroup ? "G" : "P"} ${threadId}/${userId}: ${JSON.stringify(text.slice(0, 80))}`);
      await handleMessage({ threadId, userId, text, isGroup, senderName, message: event });

    } catch (e) {
      console.error("Handler Error:", e.message);
      try { await sendText(event.threadID, `❌ Lỗi: ${e.message}`, 0); } catch {}
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// HỆ THỐNG QUÉT TỰ ĐỘNG (AUTO KICK & ĐÒI NỢ) - CHẠY NGẦM MỖI 1 PHÚT
// ═══════════════════════════════════════════════════════════════
setInterval(async () => {
  if (!api) return;
  const now = Date.now();
  
  // 1. QUÉT AUTO KICK
  for (const [threadId, groupData] of Object.entries(GROUPS)) {
    try {
      let usersToKick = [];
      if (groupData.blacklist) {
        for (const [uid, info] of Object.entries(groupData.blacklist)) {
          if (info.expiresAt === 0 || info.expiresAt > now) { usersToKick.push(uid); } 
          else { delete groupData.blacklist[uid]; saveGroups(); }
        }
      }
      for (const [uid, info] of Object.entries(AUTOKICK_DATA)) {
        if (info.expiresAt === 0 || info.expiresAt > now) { if (!usersToKick.includes(uid)) usersToKick.push(uid); } 
        else { delete AUTOKICK_DATA[uid]; saveAutokick(); }
      }
      if (usersToKick.length === 0) continue;
      const threadInfo = await new Promise((resolve) => api.getThreadInfo(threadId, (e, r) => resolve(e ? null : r)));
      if (!threadInfo || !threadInfo.participantIDs) continue;
      const botId = api.getCurrentUserID();
      for (const uid of usersToKick) {
        if (threadInfo.participantIDs.includes(uid) && uid !== botId) {
          console.log(`[AUTO KICK] Phát hiện người bị blacklist ${uid} trong nhóm ${threadId}. Đang kick...`);
          api.removeUserFromGroup(uid, threadId, (err) => {
            if (!err) { sendText(threadId, `┏━━━━━━━━━━━━━━┓\n┃ ⚔️ TRẪM ĐÃ RA TAY ┃\n┗━━━━━━━━━━━━━━┛\n\nHệ thống tự động phát hiện một tên phản tặc (nằm trong Sổ Tử Thần) đang lẩn trốn trong nhóm!\nTheo đúng thánh chỉ, ta đã tiễn hắn rời khỏi động phủ!\n\n👑 Người thi hành: ${BOT_NAME}`, 120000); }
          });
          await delay(1000);
        }
      }
    } catch (e) {}
    await delay(2000); 
  }

  // 2. QUÉT ĐÒI NỢ
  for (const [uid, data] of Object.entries(TX_DATA)) {
    if (data.debt > 0 && data.debtTime > 0 && (now - data.debtTime >= 3600000) && !data.debtNotified) {
      if (data.debtThread) {
        const name = USERS[uid]?.name || "Ai đó";
        const debtFmt = data.debt.toLocaleString("vi-VN") + " $";
        
        const msg = `🚨 CHÚ Ý ${name}!\n────────────────────\nĐã quá 1 tiếng kể từ lúc bạn vay tiền tại KARED BANK.\n💸 Số tiền nợ: ${debtFmt}\n👉 Vui lòng gõ .trano <số tiền> để trả nợ ngay lập tức!\n────────────────────\n🤬 Đừng để tao phải réo mày lần nữa!`;
        
        api.sendMessage({ body: msg, mentions: [{ tag: name, id: uid }] }, data.debtThread, (err) => {
          if (!err) {
            data.debtNotified = true;
            saveTx();
          }
        });
      }
    }
  }

  // 3. KIỂM TRA HẠN THUÊ
  for (const [tid, g] of Object.entries(GROUPS)) {
    if (!g.expiresAt || g.expiresAt <= 0) continue;
    
    const msLeft = g.expiresAt - now;
    const daysLeft = Math.ceil(msLeft / 86400000);

    if (daysLeft === 1 && !g.notified1Day) {
      sendText(tid, 
        `⚠️ CẢNH BÁO GIA HẠN BOT!\n` +
        `────────────────────\n` +
        `Box của bạn sẽ hết hạn thuê vào ngày mai.\n` +
        `Vui lòng liên hệ Admin để gia hạn, nếu không bot sẽ tự động vô hiệu hóa tính năng!\n` +
        `────────────────────\n` +
        `👑 Admin: ${ADMIN_IDS.map(a => a).join(", ")}`, 
        0
      );
      g.notified1Day = true;
      saveGroups();
    }
    
    if (daysLeft > 1 && g.notified1Day) {
      g.notified1Day = false;
      saveGroups();
    }
  }
}, 60000);