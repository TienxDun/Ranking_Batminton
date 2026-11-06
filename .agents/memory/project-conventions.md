---
type: project
created: 2026-05-25
updated: 2026-11-06
---

# Project Conventions

## Git Workflow
- **CRITICAL:** Tuyệt đối KHÔNG ĐƯỢC đụng tới Git (không commit, không push, không branch, không chạy lệnh git nào tới repo). Mọi thao tác quản lý git để người dùng tự thực hiện.

## UI / UX & Theme Guidelines
- **CRITICAL - ĐỘ TƯƠNG PHẢN LIGHT/DARK MODE (Tránh lỗi phản sáng / lóa mắt):**
  - Mọi component PHẢI hỗ trợ đầy đủ cả `isLight` (Light Mode) và Dark Mode.
  - Tuyệt đối KHÔNG hardcode các class chữ sáng màu (`text-amber-200`, `text-teal-200`, `text-slate-300`, `text-white`) trên các banner/card ở Light Mode.
  - Trong Light Mode:
    - Text cảnh báo amber: dùng `text-amber-900` hoặc `text-amber-800` trên nền `bg-amber-50 border-amber-300`.
    - Text thông báo teal/green: dùng `text-teal-900` / `text-emerald-900` trên `bg-teal-50` / `bg-emerald-50`.
    - Tiêu đề & nội dung card: dùng `text-slate-900` và `text-slate-600` trên nền `bg-white` / `bg-slate-50`.
  - Luôn đảm bảo độ tương phản (WCAG Contrast Ratio) dễ đọc, sắc nét trên mọi nền.
  - **Nút bấm nền màu nổi (Teal / Emerald / Rose / Gradient):**
    - File `src/index.css` có quy tắc `.light .text-white { color: #0f172a !important; }` để đảo màu chữ thường trong Light Mode. Do đó, nếu dùng `text-white` thuần trên nút có nền màu đậm/gradient thì ở Light Mode chữ sẽ bị biến thành màu đen gây phản sáng/khó nhìn.
    - **Bắt buộc dùng `text-white-force`** (và cho icon bên trong) trên các button chính (`bg-teal-600`, `bg-teal-500`, gradient) để chữ luôn luôn giữ màu trắng sáng tinh (`#ffffff !important`).

- **CRITICAL - MODAL / DIALOG / TOAST XÁC NHẬN BẮT BUỘC DÙNG `createPortal` (Tránh lệch vị trí / dính đáy màn hình):**
  - Mọi Popup, Modal, Toast thông báo và Hộp thoại xác nhận (Confirm Dialog) **BẮT BUỘC phải bọc trong `createPortal(..., document.body)`**.
  - **Lý do kỹ thuật:** Thẻ cha `.tab-content-active` có CSS animation `tabFadeIn` với thuộc tính `transform: translateY(...)`. Theo chuẩn CSS, bất kỳ phần tử nào có `transform` sẽ trở thành containing block cho `position: fixed`. Nếu không dùng `createPortal`, các modal `fixed inset-0` sẽ bị khóa bên trong container của tab thay vì toàn bộ màn hình (viewport), khiến hộp thoại bị đẩy tuột xuống sát đáy màn hình và bị thanh điều hướng (Bottom Nav) che một phần.
  - Sử dụng `createPortal` với `z-[100]` đảm bảo hộp thoại luôn luôn **nằm chính giữa màn hình (dead-center)**, phủ trọn toàn bộ viewport và che mờ cả thanh menu điều hướng.
  - **Khóa cuộn trang web (Body Scroll Lock):** Khi Modal/Dialog hiển thị, bắt buộc khóa cuộn trang bên dưới (`document.body.style.overflow = 'hidden'`, `document.body.style.touchAction = 'none'`), đồng thời thiết lập `overscroll-contain touch-none` trên backdrop và `overscroll-contain touch-pan-y` trên vùng cuộn để cô lập hoàn toàn thao tác, không gây cuộn nền trang web.
