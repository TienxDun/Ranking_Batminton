# 🏸 BADMIN RANK — Hệ thống Quản lý & Xếp hạng Cầu lông Đôi

Một ứng dụng web Single Page Application (SPA) hiện đại, tinh tế được thiết kế chuyên biệt để quản lý các buổi giao lưu cầu lông, tự động hóa việc xếp lịch thi đấu đôi một cách công bằng và xếp hạng trình độ người chơi theo hệ số Elo cải tiến.

---

## 🚀 Tính Năng Nổi Bật

### 1. 🏆 Bảng Xếp Hạng Elo Động (Dynamic Leaderboard)
*   **Hệ số Elo cải tiến dành cho đấu đôi**: Tính toán trình độ người chơi dựa trên trung bình Elo của mỗi đội.
*   **Hòa trộn tỷ số (Score-Blended Elo)**: Thay vì chỉ tính Thắng/Thua đơn thuần, hệ thống tích hợp tỷ lệ điểm số (ví dụ: thắng 21-19 sẽ tăng ít Elo hơn thắng hủy diệt 21-5) để phản ánh chính xác phong độ thực tế.
*   **Lọc bảng xếp hạng**: Cấu hình số trận tối thiểu để được hiển thị trên bảng xếp hạng chính, giúp loại bỏ các kết quả nhiễu từ người chơi ít tham gia.

### 2. 📅 Bộ Xếp Lịch Trận Đấu Công Bằng (Fair Match Scheduler)
*   **Tối ưu hóa số set đấu**: Tự động tính toán số set thi đấu lý tưởng (`Perfect Sets`) dựa trên số lượng người chơi tham gia để đảm bảo phân bổ đều đặn.
*   **Giải thuật phạt điểm tối ưu (Penalty-based Scheduling)**:
    *   **Tránh kiệt sức**: Hạn chế tối đa việc một người phải thi đấu quá 2 set liên tiếp.
    *   **Cân bằng giới tính**: Tránh xếp 2 người chơi nữ chung một đội (nếu có đủ số lượng nam) để các trận đấu đôi nam nữ diễn ra cân bằng và hấp dẫn nhất.
    *   **Cân bằng số set**: Giảm thiểu độ lệch số lần ra sân giữa tất cả người chơi.
*   **Điều chỉnh lịch đấu thủ công**: Cho phép thay đổi người chơi trực tiếp trên từng set đã tạo và tự động hoán đổi bù ở các set khác để duy trì sự cân bằng về số lần chơi.

### 3. 📝 Ghi Nhận Trận Đấu & Quản Lý Người Chơi
*   Thêm mới, sửa đổi thông tin người chơi, phân loại giới tính (`Nam` / `Nữ`) và quản lý trạng thái hoạt động (`Active` / `Inactive`).
*   Ghi nhận điểm số chính xác hoặc tượng trưng (thắng/thua nhanh).
*   Lịch sử trận đấu trực quan, hỗ trợ tìm kiếm, cập nhật hoặc xóa trận đấu lỗi.

### 4. 💾 Bảo Mật & Sao Lưu Dữ Liệu
*   **Lưu trữ tự động (Zustand Persist)**: Toàn bộ dữ liệu thành viên, trận đấu và lịch đấu được lưu trực tiếp tại trình duyệt (Local Storage), không lo mất dữ liệu khi F5 hoặc tắt trình duyệt.
*   **Sao lưu JSON**: Hỗ trợ Xuất dữ liệu (Export) ra file JSON và Nhập dữ liệu (Import) từ file sao lưu cực kỳ nhanh chóng.

---

## 🧮 Giải Thuật Lõi (Core Algorithms)

### 1. Giải thuật tính điểm Elo đấu đôi (Double Match Elo)
Với một trận đấu đôi giữa **Đội 1** (Người chơi A & B) và **Đội 2** (Người chơi C & D):

1.  **Tính Elo trung bình của mỗi đội**:
    $$\text{AvgRating}_{\text{Team1}} = \frac{R_A + R_B}{2}$$
    $$\text{AvgRating}_{\text{Team2}} = \frac{R_C + R_D}{2}$$

2.  **Tính xác suất thắng kỳ vọng (Expected Outcome)** cho Đội 1 theo hàm Logistic:
    $$E_1 = \frac{1}{1 + 10^{\frac{\text{AvgRating}_{\text{Team2}} - \text{AvgRating}_{\text{Team1}}}{400}}}$$
    $$E_2 = 1 - E_1$$

3.  **Xác định kết quả thực tế ($S_1$) có hòa trộn tỷ số**:
    *   Nếu tỷ số là chính xác ($score_1$ và $score_2$):
        $$\text{winPart} = \begin{cases} 1.0 & \text{nếu Team 1 thắng} \\ 0.0 & \text{nếu Team 2 thắng} \end{cases}$$
        $$\text{ratioPart} = \frac{score_1}{score_1 + score_2}$$
        $$S_1 = 0.6 \times \text{winPart} + 0.4 \times \text{ratioPart}$$
        *(Tỷ trọng 60% cho kết quả Thắng/Thua và 40% cho tỷ lệ điểm số đạt được, giúp các trận đấu kịch tính sát nút có mức biến động Elo nhẹ nhàng hơn).*
    *   Nếu tỷ số là tượng trưng: Hệ thống giả lập tỷ số 21-15 phổ biến để quy đổi $S_1 \approx 0.833$ cho đội thắng.

