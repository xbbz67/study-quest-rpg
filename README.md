## Tài khoản và đồng bộ cloud

Bản triển khai dùng Supabase Auth (email/mật khẩu) và bảng `study_progress` để giữ tiến độ trên nhiều máy. Chọn **Đăng nhập** trên website; tài khoản mới sẽ được hỏi trước khi chuyển tiến độ local lên cloud. Tài khoản đã có dữ liệu sẽ tải bản cloud. Tiến độ khách và từng tài khoản được lưu riêng trên máy.

- Frontend: `assets/cloud-save.js`; cấu hình công khai: `assets/cloud-config.js`.
- Schema và quyền truy cập: `supabase/migrations/20261117160000_cloud_progress.sql`. Bật RLS; chỉ chủ tài khoản đọc tiến độ. Hàm lưu kiểm tra danh tính và phiên bản để tránh hai máy ghi đè nhau.
- Khi mất mạng, thay đổi được giữ trong cache riêng của tài khoản và thử đồng bộ lại. Nếu có xung đột, có thể xuất bản trên máy rồi tải bản cloud; bản local trước khi thay thế vẫn được giữ dự phòng.
- Chỉ khóa anon/publishable được đưa vào frontend. Không đưa access token, mật khẩu database hoặc khóa service role lên GitHub.
- Supabase bật xác nhận email. SMTP mặc định chỉ gửi cho email thành viên tổ chức và có giới hạn gửi. Muốn mở đăng ký cho mọi email, cấu hình SMTP riêng tại Supabase Dashboard → Authentication → Email. Không tắt xác nhận email để bỏ qua giới hạn này.
- Site URL / redirect URL: `https://study-quest-rpg-beige.vercel.app/`.
- SDK vendored: `@supabase/supabase-js` 2.119.0; giấy phép đi kèm `assets/supabase.LICENSE.txt`.

# ⚔️ STUDY RPG - HỆ THỐNG CÀY CẤP & LEO RANK HỌC TẬP

> **Biến từng phút học tập thành kinh nghiệm (EXP), vàng và điểm danh vọng để thăng hạng từ Đồng Đoàn lên Global Elite!**

---

## 🌟 TÍNH NĂNG NỔI BẬT ("SIÊU VIBE")

### 1. ⚡ Hệ Thống EXP & Level (Cày Cấp)
- **Tích lũy thời gian thực**: Mỗi phút tập trung học tập sẽ tự động tích lũy **+10 EXP** và **+2 Vàng**.
- **Bộ đếm Pomodoro chuyên nghiệp**:
  - 🍅 **Pomodoro chuẩn** (25 phút học / 5 phút nghỉ): Thưởng nóng thêm **+50 EXP & +20 Vàng**.
  - 🧠 **Deep Work** (50 phút học / 10 phút nghỉ): Thưởng lớn **+120 EXP & +50 Vàng**.
  - ⚡ **Tùy chỉnh linh hoạt** (15 phút, 30 phút, 60 phút...).
  - 🛑 **Stopwatch (Bấm giờ tự do)**: Học bao nhiêu phút tính bấy nhiêu EXP.
- **Công thức thăng cấp mượt mà**:
  $$\text{EXP Cần} = \lfloor 100 \times \text{Level}^{1.25} \rfloor$$
- **Level Up Fanfare**: Hiệu ứng pháo hoa Confetti, nhạc kèn chiến thắng (Web Audio API) và thưởng vàng tương ứng với cấp độ (`Level * 25`).

---

### 2. 🏆 Hệ Thống Rank Danh Vọng (Tier Milestones)
Leo rank từng ngày để mở khóa khung avatar và danh hiệu phát sáng neon:

