## Nhân vật 3D và cửa Theater

Theater dựng nhân vật 3D bằng Three.js 0.180.0 (thư viện và giấy phép MIT trong `assets/three/`). Khi chọn ghế, ghế được giữ trên cloud trước rồi nhân vật bước từ IN, qua lối giữa, tới chỗ ngồi. Cửa IN tự chọn ghế trống. Cửa EXIT giải phóng ghế, chờ nhân vật đứng dậy đi ra rồi trở về timer; nút Rời ghế vẫn cho phép ở lại xem phòng. Chuyển tab khác sẽ dọn mô hình và giải phóng ghế ngay.

Người đã ngồi trong phòng khi bạn mở Theater được hiển thị ở ghế sẵn. Người vừa vào/rời được hoạt họa theo lần cập nhật ghế; danh sách ghế hiện cập nhật mỗi 10 giây, không phải chuyển động đồng bộ từng khung hình. Thiết bị không hỗ trợ WebGL2 giữ hình người 2D. Chế độ giảm chuyển động của hệ điều hành bỏ hoạt họa di chuyển. Bộ dựng dừng khi nhân vật ngồi yên và được giải phóng khi đóng Theater.

## Theater

Tab Theater có phòng chung 48 ghế, 6 dãy A–F, và màn hình riêng nhận link HTTPS YouTube video/playlist hoặc Spotify track/playlist/album/episode/show/artist. Dùng player nhúng chính thức; người dùng bấm Play. Nội dung phát riêng mỗi máy, chưa đồng bộ phát cho cả phòng. Một số video bị chủ nội dung chặn nhúng; dùng liên kết Mở bản gốc nếu cần. Spotify có thể yêu cầu đăng nhập hoặc chỉ cho nghe thử tùy nội dung/tài khoản.

Người đã đăng nhập chọn ghế, thấy tên hồ sơ và ghế của thành viên khác; không chia sẻ email. Danh sách cập nhật mỗi 10 giây. RPC chỉ đổi/rời ghế của tài khoản hiện tại và chống chọn trùng bằng ràng buộc unique. Giữ ghế được gia hạn khi ở phòng; ghế mất kết nối hết hạn sau 120 giây. Rời tab hoặc đăng xuất sẽ giải phóng ghế. Timer trong Theater dùng cùng phiên Focus, EXP, nhiệm vụ và streak hiện tại; nhạc Lofi nổi bị ẩn khi vào phòng.

Schema: `supabase/migrations/20261118010000_theater.sql`. Frontend: `assets/theater.js`.

## Thời lượng timer

Giữ nguyên Pomodoro 25 phút và Deep Work 50 phút. Các phiên tùy chỉnh có nút chọn nhanh 5, 10, 15, 30, 45, 60, 90, 120 phút; có thể nhập số phút nguyên từ 1 tới 180. Mỗi phiên tùy chỉnh nghỉ 5 phút, thưởng hoàn thành cơ bản 2 EXP và 0,8 vàng cho mỗi phút đã chọn, ngoài thưởng tập trung từng phút. Mốc nhiệm vụ từ 15 phút và streak từ 30 phút giữ nguyên. Đổi chế độ khi đang chạy hoặc tạm dừng cần xác nhận bắt đầu lại; dữ liệu nhập không hợp lệ không thay đổi phiên đang chạy.

## Cây chuyên cần từ streak

Streak được minh họa thành cây: 0 ngày Hạt giống, 1 ngày Nảy mầm, 3 ngày Vươn thân, 7 ngày Phân cành, 14 ngày Xanh tán, 30 ngày Kết trái. Thanh tiến độ thể hiện số ngày từ mốc hiện tại tới mốc kế tiếp, không dùng EXP để lớn cây. Sau 30 ngày, cây giữ giai đoạn kết trái và bộ đếm vẫn tiếp tục tăng.

Cây được suy ra trực tiếp từ streak đã lưu, không có bộ đếm tăng trưởng riêng. Ngày dùng đóng băng giữ nguyên cây; chỉ ngày học được tích streak mới giúp cây phát triển. Khi chuỗi gãy, cây về hạt giống. Tiến độ sẵn có tự áp dụng cho hình minh họa khi đăng nhập trên máy khác.

## Shop và bảo vệ streak

Shop có 22 vật phẩm, chia nhóm bảo vệ chuỗi, bùa hỗ trợ, bạn đồng hành, danh hiệu và khung avatar. Vật phẩm vĩnh viễn mua một lần, được trang bị/tháo miễn phí; chỉ dùng một bùa và một bạn đồng hành mỗi lần.

