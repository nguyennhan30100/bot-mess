// ═══════════════════════════════════════════════════════════════════════════
// CONFIG BOT NHTN
// Sửa file này → bot tự áp dụng ngay tin nhắn tiếp theo, KHÔNG cần restart!
// ⚠️ KHÔNG commit file này lên GitHub public (chứa cookie Garena)
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // ── Prefix mặc định ──
  PREFIX: ".",

  // ── Tên bot hiển thị (đổi ở đây là đổi ngay!) ──
  BOT_NAME: "KARED STUDIO BOT",

  // ── Version ──
  BOT_VERSION: "1.12.111",

  // ── Danh sách ID Facebook admin ──
  // Nhắn .id với bot để lấy ID của mình
  ADMIN_IDS: [
    "100095311641059",
    "100082382670263",
  ],

  // ── Cookie Garena (BẮT BUỘC — để lấy dữ liệu trận) ──
  // F12 trên congdong.ff.garena.vn → Network → copy header Cookie
  GARENA_COOKIE: "session=743a5e71-9cd9-4995-b36d-ce78ab3c2c44; session.sig=6fetrgOvdpgjTjOPURG-EmPZx6I",
};