// tutien.js - Hệ thống Tu Tiên Hoàn Chỉnh (Siêu Cửa Hàng 50 Món)
const fs = require("fs");
const path = require("path");

let TUTIEN = {};
const FILE_PATH = path.join(__dirname, "tutien.json");

try {
  if (fs.existsSync(FILE_PATH)) TUTIEN = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
} catch (e) { console.error("Lỗi load tutien.json:", e.message); }

function save() {
  try { fs.writeFileSync(FILE_PATH, JSON.stringify(TUTIEN, null, 2), "utf-8"); } catch (e) {}
}

function randomLinhCan() {
  const linhCans = [
    { name: "Tứ Linh Căn", rate: 0.95, system: "🔥 Hỏa" }, { name: "Tam Linh Căn", rate: 1.0, system: "🌿 Mộc" },
    { name: "Nhị Linh Căn", rate: 1.1, system: "💧 Thủy" }, { name: "Đơn Linh Căn", rate: 1.3, system: "⚡ Lôi" },
    { name: "Thiên Linh Căn", rate: 1.5, system: "🌟 Quang" }, { name: "Hỗn Độn Linh Căn", rate: 2.0, system: "🌑 Ám" }
  ];
  const rand = Math.random();
  if (rand > 0.95) return linhCans[5]; if (rand > 0.85) return linhCans[4]; if (rand > 0.65) return linhCans[3];
  if (rand > 0.35) return linhCans[2]; if (rand > 0.10) return linhCans[1]; return linhCans[0];
}

function initUser(userId) {
  if (!TUTIEN[userId]) {
    const lc = randomLinhCan();
    TUTIEN[userId] = {
      level: 1, exp: 0, linhThach: 1000, hp: 100, maxHp: 100, satThuong: 10,
      lastTu: 0, lastHaiThuoc: 0, lastDiemDanh: 0, lastNhiemVu: 0,
      tuiDo: { "Tụ Khí Đan": 3, "Hồi Xuân Đan": 1 },
      tongMon: null, linhThu: null,
      linhCan: lc.name, heSo: lc.rate, he: lc.system
    };
    save();
  }
  return TUTIEN[userId];
}

