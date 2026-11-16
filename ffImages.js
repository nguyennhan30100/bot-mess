const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

// ============================================================
// helper dùng chung để load ảnh mẫu (template) từ ổ đĩa.
// ============================================================
function loadTemplateImage(templatePath, humanName) {
  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Thiếu file ảnh mẫu "${humanName}" — cần copy vào: ${templatePath}`
    );
  }
  const stat = fs.statSync(templatePath);
  if (stat.size === 0) {
    throw new Error(`File ảnh mẫu "${humanName}" có 0 byte (file rỗng/hỏng): ${templatePath}`);
  }
  const buffer = fs.readFileSync(templatePath);
  return loadImage(buffer)
    .catch((err) => {
      throw new Error(
        `File ảnh mẫu "${humanName}" không đọc được như ảnh hợp lệ (${err.message}). ` +
        `File tồn tại và có ${stat.size} bytes nhưng có thể đã bị HỎNG khi upload lên server ` +
        `(ví dụ: Git/FTP convert file nhị phân sang text mode). ` +
        `Hãy tải lại đúng file gốc và upload lại ở chế độ binary vào: ${templatePath}`
      );
    })
    .then((img) => {
    console.log(`Đã load ảnh mẫu "${humanName}": ${img.width}x${img.height}, file ${stat.size} bytes`);
    if (!img.width || !img.height) {
      throw new Error(`Ảnh mẫu "${humanName}" giải mã ra kích thước 0x0 (file JPG có thể bị hỏng): ${templatePath}`);
    }
    return img;
  });
}

// Đăng ký font riêng
const FONT_PATH = path.join(__dirname, "assets", "fonts", "DejaVuSans-Bold.ttf");
try {
  GlobalFonts.registerFromPath(FONT_PATH, "AppFont");
} catch (e) {
  console.error("Font register error (thiếu file font? xem README):", e.message);
}

// ============================================================
// MẪU MẶC ĐỊNH — vẽ trên nền gradient tự tạo
// ============================================================
function drawBxhImage(sortedTeams, { title, subtitle, playerName }) {
  const rowH = 64;
  const headerH = 140;
  const footerH = 40;
  const width = 900;
  const height = headerH + footerH + rowH * Math.max(sortedTeams.length, 1);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#1b1033");
  bg.addColorStop(1, "#0d0717");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ffa500";
  ctx.font = "bold 36px AppFont";
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, 56);

  ctx.fillStyle = "#cccccc";
  ctx.font = "20px AppFont";
  ctx.fillText(subtitle, width / 2, 90);

  ctx.textAlign = "left";
  ctx.font = "bold 18px AppFont";
  ctx.fillStyle = "#888888";
  ctx.fillText("HẠNG", 30, headerH - 10);
  ctx.fillText("TÊN ĐỘI", 130, headerH - 10);
  ctx.fillText("BOOYAH", 540, headerH - 10);
  ctx.fillText("HẠ GỤC", 660, headerH - 10);
  ctx.textAlign = "right";
  ctx.fillText("ĐIỂM", width - 30, headerH - 10);
  ctx.textAlign = "left";

  ctx.strokeStyle = "#444444";
  ctx.beginPath();
  ctx.moveTo(20, headerH);
  ctx.lineTo(width - 20, headerH);
  ctx.stroke();

  const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

  sortedTeams.forEach((squad, i) => {
    const y = headerH + i * rowH;
    const isMe = playerName && squad.rep === playerName;
    const isChampion = !!squad.champion;

    if (i < 3) {
      ctx.fillStyle = "rgba(255,165,0,0.08)";
      ctx.fillRect(20, y, width - 40, rowH - 6);
    }
    if (isMe) {
      ctx.fillStyle = "rgba(0,191,255,0.15)";
      ctx.fillRect(20, y, width - 40, rowH - 6);
      ctx.strokeStyle = "#00bfff";
      ctx.strokeRect(20, y, width - 40, rowH - 6);
    }
    if (isChampion) {
      ctx.fillStyle = "rgba(255,215,0,0.18)";
      ctx.fillRect(20, y, width - 40, rowH - 6);
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, y, width - 40, rowH - 6);
      ctx.lineWidth = 1;
    }

    ctx.font = "bold 26px AppFont";
    ctx.fillStyle = isChampion ? "#FFD700" : (medalColors[i] || "#ffffff");
    const rankLabel = isChampion ? "👑" : (i < 3 ? ["🥇","🥈","🥉"][i] : `#${i + 1}`);
    ctx.fillText(rankLabel, 30, y + 40);

    ctx.font = "bold 22px AppFont";
    ctx.fillStyle = isChampion ? "#FFD700" : (isMe ? "#00bfff" : "#ffffff");
    let name = squad.rep || "Unknown";
    if (name.length > 18) name = name.slice(0, 17) + "…";
    const suffix = isChampion ? "  👑 VÔ ĐỊCH" : (isMe ? "  ◀ Bạn" : "");
    ctx.fillText(name + suffix, 130, y + 40);

    ctx.font = "20px AppFont";
    ctx.fillStyle = "#ffd700";
    ctx.fillText(String(squad.by ?? 0), 555, y + 40);

    ctx.fillStyle = "#ff6666";
    ctx.fillText(String(squad.kill ?? 0), 675, y + 40);

    ctx.font = "bold 24px AppFont";
    ctx.fillStyle = isChampion ? "#FFD700" : "#ffa500";
    ctx.textAlign = "right";
    ctx.fillText(String(squad.score ?? 0), width - 30, y + 40);
    ctx.textAlign = "left";
  });

  ctx.textAlign = "center";
  ctx.font = "14px AppFont";
  ctx.fillStyle = "#777777";
  ctx.fillText("FREE FIRE • X6 ESP", width / 2, height - 14);

  const _buf = canvas.toBuffer("image/png");
  console.log("Canvas buffer size:", _buf.length, "bytes");
  return _buf;
}

// ============================================================
// CÁC MẪU CŨ CỦA BẠN (Từ mẫu 2 -> 43)
// ============================================================
const TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "standings_template.jpg");
let _templateImgCache = null;
async function getTemplateImage() {
  if (!_templateImgCache) _templateImgCache = await loadTemplateImage(TEMPLATE_PATH, "Overall Standings");
  return _templateImgCache;
}
async function drawStandingsTemplateImage(sortedTeams, { subtitle } = {}) {
  const img = await getTemplateImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / 1037;
  const scaleY = height / 1280;
  const xTeam   = 100 * scaleX;
  const xBooyah = 590 * scaleX;
  const xElims  = 672 * scaleX;
  const xPts    = 752 * scaleX;
  const yStart  = 418 * scaleY;
  const yStep   = 66  * scaleY;
  ctx.textBaseline = "middle";
  sortedTeams.slice(0, 12).forEach((squad, i) => {
    const y = yStart + i * yStep;
    ctx.font = `bold ${Math.round(28 * scaleY)}px AppFont`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    let name = squad.rep || "Unknown";
    if (name.length > 20) name = name.slice(0, 19) + "…";
    ctx.fillText(name, xTeam, y);
    ctx.font = `bold ${Math.round(28 * scaleY)}px AppFont`;
    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "center";
    ctx.fillText(String(squad.by ?? 0), xBooyah, y);
    ctx.fillText(String(squad.kill ?? 0), xElims, y);
    ctx.fillText(String(squad.score ?? 0), xPts, y);
  });
  if (subtitle) {
    ctx.font = `${Math.round(18 * scaleY)}px AppFont`;
    ctx.fillStyle = "#ffe6a8";
    ctx.textAlign = "left";
    ctx.fillText(subtitle, 115 * scaleX, 335 * scaleY);
  }
  return canvas.toBuffer("image/png");
}

const BLUELOCK_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "bluelock_template.jpg");
let _bluelockImgCache = null;
async function getBluelockImage() {
  if (!_bluelockImgCache) _bluelockImgCache = await loadTemplateImage(BLUELOCK_TEMPLATE_PATH, "Blue Lock");
  return _bluelockImgCache;
}
const BLUELOCK_BASE_W = 902;
const BLUELOCK_BASE_H = 1128;
const BLUELOCK_COLS_LEFT  = { team: [112, 285], elim: [290, 328], by: [358, 386], pts: [405, 443] };
const BLUELOCK_COLS_RIGHT = { team: [550, 725], elim: [733, 771], by: [800, 832], pts: [858, 893] };
const BLUELOCK_RANK1_Y     = 425;
const BLUELOCK_LEFT_ROWS   = { 2: 502, 3: 547, 4: 588, 5: 630, 6: 667 };
const BLUELOCK_RIGHT_ROWS  = { 7: 464, 8: 502, 9: 542, 10: 582, 11: 622, 12: 662 };
async function drawBluelockTemplateImage(sortedTeams) {
  const img = await getBluelockImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / BLUELOCK_BASE_W;
  const scaleY = height / BLUELOCK_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell([x1, x2], y, str, { align = "center", color = "#ffffff", size = 18 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const x = align === "left" ? x1 * scaleX + 4 : ((x1 + x2) / 2) * scaleX;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x, y * scaleY);
  }
  function drawRow(cols, y, squad, size) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", color: "#ffffff", size });
    drawCell(cols.elim, y, String(squad.kill ?? 0), { align: "center", color: "#ffffff", size });
    drawCell(cols.by,   y, String(squad.by ?? 0),   { align: "center", color: "#ffffff", size });
    drawCell(cols.pts,  y, String(squad.score ?? 0),{ align: "center", color: "#ffffff", size });
  }
  if (sortedTeams[0]) drawRow(BLUELOCK_COLS_LEFT, BLUELOCK_RANK1_Y, sortedTeams[0], 20);
  Object.entries(BLUELOCK_LEFT_ROWS).forEach(([rank, y]) => {
    drawRow(BLUELOCK_COLS_LEFT, y, sortedTeams[parseInt(rank) - 1], 18);
  });
  Object.entries(BLUELOCK_RIGHT_ROWS).forEach(([rank, y]) => {
    drawRow(BLUELOCK_COLS_RIGHT, y, sortedTeams[parseInt(rank) - 1], 18);
  });
  return canvas.toBuffer("image/png");
}

const HK_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "hellokitty_template.jpg");
let _hkImgCache = null;
async function getHkImage() {
  if (!_hkImgCache) _hkImgCache = await loadTemplateImage(HK_TEMPLATE_PATH, "Hello Kitty");
  return _hkImgCache;
}
const HK_BASE_W = 1264;
const HK_BASE_H = 843;
const HK_COLS_LEFT  = { team: [150, 300], elim: [300, 412], by: [412, 537], pts: [537, 606] };
const HK_COLS_RIGHT = { team: [750, 902], elim: [902, 1005], by: [1005, 1130], pts: [1130, 1202] };
const HK_ROWS_Y = [288, 342, 396, 450, 504, 558];
async function drawHkTemplateImage(sortedTeams) {
  const img = await getHkImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / HK_BASE_W;
  const scaleY = height / HK_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell([x1, x2], y, str, { align = "center", color = "#7a3b52", size = 16 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const x = align === "left" ? x1 * scaleX + 4 : ((x1 + x2) / 2) * scaleX;
    let text = str;
    if (align === "left" && text.length > 16) text = text.slice(0, 15) + "…";
    ctx.fillText(text, x, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 16 });
    drawCell(cols.elim, y, String(squad.kill ?? 0), { align: "center", size: 16 });
    drawCell(cols.by,   y, String(squad.by ?? 0),   { align: "center", size: 16 });
    drawCell(cols.pts,  y, String(squad.score ?? 0),{ align: "center", size: 16 });
  }
  HK_ROWS_Y.forEach((y, i) => drawRow(HK_COLS_LEFT, y, sortedTeams[i]));
  HK_ROWS_Y.forEach((y, i) => drawRow(HK_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const CHAIN_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "chain_template.jpg");
let _chainImgCache = null;
async function getChainImage() {
  if (!_chainImgCache) _chainImgCache = await loadTemplateImage(CHAIN_TEMPLATE_PATH, "Xích Sắt");
  return _chainImgCache;
}
const CHAIN_BASE_W = 2028;
const CHAIN_BASE_H = 2560;
const CHAIN_COLS = { team: [1010, 1550], elim: [1647, 1647], by: [1780, 1780], pts: [1925, 1925] };
const CHAIN_ROWS = { 1: 895, 2: 1009, 3: 1124, 4: 1238, 5: 1352, 6: 1467, 7: 1581, 8: 1696, 9: 1810, 10: 1924, 11: 2039, 12: 2153 };
async function drawChainTemplateImage(sortedTeams) {
  const img = await getChainImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / CHAIN_BASE_W;
  const scaleY = height / CHAIN_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell([x1, x2], y, str, { align = "center", color = "#ffffff", size = 30 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const x = align === "left" ? x1 * scaleX + 4 : ((x1 + x2) / 2) * scaleX;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x, y * scaleY);
  }
  Object.entries(CHAIN_ROWS).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(CHAIN_COLS.team, y, t.rep || "Unknown", { align: "left",  color: "#ffffff", size: 30 });
    drawCell(CHAIN_COLS.elim, y, String(t.kill ?? 0), { align: "center", color: "#ffffff", size: 28 });
    drawCell(CHAIN_COLS.by,   y, String(t.by ?? 0),   { align: "center", color: "#ffe600", size: 28 });
    drawCell(CHAIN_COLS.pts,  y, String(t.score ?? 0),{ align: "center", color: "#ffa500", size: 30 });
  });
  return canvas.toBuffer("image/png");
}