- Đóng băng streak: 120 vàng/viên, tối đa 3 viên. Tự bảo vệ các ngày đã kết thúc mà không học; phải mua trước khi chuỗi bị gãy. Không tiêu viên cho hôm nay khi ngày chưa kết thúc và không cộng ngày streak cho ngày đóng băng.
- Nếu cả khoảng nghỉ dài hơn số viên sẵn có, streak về 0 nhưng không tiêu các viên đó. Hoàn thành một phiên đếm ngược từ 30 phút để kiếm một ngày streak, tối đa một lần/ngày. Ngày tính theo giờ trên máy, nhất quán với nhiệm vụ hàng ngày.
- Kho đóng băng và ngày đã bảo vệ nằm trong dữ liệu tiến độ của tài khoản, đồng bộ cloud cùng vàng và trang bị. Kiểm tra khi tải/mở trang, qua ngày mới và trước khi mua/nhận streak.
- Bùa EXP có các mốc 15/30/60 phút; bùa vàng nhân đôi phần thưởng từ timer và nhiệm vụ, không nhân vàng lên cấp. Thú mới gồm cáo (+1 vàng/phút), mèo (+5% EXP, +2 vàng/phiên) và rồng (+15% EXP).
- Nhiệm vụ tự tạo chỉ nhận phần thưởng một lần; có thể bỏ dấu hoàn thành nhưng không nhận lại thưởng khi tích lại.

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


## Theater: phòng học và màn hình chung

- Khách được cấp phiên Supabase ẩn danh riêng, lưu trong trình duyệt; không cần tạo tài khoản để chọn ghế. Tiến độ học cloud vẫn dùng tài khoản chính.
- 48 ghế dùng chung trên mọi thiết bị, cập nhật trực tiếp qua Supabase Realtime, có polling dự phòng; ghế hết hạn sau 2 phút mất kết nối. Chuyển ghế đi qua hành lang hàng ghế và lối giữa.
- Link đầu tiên phát chung, các link sau xếp FIFO. Mỗi người có tối đa 3 link đang chờ. Người thêm nội dung đang phát được chuyển link; hết video đơn/bài đơn thì server chuyển tiếp khi biết thời lượng.
- Người vào sau nhận vị trí phát theo đồng hồ server; chủ nội dung gửi mốc phát mỗi 1,5 giây. YouTube playlist đồng bộ cả chỉ số video. Nhấn “Vào xem trực tiếp” nếu trình duyệt chặn tự phát hoặc sau khi tạm dừng trên máy.
- Spotify dùng player chính thức, chia sẻ nội dung hiện tại và mốc phát; khả năng tua nhạc, phát toàn bài và đăng nhập phụ thuộc Spotify. API chỉ bảo đảm thao tác seek cho podcast, vì vậy không bảo đảm nhạc Spotify khớp từng giây. Playlist/album Spotify chuyển hàng chờ bằng nút của người thêm link. YouTube live phát theo nguồn trực tiếp.
- Dùng HTTP/HTTPS để tải module 3D. Backend cần bật Anonymous Sign-ins và áp dụng migrations trong `supabase/migrations/`. RLS chặn ghi trực tiếp vào ghế/hàng chờ, mọi thay đổi qua RPC kiểm tra danh tính và khóa giao dịch. Khóa service role không được đưa vào frontend.

Realtime Theater: áp dụng `20261120020000_theater_realtime.sql` và `20261120030000_theater_chat_controls.sql`. Ghế, chat và điều khiển nhận thay đổi qua WebSocket; mốc phát mới được áp dụng trực tiếp từ payload database để giảm một lượt lấy snapshot. Có snapshot dự phòng và tải lại sau khi nối mạng lại.

### Chat và điều khiển chung