// ─── KHO HÀNG 50 MÓN ───
const ALL_ITEMS = {
  // --- RÁC (Trắng) ---
  "Rác Rưởi": { price: 10, desc: "Đồ bỏ đi", type: "rác" },
  "Cỏ Khô": { price: 15, desc: "Cỏ ven đường", type: "rác" },
  "Đá Cuội": { price: 20, desc: "Đá ven sông", type: "rác" },
  "Gỗ Mục": { price: 25, desc: "Gỗ mục nát", type: "rác" },
  "Nước Bẩn": { price: 30, desc: "Nước không uống được", type: "rác" },
  // --- THƯỜNG (Xám) ---
  "Hồi Huyết Đan": { price: 100, desc: "Hồi toàn bộ HP", type: "thường", effect: "heal" },
  "Tụ Khí Đan": { price: 150, desc: "Tăng 100 EXP", type: "thường", effect: "exp100" },
  "Kiếm Gỗ": { price: 200, desc: "+5 Sát thương", type: "thường", effect: "atk5" },
  "Áo Vải": { price: 180, desc: "+50 Max HP", type: "thường", effect: "hp50" },
  "Bùa Bình An": { price: 250, desc: "Bùa cơ bản", type: "thường" },
  // --- HIẾM (Xanh lá) ---
  "Hồi Xuân Đan": { price: 500, desc: "Hồi 50% HP", type: "hiếm", effect: "heal50" },
  "Đại Tụ Khí Đan": { price: 600, desc: "Tăng 500 EXP", type: "hiếm", effect: "exp500" },
  "Sắt Tinh": { price: 700, desc: "Nguyên liệu rèn", type: "hiếm" },
  "Bùa May Mắn": { price: 800, desc: "Tăng tỷ lệ rớt đồ", type: "hiếm" },
  "Túi Trữ Vật": { price: 900, desc: "Tăng giới hạn túi", type: "hiếm" },
  // --- SỬ THI (Tím) ---
  "Ngọc Bội": { price: 2000, desc: "+100 Max HP", type: "sử thi", effect: "hp100" },
  "Linh Kiếm": { price: 2500, desc: "+20 Sát thương", type: "sử thi", effect: "atk20" },
  "Hộ Tâm Giáp": { price: 3000, desc: "+200 Max HP", type: "sử thi", effect: "hp200" },
  "Huyết Ngọc Đan": { price: 3500, desc: "Hồi 100% HP & tăng ATK", type: "sử thi", effect: "heal_atk" },
  "Thiên Lôi Phù": { price: 4000, desc: "Gây sát thương lôi", type: "sử thi" },
  // --- HUYỀN THOẠI (Cam) ---
  "Long Lân Giáp": { price: 8000, desc: "+500 Max HP", type: "huyền thoại", effect: "hp500" },
  "Phượng Vũ Kiếm": { price: 10000, desc: "+100 Sát thương", type: "huyền thoại", effect: "atk100" },
  "Cửu Chuyển Kim Đan": { price: 12000, desc: "Tăng 5000 EXP", type: "huyền thoại", effect: "exp5000" },
  "Truyền Thuyết Bảo Thạch": { price: 15000, desc: "Vật phẩm quý", type: "huyền thoại" },
  "Long Cốt": { price: 20000, desc: "Xương rồng", type: "huyền thoại" },
  // --- THẦN THOẠI / MYTHIC (Đỏ) ---
  "Hỗn Độn Chung": { price: 50000, desc: "Pháp bảo thần thoại, +1000 Max HP", type: "mythic", effect: "hp1000" },
  "Khai Thiên Phủ": { price: 60000, desc: "Vũ khí khai thiên, +500 Sát thương", type: "mythic", effect: "atk500" },
  "Bàn Cổ Đan": { price: 80000, desc: "Tăng 50.000 EXP", type: "mythic", effect: "exp50000" },
  "Nghịch Thiên Châu": { price: 100000, desc: "Bảo vật vô giá", type: "mythic" },
  "Hồng Mông Tử Khí": { price: 150000, desc: "Khí tức khai thiên lập địa", type: "mythic" },
  "Tạo Hóa Ngọc Điệp": { price: 200000, desc: "Mảnh ghép vũ trụ", type: "mythic" },
  // Thêm 20 món để đủ 50 (Trải đều các cấp)
  "Sách Cũ": { price: 50, desc: "Sách rách", type: "rác" },
  "Bình Gốm Vỡ": { price: 40, desc: "Đồ cổ vỡ", type: "rác" },
  "Lông Gà": { price: 10, desc: "Lông gà rơi", type: "rác" },
  "Hạt Giống Lạ": { price: 80, desc: "Không rõ giống", type: "thường" },
  "Đá Ma Thuật": { price: 300, desc: "Đá phát sáng", type: "thường" },
  "Lọ Thuốc Nhỏ": { price: 120, desc: "Hồi 30% HP", type: "thường", effect: "heal30" },
  "Dây Thừng": { price: 400, desc: "Dây thừng bền", type: "hiếm" },
  "La Bàn Cổ": { price: 650, desc: "La bàn chỉ đường", type: "hiếm" },
  "Mảnh Bản Đồ": { price: 750, desc: "Mảnh bản đồ kho báu", type: "hiếm" },
  "Bùa Chú Cổ": { price: 1800, desc: "Bùa chú thất truyền", type: "sử thi" },
  "Mặt Nạ Quỷ": { price: 2800, desc: "Mặt nạ kỳ dị", type: "sử thi" },
  "Đèn Lồng Ma": { price: 3200, desc: "Đèn lồng âm khí", type: "sử thi" },
  "Gậy Như Ý": { price: 9000, desc: "Gậy thần co giãn", type: "huyền thoại" },
  "Ấn Pháp": { price: 11000, desc: "Ấn pháp trấn sơn", type: "huyền thoại" },
  "Lọai Ngọc Tỳ Hưu": { price: 18000, desc: "Ngọc tỳ hưu chiêu tài", type: "huyền thoại" },
  "Kiếm Tru Tiên": { price: 55000, desc: "Kiếm chém tiên, +200 ATK", type: "mythic", effect: "atk200" },
  "Đài Sen Cửu Phẩm": { price: 70000, desc: "Đài sen thanh tịnh", type: "mythic" },
  "Hỗn Nguyên Kim Đấu": { price: 90000, desc: "Kim đấu hút linh khí", type: "mythic" },
  "Đan Dược Vô Cực": { price: 120000, desc: "Đan dược vô cực", type: "mythic" },
  "Sách Thần Công": { price: 200000, desc: "Bí kíp tuyệt thế", type: "mythic" }
};

let CURRENT_SHOP = {};
let SHOP_LAST_UPDATE = 0;