const FREEFIRE_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "freefire_bxh_template.jpg");
let _freefireImgCache = null;
async function getFreefireImage() {
  if (!_freefireImgCache) _freefireImgCache = await loadTemplateImage(FREEFIRE_TEMPLATE_PATH, "Free Fire Bảng Xếp Hạng");
  return _freefireImgCache;
}
const FREEFIRE_BASE_W = 1024;
const FREEFIRE_BASE_H = 1024;
const FREEFIRE_COLS = { team: [520, 743], elim: [744, 822], by: [823, 904], pts: [905, 995] };
const FREEFIRE_ROWS_Y = { 1: 335, 2: 385, 3: 435, 4: 483, 5: 530, 6: 579, 7: 627, 8: 676, 9: 724, 10: 773, 11: 821, 12: 870 };
async function drawFreefireTemplateImage(sortedTeams) {
  const img = await getFreefireImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / FREEFIRE_BASE_W;
  const scaleY = height / FREEFIRE_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell([x1, x2], y, str, { align = "center", color = "#ffffff", size = 26 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const x = align === "left" ? x1 * scaleX : ((x1 + x2) / 2) * scaleX;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x, y * scaleY);
  }
  Object.entries(FREEFIRE_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(FREEFIRE_COLS.team, y, t.rep || "Unknown", { align: "left",  color: "#ffffff", size: 26 });
    drawCell(FREEFIRE_COLS.elim, y, String(t.kill ?? 0), { align: "center", color: "#ffffff", size: 26 });
    drawCell(FREEFIRE_COLS.by,   y, String(t.by ?? 0),   { align: "center", color: "#ffffff", size: 26 });
    drawCell(FREEFIRE_COLS.pts,  y, String(t.score ?? 0),{ align: "center", color: "#ffff50", size: 26 });
  });
  return canvas.toBuffer("image/png");
}

