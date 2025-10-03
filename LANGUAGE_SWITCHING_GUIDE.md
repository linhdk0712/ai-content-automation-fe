# Hướng dẫn sử dụng tính năng chuyển đổi ngôn ngữ

## Tổng quan
Hệ thống đã được tích hợp tính năng chuyển đổi ngôn ngữ giữa tiếng Anh và tiếng Việt, giúp đồng nhất ngôn ngữ hiển thị cho toàn bộ ứng dụng.

## Cách sử dụng

### 1. Chuyển đổi ngôn ngữ
- Tìm biểu tượng chuyển đổi ngôn ngữ trên thanh navigation (navbar)
- Click vào dropdown để xem các ngôn ngữ có sẵn
- Chọn ngôn ngữ mong muốn (🇺🇸 English hoặc 🇻🇳 Tiếng Việt)

### 2. Vị trí của Language Switcher
Language Switcher được đặt ở navbar, giữa:
- Nút chuyển đổi theme (sáng/tối)
- Biểu tượng thông báo

### 3. Tính năng chính

#### Tự động lưu lựa chọn
- Ngôn ngữ được chọn sẽ được lưu tự động
- Khi refresh trang hoặc đăng nhập lại, ngôn ngữ sẽ được giữ nguyên

#### Phát hiện ngôn ngữ tự động
- Lần đầu sử dụng, hệ thống sẽ tự động phát hiện ngôn ngữ trình duyệt
- Nếu không hỗ trợ, sẽ mặc định là tiếng Anh

#### Định dạng theo địa phương
- Định dạng ngày tháng thay đổi theo ngôn ngữ
- Định dạng số và tiền tệ phù hợp với từng vùng

## Ngôn ngữ được hỗ trợ

### Hoàn chỉnh
- 🇺🇸 **English** - Tiếng Anh
- 🇻🇳 **Tiếng Việt** - Vietnamese

### Sẵn sàng mở rộng
Hệ thống đã chuẩn bị sẵn cho các ngôn ngữ khác:
- 🇨🇳 Chinese, 🇯🇵 Japanese, 🇰🇷 Korean
- 🇸🇦 Arabic (hỗ trợ RTL), 🇪🇸 Spanish
- 🇫🇷 French, 🇩🇪 German, 🇵🇹 Portuguese

## Các thành phần được dịch

### Header/Navigation
- Tên ứng dụng và menu chính
- Tooltips và nút chức năng
- Menu người dùng

### Nội dung chính
- Dashboard và các trang chính
- Thông báo hệ thống
- Nút và nhãn giao diện

### Thông báo
- Thông báo thành công/lỗi
- Tin nhắn hệ thống
- Trạng thái loading

## Demo và Test

### Trang Demo
Truy cập `/demo/language` để:
- Test tất cả tính năng chuyển đổi ngôn ngữ
- Xem các định dạng khác nhau
- Thử nghiệm với nhiều ngôn ngữ

### Kiểm tra tính năng
1. Chuyển đổi giữa tiếng Anh và tiếng Việt
2. Refresh trang để kiểm tra persistence
3. Kiểm tra responsive trên mobile
4. Test accessibility với keyboard navigation

## Lợi ích

### Cho người dùng
- Giao diện thân thiện với người Việt
- Không còn lẫn lộn giữa tiếng Anh và tiếng Việt
- Trải nghiệm nhất quán trên toàn hệ thống

### Cho nhà phát triển
- Dễ dàng thêm ngôn ngữ mới
- Code có cấu trúc rõ ràng
- Hỗ trợ đầy đủ cho internationalization

## Hỗ trợ kỹ thuật

Nếu gặp vấn đề:
1. Kiểm tra console browser để xem lỗi
2. Đảm bảo JavaScript được bật
3. Thử refresh trang hoặc clear cache
4. Liên hệ team phát triển nếu cần hỗ trợ

---

**Lưu ý**: Tính năng này giúp đồng nhất ngôn ngữ sử dụng cho toàn bộ hệ thống, tạo trải nghiệm người dùng tốt hơn và chuyên nghiệp hơn.