import { Match, Player } from '../types';

export const P_DUNG = "p1_dung";
export const P_NAM = "p2_nam";
export const P_THU = "p3_thu";
export const P_KHOA = "p4_khoa";
export const P_TUYET = "p5_tuyet";
export const P_THUYEN = "p6_thuyen";
export const P_LINH = "p7_linh";
export const P_NHU = "p8_nhu";

export const initialPlayers: Player[] = [
  { id: P_DUNG, name: "Dũng", isActive: true, gender: 'male' },
  { id: P_NAM, name: "Nam", isActive: true, gender: 'male' },
  { id: P_THU, name: "Thư", isActive: true, gender: 'female' },
  { id: P_KHOA, name: "Khoa", isActive: true, gender: 'male' },
  { id: P_TUYET, name: "Tuyết", isActive: true, gender: 'female' },
  { id: P_THUYEN, name: "Thuyên", isActive: true, gender: 'male' },
  { id: P_LINH, name: "Linh", isActive: true, gender: 'female' },
  { id: P_NHU, name: "Như", isActive: true, gender: 'female' },
];

export const initialMatches: Match[] = [
  // 27/6
  { id: "m27_1", date: "2026-06-27", team1: [P_DUNG, P_NAM], team2: [P_THU, P_KHOA], isScoreExact: true, score1: 21, score2: 17 },
  { id: "m27_2", date: "2026-06-27", team1: [P_DUNG, P_TUYET], team2: [P_NAM, P_THUYEN], isScoreExact: true, score1: 21, score2: 15 },
  { id: "m27_3", date: "2026-06-27", team1: [P_THU, P_KHOA], team2: [P_THUYEN, P_TUYET], isScoreExact: true, score1: 21, score2: 18 },
  { id: "m27_4", date: "2026-06-27", team1: [P_THU, P_DUNG], team2: [P_KHOA, P_NAM], isScoreExact: true, score1: 21, score2: 18 },
  { id: "m27_5", date: "2026-06-27", team1: [P_DUNG, P_NAM], team2: [P_KHOA, P_TUYET], isScoreExact: true, score1: 21, score2: 18 },
  { id: "m27_6", date: "2026-06-27", team1: [P_THUYEN, P_THU], team2: [P_KHOA, P_TUYET], isScoreExact: true, score1: 10, score2: 21 },
  { id: "m27_7", date: "2026-06-27", team1: [P_DUNG, P_THU], team2: [P_NAM, P_THUYEN], isScoreExact: true, score1: 21, score2: 10 },
  { id: "m27_8", date: "2026-06-27", team1: [P_DUNG, P_LINH], team2: [P_NAM, P_KHOA], isScoreExact: true, score1: 21, score2: 18 },
  { id: "m27_9", date: "2026-06-27", team1: [P_KHOA, P_THU], team2: [P_TUYET, P_LINH], isScoreExact: true, score1: 21, score2: 14 },
  { id: "m27_10", date: "2026-06-27", team1: [P_THU, P_THUYEN], team2: [P_KHOA, P_TUYET], isScoreExact: true, score1: 17, score2: 21 },
  { id: "m27_11", date: "2026-06-27", team1: [P_LINH, P_THU], team2: [P_THUYEN, P_NAM], isScoreExact: true, score1: 20, score2: 22 },
  
  // 24/6
  { id: "m24_1", date: "2026-06-24", team1: [P_THU, P_THUYEN], team2: [P_NAM, P_TUYET], isScoreExact: false, score1: 0, score2: 1 },
  { id: "m24_2", date: "2026-06-24", team1: [P_KHOA, P_THUYEN], team2: [P_DUNG, P_NAM], isScoreExact: false, score1: 1, score2: 0 },
  { id: "m24_3", date: "2026-06-24", team1: [P_KHOA, P_THU], team2: [P_NAM, P_TUYET], isScoreExact: false, score1: 1, score2: 0 },
  { id: "m24_4", date: "2026-06-24", team1: [P_DUNG, P_NHU], team2: [P_NAM, P_TUYET], isScoreExact: false, score1: 1, score2: 0 },
  { id: "m24_5", date: "2026-06-24", team1: [P_THUYEN, P_THU], team2: [P_DUNG, P_NHU], isScoreExact: true, score1: 17, score2: 21 },
  { id: "m24_6", date: "2026-06-24", team1: [P_THUYEN, P_THU], team2: [P_NAM, P_TUYET], isScoreExact: true, score1: 21, score2: 8 },
  { id: "m24_7", date: "2026-06-24", team1: [P_KHOA, P_NHU], team2: [P_NAM, P_TUYET], isScoreExact: true, score1: 21, score2: 14 },
  { id: "m24_8", date: "2026-06-24", team1: [P_KHOA, P_THU], team2: [P_DUNG, P_NHU], isScoreExact: true, score1: 18, score2: 21 },
  { id: "m24_9", date: "2026-06-24", team1: [P_KHOA, P_THUYEN], team2: [P_NAM, P_TUYET], isScoreExact: true, score1: 17, score2: 21 },
  { id: "m24_10", date: "2026-06-24", team1: [P_DUNG, P_NHU], team2: [P_NAM, P_TUYET], isScoreExact: true, score1: 21, score2: 19 },
  { id: "m24_11", date: "2026-06-24", team1: [P_DUNG, P_THU], team2: [P_KHOA, P_THUYEN], isScoreExact: true, score1: 19, score2: 21 },

  // 21/6
  { id: "m21_1", date: "2026-06-21", team1: [P_DUNG, P_THU], team2: [P_TUYET, P_KHOA], isScoreExact: true, score1: 17, score2: 21 },
  { id: "m21_2", date: "2026-06-21", team1: [P_TUYET, P_KHOA], team2: [P_THUYEN, P_NAM], isScoreExact: true, score1: 16, score2: 21 },
  { id: "m21_3", date: "2026-06-21", team1: [P_KHOA, P_THUYEN], team2: [P_DUNG, P_NAM], isScoreExact: true, score1: 21, score2: 18 },
  { id: "m21_4", date: "2026-06-21", team1: [P_DUNG, P_THU], team2: [P_NAM, P_THUYEN], isScoreExact: true, score1: 21, score2: 18 },
  { id: "m21_5", date: "2026-06-21", team1: [P_DUNG, P_TUYET], team2: [P_NAM, P_THUYEN], isScoreExact: true, score1: 19, score2: 21 },
  { id: "m21_6", date: "2026-06-21", team1: [P_DUNG, P_TUYET], team2: [P_THU, P_KHOA], isScoreExact: true, score1: 15, score2: 21 },
  { id: "m21_7", date: "2026-06-21", team1: [P_KHOA, P_THU], team2: [P_DUNG, P_THUYEN], isScoreExact: true, score1: 16, score2: 21 },
];