const FREEFIRE2_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "freefire2_bxh_template.jpg");
let _freefire2ImgCache = null;
async function getFreefire2Image() {
  if (!_freefire2ImgCache) _freefire2ImgCache = await loadTemplateImage(FREEFIRE2_TEMPLATE_PATH, "Free Fire 2 Cột");
  return _freefire2ImgCache;
}
const FREEFIRE2_BASE_W = 1638;
const FREEFIRE2_BASE_H = 2048;
const FREEFIRE2_COLS_LEFT  = { team: 200, elim: 520, by: 627, pts: 735 };
const FREEFIRE2_COLS_RIGHT = { team: 1000, elim: 1355, by: 1460, pts: 1577 };
const FREEFIRE2_RANK1 = { y: 829, team: 200, elim: 550, by: 647, pts: 760 };
const FREEFIRE2_ROWS_LEFT  = { 2: 985, 3: 1060, 4: 1135, 5: 1210, 6: 1285 };
const FREEFIRE2_ROWS_RIGHT = { 7: 910, 8: 985, 9: 1060, 10: 1135, 11: 1210, 12: 1285 };
async function drawFreefire2TemplateImage(sortedTeams) {
  const img = await getFreefire2Image();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / FREEFIRE2_BASE_W;
  const scaleY = height / FREEFIRE2_BASE_H;
  ctx.textBaseline = "middle";
  function drawText(x, y, str, { align = "center", color = "#ffffff", size = 34 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 14) text = text.slice(0, 13) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function drawRow(cols, y, squad, size) {
    if (!squad) return;
    drawText(cols.team, y, squad.rep || "Unknown", { align: "left",  color: "#ffffff", size });
    drawText(cols.elim, y, String(squad.kill ?? 0), { align: "center", color: "#ffffff", size });
    drawText(cols.by,   y, String(squad.by ?? 0).padStart(2, "0"), { align: "center", color: "#ffffff", size });
    drawText(cols.pts,  y, String(squad.score ?? 0),{ align: "center", color: "#ffe14d", size });
  }
  if (sortedTeams[0]) {
    drawRow({ team: FREEFIRE2_RANK1.team, elim: FREEFIRE2_RANK1.elim, by: FREEFIRE2_RANK1.by, pts: FREEFIRE2_RANK1.pts }, FREEFIRE2_RANK1.y, sortedTeams[0], 40);
  }
  Object.entries(FREEFIRE2_ROWS_LEFT).forEach(([rank, y]) => { drawRow(FREEFIRE2_COLS_LEFT, y, sortedTeams[parseInt(rank) - 1], 34); });
  Object.entries(FREEFIRE2_ROWS_RIGHT).forEach(([rank, y]) => { drawRow(FREEFIRE2_COLS_RIGHT, y, sortedTeams[parseInt(rank) - 1], 34); });
  return canvas.toBuffer("image/png");
}

const HXH_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "hxh_template.jpg");
let _hxhImgCache = null;
async function getHxhImage() {
  if (!_hxhImgCache) _hxhImgCache = await loadTemplateImage(HXH_TEMPLATE_PATH, "Hunter x Hunter");
  return _hxhImgCache;
}
const HXH_BASE_W = 1086;
const HXH_BASE_H = 1448;
const HXH_COLS_LEFT  = { team: [90, 320], elim: [320, 400], by: [400, 460], pts: [460, 525] };
const HXH_COLS_RIGHT = { team: [635, 850], elim: [850, 925], by: [925, 985], pts: [985, 1050] };
const HXH_ROWS_Y = [658, 711, 764, 817, 870, 923];
async function drawHxhTemplateImage(sortedTeams) {
  const img = await getHxhImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / HXH_BASE_W;
  const scaleY = height / HXH_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell([x1, x2], y, str, { align = "center", color = "#ffffff", size = 26 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const x = align === "left" ? x1 * scaleX + 4 : ((x1 + x2) / 2) * scaleX;
    let text = str;
    if (align === "left" && text.length > 16) text = text.slice(0, 15) + "…";
    ctx.fillText(text, x, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 26 });
    drawCell(cols.elim, y, String(squad.kill ?? 0), { align: "center", size: 26 });
    drawCell(cols.by,   y, String(squad.by ?? 0),   { align: "center", size: 26 });
    drawCell(cols.pts,  y, String(squad.score ?? 0),{ align: "center", size: 26 });
  }
  HXH_ROWS_Y.forEach((y, i) => drawRow(HXH_COLS_LEFT, y, sortedTeams[i]));
  HXH_ROWS_Y.forEach((y, i) => drawRow(HXH_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const MC_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "minecraft_template.jpg");
let _mcImgCache = null;
async function getMcImage() {
  if (!_mcImgCache) _mcImgCache = await loadTemplateImage(MC_TEMPLATE_PATH, "Minecraft Tournament");
  return _mcImgCache;
}
const MC_BASE_W = 1086;
const MC_BASE_H = 1448;
const MC_COLS_LEFT  = { team: [90, 270], elim: [270, 355], by: [355, 430], pts: [430, 525] };
const MC_COLS_RIGHT = { team: [635, 800], elim: [800, 880], by: [880, 955], pts: [955, 1050] };
const MC_ROWS_Y = [618, 670, 723, 775, 828, 880];
async function drawMinecraftTemplateImage(sortedTeams) {
  const img = await getMcImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / MC_BASE_W;
  const scaleY = height / MC_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell([x1, x2], y, str, { align = "center", color = "#ffffff", size = 26 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const x = align === "left" ? x1 * scaleX + 4 : ((x1 + x2) / 2) * scaleX;
    let text = str;
    if (align === "left" && text.length > 14) text = text.slice(0, 13) + "…";
    ctx.fillText(text, x, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 26 });
    drawCell(cols.elim, y, String(squad.kill ?? 0), { align: "center", size: 26 });
    drawCell(cols.by,   y, String(squad.by ?? 0),   { align: "center", size: 26 });
    drawCell(cols.pts,  y, String(squad.score ?? 0),{ align: "center", size: 26 });
  }
  MC_ROWS_Y.forEach((y, i) => drawRow(MC_COLS_LEFT, y, sortedTeams[i]));
  MC_ROWS_Y.forEach((y, i) => drawRow(MC_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const KITTY_SCRIM_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "kitty_scrim_template.png");
let _kittyScrimImgCache = null;
async function getKittyScrimImage() {
  if (!_kittyScrimImgCache) _kittyScrimImgCache = await loadTemplateImage(KITTY_SCRIM_TEMPLATE_PATH, "Hello Kitty Scrim");
  return _kittyScrimImgCache;
}
const KITTY_BASE_W = 1024;
const KITTY_BASE_H = 1024;
const KITTY_COLS_LEFT  = { team: [80, 270],  elim: [270, 347], by: [347, 450], pts: [450, 505] };
const KITTY_COLS_RIGHT = { team: [580, 770], elim: [770, 847], by: [847, 950], pts: [950, 1005] };
const KITTY_ROWS_Y = [320, 394, 468, 543, 618, 690];
async function drawKittyScrimTemplateImage(sortedTeams) {
  const img = await getKittyScrimImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / KITTY_BASE_W;
  const scaleY = height / KITTY_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell([x1, x2], y, str, { align = "center", color = "#3a1a1a", size = 22 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const x = align === "left" ? x1 * scaleX : ((x1 + x2) / 2) * scaleX;
    let text = str;
    if (align === "left" && text.length > 14) text = text.slice(0, 13) + "…";
    ctx.fillText(text, x, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 22 });
    drawCell(cols.elim, y, String(squad.kill ?? 0), { align: "center", size: 22 });
    drawCell(cols.by,   y, String(squad.by ?? 0),   { align: "center", size: 22 });
    drawCell(cols.pts,  y, String(squad.score ?? 0),{ align: "center", size: 22 });
  }
  KITTY_ROWS_Y.forEach((y, i) => drawRow(KITTY_COLS_LEFT, y, sortedTeams[i]));
  KITTY_ROWS_Y.forEach((y, i) => drawRow(KITTY_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const FFCLASSIC_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "freefire_classic_template.png");
let _ffClassicImgCache = null;
async function getFfClassicImage() {
  if (!_ffClassicImgCache) _ffClassicImgCache = await loadTemplateImage(FFCLASSIC_TEMPLATE_PATH, "Free Fire Classic");
  return _ffClassicImgCache;
}
const FFCLASSIC_BASE_W = 1024;
const FFCLASSIC_BASE_H = 1024;
const FFCLASSIC_COLS = { team: [512, 742], elim: [742, 823], by: [823, 904], pts: [904, 989] };
const FFCLASSIC_ROWS_Y = [337, 384, 433, 481, 530, 578, 627, 675, 724, 773, 821, 870];
async function drawFreefireClassicTemplateImage(sortedTeams) {
  const img = await getFfClassicImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / FFCLASSIC_BASE_W;
  const scaleY = height / FFCLASSIC_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell([x1, x2], y, str, { align = "center", color = "#1a1a2e", size = 22 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const x = align === "left" ? x1 * scaleX : ((x1 + x2) / 2) * scaleX;
    let text = str;
    if (align === "left" && text.length > 16) text = text.slice(0, 15) + "…";
    ctx.fillText(text, x, y * scaleY);
  }
  FFCLASSIC_ROWS_Y.forEach((y, i) => {
    const squad = sortedTeams[i];
    if (!squad) return;
    drawCell(FFCLASSIC_COLS.team, y, squad.rep || "Unknown", { align: "left", size: 22 });
    drawCell(FFCLASSIC_COLS.elim, y, String(squad.kill ?? 0), { align: "center", size: 22 });
    drawCell(FFCLASSIC_COLS.by,   y, String(squad.by ?? 0),   { align: "center", size: 22 });
    drawCell(FFCLASSIC_COLS.pts,  y, String(squad.score ?? 0),{ align: "center", size: 22 });
  });
  return canvas.toBuffer("image/png");
}

const BLSCRIM_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "bluelock_scrim_template.png");
let _blScrimImgCache = null;
async function getBlScrimImage() {
  if (!_blScrimImgCache) _blScrimImgCache = await loadTemplateImage(BLSCRIM_TEMPLATE_PATH, "Blue Lock Scrim");
  return _blScrimImgCache;
}
const BLSCRIM_BASE_W = 928;
const BLSCRIM_BASE_H = 1152;
const BLSCRIM_TOP1_NAME_X = 286;
const BLSCRIM_TOP1_NAME_Y = 540;
const BLSCRIM_TOP1_STATS_Y = 485;
const BLSCRIM_TOP1_ELIM_CX = 609;
const BLSCRIM_TOP1_BY_CX   = 722;
const BLSCRIM_TOP1_PTS_CX  = 819;
const BLSCRIM_COLS_LEFT  = { team: 62,  elim: 261, by: 343, pts: 416 };
const BLSCRIM_COLS_RIGHT = { team: 510, elim: 700, by: 785, pts: 864 };
const BLSCRIM_ROWS_Y = [663, 710, 750, 789, 826, 865];
async function drawBluelockScrimTemplateImage(sortedTeams) {
  const img = await getBlScrimImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / BLSCRIM_BASE_W;
  const scaleY = height / BLSCRIM_BASE_H;
  ctx.textBaseline = "middle";
  function drawAt(x, y, str, { align = "center", color = "#ffffff", size = 15 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 16) text = text.slice(0, 15) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  const top1 = sortedTeams[0];
  if (top1) {
    drawAt(BLSCRIM_TOP1_NAME_X, BLSCRIM_TOP1_NAME_Y, top1.rep || "Unknown", { align: "left", size: 34 });
    drawAt(BLSCRIM_TOP1_ELIM_CX, BLSCRIM_TOP1_STATS_Y, String(top1.kill ?? 0), { align: "center", size: 26 });
    drawAt(BLSCRIM_TOP1_BY_CX,   BLSCRIM_TOP1_STATS_Y, String(top1.by ?? 0).padStart(2, "0"), { align: "center", size: 26 });
    drawAt(BLSCRIM_TOP1_PTS_CX,  BLSCRIM_TOP1_STATS_Y, String(top1.score ?? 0), { align: "center", size: 26 });
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawAt(cols.team, y, squad.rep || "Unknown", { align: "left", size: 15 });
    drawAt(cols.elim, y, String(squad.kill ?? 0), { align: "center", size: 15 });
    drawAt(cols.by,   y, String(squad.by ?? 0).padStart(2, "0"), { align: "center", size: 15 });
    drawAt(cols.pts,  y, String(squad.score ?? 0), { align: "center", size: 15 });
  }
  BLSCRIM_ROWS_Y.forEach((y, i) => drawRow(BLSCRIM_COLS_LEFT, y, sortedTeams[i + 1]));
  BLSCRIM_ROWS_Y.forEach((y, i) => drawRow(BLSCRIM_COLS_RIGHT, y, sortedTeams[i + 7]));
  return canvas.toBuffer("image/png");
}

const OVERALL_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "overall_standing_template.png");
let _overallImgCache = null;
async function getOverallImage() {
  if (!_overallImgCache) _overallImgCache = await loadTemplateImage(OVERALL_TEMPLATE_PATH, "Overall Standing");
  return _overallImgCache;
}
const OVERALL_BASE_W = 928;
const OVERALL_BASE_H = 1134;
const OVERALL_COLS = { team: 145, elim: 487, by: 570, pts: 650 };
const OVERALL_ROWS_Y = { 1: 504, 2: 544, 3: 588, 4: 632.5, 5: 676.5, 6: 720.5, 7: 765, 8: 809.5, 9: 853.5, 10: 897.5, 11: 942, 12: 986.5 };
async function drawOverallStandingTemplateImage(sortedTeams) {
  const img = await getOverallImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / OVERALL_BASE_W;
  const scaleY = height / OVERALL_BASE_H;
  ctx.textBaseline = "middle";
  function drawText(x, y, str, { align = "center", color = "#ffffff", size = 24 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 16) text = text.slice(0, 15) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(OVERALL_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawText(OVERALL_COLS.team, y, t.rep || "Unknown", { align: "left",  color: "#ffffff", size: 24 });
    drawText(OVERALL_COLS.elim, y, String(t.kill ?? 0), { align: "center", color: "#ffffff", size: 24 });
    drawText(OVERALL_COLS.by,   y, String(t.by ?? 0).padStart(2, "0"), { align: "center", color: "#ffffff", size: 24 });
    drawText(OVERALL_COLS.pts,  y, String(t.score ?? 0), { align: "center", color: "#ffdc3c", size: 24 });
  });
  return canvas.toBuffer("image/png");
}

const SIMPLEBXH_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "simple_bxh_template.png");
let _simpleBxhImgCache = null;
async function getSimpleBxhImage() {
  if (!_simpleBxhImgCache) _simpleBxhImgCache = await loadTemplateImage(SIMPLEBXH_TEMPLATE_PATH, "BXH Đơn Giản");
  return _simpleBxhImgCache;
}
const SIMPLEBXH_BASE_W = 922;
const SIMPLEBXH_BASE_H = 1152;
const SIMPLEBXH_COLS_LEFT  = { team: 90,  elim: 305, by: 357, pts: 412 };
const SIMPLEBXH_COLS_RIGHT = { team: 540, elim: 752, by: 809, pts: 872 };
const SIMPLEBXH_ROWS_Y = [446, 517.5, 588, 658, 729, 800];
async function drawSimpleBxhTemplateImage(sortedTeams) {
  const img = await getSimpleBxhImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / SIMPLEBXH_BASE_W;
  const scaleY = height / SIMPLEBXH_BASE_H;
  ctx.textBaseline = "middle";
  function drawText(x, y, str, { align = "center", color = "#141414", size = 24 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 14) text = text.slice(0, 13) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawText(cols.team, y, squad.rep || "Unknown", { align: "left" });
    drawText(cols.elim, y, String(squad.kill ?? 0));
    drawText(cols.by,   y, String(squad.by ?? 0).padStart(2, "0"));
    drawText(cols.pts,  y, String(squad.score ?? 0));
  }
  SIMPLEBXH_ROWS_Y.forEach((y, i) => drawRow(SIMPLEBXH_COLS_LEFT, y, sortedTeams[i]));
  SIMPLEBXH_ROWS_Y.forEach((y, i) => drawRow(SIMPLEBXH_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const BXHTONG_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "bxh_tong_template.png");
let _bxhTongImgCache = null;
async function getBxhTongImage() {
  if (!_bxhTongImgCache) _bxhTongImgCache = await loadTemplateImage(BXHTONG_TEMPLATE_PATH, "BXH Tổng");
  return _bxhTongImgCache;
}
const BXHTONG_BASE_W = 1364;
const BXHTONG_BASE_H = 768;
const BXHTONG_COLS_LEFT  = { team: 395, elim: 543, by: 599, pts: 648 };
const BXHTONG_COLS_RIGHT = { team: 754, elim: 902, by: 958, pts: 1007 };
const BXHTONG_ROWS_Y = [292, 351.5, 411, 471.5, 530.5, 590];
async function drawBxhTongTemplateImage(sortedTeams) {
  const img = await getBxhTongImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / BXHTONG_BASE_W;
  const scaleY = height / BXHTONG_BASE_H;
  ctx.textBaseline = "middle";
  function drawText(x, y, str, { align = "center", color = "#ffffff", size = 18 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 9) text = text.slice(0, 8) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawText(cols.team, y, squad.rep || "Unknown", { align: "left",  color: "#ffffff" });
    drawText(cols.elim, y, String(squad.kill ?? 0), { align: "center", color: "#ffffff" });
    drawText(cols.by,   y, String(squad.by ?? 0).padStart(2, "0"), { align: "center", color: "#ffffff" });
    drawText(cols.pts,  y, String(squad.score ?? 0), { align: "center", color: "#ffdc3c" });
  }
  BXHTONG_ROWS_Y.forEach((y, i) => drawRow(BXHTONG_COLS_LEFT, y, sortedTeams[i]));
  BXHTONG_ROWS_Y.forEach((y, i) => drawRow(BXHTONG_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const KAITO_BASE_W = 1364;
const KAITO_BASE_H = 768;
const KAITO_COLS = { team: 640, elim: 895, by: 985, pts: 1057 };
const KAITO_ROWS_Y = { 2: 204, 3: 247, 4: 290, 5: 332, 6: 374, 7: 417, 8: 459, 9: 502, 10: 544, 11: 587, 12: 629 };
const KAITO_TOP1 = { name: { x: 445, y: 435 }, byCount: { x: 495, y: 530 }, elim: { x: 330, y: 610 }, pts: { x: 488, y: 610 } };
function drawKaitoStyleRows(ctx, scaleX, scaleY, sortedTeams) {
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 20 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 20) text = text.slice(0, 19) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(KAITO_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(KAITO_COLS.team, y, t.rep || "Unknown", { align: "left",  color: "#ffffff", size: 22 });
    drawCell(KAITO_COLS.elim, y, String(t.kill ?? 0), { align: "center", color: "#ffffff", size: 20 });
    drawCell(KAITO_COLS.by,   y, String(t.by ?? 0),   { align: "center", color: "#ffffff", size: 20 });
    drawCell(KAITO_COLS.pts,  y, String(t.score ?? 0),{ align: "center", color: "#ffd654", size: 20 });
  });
  const top1 = sortedTeams[0];
  if (top1) {
    drawCell(KAITO_TOP1.name.x, KAITO_TOP1.name.y, top1.rep || "Unknown", { align: "center", color: "#ffffff", size: 26 });
    drawCell(KAITO_TOP1.byCount.x, KAITO_TOP1.byCount.y, `x${top1.by ?? 0}`, { align: "left", color: "#ffd654", size: 24 });
    drawCell(KAITO_TOP1.elim.x, KAITO_TOP1.elim.y, String(top1.kill ?? 0), { align: "center", color: "#ffffff", size: 30 });
    drawCell(KAITO_TOP1.pts.x, KAITO_TOP1.pts.y, String(top1.score ?? 0), { align: "center", color: "#ffd654", size: 30 });
  }
}
const KAITO_DARK_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "kaito_dark_template.png");
let _kaitoDarkImgCache = null;
async function getKaitoDarkImage() {
  if (!_kaitoDarkImgCache) _kaitoDarkImgCache = await loadTemplateImage(KAITO_DARK_TEMPLATE_PATH, "BXH Kaito (nền tối)");
  return _kaitoDarkImgCache;
}
async function drawKaitoDarkTemplateImage(sortedTeams) {
  const img = await getKaitoDarkImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  ctx.textBaseline = "middle";
  const scaleX = width / KAITO_BASE_W;
  const scaleY = height / KAITO_BASE_H;
  drawKaitoStyleRows(ctx, scaleX, scaleY, sortedTeams);
  return canvas.toBuffer("image/png");
}
const KAITO_LIGHT_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "kaito_light_template.png");
let _kaitoLightImgCache = null;
async function getKaitoLightImage() {
  if (!_kaitoLightImgCache) _kaitoLightImgCache = await loadTemplateImage(KAITO_LIGHT_TEMPLATE_PATH, "BXH Kaito (nền sáng)");
  return _kaitoLightImgCache;
}
async function drawKaitoLightTemplateImage(sortedTeams) {
  const img = await getKaitoLightImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  ctx.textBaseline = "middle";
  const scaleX = width / KAITO_BASE_W;
  const scaleY = height / KAITO_BASE_H;
  drawKaitoStyleRows(ctx, scaleX, scaleY, sortedTeams);
  return canvas.toBuffer("image/png");
}

const TETBXH_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "tet_bxhtong_template.png");
let _tetBxhImgCache = null;
async function getTetBxhImage() {
  if (!_tetBxhImgCache) _tetBxhImgCache = await loadTemplateImage(TETBXH_TEMPLATE_PATH, "BXH Tổng Tết");
  return _tetBxhImgCache;
}
const TETBXH_BASE_W = 1364;
const TETBXH_BASE_H = 768;
const TETBXH_TOP3_COLS = { team: 230, elim: 460, by: 535, pts: 615 };
const TETBXH_TOP3_ROWS = { 1: { y: 408, color: "#280505" }, 2: { y: 475, color: "#ffffff" }, 3: { y: 542, color: "#ffffff" } };
const TETBXH_MAIN_COLS = { team: 780, elim: 996, by: 1093, pts: 1190 };
const TETBXH_MAIN_ROWS_Y = { 4: 214, 5: 262, 6: 310, 7: 358, 8: 406, 9: 454, 10: 502, 11: 550, 12: 598 };
async function drawTetBxhTongTemplateImage(sortedTeams) {
  const img = await getTetBxhImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / TETBXH_BASE_W;
  const scaleY = height / TETBXH_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 18 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 14) text = text.slice(0, 13) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(TETBXH_TOP3_ROWS).forEach(([rank, { y, color }]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(TETBXH_TOP3_COLS.team, y - 22, t.rep || "Unknown", { align: "left", color, size: 18 });
    drawCell(TETBXH_TOP3_COLS.elim, y, String(t.kill ?? 0), { align: "center", color, size: 16 });
    drawCell(TETBXH_TOP3_COLS.by,   y, String(t.by ?? 0),   { align: "center", color, size: 16 });
    drawCell(TETBXH_TOP3_COLS.pts,  y, String(t.score ?? 0),{ align: "center", color, size: 16 });
  });
  Object.entries(TETBXH_MAIN_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(TETBXH_MAIN_COLS.team, y, t.rep || "Unknown", { align: "left",  color: "#ffffff", size: 16 });
    drawCell(TETBXH_MAIN_COLS.elim, y, String(t.kill ?? 0), { align: "center", color: "#ffffff", size: 20 });
    drawCell(TETBXH_MAIN_COLS.by,   y, String(t.by ?? 0),   { align: "center", color: "#ffffff", size: 20 });
    drawCell(TETBXH_MAIN_COLS.pts,  y, String(t.score ?? 0),{ align: "center", color: "#ffd654", size: 20 });
  });
  return canvas.toBuffer("image/png");
}

const ONEPIECE_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "onepiece_bxh_template.png");
let _onepieceImgCache = null;
async function getOnepieceImage() {
  if (!_onepieceImgCache) _onepieceImgCache = await loadTemplateImage(ONEPIECE_TEMPLATE_PATH, "BXH One Piece");
  return _onepieceImgCache;
}
const ONEPIECE_BASE_W = 1364;
const ONEPIECE_BASE_H = 768;
const ONEPIECE_MAIN_COLS = { team: 765, elim: 1134, by: 1217, pts: 1289 };
const ONEPIECE_MAIN_ROWS_Y = { 2: 257, 3: 293, 4: 330, 5: 368, 6: 405, 7: 442, 8: 478, 9: 516, 10: 553, 11: 590, 12: 627 };
const ONEPIECE_TOP1 = { elim: { x: 290, y: 575 }, by: { x: 430, y: 575 }, pts: { x: 610, y: 575 } };
async function drawOnepieceTemplateImage(sortedTeams) {
  const img = await getOnepieceImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / ONEPIECE_BASE_W;
  const scaleY = height / ONEPIECE_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#191919", size = 18 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 20) text = text.slice(0, 19) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(ONEPIECE_MAIN_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(ONEPIECE_MAIN_COLS.team, y, t.rep || "Unknown", { align: "left",  color: "#191919", size: 18 });
    drawCell(ONEPIECE_MAIN_COLS.elim, y, String(t.kill ?? 0), { align: "center", color: "#191919", size: 18 });
    drawCell(ONEPIECE_MAIN_COLS.by,   y, String(t.by ?? 0),   { align: "center", color: "#191919", size: 18 });
    drawCell(ONEPIECE_MAIN_COLS.pts,  y, String(t.score ?? 0),{ align: "center", color: "#191919", size: 18 });
  });
  const top1 = sortedTeams[0];
  if (top1) {
    drawCell(ONEPIECE_TOP1.elim.x, ONEPIECE_TOP1.elim.y, String(top1.kill ?? 0), { align: "center", color: "#ffffff", size: 20 });
    drawCell(ONEPIECE_TOP1.by.x,   ONEPIECE_TOP1.by.y,   String(top1.by ?? 0),   { align: "center", color: "#ffffff", size: 20 });
    drawCell(ONEPIECE_TOP1.pts.x,  ONEPIECE_TOP1.pts.y,  String(top1.score ?? 0),{ align: "center", color: "#ffffff", size: 20 });
  }
  return canvas.toBuffer("image/png");
}

