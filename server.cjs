const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.argv[2] || process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '50mb' })); // Tăng giới hạn payload phòng trường hợp lịch sử trận đấu rất lớn

// Dữ liệu mẫu khởi tạo (được lấy từ src/data/seed.ts)
const defaultData = {
  players: [
    { id: "p1_dung", name: "Dũng", isActive: true, gender: "male" },
    { id: "p2_nam", name: "Nam", isActive: true, gender: "male" },
    { id: "p3_thu", name: "Thư", isActive: true, gender: "female" },
    { id: "p4_khoa", name: "Khoa", isActive: true, gender: "male" },
    { id: "p5_tuyet", name: "Tuyết", isActive: true, gender: "female" },
    { id: "p6_thuyen", name: "Thuyên", isActive: true, gender: "male" },
    { id: "p7_linh", name: "Linh", isActive: true, gender: "female" },
    { id: "p8_nhu", name: "Như", isActive: true, gender: "female" }
  ],
  matches: [
    { id: "m27_1", date: "2026-06-27", team1: ["p1_dung", "p2_nam"], team2: ["p3_thu", "p4_khoa"], isScoreExact: true, score1: 21, score2: 17 },
    { id: "m27_2", date: "2026-06-27", team1: ["p1_dung", "p5_tuyet"], team2: ["p2_nam", "p6_thuyen"], isScoreExact: true, score1: 21, score2: 15 },
    { id: "m27_3", date: "2026-06-27", team1: ["p3_thu", "p4_khoa"], team2: ["p6_thuyen", "p5_tuyet"], isScoreExact: true, score1: 21, score2: 18 },
    { id: "m27_4", date: "2026-06-27", team1: ["p3_thu", "p1_dung"], team2: ["p4_khoa", "p2_nam"], isScoreExact: true, score1: 21, score2: 18 },
    { id: "m27_5", date: "2026-06-27", team1: ["p1_dung", "p2_nam"], team2: ["p4_khoa", "p5_tuyet"], isScoreExact: true, score1: 21, score2: 18 },
    { id: "m27_6", date: "2026-06-27", team1: ["p6_thuyen", "p3_thu"], team2: ["p4_khoa", "p5_tuyet"], isScoreExact: true, score1: 10, score2: 21 },
    { id: "m27_7", date: "2026-06-27", team1: ["p1_dung", "p3_thu"], team2: ["p2_nam", "p6_thuyen"], isScoreExact: true, score1: 21, score2: 10 },
    { id: "m27_8", date: "2026-06-27", team1: ["p1_dung", "p7_linh"], team2: ["p2_nam", "p4_khoa"], isScoreExact: true, score1: 21, score2: 18 },
    { id: "m27_9", date: "2026-06-27", team1: ["p4_khoa", "p3_thu"], team2: ["p5_tuyet", "p7_linh"], isScoreExact: true, score1: 21, score2: 14 },
    { id: "m27_10", date: "2026-06-27", team1: ["p3_thu", "p6_thuyen"], team2: ["p4_khoa", "p5_tuyet"], isScoreExact: true, score1: 17, score2: 21 },
    { id: "m27_11", date: "2026-06-27", team1: ["p7_linh", "p3_thu"], team2: ["p6_thuyen", "p2_nam"], isScoreExact: true, score1: 20, score2: 22 },
    { id: "m24_1", date: "2026-06-24", team1: ["p3_thu", "p6_thuyen"], team2: ["p2_nam", "p5_tuyet"], isScoreExact: false, score1: 0, score2: 1 },
    { id: "m24_2", date: "2026-06-24", team1: ["p4_khoa", "p6_thuyen"], team2: ["p1_dung", "p2_nam"], isScoreExact: false, score1: 1, score2: 0 },
    { id: "m24_3", date: "2026-06-24", team1: ["p4_khoa", "p3_thu"], team2: ["p2_nam", "p5_tuyet"], isScoreExact: false, score1: 1, score2: 0 },
    { id: "m24_4", date: "2026-06-24", team1: ["p1_dung", "p8_nhu"], team2: ["p2_nam", "p5_tuyet"], isScoreExact: false, score1: 1, score2: 0 },
    { id: "m24_5", date: "2026-06-24", team1: ["p6_thuyen", "p3_thu"], team2: ["p1_dung", "p8_nhu"], isScoreExact: true, score1: 17, score2: 21 },
    { id: "m24_6", date: "2026-06-24", team1: ["p6_thuyen", "p3_thu"], team2: ["p2_nam", "p5_tuyet"], isScoreExact: true, score1: 21, score2: 8 },
    { id: "m24_7", date: "2026-06-24", team1: ["p4_khoa", "p8_nhu"], team2: ["p2_nam", "p5_tuyet"], isScoreExact: true, score1: 21, score2: 14 },
    { id: "m24_8", date: "2026-06-24", team1: ["p4_khoa", "p3_thu"], team2: ["p1_dung", "p8_nhu"], isScoreExact: true, score1: 18, score2: 21 },
    { id: "m24_9", date: "2026-06-24", team1: ["p4_khoa", "p6_thuyen"], team2: ["p2_nam", "p5_tuyet"], isScoreExact: true, score1: 17, score2: 21 },
    { id: "m24_10", date: "2026-06-24", team1: ["p1_dung", "p8_nhu"], team2: ["p2_nam", "p5_tuyet"], isScoreExact: true, score1: 21, score2: 19 },
    { id: "m24_11", date: "2026-06-24", team1: ["p1_dung", "p3_thu"], team2: ["p4_khoa", "p6_thuyen"], isScoreExact: true, score1: 19, score2: 21 },
    { id: "m21_1", date: "2026-06-21", team1: ["p1_dung", "p3_thu"], team2: ["p5_tuyet", "p4_khoa"], isScoreExact: true, score1: 17, score2: 21 },
    { id: "m21_2", date: "2026-06-21", team1: ["p5_tuyet", "p4_khoa"], team2: ["p6_thuyen", "p2_nam"], isScoreExact: true, score1: 16, score2: 21 },
    { id: "m21_3", date: "2026-06-21", team1: ["p4_khoa", "p6_thuyen"], team2: ["p1_dung", "p2_nam"], isScoreExact: true, score1: 21, score2: 18 },
    { id: "m21_4", date: "2026-06-21", team1: ["p1_dung", "p3_thu"], team2: ["p2_nam", "p6_thuyen"], isScoreExact: true, score1: 21, score2: 18 },
    { id: "m21_5", date: "2026-06-21", team1: ["p1_dung", "p5_tuyet"], team2: ["p2_nam", "p6_thuyen"], isScoreExact: true, score1: 19, score2: 21 },
    { id: "m21_6", date: "2026-06-21", team1: ["p1_dung", "p5_tuyet"], team2: ["p3_thu", "p4_khoa"], isScoreExact: true, score1: 15, score2: 21 },
    { id: "m21_7", date: "2026-06-21", team1: ["p4_khoa", "p3_thu"], team2: ["p1_dung", "p6_thuyen"], isScoreExact: true, score1: 16, score2: 21 }
  ],
  config: {
    minMatchesForMainBoard: 5
  }
};

