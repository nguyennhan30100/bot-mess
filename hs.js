// hs.js - Quản lý hồ sơ tên team (Hỗ trợ nhiều dòng)
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "hoso.json");
let HoSoData = {};

try {
  if (fs.existsSync(DB_FILE)) HoSoData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
} catch (e) { console.error("Lỗi load hoso.json:", e.message); }

function saveData() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(HoSoData, null, 2), "utf-8"); } catch (e) {}
}

function maskId(id) {
  if (id.length <= 8) return id;
  return id.slice(0, 8) + "**";
}

async function handleHoSo(userId, senderName, rawText, sendText, threadId, prefix) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  if (lines.length === 0) return sendText(threadId, "❌ Vui lòng nhập lệnh!");

  const firstLineWords = lines[0].split(/\s+/);
  const action = firstLineWords[0].toLowerCase();
  const firstLineArgs = firstLineWords.slice(1);

  const menuText = 
    `📋 QUẢN LÝ HỒ SƠ TEAM\n` +
    `────────────────────────\n` +
    `📸 Lệnh thêm team (hỗ trợ nhiều dòng):\n` +
    `• ${prefix}hs add <ID>, <Tên>\n` +
    `────────────────────────\n` +
    `📌 Lệnh khác:\n` +
    `• ${prefix}hs list          → Danh sách team\n` +
    `• ${prefix}hs info <Tên>    → Xem thông tin\n` +
    `• ${prefix}hs del <Tên>     → Xóa team\n` +
    `• ${prefix}hs clear         → Xóa tất cả`;

  // 1. THÊM TEAM (HỖ TRỢ NHIỀU DÒNG)
  if (action === "add") {
    let processLines = [];
    
    // Lấy dữ liệu trên dòng đầu tiên (nếu có gõ kèm)
    const addIndex = lines[0].toLowerCase().indexOf("add");
    const firstLineData = lines[0].substring(addIndex + 3).trim();
    if (firstLineData) processLines.push(firstLineData);
    
    // Lấy toàn bộ các dòng tiếp theo
    for (let i = 1; i < lines.length; i++) processLines.push(lines[i]);

    if (processLines.length === 0) return sendText(threadId, `❌ Vui lòng nhập ID và Tên team!`);

    let successCount = 0;
    let updatedCount = 0;
    let errorMessages = [];

    for (const line of processLines) {
        const commaIndex = line.lastIndexOf(",");
        if (commaIndex === -1) {
          errorMessages.push(`❌ Thiếu dấu phẩy: "${line}"`);
          continue;
        }
        const part1 = line.slice(0, commaIndex).trim();
        const part2 = line.slice(commaIndex + 1).trim();
        
        let id, teamName;
        // Tự nhận diện bên nào là ID, bên nào là Tên
        if (/^\d+$/.test(part1)) { id = part1; teamName = part2; }
        else if (/^\d+$/.test(part2)) { id = part2; teamName = part1; }
        else {
          errorMessages.push(`❌ ID không hợp lệ: "${line}"`);
          continue;
        }

        if (!teamName) {
          errorMessages.push(`❌ Thiếu tên team: "${line}"`);
          continue;
        }
        if (teamName.length > 25) {
          errorMessages.push(`❌ Tên quá dài: "${line}"`);
          continue;
        }

        const key = teamName.toLowerCase();
        if (!HoSoData[key]) {
          HoSoData[key] = { name: teamName, ids: [id], updatedAt: Date.now() };
          successCount++;
        } else {
          if (!HoSoData[key].ids.includes(id)) {
              HoSoData[key].ids.push(id);
              HoSoData[key].updatedAt = Date.now();
              updatedCount++;
          } else {
              errorMessages.push(`⚠️ ID ${maskId(id)} đã có trong ${HoSoData[key].name}`);
          }
        }
    }

    saveData();
    
    let response = `✅ KẾT QUẢ THÊM TEAM\n────────────────────────\n`;
    if (successCount > 0) response += `➕ Tạo mới: ${successCount} team\n`;
    if (updatedCount > 0) response += `♻️ Thêm ID mới: ${updatedCount} team\n`;
    
    if (errorMessages.length > 0) {
      response += `\n⚠️ LỖI:\n${errorMessages.join("\n")}`;
    }
    
    if (successCount === 0 && updatedCount === 0) {
      response = `❌ KHÔNG CÓ TEAM NÀO ĐƯỢC LƯU!\n\n${errorMessages.join("\n")}`;
    }
    
    return sendText(threadId, response);
  }

  // 2. DANH SÁCH
  if (action === "list") {
    const keys = Object.keys(HoSoData);
    if (keys.length === 0) return sendText(threadId, "ℹ️ Mày lọ à có đéo?");

    let msg = `📋 Danh sách team (${keys.length}):\n`;
    keys.forEach((k, i) => {
      const team = HoSoData[k];
      const maskedIds = team.ids.map(id => maskId(id)).join(", ");
      msg += `${i + 1}. ${team.name} — ${maskedIds}\n`;
    });
    return sendText(threadId, msg);
  }

  // 3. XEM THÔNG TIN
  if (action === "info") {
    const searchName = firstLineArgs.join(" ").trim().toLowerCase();
    if (!searchName) return sendText(threadId, `❌ Cú pháp: ${prefix}hs info <Tên team>`);
    
    let foundKey = null;
    for (const k of Object.keys(HoSoData)) {
      if (k.includes(searchName)) { foundKey = k; break; }
    }

    if (!foundKey) return sendText(threadId, `❌ Không tìm thấy team!`);
    
    const team = HoSoData[foundKey];
    const maskedIds = team.ids.map(id => maskId(id)).join("\n📋 ");
    
    return sendText(threadId, 
      `📌 Thông tin team ${team.name}\n` +
      `👥 Số thành viên: ${team.ids.length}\n` +
      `🆔 ID:\n📋 ${maskedIds}`
    );
  }

  // 4. XÓA TEAM
  if (action === "del" || action === "remove") {
    const searchName = firstLineArgs.join(" ").trim().toLowerCase();
    if (!searchName) return sendText(threadId, `❌ Cú pháp: ${prefix}hs del <Tên team>`);
    
    let foundKey = null;
    for (const k of Object.keys(HoSoData)) {
      if (k.includes(searchName)) { foundKey = k; break; }
    }

    if (!foundKey) return sendText(threadId, `❌ Không tìm thấy team để xóa!`);
    
    const deletedName = HoSoData[foundKey].name;
    delete HoSoData[foundKey];
    saveData();
    return sendText(threadId, `🗑️ Đã xóa team: ${deletedName}`);
  }

  // 5. XÓA TẤT CẢ
  if (action === "clear") {
    HoSoData = {};
    saveData();
    return sendText(threadId, `🗑️ Đã xóa TOÀN BỘ hồ sơ team.`);
  }

  return sendText(threadId, menuText);
}

module.exports = { handleHoSo };