const SRIM_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "srim_bxh_template.png");
let _srimImgCache = null;
async function getSrimImage() {
  if (!_srimImgCache) _srimImgCache = await loadTemplateImage(SRIM_TEMPLATE_PATH, "BXH Free Fire Srim");
  return _srimImgCache;
}
const SRIM_BASE_W = 922;
const SRIM_BASE_H = 1152;
const SRIM_COLS = { team: 450, elim: 683, by: 765, pts: 857 };
const SRIM_ROWS_Y = { 1: 413, 2: 465, 3: 517, 4: 569, 5: 621, 6: 673, 7: 725, 8: 777, 9: 829, 10: 881, 11: 933, 12: 985 };
async function drawSrimTemplateImage(sortedTeams) {
  const img = await getSrimImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / SRIM_BASE_W;
  const scaleY = height / SRIM_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 20 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 20) text = text.slice(0, 19) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(SRIM_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(SRIM_COLS.team, y, t.rep || "Unknown", { align: "left",  color: "#ffffff", size: 20 });
    drawCell(SRIM_COLS.elim, y, String(t.kill ?? 0), { align: "center", color: "#ffffff", size: 20 });
    drawCell(SRIM_COLS.by,   y, String(t.by ?? 0),   { align: "center", color: "#ffffff", size: 20 });
    drawCell(SRIM_COLS.pts,  y, String(t.score ?? 0),{ align: "center", color: "#ffd654", size: 20 });
  });
  return canvas.toBuffer("image/png");
}

const ZORO_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "zoro_bxh_template.png");
let _zoroImgCache = null;
async function getZoroImage() {
  if (!_zoroImgCache) _zoroImgCache = await loadTemplateImage(ZORO_TEMPLATE_PATH, "BXH One Piece Zoro");
  return _zoroImgCache;
}
const ZORO_BASE_W = 1920;
const ZORO_BASE_H = 1080;
const ZORO_MAIN_COLS = { team: 1080, elim: 1600, by: 1700, pts: 1810 };
const ZORO_MAIN_ROWS_Y = { 2: 357, 3: 409, 4: 461, 5: 513, 6: 565, 7: 617, 8: 669, 9: 721, 10: 773, 11: 825, 12: 877 };
const ZORO_TOP1 = { elim: { x: 410, y: 820 }, by: { x: 610, y: 820 }, pts: { x: 880, y: 820 }, playerName: { x: 110, y: 895 } };
async function drawZoroTemplateImage(sortedTeams) {
  const img = await getZoroImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / ZORO_BASE_W;
  const scaleY = height / ZORO_BASE_H;
  ctx.textBaseline = "middle";
  const pad2 = (n) => String(n ?? 0).padStart(2, "0");
  function drawCell(x, y, str, { align = "center", color = "#191919", size = 24 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 20) text = text.slice(0, 19) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(ZORO_MAIN_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(ZORO_MAIN_COLS.team, y, t.rep || "Unknown", { align: "left",  color: "#191919", size: 26 });
    drawCell(ZORO_MAIN_COLS.elim, y, pad2(t.kill), { align: "center", color: "#191919", size: 26 });
    drawCell(ZORO_MAIN_COLS.by,   y, pad2(t.by),   { align: "center", color: "#191919", size: 26 });
    drawCell(ZORO_MAIN_COLS.pts,  y, pad2(t.score),{ align: "center", color: "#191919", size: 26 });
  });
  const top1 = sortedTeams[0];
  if (top1) {
    drawCell(ZORO_TOP1.elim.x, ZORO_TOP1.elim.y, pad2(top1.kill), { align: "center", color: "#ffffff", size: 30 });
    drawCell(ZORO_TOP1.by.x,   ZORO_TOP1.by.y,   pad2(top1.by),   { align: "center", color: "#ffffff", size: 30 });
    drawCell(ZORO_TOP1.pts.x,  ZORO_TOP1.pts.y,  pad2(top1.score),{ align: "center", color: "#ffffff", size: 30 });
    drawCell(ZORO_TOP1.playerName.x, ZORO_TOP1.playerName.y, top1.rep || "Unknown", { align: "left", color: "#141414", size: 20 });
  }
  return canvas.toBuffer("image/png");
}

const OSANIME_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "overall_standings_anime_template.jpg");
let _osAnimeImgCache = null;
async function getOsAnimeImage() {
  if (!_osAnimeImgCache) _osAnimeImgCache = await loadTemplateImage(OSANIME_TEMPLATE_PATH, "Overall Standings Anime");
  return _osAnimeImgCache;
}
const OSANIME_BASE_W = 928;
const OSANIME_BASE_H = 1134;
const OSANIME_COLS = { team: 130, booyah: 520, elim: 568, pts: 615 };
const OSANIME_ROWS_Y = (() => {
  const start = 430, step = 46.3, out = {};
  for (let i = 1; i <= 12; i++) out[i] = start + (i - 1) * step;
  return out;
})();
async function drawOverallStandingsAnimeTemplateImage(sortedTeams) {
  const img = await getOsAnimeImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / OSANIME_BASE_W;
  const scaleY = height / OSANIME_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#1e160a", size = 22 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(OSANIME_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(OSANIME_COLS.team, y, t.rep || "Unknown", { align: "left", size: 22 });
    drawCell(OSANIME_COLS.booyah, y, String(t.by ?? 0), { align: "center", size: 22 });
    drawCell(OSANIME_COLS.elim, y, String(t.kill ?? 0), { align: "center", size: 22 });
    drawCell(OSANIME_COLS.pts, y, String(t.score ?? 0), { align: "center", size: 22 });
  });
  return canvas.toBuffer("image/png");
}

