# BADMIN RANK

Hệ thống quản lý, xếp lịch và xếp hạng cầu lông đôi bằng Elo, xây dựng bằng React + Vite + TypeScript.

Ứng dụng tập trung vào 4 việc chính:
- Quản lý danh sách người chơi
- Ghi nhận và chỉnh sửa trận đấu
- Tự động tạo lịch thi đấu đôi công bằng
- Tính bảng xếp hạng, thống kê và biểu đồ Elo theo thời gian

## Tính năng chính

- Bảng xếp hạng động theo Elo cho cầu lông đôi
- Tính Elo dựa trên trung bình sức mạnh của từng đội
- Kết hợp kết quả thắng thua với tỉ lệ điểm số để phản ánh đúng độ chênh lệch trận đấu
- Lịch sử Elo theo thời gian với biểu đồ trực quan
- Thống kê cặp đôi có hiệu suất tốt nhất
- Thống kê tần suất thi đấu theo ngày
- Lọc dữ liệu theo tuần hoặc theo từng người chơi
- Quản lý người chơi:
  - Thêm, sửa tên
  - Chuyển giới tính Nam / Nữ
  - Bật / tắt trạng thái đang chơi
  - Cấu hình số trận tối thiểu để vào bảng xếp hạng chính
- Ghi nhận trận đấu:
  - Chọn 4 người chơi cho 1 trận đôi
  - Nhập điểm số chi tiết hoặc thắng thua
  - Sửa và xoá trận trong lịch sử
- Tự động xếp lịch:
  - Tạo lịch thi đấu theo số set mong muốn
  - Cân bằng số lần ra sân
  - Hạn chế chơi liên tiếp quá nhiều set
  - Tránh ghép 2 nữ trong cùng một đội khi có thể
  - Cho phép đổi người trực tiếp trong lịch đã tạo
- Lưu trữ và đồng bộ:
  - Dữ liệu được lưu cục bộ bằng `zustand persist`
  - Có thể đồng bộ lên Google Apps Script hoặc API `/api/data`
  - Hỗ trợ nhập / xuất dữ liệu JSON qua state của ứng dụng
- Giao diện hiện đại:
  - Dark / Light mode
  - Tối ưu cho mobile
  - Hỗ trợ cài đặt PWA nếu trình duyệt hỗ trợ

## Công nghệ sử dụng

- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- Zustand
- Recharts
- Motion
- Lucide React
- date-fns
- html2canvas

## Cấu trúc dự án

```text
Ranking_Batminton/
├── src/
│   ├── components/
│   │   ├── Analytics.tsx
│   │   ├── Dashboard.tsx
│   │   ├── MatchForm.tsx
│   │   ├── MatchHistory.tsx
│   │   ├── PlayerManagement.tsx
│   │   ├── PWAInstallPrompt.tsx
│   │   └── ui/
│   ├── data/
│   │   └── seed.ts
│   ├── utils/
│   │   ├── calculations.ts
│   │   └── dateUtils.ts
│   ├── store.ts
│   ├── types.ts
│   ├── App.tsx
│   └── index.css
├── public/
├── index.html
├── vite.config.ts
├── package.json
└── .env.example
```

## Chức năng theo màn hình

- `Dashboard`
  - Hiển thị bảng xếp hạng Elo
  - Lọc theo tuần
  - Hiển thị điều kiện tối thiểu để vào bảng chính

- `Analytics`
  - Biểu đồ Elo theo thời gian
  - Top cặp đôi hiệu quả
  - Biểu đồ tần suất trận đấu
  - Một số chỉ số nhanh như người chơi hoạt động nhiều nhất, chuỗi thắng hiện tại

- `MatchForm`
  - Thêm trận đấu mới
  - Chọn đội và nhập điểm

- `MatchHistory`
  - Xem toàn bộ lịch sử trận đấu
  - Lọc theo tuần và theo người chơi
  - Sửa, xoá từng trận

- `PlayerManagement`
  - Thêm và chỉnh sửa người chơi
  - Bật / tắt trạng thái hoạt động
  - Đổi giới tính
  - Cấu hình số trận tối thiểu để lên BXH chính

## Cài đặt

### Yêu cầu

- Node.js 18 trở lên
- npm, pnpm hoặc yarn

### Chạy local

```bash
git clone <url-repo-cua-ban>
cd Ranking_Batminton
npm install
npm run dev
```

Ứng dụng sẽ chạy tại:

```text
http://localhost:3000
```

### Build sản phẩm

```bash
npm run build
```

### Xem bản build

```bash
npm run preview
```

## Cấu hình môi trường

Tạo file `.env` từ `.env.example`.

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
VITE_GOOGLE_SCRIPT_URL=""
```

### Ý nghĩa các biến

- `GEMINI_API_KEY`
  - Dành cho các tính năng AI nếu bạn mở rộng dự án
  - Trong mã hiện tại chưa thấy phần UI nào sử dụng trực tiếp

- `APP_URL`
  - URL thực tế của ứng dụng
  - Hữu ích khi cấu hình chia sẻ hoặc PWA

- `VITE_GOOGLE_SCRIPT_URL`
  - URL Web App của Google Apps Script nếu muốn dùng Google Sheets làm nơi đồng bộ dữ liệu
  - Để trống nếu bạn muốn ứng dụng chạy local và đồng bộ qua API `/api/data`

## Lưu ý về dữ liệu

- Dữ liệu ban đầu trong `src/data/seed.ts` hiện đang để trống
- Nghĩa là khi cài mới, bạn sẽ bắt đầu từ danh sách người chơi và trận đấu rỗng
- Dữ liệu được lưu cục bộ trong trình duyệt qua `zustand persist`
- Nếu có backend đồng bộ, ứng dụng sẽ nạp dữ liệu từ server khi khởi động

## Quy ước tính điểm

Ứng dụng dùng Elo để đánh giá sức mạnh người chơi. Có thể hiểu đơn giản như sau:

- Mỗi người chơi bắt đầu ở cùng một mức điểm
- Sau mỗi trận, người thắng sẽ được cộng điểm và người thua sẽ bị trừ điểm
- Nếu thắng một đối thủ mạnh hơn, điểm cộng sẽ nhiều hơn
- Nếu thắng một đối thủ yếu hơn, điểm cộng sẽ ít hơn
- Nếu thua sát nút, điểm trừ sẽ ít hơn thua đậm

Với cầu lông đôi, hệ thống không chấm riêng từng người trong một trận mà tính theo cả đội:

- Điểm của một đội được lấy từ trung bình điểm của 2 thành viên
- Sau đó ứng dụng so sánh hai đội để quyết định mức cộng / trừ điểm

Nếu bạn nhập **điểm số chi tiết**, hệ thống sẽ tính chính xác hơn:

- Thắng 21-19 sẽ được cộng ít hơn
- Thắng 21-5 sẽ được cộng nhiều hơn

Nếu bạn chỉ nhập **thắng / thua**, ứng dụng vẫn có thể tự ước lượng để cập nhật Elo.

Tóm lại:

- Thắng bất ngờ: cộng nhiều
- Thắng dễ đoán: cộng ít
- Thua sát nút: trừ ít
- Thua đậm: trừ nhiều

Hệ số thay đổi hiện tại là `K = 40`, giúp bảng xếp hạng phản ánh khá nhanh phong độ gần đây.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## License

Dự án phát hành theo giấy phép **Apache-2.0**.