4.  **Cập nhật Elo**: Với hệ số thay đổi cơ bản $K = 40$:
    $$\Delta R = K \times (S_1 - E_1)$$
    *   Thành viên Đội 1: $R_{\text{mới}} = R_{\text{cũ}} + \Delta R$
    *   Thành viên Đội 2: $R_{\text{mới}} = R_{\text{cũ}} - \Delta R$

---

### 2. Thuật toán phân lịch thi đấu đôi (Match Scheduler)
Để sắp xếp $N$ set đấu cho $M$ người chơi hôm nay, hệ thống duyệt qua từng set đấu từ $1 \dots N$:
1.  Sinh toàn bộ tổ hợp chập 4 người chơi từ danh sách tham gia.
2.  Với mỗi tổ hợp 4 người, sinh ra 3 cách chia cặp đấu có thể (Ví dụ: $[1,2]$ vs $[3,4]$; $[1,3]$ vs $[2,4]$; $[1,4]$ vs $[2,3]$).
3.  Tính toán **Điểm Phạt (Penalty Score)** cho từng phương án:
    *   **Phạt Đội 2 Nữ**: $+100,000$ điểm nếu có bất kỳ đội nào gồm 2 thành viên nữ (ưu tiên các cặp nam-nữ hoặc nam-nam để công bằng về thể lực).
    *   **Phạt chơi liên tục**: $+5,000$ điểm cho mỗi người chơi phải ra sân ở cả 3 set liên tiếp (giúp người chơi có thời gian nghỉ ngơi).
    *   **Phạt lệch số set**: $+100 \times \text{Tổng số set đã chơi của 4 người}$ (ưu tiên những người đang chơi ít set hơn được vào sân).
    *   **Độ nhiễu ngẫu nhiên**: Cộng ngẫu nhiên từ $0 \dots 5$ điểm để đa dạng hóa lịch đấu khi các chỉ số trên bằng nhau.
4.  Lựa chọn phương án chia cặp có **Điểm Phạt thấp nhất** cho set đấu đó.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

*   **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) (Build tool cực nhanh)
*   **Ngôn ngữ**: [TypeScript](https://www.typescriptlang.org/) (Đảm bảo an toàn kiểu dữ liệu)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Hệ thống CSS-first utility hiện đại nhất)
*   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) + Middleware Persist (Nhẹ nhàng, lưu trữ local dễ dàng)
*   **Animations**: [Motion](https://motion.dev/) (Tên mới của Framer Motion, mang lại các hiệu ứng micro-animations mượt mà)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Xuất ảnh**: [html2canvas](https://html2canvas.hertzen.com/) (Hỗ trợ chụp ảnh bảng xếp hạng hoặc lịch thi đấu để chia sẻ lên nhóm chat)

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu cầu hệ thống
*   [Node.js](https://nodejs.org/) phiên bản 18.x trở lên
*   Trình quản lý gói `npm` hoặc `yarn` / `pnpm`

### Các bước khởi chạy nhanh (< 3 phút)

1.  **Tải mã nguồn và truy cập thư mục dự án**:
    ```bash
    git clone <url-clone-cua-ban>
    cd Ranking_Batminton
    ```

2.  **Cài đặt các gói thư viện phụ thuộc**:
    ```bash
    npm install
    ```

3.  **Tạo file cấu hình môi trường**:
    Sao chép file cấu hình mẫu `.env.example` thành `.env`:
    ```bash
    cp .env.example .env
    ```
    *(Mặc định dự án có thể chạy trực tiếp local mà không cần thay đổi giá trị trong `.env`)*.

4.  **Khởi chạy máy chủ phát triển (Development Server)**:
    ```bash
    npm run dev
    ```
    Sau đó, mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

5.  **Biên dịch sản phẩm (Production Build)**:
    Để tạo bản dựng tối ưu hóa cho môi trường production:
    ```bash
    npm run build
    ```
    Mã nguồn đã biên dịch sẽ nằm trong thư mục `dist/`.

---

## 📂 Cấu Trúc Mã Nguồn (Project Structure)

```text
Ranking_Batminton/
├── .agents/               # Cấu hình AI Copilot (AG Kit)
├── src/
│   ├── components/        # Các thành phần giao diện chính
│   │   ├── ui/            # UI components cơ bản (Button, Card...)
│   │   ├── Dashboard.tsx  # Bảng xếp hạng & Thống kê Elo
│   │   ├── MatchForm.tsx  # Form ghi nhận điểm số trận đấu
│   │   ├── MatchHistory.tsx # Lịch sử & Chỉnh sửa trận đấu
│   │   ├── MatchScheduler.tsx # Xếp lịch tự động & Phân bổ set
│   │   └── PlayerManagement.tsx # Quản lý thành viên & cấu hình sao lưu
│   ├── data/
│   │   └── seed.ts        # Dữ liệu mẫu khởi tạo (Players & Matches)
│   ├── lib/
│   │   └── utils.ts       # Tiện ích bổ trợ (clsx, tailwind-merge)
│   ├── utils/
│   │   └── calculations.ts # Logic tính toán Elo & Thứ hạng
│   ├── App.tsx            # Điểm khởi đầu giao diện (Layout & Tabs)
│   ├── store.ts           # Kho lưu trữ Zustand (Global State)
│   ├── types.ts           # Định nghĩa kiểu dữ liệu TypeScript
│   └── index.css          # Cấu hình CSS, Mesh Gradients & Glassmorphism
├── index.html             # Entry HTML
├── vite.config.ts         # Cấu hình Vite
└── package.json           # Danh sách thư viện & scripts
```

---

## ⚖️ Giấy Phép (License)
Dự án được phân phối dưới giấy phép **Apache-2.0 License**. Xem chi tiết tại mã nguồn.