const PCAT_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "purple_cat_bxh_template.jpg");
let _pCatImgCache = null;
async function getPCatImage() {
  if (!_pCatImgCache) _pCatImgCache = await loadTemplateImage(PCAT_TEMPLATE_PATH, "BXH Mèo Tím");
  return _pCatImgCache;
}
const PCAT_BASE_W = 1364;
const PCAT_BASE_H = 768;
const PCAT_COLS = { team: 638, elim: 892, by: 985, pts: 1057 };
const PCAT_ROWS_Y = (() => {
  const start = 208, step = 44, out = {};
  for (let i = 2; i <= 12; i++) out[i] = start + (i - 2) * step;
  return out;
})();
const PCAT_TOP1 = { name: { x: 45, y: 445 }, elim: { x: 305, y: 635 }, pts: { x: 470, y: 635 } };
async function drawPurpleCatTemplateImage(sortedTeams) {
  const img = await getPCatImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / PCAT_BASE_W;
  const scaleY = height / PCAT_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 22 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(PCAT_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(PCAT_COLS.team, y, t.rep || "Unknown", { align: "left", size: 22 });
    drawCell(PCAT_COLS.elim, y, String(t.kill ?? 0), { align: "center", size: 24 });
    drawCell(PCAT_COLS.by, y, String(t.by ?? 0), { align: "center", size: 24 });
    drawCell(PCAT_COLS.pts, y, String(t.score ?? 0), { align: "center", size: 24 });
  });
  const top1 = sortedTeams[0];
  if (top1) {
    drawCell(PCAT_TOP1.name.x, PCAT_TOP1.name.y, top1.rep || "Unknown", { align: "left", size: 32 });
    drawCell(PCAT_TOP1.elim.x, PCAT_TOP1.elim.y, String(top1.kill ?? 0), { align: "center", size: 28 });
    drawCell(PCAT_TOP1.pts.x, PCAT_TOP1.pts.y, String(top1.score ?? 0), { align: "center", size: 28 });
  }
  return canvas.toBuffer("image/png");
}

const PINKANIME_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "pink_anime_bxh_template.jpg");
let _pinkAnimeImgCache = null;
async function getPinkAnimeImage() {
  if (!_pinkAnimeImgCache) _pinkAnimeImgCache = await loadTemplateImage(PINKANIME_TEMPLATE_PATH, "BXH Hồng Anime");
  return _pinkAnimeImgCache;
}
const PINKANIME_BASE_W = 1364;
const PINKANIME_BASE_H = 768;
const PINKANIME_COLS = { team: 615, elim: 868, by: 945, pts: 1028 };
const PINKANIME_ROWS_Y = { 2: 201, 3: 239, 4: 277, 5: 315, 6: 353, 7: 391, 8: 429, 9: 467, 10: 505, 11: 543, 12: 581 };
const PINKANIME_TOP1 = { name: { x: 55, y: 470 }, elim: { x: 305, y: 632 }, pts: { x: 470, y: 632 } };
async function drawPinkAnimeTemplateImage(sortedTeams) {
  const img = await getPinkAnimeImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / PINKANIME_BASE_W;
  const scaleY = height / PINKANIME_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 22 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(PINKANIME_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(PINKANIME_COLS.team, y, t.rep || "Unknown", { align: "left", size: 22 });
    drawCell(PINKANIME_COLS.elim, y, String(t.kill ?? 0), { align: "center", size: 24 });
    drawCell(PINKANIME_COLS.by, y, String(t.by ?? 0), { align: "center", size: 24 });
    drawCell(PINKANIME_COLS.pts, y, String(t.score ?? 0), { align: "center", size: 24 });
  });
  const top1 = sortedTeams[0];
  if (top1) {
    drawCell(PINKANIME_TOP1.name.x, PINKANIME_TOP1.name.y, top1.rep || "Unknown", { align: "left", size: 32 });
    drawCell(PINKANIME_TOP1.elim.x, PINKANIME_TOP1.elim.y, String(top1.kill ?? 0), { align: "center", size: 30 });
    drawCell(PINKANIME_TOP1.pts.x, PINKANIME_TOP1.pts.y, String(top1.score ?? 0), { align: "center", size: 30 });
  }
  return canvas.toBuffer("image/png");
}

const OSRED_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "overall_standing_red_template.jpg");
let _osRedImgCache = null;
async function getOsRedImage() {
  if (!_osRedImgCache) _osRedImgCache = await loadTemplateImage(OSRED_TEMPLATE_PATH, "Overall Standing Đỏ");
  return _osRedImgCache;
}
const OSRED_BASE_W = 928;
const OSRED_BASE_H = 1134;
const OSRED_COLS = { team: 140, elim: 487, by: 578, pts: 655 };
const OSRED_ROWS_Y = { 1: 507, 2: 552, 3: 596, 4: 640, 5: 684, 6: 728, 7: 772, 8: 816, 9: 860, 10: 905, 11: 950, 12: 994 };
async function drawOverallStandingRedTemplateImage(sortedTeams) {
  const img = await getOsRedImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / OSRED_BASE_W;
  const scaleY = height / OSRED_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 22 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(OSRED_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(OSRED_COLS.team, y, t.rep || "Unknown", { align: "left", size: 22 });
    drawCell(OSRED_COLS.elim, y, String(t.kill ?? 0), { align: "center", size: 22 });
    drawCell(OSRED_COLS.by, y, String(t.by ?? 0), { align: "center", size: 22 });
    drawCell(OSRED_COLS.pts, y, String(t.score ?? 0), { align: "center", size: 22 });
  });
  return canvas.toBuffer("image/png");
}

const CYBERCAT_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "cyber_cat_bxh_template.jpg");
let _cyberCatImgCache = null;
async function getCyberCatImage() {
  if (!_cyberCatImgCache) _cyberCatImgCache = await loadTemplateImage(CYBERCAT_TEMPLATE_PATH, "BXH Mèo Cyber");
  return _cyberCatImgCache;
}
const CYBERCAT_BASE_W = 922;
const CYBERCAT_BASE_H = 1152;
const CYBERCAT_COLS_LEFT = { team: 90, elim: 317, by: 368, pts: 423 };
const CYBERCAT_COLS_RIGHT = { team: 537, elim: 766, by: 815, pts: 871 };
const CYBERCAT_ROWS_Y = [413, 482, 554, 624, 694, 765];
async function drawCyberCatTemplateImage(sortedTeams) {
  const img = await getCyberCatImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / CYBERCAT_BASE_W;
  const scaleY = height / CYBERCAT_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#1e1e23", size = 17 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 16) text = text.slice(0, 15) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 17 });
    drawCell(cols.elim, y, String(squad.kill ?? 0), { align: "center", size: 24 });
    drawCell(cols.by, y, String(squad.by ?? 0), { align: "center", size: 24 });
    drawCell(cols.pts, y, String(squad.score ?? 0), { align: "center", size: 24 });
  }
  CYBERCAT_ROWS_Y.forEach((y, i) => drawRow(CYBERCAT_COLS_LEFT, y, sortedTeams[i]));
  CYBERCAT_ROWS_Y.forEach((y, i) => drawRow(CYBERCAT_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const ANIMEV2_BASE_W = 1364;
const ANIMEV2_BASE_H = 768;
const ANIMEV2_COLS = { team: 635, elim: 895, by: 985, pts: 1057 };
const ANIMEV2_ROWS_Y = { 2: 207, 3: 249, 4: 291, 5: 334, 6: 376, 7: 419, 8: 462, 9: 505, 10: 547, 11: 590, 12: 632 };
const ANIMEV2_TOP1 = { name: { x: 410, y: 430 }, elim: { x: 330, y: 615 }, pts: { x: 495, y: 615 }, by: { x: 535, y: 532 } };
function drawAnimeV2StyleRows(ctx, scaleX, scaleY, sortedTeams, { drawTop1By = false } = {}) {
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 22 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(ANIMEV2_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(ANIMEV2_COLS.team, y, t.rep || "Unknown", { align: "left", size: 22 });
    drawCell(ANIMEV2_COLS.elim, y, String(t.kill ?? 0), { align: "center", size: 24 });
    drawCell(ANIMEV2_COLS.by, y, String(t.by ?? 0), { align: "center", size: 24 });
    drawCell(ANIMEV2_COLS.pts, y, String(t.score ?? 0), { align: "center", size: 24 });
  });
  const top1 = sortedTeams[0];
  if (top1) {
    drawCell(ANIMEV2_TOP1.name.x, ANIMEV2_TOP1.name.y, top1.rep || "Unknown", { align: "center", size: 30 });
    drawCell(ANIMEV2_TOP1.elim.x, ANIMEV2_TOP1.elim.y, String(top1.kill ?? 0), { align: "center", size: 30 });
    drawCell(ANIMEV2_TOP1.pts.x, ANIMEV2_TOP1.pts.y, String(top1.score ?? 0), { align: "center", size: 30 });
    if (drawTop1By) {
      drawCell(ANIMEV2_TOP1.by.x, ANIMEV2_TOP1.by.y, String(top1.by ?? 0), { align: "center", size: 36 });
    }
  }
}
const JJK_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "jjk_bxh_template.jpg");
let _jjkImgCache = null;
async function getJjkImage() {
  if (!_jjkImgCache) _jjkImgCache = await loadTemplateImage(JJK_TEMPLATE_PATH, "BXH Jujutsu Kaisen");
  return _jjkImgCache;
}
async function drawJjkTemplateImage(sortedTeams) {
  const img = await getJjkImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  ctx.textBaseline = "middle";
  const scaleX = width / ANIMEV2_BASE_W;
  const scaleY = height / ANIMEV2_BASE_H;
  drawAnimeV2StyleRows(ctx, scaleX, scaleY, sortedTeams, { drawTop1By: false });
  return canvas.toBuffer("image/png");
}
const DRAGONBALL_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "dragonball_bxh_template.jpg");
let _dragonballImgCache = null;
async function getDragonballImage() {
  if (!_dragonballImgCache) _dragonballImgCache = await loadTemplateImage(DRAGONBALL_TEMPLATE_PATH, "BXH Dragon Ball");
  return _dragonballImgCache;
}
async function drawDragonballTemplateImage(sortedTeams) {
  const img = await getDragonballImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  ctx.textBaseline = "middle";
  const scaleX = width / ANIMEV2_BASE_W;
  const scaleY = height / ANIMEV2_BASE_H;
  drawAnimeV2StyleRows(ctx, scaleX, scaleY, sortedTeams, { drawTop1By: true });
  return canvas.toBuffer("image/png");
}

