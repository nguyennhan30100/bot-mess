const fs = require("fs");
const path = require("path");
const axios = require("axios");

const QR_FILE = path.join(__dirname, "qrdata.json");
const QR_DIR = path.join(__dirname, "qrcodes");

if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR);

let QRData = {};
try {
  if (fs.existsSync(QR_FILE)) QRData = JSON.parse(fs.readFileSync(QR_FILE, "utf-8"));
} catch (e) { console.error("Lỗi load qrdata.json:", e.message); }

function saveQr() {
  try { fs.writeFileSync(QR_FILE, JSON.stringify(QRData, null, 2), "utf-8"); } catch (e) {}
}

function extractPhotoUrl(message) {
  if (!message?.attachments) return null;
  for (const att of Object.values(message.attachments)) {
    const list = Array.isArray(att) ? att : [att];
    for (const a of list) {
      if (a?.type === "photo" && a.url) return a.url;
      if (a?.type === "photo" && a.largePreviewUrl) return a.largePreviewUrl;
    }
  }
  return null;
}

async function handleQrLogic(userId, text, sendText, sendPhoto, threadId, prefix, message, pendingStep, pendingKey, ADMIN_IDS, CTV_IDS, api, isGroup) {
  const isAuthorized = async () => {
    if (ADMIN_IDS.includes(String(userId))) return true;
    if (CTV_IDS.includes(String(userId))) return true;
    if (isGroup) {
      try {
        const threadInfo = await new Promise((resolve) => api.getThreadInfo(threadId, (e, r) => resolve(e ? null : r)));
        if (threadInfo && threadInfo.adminIDs && threadInfo.adminIDs.some(admin => String(admin.id) === String(userId))) {
          return true;
        }
      } catch (e) { console.error("Lỗi check QTV nhóm:", e.message); }
    }
    return false;
  };

  const pending = pendingStep[pendingKey];
  const lowerText = text.toLowerCase().trim();

  // 0. TÍNH NĂNG THOÁT KHẨN CẤP
  if (pending?.step === "setqr_input" || pending?.step === "setqr_photo") {
    if (lowerText === "huy" || lowerText === "cancel" || text.startsWith(prefix)) {
      delete pendingStep[pendingKey];
      if (text.startsWith(prefix)) return false;
      return sendText(threadId, "✅ Đã hủy bỏ quá trình cấu hình QR.");
    }
  }

  // 1. LỆNH SETQR
  if (lowerText === `${prefix}setqr` || lowerText.startsWith(`${prefix}setqr `)) {
    const allowed = await isAuthorized();
    if (!allowed) {
      return sendText(threadId, "🚫 Chỉ Admin Bot, CTV hoặc QTV Nhóm mới được cấu hình QR!");
    }

    const inlineData = text.slice(`${prefix}setqr`.length).trim();
    if (inlineData) {
      const parts = inlineData.split("|").map(s => s.trim());
      if (parts.length === 3) {
        const [bank, stk, name] = parts;
        pendingStep[pendingKey] = { step: "setqr_photo", bank, stk, name };
        return sendText(threadId, 
          `✅ ĐÃ NHẬN THÔNG TIN (NHẬP NHANH)!\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🏦 Ngân hàng: ${bank.toUpperCase()}\n` +
          `🏧 Số tài khoản: ${stk}\n` +
          `👤 Chủ tài khoản: ${name.toUpperCase()}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📸 Bây giờ, hãy gửi 1 ẢNH MÃ QR (hoặc gõ "huy" để hủy).`
        );
      } else {
        return sendText(threadId, `❌ Sai cú pháp! Vui lòng nhập đúng 3 mục cách nhau bởi dấu "|" (VD: MB Bank | 123456 | NGUYEN VAN A)`);
      }
    }

    if (QRData[threadId]) {
      try {
        if (QRData[threadId].photoPath && fs.existsSync(QRData[threadId].photoPath)) {
          fs.unlinkSync(QRData[threadId].photoPath);
        }
      } catch (e) { console.error("Lỗi xóa ảnh QR cũ:", e.message); }
      delete QRData[threadId];
      saveQr();
    }

    pendingStep[pendingKey] = { step: "setqr_input" };
    return sendText(threadId, 
      `🏦 CẤU HÌNH THÔNG TIN CHUYỂN KHOẢN\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Vui lòng nhập thông tin theo cú pháp:\n` +
      `<Ngân hàng> | <Số tài khoản> | <Tên chủ tài khoản>\n\n` +
      `📌 Ví dụ:\nMB Bank | 0948301012 | NGUYEN VAN A\n\n` +
      `👉 Hãy Reply (Trả lời) tin nhắn này với nội dung bạn muốn cài đặt.\n` +
      `(⚠️ Gõ "huy" để hủy bỏ)`
    );
  }

  // 2. NHẬN THÔNG TIN (BƯỚC 2)
  if (pending?.step === "setqr_input") {
    const parts = text.split("|").map(s => s.trim());
    if (parts.length !== 3) {
      return sendText(threadId, `❌ Sai cú pháp! Vui lòng nhập đúng 3 mục cách nhau bởi dấu "|" (VD: MB Bank | 123456 | NGUYEN VAN A)\n👉 Hoặc gõ "huy" để hủy bỏ.`);
    }
    const [bank, stk, name] = parts;
    pendingStep[pendingKey] = { step: "setqr_photo", bank, stk, name };
    return sendText(threadId, 
      `✅ ĐÃ NHẬN THÔNG TIN!\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏦 Ngân hàng: ${bank.toUpperCase()}\n` +
      `🏧 Số tài khoản: ${stk}\n` +
      `👤 Chủ tài khoản: ${name.toUpperCase()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📸 Bây giờ, hãy gửi 1 ẢNH MÃ QR (hoặc gõ "huy" để hủy).`
    );
  }

  // 3. NHẬN ẢNH QR (BƯỚC 3)
  if (pending?.step === "setqr_photo") {
    const photoUrl = extractPhotoUrl(message);
    if (!photoUrl) {
      return sendText(threadId, `❌ Chưa thấy ảnh QR. Vui lòng gửi 1 ẢNH MÃ QR (hoặc gõ "huy" để hủy).`);
    }

    try {
      await sendText(threadId, "⏳ Đang tải và lưu ảnh QR...");
      const response = await axios.get(photoUrl, { responseType: "arraybuffer", timeout: 15000 });
      const fileName = `qr_${threadId}_${Date.now()}.png`;
      const filePath = path.join(QR_DIR, fileName);
      fs.writeFileSync(filePath, response.data);

      QRData[threadId] = {
        bank: pending.bank,
        stk: pending.stk,
        name: pending.name,
        photoPath: filePath
      };
      saveQr();
      delete pendingStep[pendingKey];

      await sendText(threadId, 
        `✅ ĐÃ LƯU CẤU HÌNH HOÀN TẤT!\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏦 Ngân hàng: ${pending.bank.toUpperCase()}\n` +
        `🏧 Số tài khoản: ${pending.stk}\n` +
        `👤 Chủ tài khoản: ${pending.name.toUpperCase()}\n` +
        `🖼️ Ảnh QR: Đã lưu\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 Từ giờ, thành viên gõ "mã" hoặc "qr" để xem thông tin và ảnh.`
      );
      return await sendPhoto(threadId, fs.readFileSync(filePath));
    } catch (e) {
      delete pendingStep[pendingKey];
      return sendText(threadId, `❌ Lỗi tải ảnh QR: ${e.message}`);
    }
  }

  // 4. GÕ "MÃ" HOẶC "QR" ĐỂ XEM THÔNG TIN
  if (lowerText === "mã" || lowerText === "ma" || lowerText === "qr") {
    const data = QRData[threadId];
    
    // NẾU CHƯA CÓ DỮ LIỆU -> IM LẶNG, KHÔNG TRẢ LỜI
    if (!data) {
      return true; 
    }
    
    // NẾU CÓ DỮ LIỆU -> GỬI ẢNH KÈM CAPTION GỌN GÀNG
    if (data.photoPath && fs.existsSync(data.photoPath)) {
      const caption = `🏦 Ngân hàng: ${data.bank.toUpperCase()}\n🏧 STK: ${data.stk}\n👤 Chủ TK: ${data.name.toUpperCase()}`;
      return await sendPhoto(threadId, fs.readFileSync(data.photoPath), caption);
    } else {
      // Trường hợp không tìm thấy ảnh (bị xóa) thì chỉ gửi text
      return sendText(threadId, `🏦 Ngân hàng: ${data.bank.toUpperCase()}\n🏧 STK: ${data.stk}\n👤 Chủ TK: ${data.name.toUpperCase()}`);
    }
  }
  
  return false;
}

module.exports = { handleQrLogic, QRData, saveQr };