// Hàm đọc dữ liệu từ file JSON
const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // Nếu file chưa tồn tại, tạo file mới với dữ liệu mặc định
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Lỗi khi đọc file dữ liệu data.json:', error);
    return defaultData;
  }
};

// Hàm ghi dữ liệu vào file JSON
const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Lỗi khi ghi file dữ liệu data.json:', error);
    return false;
  }
};

// API: Lấy toàn bộ dữ liệu bảng xếp hạng
app.get('/api/data', (req, res) => {
  const data = readData();
  res.json(data);
});

// API: Lưu/Cập nhật toàn bộ dữ liệu
app.post('/api/data', (req, res) => {
  const { players, matches, config, schedulerState } = req.body;
  
  if (!players || !matches || !config) {
    return res.status(400).json({ error: 'Dữ liệu không đúng định dạng (thiếu players, matches hoặc config)' });
  }

  const currentData = readData();
  
  const newData = {
    players,
    matches,
    config,
    // Lưu thêm trạng thái bộ xếp lịch nếu có gửi lên
    schedulerState: schedulerState !== undefined ? schedulerState : currentData.schedulerState
  };

  const success = writeData(newData);
  if (success) {
    res.json({ message: 'Lưu dữ liệu thành công', data: newData });
  } else {
    res.status(500).json({ error: 'Không thể ghi dữ liệu lên ổ đĩa của server' });
  }
});

// Phục vụ giao diện tĩnh sau khi build (Vite production bundle)
app.use(express.static(path.join(__dirname, 'dist')));

// Bất kỳ route nào không khớp với API sẽ được điều hướng về index.html (SPA routing)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` BADMIN RANK Server đang chạy!`);
  console.log(` Địa chỉ: http://localhost:${PORT}`);
  console.log(` File dữ liệu: ${DATA_FILE}`);
  console.log(`==================================================`);
});