const SOLDIERV2_BASE_W = 1364;
const SOLDIERV2_BASE_H = 768;
const SOLDIERV2_COLS = { team: 840, elim: 1132, by: 1218, pts: 1290 };
const SOLDIERV2_ROWS_Y = { 2: 256, 3: 293, 4: 330, 5: 367, 6: 404, 7: 441, 8: 478, 9: 515, 10: 552, 11: 589, 12: 626 };
const SOLDIERV2_TOP1 = { elim: { x: 293, y: 595 }, by: { x: 453, y: 595 }, pts: { x: 618, y: 595 }, name: { x: 165, y: 460 } };
function drawSoldierV2StyleRows(ctx, scaleX, scaleY, sortedTeams, { drawTop1Name = false, textColor = "#1e0a05" } = {}) {
  function drawCell(x, y, str, { align = "center", color = textColor, size = 20 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(SOLDIERV2_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(SOLDIERV2_COLS.team, y, t.rep || "Unknown", { align: "left", size: 20 });
    drawCell(SOLDIERV2_COLS.elim, y, String(t.kill ?? 0), { align: "center", size: 24 });
    drawCell(SOLDIERV2_COLS.by, y, String(t.by ?? 0), { align: "center", size: 24 });
    drawCell(SOLDIERV2_COLS.pts, y, String(t.score ?? 0), { align: "center", size: 24 });
  });
  const top1 = sortedTeams[0];
  if (top1) {
    drawCell(SOLDIERV2_TOP1.elim.x, SOLDIERV2_TOP1.elim.y, String(top1.kill ?? 0), { align: "center", color: "#ffffff", size: 30 });
    drawCell(SOLDIERV2_TOP1.by.x, SOLDIERV2_TOP1.by.y, String(top1.by ?? 0), { align: "center", color: "#ffffff", size: 30 });
    drawCell(SOLDIERV2_TOP1.pts.x, SOLDIERV2_TOP1.pts.y, String(top1.score ?? 0), { align: "center", color: "#ffffff", size: 30 });
    if (drawTop1Name) {
      drawCell(SOLDIERV2_TOP1.name.x, SOLDIERV2_TOP1.name.y, top1.rep || "Unknown", { align: "left", color: "#ffffff", size: 28 });
    }
  }
}
const SOLDIER_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "soldier_bxh_template.jpg");
let _soldierImgCache = null;
async function getSoldierImage() {
  if (!_soldierImgCache) _soldierImgCache = await loadTemplateImage(SOLDIER_TEMPLATE_PATH, "BXH Lính Việt Nam");
  return _soldierImgCache;
}
async function drawSoldierTemplateImage(sortedTeams) {
  const img = await getSoldierImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  ctx.textBaseline = "middle";
  const scaleX = width / SOLDIERV2_BASE_W;
  const scaleY = height / SOLDIERV2_BASE_H;
  drawSoldierV2StyleRows(ctx, scaleX, scaleY, sortedTeams, { drawTop1Name: false });
  return canvas.toBuffer("image/png");
}
const DEMONSLAYER_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "demonslayer_bxh_template.jpg");
let _demonslayerImgCache = null;
async function getDemonslayerImage() {
  if (!_demonslayerImgCache) _demonslayerImgCache = await loadTemplateImage(DEMONSLAYER_TEMPLATE_PATH, "BXH Demon Slayer");
  return _demonslayerImgCache;
}
async function drawDemonslayerTemplateImage(sortedTeams) {
  const img = await getDemonslayerImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  ctx.textBaseline = "middle";
  const scaleX = width / SOLDIERV2_BASE_W;
  const scaleY = height / SOLDIERV2_BASE_H;
  drawSoldierV2StyleRows(ctx, scaleX, scaleY, sortedTeams, { drawTop1Name: true });
  return canvas.toBuffer("image/png");
}

const ANIMEBLUE_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "anime_blue_bxhtong_template.jpg");
let _animeBlueImgCache = null;
async function getAnimeBlueImage() {
  if (!_animeBlueImgCache) _animeBlueImgCache = await loadTemplateImage(ANIMEBLUE_TEMPLATE_PATH, "BXH Tổng Anime Xanh");
  return _animeBlueImgCache;
}
const ANIMEBLUE_BASE_W = 1364;
const ANIMEBLUE_BASE_H = 768;
const ANIMEBLUE_COLS = { team: 615, elim: 972, by: 1057, pts: 1128 };
const ANIMEBLUE_ROWS_Y = { 2: 255, 3: 290, 4: 326, 5: 362, 6: 398, 7: 434, 8: 470, 9: 507, 10: 543, 11: 579, 12: 615 };
const ANIMEBLUE_TOP1_NAME = { x: 110, y: 460 };
async function drawAnimeBlueBxhTongTemplateImage(sortedTeams) {
  const img = await getAnimeBlueImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / ANIMEBLUE_BASE_W;
  const scaleY = height / ANIMEBLUE_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 20 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(ANIMEBLUE_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(ANIMEBLUE_COLS.team, y, t.rep || "Unknown", { align: "left", size: 20 });
    drawCell(ANIMEBLUE_COLS.elim, y, String(t.kill ?? 0), { align: "center", size: 22 });
    drawCell(ANIMEBLUE_COLS.by, y, String(t.by ?? 0), { align: "center", size: 22 });
    drawCell(ANIMEBLUE_COLS.pts, y, String(t.score ?? 0), { align: "center", size: 22 });
  });
  const top1 = sortedTeams[0];
  if (top1) {
    drawCell(ANIMEBLUE_TOP1_NAME.x, ANIMEBLUE_TOP1_NAME.y, top1.rep || "Unknown", { align: "left", size: 26 });
  }
  return canvas.toBuffer("image/png");
}

const FFSCRIM_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "ff_scrim_yellow_template.jpg");
let _ffScrimImgCache = null;
async function getFfScrimImage() {
  if (!_ffScrimImgCache) _ffScrimImgCache = await loadTemplateImage(FFSCRIM_TEMPLATE_PATH, "BXH Free Fire Scrim Vàng");
  return _ffScrimImgCache;
}
const FFSCRIM_BASE_W = 1024;
const FFSCRIM_BASE_H = 1024;
const FFSCRIM_COLS = { team: 430, by: 858, pts: 918, elim: 985 };
const FFSCRIM_ROWS_Y = { 1: 229, 2: 284, 3: 338, 4: 393, 5: 447, 6: 502, 7: 556, 8: 611, 9: 665, 10: 720, 11: 774, 12: 829 };
async function drawFfScrimYellowTemplateImage(sortedTeams) {
  const img = await getFfScrimImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / FFSCRIM_BASE_W;
  const scaleY = height / FFSCRIM_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 20 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(FFSCRIM_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(FFSCRIM_COLS.team, y, t.rep || "Unknown", { align: "left", color: "#ffffff", size: 20 });
    drawCell(FFSCRIM_COLS.by, y, String(t.by ?? 0), { align: "center", color: "#141414", size: 20 });
    drawCell(FFSCRIM_COLS.pts, y, String(t.score ?? 0), { align: "center", color: "#ffffff", size: 20 });
    drawCell(FFSCRIM_COLS.elim, y, String(t.kill ?? 0), { align: "center", color: "#141414", size: 20 });
  });
  return canvas.toBuffer("image/png");
}

const NEONOS_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "neon_overall_standings_template.jpg");
let _neonOsImgCache = null;
async function getNeonOsImage() {
  if (!_neonOsImgCache) _neonOsImgCache = await loadTemplateImage(NEONOS_TEMPLATE_PATH, "Overall Standings Neon");
  return _neonOsImgCache;
}
const NEONOS_BASE_W = 1024;
const NEONOS_BASE_H = 1536;
const NEONOS_COLS = { team: 250, by: 650, elim: 790, pts: 915 };
const NEONOS_ROWS_Y = { 1: 614, 2: 675, 3: 736, 4: 797, 5: 858, 6: 921, 7: 984, 8: 1047, 9: 1109, 10: 1172, 11: 1234, 12: 1296 };
async function drawNeonOverallStandingsTemplateImage(sortedTeams) {
  const img = await getNeonOsImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / NEONOS_BASE_W;
  const scaleY = height / NEONOS_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 26 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  Object.entries(NEONOS_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(NEONOS_COLS.team, y, t.rep || "Unknown", { align: "left", size: 26 });
    drawCell(NEONOS_COLS.by, y, String(t.by ?? 0), { align: "center", size: 26 });
    drawCell(NEONOS_COLS.elim, y, String(t.kill ?? 0), { align: "center", size: 26 });
    drawCell(NEONOS_COLS.pts, y, String(t.score ?? 0), { align: "center", size: 26 });
  });
  return canvas.toBuffer("image/png");
}

const GREENBXH_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "green_bxh_template.jpg");
let _greenBxhImgCache = null;
async function getGreenBxhImage() {
  if (!_greenBxhImgCache) _greenBxhImgCache = await loadTemplateImage(GREENBXH_TEMPLATE_PATH, "BXH Xanh Lá");
  return _greenBxhImgCache;
}
const GREENBXH_BASE_W = 1672;
const GREENBXH_BASE_H = 940;
const GREENBXH_MAIN_COLS = { team: 790, by: 1108, elim: 1192, pts: 1265 };
const GREENBXH_MAIN_ROWS_Y = { 1: 305, 2: 358, 3: 411, 4: 465, 5: 518, 6: 572, 7: 625, 8: 676, 9: 727, 10: 776, 11: 824, 12: 872 };
const GREENBXH_NAME_ERASE_RECT = [62, 598, 448, 665];
const GREENBXH_ERASE_COLOR = "#021009";
const GREENBXH_TOP1_NAME = { x: 80, y: 631 };
const GREENBXH_TOP1_STATS = {
  kill: { eraseRect: [260, 828, 340, 848], x: 290, y: 845 },
  elim: { eraseRect: [390, 828, 460, 848], x: 420, y: 845 },
  pts: { eraseRect: [535, 815, 625, 848], x: 580, y: 845 },
};
async function drawGreenBxhTemplateImage(sortedTeams) {
  const img = await getGreenBxhImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / GREENBXH_BASE_W;
  const scaleY = height / GREENBXH_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 22 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function eraseRect([x1, y1, x2, y2]) {
    ctx.fillStyle = GREENBXH_ERASE_COLOR;
    ctx.fillRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);
  }
  Object.entries(GREENBXH_MAIN_ROWS_Y).forEach(([rank, y]) => {
    const t = sortedTeams[parseInt(rank) - 1];
    if (!t) return;
    drawCell(GREENBXH_MAIN_COLS.team, y, t.rep || "Unknown", { align: "left", size: 22 });
    drawCell(GREENBXH_MAIN_COLS.by, y, String(t.by ?? 0), { align: "center", size: 24 });
    drawCell(GREENBXH_MAIN_COLS.elim, y, String(t.kill ?? 0), { align: "center", size: 24 });
    drawCell(GREENBXH_MAIN_COLS.pts, y, String(t.score ?? 0), { align: "center", size: 24 });
  });
  const top1 = sortedTeams[0];
  if (top1) {
    eraseRect(GREENBXH_NAME_ERASE_RECT);
    drawCell(GREENBXH_TOP1_NAME.x, GREENBXH_TOP1_NAME.y, top1.rep || "Unknown", { align: "left", size: 40, color: "#f5faf5" });
    eraseRect(GREENBXH_TOP1_STATS.kill.eraseRect);
    drawCell(GREENBXH_TOP1_STATS.kill.x, GREENBXH_TOP1_STATS.kill.y, String(top1.kill ?? 0), { align: "center", size: 30 });
    eraseRect(GREENBXH_TOP1_STATS.elim.eraseRect);
    drawCell(GREENBXH_TOP1_STATS.elim.x, GREENBXH_TOP1_STATS.elim.y, String(top1.by ?? 0), { align: "center", size: 30 });
    eraseRect(GREENBXH_TOP1_STATS.pts.eraseRect);
    drawCell(GREENBXH_TOP1_STATS.pts.x, GREENBXH_TOP1_STATS.pts.y, String(top1.score ?? 0), { align: "center", size: 30 });
  }
  return canvas.toBuffer("image/png");
}

