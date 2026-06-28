import { Match, Player } from '../types';

export const P_DUNG = "p1_dung";
export const P_NAM = "p2_nam";
export const P_THU = "p3_thu";
export const P_KHOA = "p4_khoa";
export const P_TUYET = "p5_tuyet";
export const P_THUYEN = "p6_thuyen";
export const P_LINH = "p7_linh";
export const P_NHU = "p8_nhu";

// Khởi tạo danh sách người chơi trống để hoàn toàn sử dụng dữ liệu từ Excel
export const initialPlayers: Player[] = [];

// Khởi tạo danh sách trận đấu trống để hoàn toàn sử dụng dữ liệu từ Excel
export const initialMatches: Match[] = [];