- Người thêm link đang phát có nút phát / tạm dừng cả phòng. Nút pause trực tiếp trong iframe của người đó cũng được đồng bộ; buffering không được coi là thao tác pause. Người khác có thể tạm dừng riêng máy mình.
- Pause lưu con trỏ cố định, ngừng tính thời gian chờ; người vào sau vẫn thấy phòng đang dừng. Revision kiểm tra cả điều khiển và heartbeat để bỏ qua gói cũ đến muộn.
- YouTube livestream không bị ép seek theo đồng hồ phòng. Với video thường, chỉ sửa lệch lớn hơn 3 giây qua hai mốc liên tiếp, cách ít nhất 12 giây giữa các lần tua; lệch nhỏ được giữ để tránh giật. Spotify chỉ seek podcast khi vào xem hoặc có thao tác chung. Video vẫn do YouTube/Spotify phân phối; đây là phần đồng bộ tự viết, không phải dịch vụ truyền video riêng hay cam kết 0 ms.
- Chat dùng được với tài khoản và phiên khách. RLS cho đọc tin trong 7 ngày; UI hiển thị 80 tin gần nhất. Gửi qua RPC, tối đa 500 ký tự, cách ít nhất 1,2 giây mỗi người. Tên và nội dung được render bằng textContent. Tin cũ được dọn khi có tin mới.
- Kiểm tra database chạy trong giao dịch rollback; kiểm tra giao diện dùng ba phiên trình duyệt trong phòng giả lập riêng, không gửi tin thử vào phòng thật.

### Quyền timeline theo video

Người gửi video đang phát là host: YouTube hiện thanh thời gian và phím tua cho host. Người xem dùng `controls=0`, `disablekb=1`; các nút điều khiển chung ở sidebar cũng được ẩn. Chủ quyền tự đổi theo người gửi video tiếp theo và player được tạo lại khi danh tính đổi. Tua được gửi bằng RPC `theater_control` với action `seek`, kiểm tra owner và revision trên server. Tua khi đang pause giữ nguyên pause và cập nhật vị trí cho người vào sau. Migration: `20261120040000_theater_host_seek.sql`.

### Streak theo thời gian tập trung trong ngày

Tích lũy đủ 30 phút tập trung trong cùng ngày để nhận tối đa một ngày streak. Tất cả chế độ timer, kể cả Stopwatch và nhiều phiên ngắn, cùng đóng góp. Giờ nghỉ và thời gian pause không tính. Sau khi mất chuỗi, đủ 30 phút bắt đầu lại từ 1 ngày; vật phẩm đóng băng vẫn theo quy tắc cũ. Khi tải local hoặc áp dụng cloud save, hệ thống kiểm tra lại thời gian đã ghi cho hôm nay để khôi phục ngày chưa được cộng, không cộng trùng hay dùng thời gian của hôm qua.

Kiểm thử: `node assets/tests/streak-restart.cjs`.

### Đồng hồ tròn và trang trí

Timer chính, Zen và Theater dùng mặt đồng hồ tròn SVG. Đếm ngược hiển thị phần thời gian còn lại; Stopwatch hiển thị tiến độ hướng tới mốc 30 phút. Có bốn trang trí miễn phí: Quỹ đạo, Khu vườn, Ánh trăng, Tối giản. Chọn ở Góc tập trung hoặc ô Trang trí đồng hồ trong Theater. Lựa chọn lưu trong `settings.timerDecoration`, dùng chung cơ chế lưu local/cloud; đổi trang trí không dừng hay reset phiên học. Zen ẩn bảng chọn để gọn giao diện; hỗ trợ reduced motion. Khung nhạc mở rộng nằm dưới timer ở chế độ thường để không che bảng chọn trang trí, vẫn giữ bố cục riêng của Zen.

### Đăng nhập hoặc tài khoản khách có tên riêng

Khi chưa đăng nhập, website yêu cầu chọn đăng nhập hoặc tiếp tục bằng khách. Khách xác nhận tên 2–24 ký tự trước khi vào; không nhận tên mặc định “Chiến Thần VNU”. Tên được chuẩn hóa Unicode NFKC, khoảng trắng và hoa/thường, được giữ duy nhất bằng constraint trong database. Tên gắn với Supabase user ID, không tin nickname gửi từ trình duyệt. Cùng một tên dùng cho hồ sơ, ghế và chat; đổi tên có kiểm tra trùng và cập nhật ghế đang ngồi.

Khách quay lại được nhận diện qua phiên riêng trên trình duyệt; tiến độ khách vẫn lưu local, tài khoản đăng nhập dùng cloud như trước. Khi tài khoản đăng nhập lần đầu vào Theater, tên hồ sơ hợp lệ được đăng ký hoặc yêu cầu chọn lại nếu trùng/mặc định. Tên khách không hoạt động 30 ngày có thể được dùng lại; tên tài khoản được giữ.

Áp dụng migration `20261122010000_guest_names.sql` trước khi triển khai frontend. Các RPC phòng hiện kiểm tra danh tính đã đặt tên; bản RPC cũ được đổi tên và thu hồi quyền gọi trực tiếp. Nhả ghế vẫn được phép khi chưa có tên, để khách cũ có thể rời phòng.