| Bậc Rank | Cấp độ yêu cầu | Danh hiệu Tiếng Việt | Hiệu ứng khung & Icon |
| :--- | :--- | :--- | :--- |
| **Bronze** | Level 1 - 4 | Đồng Đoàn | 🥉 Khung Đồng mộc mạc |
| **Silver** | Level 5 - 9 | Bạc Tinh Anh | 🥈 Khung Ánh Bạc sáng lấp lánh |
| **Gold** | Level 10 - 19 | Vàng Chiến Tướng | 🥇 Khung Kim Vàng tỏa sáng |
| **Platinum** | Level 20 - 29 | Bạch Kim Siêu Đẳng | 💠 Khung Xanh Cyan công nghệ |
| **Diamond** | Level 30 - 39 | Kim Cương Tối Thượng | 💎 Khung Lam Ngọc huyền bí |
| **Master** | Level 40 - 49 | Cao Thủ Học Thuật | 🔮 Khung Ma Thuật Tím vương giả |
| **Grandmaster** | Level 50 - 69 | Đại Cao Thủ | 👑 Khung Hồng Ngọc rực lửa |
| **Global Elite** | Level 70+ | Thần Thoại Thách Đấu | ⚡ Khung Hào Quang Cầu Vồng tối thượng |

---

### 3. 📜 Nhiệm Vụ Hàng Ngày (Daily Quests)
- **Mục tiêu học tập cụ thể**:
  - 📐 Giải bài tập Toán Hình & Giải Tích (+160 EXP)
  - 🧬 Học & Ôn 30 từ vựng Sinh học 12 (+160 EXP)
  - 🍅 Hoàn thành 2 phiên Pomodoro (+150 EXP)
  - 👑 Boss Quest: Đọc xong 1 chương sách chuyên ngành (+500 EXP, +150 Vàng)
- **Thêm nhiệm vụ tùy chỉnh**: Tự tạo nhiệm vụ học tập theo ý thích với 4 cấp độ: *Dễ, Vừa, Khó, Boss*.
- **Cơ chế nhận thưởng**:
  - Âm thanh Ding mừng rỡ.
  - Số EXP & Vàng bay bổng trên màn hình.
  - Tự động cộng dồn và lưu vào lịch sử.

---

### 4. 🛒 Cửa Hàng RPG (RPG Shop) & Cường Hóa
- **Cuộn Giấy X2 EXP (30 Phút)**: Nhân đôi toàn bộ EXP nhận được khi học và hoàn thành nhiệm vụ.
- **Thú Cưng Hộ Mệnh**:
  - 🦉 **Cú Mèo Thức Khuya**: Tăng vĩnh viễn +10% EXP.
  - ☕ **Ly Cà Phê Bất Tử**: Tăng +5 Vàng mỗi phiên Pomodoro.
- **Danh Hiệu Bá Đạo**: *"Chiến Binh Đêm Khuya"*, *"Kẻ Hủy Diệt Đề Thi"*, *"Đại Pháp Sư GPA 4.0"*, *"Chúa Tể Không Trì Hoãn"*.
- **Khung Avatar Ma Thuật**: Khung phát sáng tùy chỉnh theo sở thích.

---

### 5. 💾 Lưu Trữ Tự Động (Auto-Save LocalStorage)
- Mọi thông số (Level, EXP, Vàng, Nhiệm vụ, Chuỗi ngày Streak, Lịch sử) được đồng bộ **ngay lập tức** vào `LocalStorage`.
- **F5, đóng trình duyệt hoặc tắt máy thoải mái mà không bị mất tiến độ**.
- Hỗ trợ **Sao lưu JSON (Export)** và **Khôi phục dữ liệu (Import)** sang máy khác.

---

## 🚀 CÁCH KHỞI ĐỘNG VÀ SỬ DỤNG

1. Mở file [index.html](file:///C:/Users/trong/.gemini/antigravity/scratch/study-quest-rpg/index.html) bằng bất kỳ trình duyệt nào (Edge, Chrome, Brave, Firefox, Safari).
2. Hoặc nhấp đúp vào [run.bat](file:///C:/Users/trong/.gemini/antigravity/scratch/study-quest-rpg/run.bat).
3. Đặt mục tiêu hôm nay trong tab **📜 Nhiệm Vụ Hàng Ngày**.
4. Chọn chế độ Pomodoro trong tab **⏱️ Cày Cấp** và bắt đầu cày cuốc!