// Hàm tạo Shop ngẫu nhiên 10 món
function generateShop() {
  // Lấy tất cả các key của ALL_ITEMS
  const itemNames = Object.keys(ALL_ITEMS);
  // Xáo trộn mảng
  for (let i = itemNames.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [itemNames[i], itemNames[j]] = [itemNames[j], itemNames[i]];
  }
  // Lấy 10 món đầu tiên
  CURRENT_SHOP = {};
  for (let i = 0; i < 10; i++) {
    const name = itemNames[i];
    CURRENT_SHOP[name] = ALL_ITEMS[name];
  }
  SHOP_LAST_UPDATE = Date.now();
}

// Khởi tạo shop lần đầu
generateShop();

async function handleTuTien(userId, senderName, args, sendText, threadId, prefix, USERS, isAdmin) {
  const sub = (args[0] || "").toLowerCase();
  const pTT = `${prefix}tt`;

  if (sub === "dangky") {
    if (TUTIEN[userId]) return sendText(threadId, `❌ Đạo hữu đã đăng ký rồi! Gõ ${pTT} thongtin để xem.`);
    const tu = initUser(userId);
    return sendText(threadId, `🌸 Chào mừng ${senderName || "đạo hữu"} bước vào con đường tu tiên!\n━━━━━━━━━━━━━━━━━━\n📜 Linh căn: ${tu.linhCan} (${tu.he})\n📈 Hệ số tu luyện: x${tu.heSo}\n💎 Linh thạch khởi đầu: 1000\n🎁 Quà tân thủ: 3 Tụ Khí Đan, 1 Hồi Xuân Đan\n━━━━━━━━━━━━━━━━━━\nGõ "${pTT} tuluyen" để bắt đầu tu luyện, "${pTT} menu" để xem lệnh.`);
  }

  const tu = TUTIEN[userId];
  if (!tu) return sendText(threadId, `📜 Người chưa nhập đạo. Gõ: ${pTT} dangky`);

  if (!sub || sub === "menu") {
    return sendText(threadId, `🌸 TU TIÊN — MENU\n━━━━━━━━━━━━━━━━━━\n🧘 Tu luyện: thongtin | tuluyen | dotpha | bequan\n⚔️ Chiến đấu: sanquai | bicanh | pk @tag\n🌿 Thu thập: haithuoc | khaikhoang\n🏪 Cửa hàng: cuahang | mua <tên> | ban <tên> | refresh\n🎒 Túi đồ: tuido | dung <tên>\n📖 Chế tạo: renkhi | luyendan\n🏛️ Tông môn: tongmon\n📅 Hằng ngày: diemdanh | nhiemvu\n💰 Kinh tế: chuyen @tag <số> | top\n━━━━━━━━━━━━━━━━━━\nCách dùng: ${pTT} <lệnh>`);
  }

  if (sub === "thongtin") {
    return sendText(threadId, `👤 THÔNG TIN ĐẠO HỮU\n📛 Đạo hiệu: ${senderName || userId}\n📜 Linh căn: ${tu.linhCan} (x${tu.heSo})\n⭐ Cảnh giới: Tầng ${tu.level}\n✨ Tu vi: ${tu.exp} / ${tu.level * 100}\n❤️ HP: ${tu.hp}/${tu.maxHp} | ⚔️ ATK: ${tu.satThuong}\n💎 Linh thạch: ${tu.linhThach}`);
  }

  if (sub === "tuluyen") {
    const cd = 60000;
    if (Date.now() - tu.lastTu < cd) return sendText(threadId, `⏳ Chờ ${Math.ceil((cd - (Date.now() - tu.lastTu)) / 1000)}s!`);
    const gain = Math.floor((Math.random() * 20 + 10) * tu.heSo);
    tu.exp += gain; tu.lastTu = Date.now(); save();
    return sendText(threadId, `🧘 Ngồi thiền...\n✨ Tu vi +${gain} EXP`);
  }

  if (sub === "dotpha") {
    const need = tu.level * 100;
    if (tu.exp < need) return sendText(threadId, `❌ Cần ${need} EXP (Có ${tu.exp}).`);
    tu.exp -= need; tu.level += 1; tu.maxHp += 50; tu.hp = tu.maxHp; tu.satThuong += 5; save();
    return sendText(threadId, `💥 ĐỘT PHÁ! ⭐ Tầng ${tu.level} | ❤️ HP ${tu.maxHp} | ⚔️ ATK ${tu.satThuong}`);
  }

  if (sub === "sanquai") {
    if (tu.satThuong * 3 >= tu.level * 50) {
      const r = Math.floor(Math.random() * 50) + 20; tu.linhThach += r; tu.exp += 10; save();
      return sendText(threadId, `⚔️ Thắng! +${r} Linh thạch | +10 EXP`);
    } else {
      tu.hp -= tu.level * 5;
      if (tu.hp <= 0) { tu.hp = 1; save(); return sendText(threadId, `💀 Trọng thương!`); }
      save(); return sendText(threadId, `⚔️ Thua! Mất ${tu.level * 5} HP.`);
    }
  }

  if (sub === "haithuoc" || sub === "khaikhoang") {
    const cd = 30000;
    if (Date.now() - tu.lastHaiThuoc < cd) return sendText(threadId, `⏳ Chờ ${Math.ceil((cd - (Date.now() - tu.lastHaiThuoc)) / 1000)}s!`);
    const r = Math.floor(Math.random() * 30) + 10; tu.linhThach += r; tu.lastHaiThuoc = Date.now(); save();
    return sendText(threadId, `🌿 Thu hoạch! +${r} Linh thạch`);
  }

  // ─── CỬA HÀNG (RANDOM 10P) ───
  if (sub === "cuahang" || sub === "shop") {
    // Kiểm tra xem đã qua 10 phút chưa, nếu rồi thì đổi
    if (Date.now() - SHOP_LAST_UPDATE > 600000) generateShop();

    let shopStr = "";
    for (const [name, info] of Object.entries(CURRENT_SHOP)) {
      let icon = "⚪"; let color = "";
      if (info.type === "rác") { icon = "🗑️"; color = " (Rác)"; }
      if (info.type === "thường") { icon = "🟢"; color = " (Thường)"; }
      if (info.type === "hiếm") { icon = "🔵"; color = " (Hiếm)"; }
      if (info.type === "sử thi") { icon = "🟣"; color = " (Sử Thi)"; }
      if (info.type === "huyền thoại") { icon = "🟠"; color = " (Huyền Thoại)"; }
      if (info.type === "mythic") { icon = "🔴"; color = " (Thần Thoại)"; }
      
      shopStr += `${icon} ${name}${color}: ${info.price} 💎\n   └ ${info.desc}\n`;
    }
    const timeLeft = 600000 - (Date.now() - SHOP_LAST_UPDATE);
    const mins = Math.floor(timeLeft / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);

    return sendText(threadId, `🏪 CỬA HÀNG (Làm mới sau ${mins}p ${secs}s)\n━━━━━━━━━━━━━━━━━━\n${shopStr}━━━━━━━━━━━━━━━━━━\n💡 Mua: ${pTT} mua <tên>\n💡 Đổi shop ngay: ${pTT} refresh`);
  }

  if (sub === "refresh") {
    if (!isAdmin(userId)) return sendText(threadId, `🚫 Chỉ Admin mới được đổi cửa hàng!`);
    generateShop();
    return sendText(threadId, `✅ Admin đã làm mới cửa hàng! Gõ ${pTT} cuahang để xem.`);
  }

  if (sub === "mua") {
    const itemName = args.slice(1).join(" ");
    if (!itemName || !CURRENT_SHOP[itemName]) return sendText(threadId, `❌ Vật phẩm không có trong shop. Gõ ${pTT} cuahang để xem.`);
    const item = CURRENT_SHOP[itemName];
    if (tu.linhThach < item.price) return sendText(threadId, `❌ Bạn không đủ Linh thạch! Cần ${item.price} 💎 (Có ${tu.linhThach} 💎).`);
    
    tu.linhThach -= item.price;
    tu.tuiDo[itemName] = (tu.tuiDo[itemName] || 0) + 1;
    
    // Áp dụng hiệu ứng ngay nếu có (trang bị)
    if (item.effect === "hp50") { tu.maxHp += 50; tu.hp = tu.maxHp; }
    if (item.effect === "hp100") { tu.maxHp += 100; tu.hp = tu.maxHp; }
    if (item.effect === "hp200") { tu.maxHp += 200; tu.hp = tu.maxHp; }
    if (item.effect === "hp500") { tu.maxHp += 500; tu.hp = tu.maxHp; }
    if (item.effect === "hp1000") { tu.maxHp += 1000; tu.hp = tu.maxHp; }
    if (item.effect === "atk5") { tu.satThuong += 5; }
    if (item.effect === "atk20") { tu.satThuong += 20; }
    if (item.effect === "atk100") { tu.satThuong += 100; }
    if (item.effect === "atk200") { tu.satThuong += 200; }
    if (item.effect === "atk500") { tu.satThuong += 500; }

    save();
    return sendText(threadId, `✅ Mua thành công [${itemName}]!\n💎 -${item.price} Linh thạch.`);
  }

  if (sub === "ban") {
    const itemName = args.slice(1).join(" ");
    if (!itemName || !tu.tuiDo[itemName] || tu.tuiDo[itemName] <= 0) return sendText(threadId, `❌ Bạn không có vật phẩm này để bán!`);
    
    // Lấy giá gốc từ ALL_ITEMS, bán lại được 50%
    const basePrice = ALL_ITEMS[itemName] ? ALL_ITEMS[itemName].price : 10;
    const sellPrice = Math.floor(basePrice * 0.5);
    
    tu.tuiDo[itemName]--;
    if (tu.tuiDo[itemName] <= 0) delete tu.tuiDo[itemName];
    tu.linhThach += sellPrice;
    save();
    return sendText(threadId, `✅ Bán [${itemName}]!\n💎 +${sellPrice} Linh thạch.`);
  }

  if (sub === "tuido") {
    const items = Object.entries(tu.tuiDo);
    if (!items.length) return sendText(threadId, `🎒 Túi đồ trống.`);
    return sendText(threadId, `🎒 TÚI ĐỒ\n` + items.map(([k, v]) => `- ${k} (x${v})`).join("\n"));
  }

  if (sub === "dung") {
    const item = args.slice(1).join(" ");
    if (!tu.tuiDo[item]) return sendText(threadId, `❌ Không có vật phẩm này!`);
    
    const baseInfo = ALL_ITEMS[item] || {};
    const eff = baseInfo.effect;

    if (eff === "heal" || eff === "heal50" || eff === "heal30") {
      tu.tuiDo[item]--; tu.hp = tu.maxHp; save();
      return sendText(threadId, `💊 Hồi phục toàn bộ HP!`);
    }
    if (eff === "exp100") { tu.tuiDo[item]--; tu.exp += 100; save(); return sendText(threadId, `💊 Sử dụng ${item}! +100 EXP`); }
    if (eff === "exp500") { tu.tuiDo[item]--; tu.exp += 500; save(); return sendText(threadId, `💊 Sử dụng ${item}! +500 EXP`); }
    if (eff === "exp5000") { tu.tuiDo[item]--; tu.exp += 5000; save(); return sendText(threadId, `💊 Sử dụng ${item}! +5000 EXP`); }
    if (eff === "exp50000") { tu.tuiDo[item]--; tu.exp += 50000; save(); return sendText(threadId, `💊 Sử dụng ${item}! +50.000 EXP`); }

    return sendText(threadId, `❌ Vật phẩm này chưa có tác dụng.`);
  }

  if (sub === "renkhi") {
    const cost = tu.satThuong * 10;
    if (tu.linhThach < cost) return sendText(threadId, `❌ Cần ${cost} Linh thạch.`);
    tu.linhThach -= cost; tu.satThuong += 2; save();
    return sendText(threadId, `🔨 Rèn khí! +2 ATK`);
  }

  if (sub === "diemdanh") {
    const today = new Date().toDateString();
    if (tu.lastDiemDanh === today) return sendText(threadId, `📅 Hôm nay đã điểm danh!`);
    tu.lastDiemDanh = today; tu.linhThach += 200; tu.exp += 50; save();
    return sendText(threadId, `📅 Điểm danh! +200 Linh thạch | +50 EXP`);
  }

  if (sub === "top") {
    const sorted = Object.entries(TUTIEN).sort((a, b) => b[1].level - a[1].level || b[1].exp - a[1].exp).slice(0, 10);
    return sendText(threadId, `🏆 TOP CAO THỦ\n\n` + sorted.map((t, i) => `${i + 1}. ${USERS[t[0]]?.name || t[0].slice(-6)} - Tầng ${t[1].level}`).join("\n"));
  }

  if (sub === "chuyen") {
    const target = Object.keys(args[0]?.mentions || {})[0] || args[1];
    const amount = parseInt(args[2]);
    if (!target || isNaN(amount) || amount <= 0) return sendText(threadId, `❌ ${pTT} chuyen @tag <số>`);
    if (tu.linhThach < amount) return sendText(threadId, `❌ Không đủ Linh thạch.`);
    tu.linhThach -= amount;
    const targetTu = initUser(target); targetTu.linhThach += amount; save();
    return sendText(threadId, `💸 Đã chuyển ${amount} Linh thạch!`);
  }

  return sendText(threadId, `❌ Lệnh không hợp lệ. Gõ ${pTT} menu.`);
}

module.exports = { handleTuTien };