const ONEPIECE2_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "onepiece2_bxh_template.jpg");
let _onepiece2ImgCache = null;
async function getOnepiece2Image() {
  if (!_onepiece2ImgCache) _onepiece2ImgCache = await loadTemplateImage(ONEPIECE2_TEMPLATE_PATH, "BXH One Piece 2 Cột");
  return _onepiece2ImgCache;
}
const ONEPIECE2_BASE_W = 1024;
const ONEPIECE2_BASE_H = 1536;
const ONEPIECE2_COLS_LEFT = { team: 110, elim: 305, by: 370, pts: 440 };
const ONEPIECE2_COLS_RIGHT = { team: 625, elim: 820, by: 885, pts: 955 };
const ONEPIECE2_ROWS_Y = [683, 737, 791, 845, 898, 952];
async function drawOnepiece2TemplateImage(sortedTeams) {
  const img = await getOnepiece2Image();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / ONEPIECE2_BASE_W;
  const scaleY = height / ONEPIECE2_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 15 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 16) text = text.slice(0, 15) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 15 });
    drawCell(cols.elim, y, String(squad.kill ?? 0), { align: "center", size: 18 });
    drawCell(cols.by, y, String(squad.by ?? 0), { align: "center", size: 18 });
    drawCell(cols.pts, y, String(squad.score ?? 0), { align: "center", size: 18 });
  }
  ONEPIECE2_ROWS_Y.forEach((y, i) => drawRow(ONEPIECE2_COLS_LEFT, y, sortedTeams[i]));
  ONEPIECE2_ROWS_Y.forEach((y, i) => drawRow(ONEPIECE2_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const PURPLEMHA_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "purple_mha_14teams_template.jpg");
let _purpleMhaImgCache = null;
async function getPurpleMhaImage() {
  if (!_purpleMhaImgCache) _purpleMhaImgCache = await loadTemplateImage(PURPLEMHA_TEMPLATE_PATH, "BXH Tím MHA (14 đội)");
  return _purpleMhaImgCache;
}
const PURPLEMHA_BASE_W = 1024;
const PURPLEMHA_BASE_H = 1536;
const PURPLEMHA_COLS_LEFT = { team: 120, kills: 344, by: 403, total: 465 };
const PURPLEMHA_COLS_RIGHT = { team: 625, kills: 849, by: 908, total: 970 };
const PURPLEMHA_ROWS_Y = [509, 606, 702, 797, 892, 986, 1082];
async function drawPurpleMhaTemplateImage(sortedTeams) {
  const img = await getPurpleMhaImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / PURPLEMHA_BASE_W;
  const scaleY = height / PURPLEMHA_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 19 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 19 });
    drawCell(cols.kills, y, String(squad.kill ?? 0), { align: "center", size: 20 });
    drawCell(cols.by, y, String(squad.by ?? 0), { align: "center", size: 20 });
    drawCell(cols.total, y, String(squad.score ?? 0), { align: "center", size: 20 });
  }
  PURPLEMHA_ROWS_Y.forEach((y, i) => drawRow(PURPLEMHA_COLS_LEFT, y, sortedTeams[i]));
  PURPLEMHA_ROWS_Y.forEach((y, i) => drawRow(PURPLEMHA_COLS_RIGHT, y, sortedTeams[i + 7]));
  return canvas.toBuffer("image/png");
}

const SPACEANIME_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "space_anime_overall_standings_template.jpg");
let _spaceAnimeImgCache = null;
async function getSpaceAnimeImage() {
  if (!_spaceAnimeImgCache) _spaceAnimeImgCache = await loadTemplateImage(SPACEANIME_TEMPLATE_PATH, "Overall Standings Vũ Trụ Tím");
  return _spaceAnimeImgCache;
}
const SPACEANIME_BASE_W = 1370;
const SPACEANIME_BASE_H = 768;
const SPACEANIME_TOP3_COLS = { team: 190, elim: 490, by: 563, pts: 638 };
const SPACEANIME_TOP3_ROWS_Y = [552, 615, 676];
const SPACEANIME_REST_COLS = { team: 790, elim: 1073, by: 1150, pts: 1223 };
const SPACEANIME_REST_ROWS_Y = [180, 242, 304, 365, 427, 489, 550, 612, 674];
async function drawSpaceAnimeOverallStandingsTemplateImage(sortedTeams) {
  const img = await getSpaceAnimeImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / SPACEANIME_BASE_W;
  const scaleY = height / SPACEANIME_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 22 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 22 });
    drawCell(cols.elim, y, String(squad.kill ?? 0), { align: "center", size: 22 });
    drawCell(cols.by, y, String(squad.by ?? 0), { align: "center", size: 22 });
    drawCell(cols.pts, y, String(squad.score ?? 0), { align: "center", size: 22 });
  }
  SPACEANIME_TOP3_ROWS_Y.forEach((y, i) => drawRow(SPACEANIME_TOP3_COLS, y, sortedTeams[i]));
  SPACEANIME_REST_ROWS_Y.forEach((y, i) => drawRow(SPACEANIME_REST_COLS, y, sortedTeams[i + 3]));
  return canvas.toBuffer("image/png");
}

const TODAYSTANDING_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "today_standing_black_template.jpg");
let _todayStandingImgCache = null;
async function getTodayStandingImage() {
  if (!_todayStandingImgCache) _todayStandingImgCache = await loadTemplateImage(TODAYSTANDING_TEMPLATE_PATH, "Today Standing Đen");
  return _todayStandingImgCache;
}
const TODAYSTANDING_BASE_W = 1364;
const TODAYSTANDING_BASE_H = 768;
const TODAYSTANDING_COLS = { team: 225, booyah: 478, elims: 588, total: 681 };
const TODAYSTANDING_ROWS_Y = [211, 250, 289, 329, 369, 408, 448, 487, 527, 567, 606, 646];
async function drawTodayStandingTemplateImage(sortedTeams) {
  const img = await getTodayStandingImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / TODAYSTANDING_BASE_W;
  const scaleY = height / TODAYSTANDING_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 15 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  TODAYSTANDING_ROWS_Y.forEach((y, i) => {
    const t = sortedTeams[i];
    if (!t) return;
    drawCell(TODAYSTANDING_COLS.team, y, t.rep || "Unknown", { align: "left", color: "#ffffff", size: 15 });
    drawCell(TODAYSTANDING_COLS.booyah, y, String(t.by ?? 0), { align: "center", color: "#141414", size: 20 });
    drawCell(TODAYSTANDING_COLS.elims, y, String(t.kill ?? 0), { align: "center", color: "#141414", size: 20 });
    drawCell(TODAYSTANDING_COLS.total, y, String(t.score ?? 0), { align: "center", color: "#141414", size: 20 });
  });
  return canvas.toBuffer("image/png");
}

const BLUE2PANEL_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "blue_2panel_bxh_template.jpg");
let _blue2PanelImgCache = null;
async function getBlue2PanelImage() {
  if (!_blue2PanelImgCache) _blue2PanelImgCache = await loadTemplateImage(BLUE2PANEL_TEMPLATE_PATH, "BXH 2 Cột Xanh");
  return _blue2PanelImgCache;
}
const BLUE2PANEL_BASE_W = 1364;
const BLUE2PANEL_BASE_H = 768;
const BLUE2PANEL_COLS_LEFT = { team: 310, kills: 506, by: 569, pts: 624 };
const BLUE2PANEL_COLS_RIGHT = { team: 788, kills: 984, by: 1047, pts: 1102 };
const BLUE2PANEL_ROWS_Y = [313, 372, 431, 490, 549, 608];
async function drawBlue2PanelTemplateImage(sortedTeams) {
  const img = await getBlue2PanelImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / BLUE2PANEL_BASE_W;
  const scaleY = height / BLUE2PANEL_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 17 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 16) text = text.slice(0, 15) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 17 });
    drawCell(cols.kills, y, String(squad.kill ?? 0), { align: "center", size: 20 });
    drawCell(cols.by, y, String(squad.by ?? 0), { align: "center", size: 20 });
    drawCell(cols.pts, y, String(squad.score ?? 0), { align: "center", size: 20 });
  }
  BLUE2PANEL_ROWS_Y.forEach((y, i) => drawRow(BLUE2PANEL_COLS_LEFT, y, sortedTeams[i]));
  BLUE2PANEL_ROWS_Y.forEach((y, i) => drawRow(BLUE2PANEL_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const PINK2PANEL_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "pink_anime_2panel_bxh_template.jpg");
let _pink2PanelImgCache = null;
async function getPink2PanelImage() {
  if (!_pink2PanelImgCache) _pink2PanelImgCache = await loadTemplateImage(PINK2PANEL_TEMPLATE_PATH, "BXH 2 Cột Hồng Anime");
  return _pink2PanelImgCache;
}
const PINK2PANEL_BASE_W = 1024;
const PINK2PANEL_BASE_H = 1536;
const PINK2PANEL_COLS_LEFT = { team: 88, elim: 323, by: 394, pts: 465 };
const PINK2PANEL_COLS_RIGHT = { team: 598, elim: 834, by: 904, pts: 975 };
const PINK2PANEL_ROWS_Y = [625, 677, 729, 780, 832, 883];
async function drawPink2PanelTemplateImage(sortedTeams) {
  const img = await getPink2PanelImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / PINK2PANEL_BASE_W;
  const scaleY = height / PINK2PANEL_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#3c0a23", size = 17 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 16) text = text.slice(0, 15) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 17 });
    drawCell(cols.elim, y, String(squad.kill ?? 0), { align: "center", size: 18 });
    drawCell(cols.by, y, String(squad.by ?? 0), { align: "center", size: 18 });
    drawCell(cols.pts, y, String(squad.score ?? 0), { align: "center", size: 18 });
  }
  PINK2PANEL_ROWS_Y.forEach((y, i) => drawRow(PINK2PANEL_COLS_LEFT, y, sortedTeams[i]));
  PINK2PANEL_ROWS_Y.forEach((y, i) => drawRow(PINK2PANEL_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const REDDEMON2PANEL_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "red_demon_2panel_bxh_template.jpg");
let _redDemon2PanelImgCache = null;
async function getRedDemon2PanelImage() {
  if (!_redDemon2PanelImgCache) _redDemon2PanelImgCache = await loadTemplateImage(REDDEMON2PANEL_TEMPLATE_PATH, "BXH 2 Cột Đỏ Quỷ");
  return _redDemon2PanelImgCache;
}
const REDDEMON2PANEL_BASE_W = 1024;
const REDDEMON2PANEL_BASE_H = 1536;
const REDDEMON2PANEL_COLS_LEFT = { team: 110, kills: 330, by: 396, total: 459 };
const REDDEMON2PANEL_COLS_RIGHT = { team: 605, kills: 825, by: 891, total: 954 };
const REDDEMON2PANEL_ROWS_Y = [522, 610, 698, 787, 875, 967];
async function drawRedDemon2PanelTemplateImage(sortedTeams) {
  const img = await getRedDemon2PanelImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / REDDEMON2PANEL_BASE_W;
  const scaleY = height / REDDEMON2PANEL_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 20 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 16) text = text.slice(0, 15) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  function drawRow(cols, y, squad) {
    if (!squad) return;
    drawCell(cols.team, y, squad.rep || "Unknown", { align: "left", size: 20 });
    drawCell(cols.kills, y, String(squad.kill ?? 0), { align: "center", size: 26 });
    drawCell(cols.by, y, String(squad.by ?? 0), { align: "center", size: 26 });
    drawCell(cols.total, y, String(squad.score ?? 0), { align: "center", size: 26 });
  }
  REDDEMON2PANEL_ROWS_Y.forEach((y, i) => drawRow(REDDEMON2PANEL_COLS_LEFT, y, sortedTeams[i]));
  REDDEMON2PANEL_ROWS_Y.forEach((y, i) => drawRow(REDDEMON2PANEL_COLS_RIGHT, y, sortedTeams[i + 6]));
  return canvas.toBuffer("image/png");
}

const BLUEREDSOCCER_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "blue_red_soccer_bxh_template.jpg");
let _blueRedSoccerImgCache = null;
async function getBlueRedSoccerImage() {
  if (!_blueRedSoccerImgCache) _blueRedSoccerImgCache = await loadTemplateImage(BLUEREDSOCCER_TEMPLATE_PATH, "BXH Xanh Đỏ Cầu Thủ");
  return _blueRedSoccerImgCache;
}
const BLUEREDSOCCER_BASE_W = 928;
const BLUEREDSOCCER_BASE_H = 1147;
const BLUEREDSOCCER_COLS = { team: 90, elims: 356, booyah: 454, total: 563 };
const BLUEREDSOCCER_ROWS_Y = [436, 483, 529, 576, 623, 669, 716, 763, 809, 856, 903, 945];
async function drawBlueRedSoccerTemplateImage(sortedTeams) {
  const img = await getBlueRedSoccerImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / BLUEREDSOCCER_BASE_W;
  const scaleY = height / BLUEREDSOCCER_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#14143c", size = 22 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  BLUEREDSOCCER_ROWS_Y.forEach((y, i) => {
    const t = sortedTeams[i];
    if (!t) return;
    drawCell(BLUEREDSOCCER_COLS.team, y, t.rep || "Unknown", { align: "left", size: 22 });
    drawCell(BLUEREDSOCCER_COLS.elims, y, String(t.kill ?? 0), { align: "center", size: 22 });
    drawCell(BLUEREDSOCCER_COLS.booyah, y, String(t.by ?? 0), { align: "center", size: 22 });
    drawCell(BLUEREDSOCCER_COLS.total, y, String(t.score ?? 0), { align: "center", size: 22 });
  });
  return canvas.toBuffer("image/png");
}

