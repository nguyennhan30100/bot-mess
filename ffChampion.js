// ============================================================
// LOGIC "VÔ ĐỊCH" (CPR) - CHUẨN THEO MATCHDATA.JS
// ============================================================

function computeChampionBoard(matchesOrdered, threshold = 50) {
  const N = Number(threshold) || 50;
  const MAX_MATCHES = 5;
  const limited = matchesOrdered.slice(0, MAX_MATCHES);

  // Sắp xếp trận đấu theo thời gian (cũ -> mới)
  const sortedMatches = [...limited].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  const overall = []; // Danh sách các đội
  let championRushWinner = null;
  let winnerFound = false;

  for (const match of sortedMatches) {
    if (winnerFound) break; // Đã có vô địch thì dừng

    const teamsInThisMatch = [];

    for (const rankData of (match.ranks || [])) {
      const currentIDs = rankData.playerAccountIds.map(id => id.replace(/\*+$/, ""));
      
      // Tìm đội đã tồn tại dựa trên việc trùng >= 2 ID (đã bỏ dấu *)
      const existingTeam = overall.find(team => {
        const commonPlayers = currentIDs.filter(id => team.playerIDs.includes(id));
        return commonPlayers.length >= 2;
      });

      if (existingTeam) {
        // ── BƯỚC QUAN TRỌNG: KIỂM TRA VÔ ĐỊCH TRƯỚC KHI CỘNG ĐIỂM TRẬN NÀY ──
        // Nếu đội đã kích hoạt từ trước VÀ trận này ăn Top 1 -> Vô địch luôn
        if (existingTeam.activeChampionRush && Number(rankData.rank) === 1) {
          winnerFound = true;
          championRushWinner = existingTeam;
        }

        // Cộng dồn điểm
        existingTeam.kills += Number(rankData.kill) || 0;
        existingTeam.booyahs += Number(rankData.booyah) || 0;
        existingTeam.scores += Number(rankData.score) || 0;
        existingTeam.played += 1;
        existingTeam.lastMatchPlacementPoint = (Number(rankData.score) || 0) - (Number(rankData.kill) || 0);
        existingTeam.isPlayOnLastMatch = true;
        
        // Cập nhật thêm ID nếu có
        existingTeam.playerIDs = Array.from(new Set([...existingTeam.playerIDs, ...currentIDs]));
        
        // Cập nhật tên đại diện nếu chưa có
        if (!existingTeam.teamName) existingTeam.teamName = rankData.accountNames?.[0] || "Unknown";

        // ── KIỂM TRA KÍCH HOẠT CPR SAU KHI ĐÃ CỘNG ĐIỂM ──
        // Nếu tổng điểm đạt ngưỡng, bật cờ activeChampionRush cho các trận sau
        if (existingTeam.scores >= N) {
          existingTeam.activeChampionRush = true;
        }

        teamsInThisMatch.push(existingTeam);
      } else {
        // Đội mới xuất hiện
        const defaultTeamName = rankData.accountNames?.[0] || `Team ${overall.length + 1}`;
        const newTeam = {
          teamName: defaultTeamName,
          playerIDs: [...currentIDs],
          kills: Number(rankData.kill) || 0,
          booyahs: Number(rankData.booyah) || 0,
          scores: Number(rankData.score) || 0,
          played: 1,
          activeChampionRush: (Number(rankData.score) || 0) >= N, // Nếu trận đầu tiên đã đủ điểm
          isPlayOnLastMatch: true,
          lastMatchPlacementPoint: (Number(rankData.score) || 0) - (Number(rankData.kill) || 0),
        };
        overall.push(newTeam);
        teamsInThisMatch.push(newTeam);
      }

      if (winnerFound) break; // Nếu tìm thấy vô địch thì dừng vòng lặp trận
    }

    // Reset cờ isPlayOnLastMatch cho các đội không tham gia trận này
    overall.forEach(team => {
      team.isPlayOnLastMatch = teamsInThisMatch.includes(team);
    });
  }

  // Xác định đội vô địch cuối cùng
  const finalWinner = championRushWinner;

  // Sắp xếp bảng xếp hạng
  const sortedOverall = overall.sort((a, b) => {
    // Nếu có vô địch, đẩy lên đầu
    if (finalWinner) {
      if (a === finalWinner) return -1;
      if (b === finalWinner) return 1;
    }
    // Sắp xếp theo điểm, booyah, kill, điểm trận cuối
    if (b.scores !== a.scores) return b.scores - a.scores;
    if (b.booyahs !== a.booyahs) return b.booyahs - a.booyahs;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return b.lastMatchPlacementPoint - a.lastMatchPlacementPoint;
  });

  // Định dạng lại dữ liệu trả về cho khớp với ffImages (cần rep, by, kill, score)
  const sortedTeams = sortedOverall.slice(0, 12).map(team => ({
    rep: team.teamName,
    by: team.booyahs,
    kill: team.kills,
    score: team.scores,
    champion: finalWinner ? (team.teamName === finalWinner.teamName) : false
  }));

  return { 
    sortedTeams: sortedTeams, 
    hasChampion: !!finalWinner 
  };
}

// Gộp đội thông minh dùng ở luồng .td thường (giữ nguyên)
function mergeTeams(teamTotals) {
  const rawTeams = Object.entries(teamTotals).map(([key, val]) => ({
    cleanIds: new Set(key.split("|")),
    rep:   val.rep,
    by:    Number(val.by) || 0,
    kill:  Number(val.kill) || 0,
    score: Number(val.score) || 0,
  }));
  const merged = [];
  const used = new Array(rawTeams.length).fill(false);
  for (let i = 0; i < rawTeams.length; i++) {
    if (used[i]) continue;
    let group = { ...rawTeams[i], cleanIds: new Set(rawTeams[i].cleanIds) };
    used[i] = true;
    let changed = true;
    while (changed) {
      changed = false;
      for (let j = 0; j < rawTeams.length; j++) {
        if (used[j]) continue;
        const inter = [...rawTeams[j].cleanIds].filter(id => group.cleanIds.has(id));
        if (inter.length >= 2) {
          group.by    += rawTeams[j].by;
          group.kill  += rawTeams[j].kill;
          group.score += rawTeams[j].score;
          rawTeams[j].cleanIds.forEach(id => group.cleanIds.add(id));
          used[j] = true;
          changed = true;
        }
      }
    }
    merged.push(group);
  }
  return merged;
}

module.exports = { computeChampionBoard, mergeTeams };