const FFWSSEA_TEMPLATE_PATH = path.join(__dirname, "assets", "templates", "ffws_sea_bxh_template.jpg");
let _ffwsSeaImgCache = null;
async function getFfwsSeaImage() {
  if (!_ffwsSeaImgCache) _ffwsSeaImgCache = await loadTemplateImage(FFWSSEA_TEMPLATE_PATH, "BXH FFWS SEA");
  return _ffwsSeaImgCache;
}
const FFWSSEA_BASE_W = 1024;
const FFWSSEA_BASE_H = 1024;
const FFWSSEA_COLS = { team: 135, elims: 388, booyah: 479, total: 570 };
const FFWSSEA_ROWS_Y = [376, 421, 466, 511, 557, 602, 646, 691, 737, 782, 828, 869];
async function drawFfwsSeaTemplateImage(sortedTeams) {
  const img = await getFfwsSeaImage();
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const scaleX = width / FFWSSEA_BASE_W;
  const scaleY = height / FFWSSEA_BASE_H;
  ctx.textBaseline = "middle";
  function drawCell(x, y, str, { align = "center", color = "#ffffff", size = 18 } = {}) {
    ctx.font = `bold ${Math.round(size * scaleY)}px AppFont`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let text = str;
    if (align === "left" && text.length > 18) text = text.slice(0, 17) + "…";
    ctx.fillText(text, x * scaleX, y * scaleY);
  }
  FFWSSEA_ROWS_Y.forEach((y, i) => {
    const t = sortedTeams[i];
    if (!t) return;
    drawCell(FFWSSEA_COLS.team, y, t.rep || "Unknown", { align: "left", color: "#ffffff", size: 18 });
    drawCell(FFWSSEA_COLS.elims, y, String(t.kill ?? 0), { align: "center", color: "#ffffff", size: 18 });
    drawCell(FFWSSEA_COLS.booyah, y, String(t.by ?? 0), { align: "center", color: "#1e1405", size: 18 });
    drawCell(FFWSSEA_COLS.total, y, String(t.score ?? 0), { align: "center", color: "#1e1405", size: 18 });
  });
  return canvas.toBuffer("image/png");
}

// ============================================================
// CÁC MẪU MỚI (44, 45, 46, 47) DÙNG HÀM VẼ ĐỘNG TỪ JSON
// ============================================================
async function drawDynamicLayout(jsonConfig, sortedTeams) {
  return new Promise(async (resolve, reject) => {
    try {
      const width = jsonConfig.layoutConfig.width;
      const height = jsonConfig.layoutConfig.height;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      const bgPath = path.join(__dirname, "assets", "templates", jsonConfig.layoutConfig.backgroundUrl);
      const bg = await loadTemplateImage(bgPath, jsonConfig.layoutName);
      ctx.drawImage(bg, 0, 0, width, height);

      function drawTextNode(node, text, defaultSize = 24) {
        if (!node) return;
        ctx.font = `bold ${node.fontSize || defaultSize}px AppFont`;
        ctx.fillStyle = node.color || "#ffffff";
        ctx.textAlign = node.align || "center";
        ctx.textBaseline = node.verticalAlign || "middle";
        
        let str = String(text);
        if (node.align === "left" && str.length > 16) str = str.slice(0, 15) + "…";
        ctx.fillText(str, node.x, node.y);
      }

      if (jsonConfig.layoutFristRank && jsonConfig.layoutFristRank[0]) {
        const top1 = sortedTeams[0];
        if (top1) {
          const config = jsonConfig.layoutFristRank[0];
          drawTextNode(config.teamName, top1.rep || "Unknown");
          drawTextNode(config.kills, top1.kill ?? 0);
          drawTextNode(config.booyahs, top1.by ?? 0);
          drawTextNode(config.scores, top1.score ?? 0);
        }
      }

      if (jsonConfig.layoutRank) {
        const startIndex = jsonConfig.layoutFristRank ? 1 : 0; 
        
        jsonConfig.layoutRank.forEach((config, i) => {
          const squad = sortedTeams[i + startIndex];
          if (!squad) return;

          if (config.teamName) drawTextNode(config.teamName, squad.rep || "Unknown");
          if (config.kills)    drawTextNode(config.kills, squad.kill ?? 0);
          if (config.booyahs)  drawTextNode(config.booyahs, squad.by ?? 0);
          if (config.scores)   drawTextNode(config.scores, squad.score ?? 0);
        });
      }

      const _buf = canvas.toBuffer("image/png");
      resolve(_buf);
    } catch (e) {
      reject(e);
    }
  });
}

const CONFIG_TOKUDA = {
  layoutName: "BXH TOKUDA",
  layoutConfig: { backgroundUrl: "tokuda-2030.png", height: 2048, width: 1638 },
  layoutRank: Array.from({ length: 12 }).map((_, i) => ({
    teamName: { x: 855, y: 756 + i * 95, color: i === 0 ? "yellow" : "white", align: "center", fontSize: 28 },
    kills:    { x: 1067, y: 756 + i * 95, color: i === 0 ? "yellow" : "white", align: "center", fontSize: 28 },
    booyahs:  { x: 1310, y: 756 + i * 95, color: i === 0 ? "yellow" : "white", align: "center", fontSize: 28 },
    scores:   { x: 1527, y: 756 + i * 95, color: i === 0 ? "yellow" : "white", align: "center", fontSize: 28 },
  }))
};

const CONFIG_FFWS = {
  layoutName: "FFWS Vietnam Fall 2024",
  layoutConfig: { backgroundUrl: "ffws-vn-fall-2024.png", height: 4000, width: 4000 },
  layoutRank: Array.from({ length: 12 }).map((_, i) => {
    const isLeft = i < 6;
    const rowIndex = isLeft ? i : i - 6;
    const baseY = 1852 + (rowIndex * 196);
    const baseX = isLeft ? 0 : 1960;
    return {
      teamName: { x: 320 + baseX, y: baseY, color: "white", align: "left", fontSize: 44 },
      kills:    { x: 1278 + baseX, y: baseY, color: i < 3 ? "black" : "white", align: "center", fontSize: 44 },
      booyahs:  { x: 1531 + baseX, y: baseY, color: i < 3 ? "black" : "white", align: "center", fontSize: 44 },
      scores:   { x: 1797 + baseX, y: baseY, color: i < 3 ? "black" : "white", align: "center", fontSize: 44 },
    };
  })
};

const CONFIG_CR7 = {
  layoutName: "BXH CR7",
  layoutConfig: { backgroundUrl: "cr7-2030.png", height: 2048, width: 1638 },
  layoutRank: Array.from({ length: 12 }).map((_, i) => ({
    teamName: { x: 900, y: 756 + i * 95, color: "#C8102E", align: "center", fontSize: 26 },
    kills:    { x: 1067, y: 756 + i * 95, color: "#C8102E", align: "center", fontSize: 28 },
    booyahs:  { x: 1310, y: 756 + i * 95, color: "#C8102E", align: "center", fontSize: 28 },
    scores:   { x: 1527, y: 756 + i * 95, color: "#C8102E", align: "center", fontSize: 28 },
  }))
};

const CONFIG_PEBARO = {
  layoutName: "BXH Pe Ba Ro",
  layoutConfig: { backgroundUrl: "bxh-pebaro.jpg", height: 1280, width: 1160 },
  layoutFristRank: [{
    teamName: { x: 473, y: 830, color: "#fc4176", align: "center", fontSize: 28 },
    kills:    { x: 688, y: 810, color: "#fc4176", align: "center", fontSize: 72 },
    booyahs:  { x: 902, y: 810, color: "#fc4176", align: "center", fontSize: 72 },
    scores:   { x: 1101, y: 810, color: "#fc4176", align: "center", fontSize: 72 }
  }],
  layoutRank: Array.from({ length: 11 }).map((_, i) => {
    const rank = i + 2;
    const isLeft = rank <= 7;
    const rowIndex = isLeft ? (rank - 2) : (rank - 8);
    
    const yLeft = [1116, 1195, 1278, 1363, 1443, 1534];
    const yRight = [1031, 1116, 1195, 1278, 1363, 1443, 1534];
    const y = isLeft ? yLeft[rowIndex] : yRight[rowIndex];
    
    const baseX = isLeft ? 0 : 744;

    return {
      teamName: { x: 243 + baseX, y: y, color: "#000000", align: "left", fontSize: 28 },
      kills:    { x: 496 + baseX, y: y, color: "#000000", align: "center", fontSize: 28 },
      booyahs:  { x: 582 + baseX, y: y, color: "#000000", align: "center", fontSize: 28 },
      scores:   { x: 672 + baseX, y: y, color: "#000000", align: "center", fontSize: 28 },
    };
  })
};

async function drawTokudaTemplateImage(sortedTeams) { return await drawDynamicLayout(CONFIG_TOKUDA, sortedTeams); }
async function drawFfwsVnTemplateImage(sortedTeams) { return await drawDynamicLayout(CONFIG_FFWS, sortedTeams); }
async function drawCr7TemplateImage(sortedTeams) { return await drawDynamicLayout(CONFIG_CR7, sortedTeams); }
async function drawPeBaRoTemplateImage(sortedTeams) { return await drawDynamicLayout(CONFIG_PEBARO, sortedTeams); }

// ============================================================
// EXPORT TẤT CẢ CÁC HÀM (ĐỦ 47 MẪU)
// ============================================================
module.exports = {
  drawBxhImage,
  drawStandingsTemplateImage,
  drawBluelockTemplateImage,
  drawHkTemplateImage,
  drawChainTemplateImage,
  drawFreefireTemplateImage,
  drawFreefire2TemplateImage,
  drawHxhTemplateImage,
  drawMinecraftTemplateImage,
  drawKittyScrimTemplateImage,
  drawFreefireClassicTemplateImage,
  drawBluelockScrimTemplateImage,
  drawOverallStandingTemplateImage,
  drawSimpleBxhTemplateImage,
  drawBxhTongTemplateImage,
  drawKaitoDarkTemplateImage,
  drawKaitoLightTemplateImage,
  drawTetBxhTongTemplateImage,
  drawOnepieceTemplateImage,
  drawSrimTemplateImage,
  drawZoroTemplateImage,
  drawOverallStandingsAnimeTemplateImage,
  drawPurpleCatTemplateImage,
  drawPinkAnimeTemplateImage,
  drawOverallStandingRedTemplateImage,
  drawCyberCatTemplateImage,
  drawJjkTemplateImage,
  drawDragonballTemplateImage,
  drawSoldierTemplateImage,
  drawAnimeBlueBxhTongTemplateImage,
  drawDemonslayerTemplateImage,
  drawFfScrimYellowTemplateImage,
  drawNeonOverallStandingsTemplateImage,
  drawGreenBxhTemplateImage,
  drawOnepiece2TemplateImage,
  drawPurpleMhaTemplateImage,
  drawSpaceAnimeOverallStandingsTemplateImage,
  drawTodayStandingTemplateImage,
  drawBlue2PanelTemplateImage,
  drawPink2PanelTemplateImage,
  drawRedDemon2PanelTemplateImage,
  drawBlueRedSoccerTemplateImage,
  drawFfwsSeaTemplateImage,
  // 4 Mẫu mới bổ sung
  drawTokudaTemplateImage,
  drawFfwsVnTemplateImage,
  drawCr7TemplateImage,
  drawPeBaRoTemplateImage,
};