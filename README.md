# Quản lý siêu thị mini – Đồ ăn vặt & Đồ chơi

Ứng dụng quản lý siêu thị mini xây dựng bằng Spring Boot (Java), React + Vite và MySQL (XAMPP).

## Nghiệp vụ chính
- Quản lý hàng hóa: đồ ăn vặt, bánh kẹo, nước uống, đồ chơi và phụ kiện.
- Quản lý danh mục, thương hiệu hàng hóa, giá nhập, số lượng, đơn vị tính, hạn sử dụng và vị trí kệ.
- Quản lý nhân viên, phân quyền, tài khoản khách hàng và hồ sơ thành viên.
- Khách hàng có thể tự đăng ký tài khoản, đăng nhập, xem sản phẩm, tạo yêu cầu mua hàng và gửi phản hồi.
- Nhân viên thực hiện bán hàng tại quầy, lập hóa đơn, quản lý khách hàng và xem thống kê.
- Theo dõi hàng lỗi, lịch sử xuất/nhập kho và thùng rác dữ liệu.

## Công nghệ
- Backend: Java 17+, Spring Boot, Spring Security, Spring Data JPA.
- Frontend: React, TypeScript, Vite.
- Database: MySQL 8 / MariaDB qua XAMPP.

## Chạy trên Windows
1. Cài Node.js LTS, JDK 17+ và XAMPP.
2. Mở XAMPP, bật MySQL.
3. Mở CMD tại thư mục `doanJava`.
4. Chạy `npm install` và đợi hoàn tất.
5. Chạy `npm run migrate` để tạo database `QuanLySieuThiMini` và nạp dữ liệu mẫu.
6. Chạy `npm run dev`.
7. Mở `http://localhost:5173`.

## Tài khoản mẫu
- Quản trị: `admin` / `123`
- Thu ngân: `cashier` / `123`
- Nhân viên kho: `fixer` / `123`
- Khách hàng: đăng ký tài khoản tại trang cửa hàng `/store/register`.

## Database
- File import XAMPP/phpMyAdmin: `xampp_migration.sql`.
- Database đích: `QuanLySieuThiMini`.
- Một số tên lớp/thuộc tính và migration lịch sử vẫn giữ định danh tương thích của dự án nền để tránh phá vỡ API và dữ liệu; nội dung nghiệp vụ và dữ liệu mẫu đã chuyển sang hàng hóa siêu thị mini.

## Giao diện và ảnh sản phẩm

- Giao diện đã chuyển sang bảng màu kem ấm, nâu cà phê, xanh olive và cam đất.
- Ảnh sản phẩm ở trang cửa hàng dùng ảnh chụp trực tuyến theo nhóm hàng: đồ ăn vặt, nước uống và đồ chơi. Máy cần kết nối Internet để tải ảnh.
- Ảnh đồ ăn vặt: https://fmcgnepal.com/images/snacks.webp
- Ảnh nước uống: https://p2.trrsf.com/image/fget/cf/940/0/images.terra.com/2023/07/02/reflejo_pag1-t8cxsnqdz0vr.jpg
- Ảnh đồ chơi: https://igrashky24.com.ua/image/catalog/categori/ihrashky.png
- Ảnh banner cửa hàng: https://altawfeermarket.com/assets/images/1775260496_2887.png
- Các ảnh từ website bên ngoài có thể thay đổi đường dẫn hoặc chính sách sử dụng; nếu triển khai thương mại, hãy kiểm tra giấy phép hoặc thay bằng ảnh do cửa hàng tự chụp.

## Tài khoản khách hàng

- Trang đăng ký: `/store/register`
- Trang đăng nhập: `/store/login`
- Trang thông tin cá nhân: `/store/account`
- API đăng ký/đăng nhập khách hàng dùng riêng, mật khẩu được mã hóa BCrypt và token mang vai trò `CUSTOMER`.
- Tài khoản nhân viên vẫn đăng nhập bằng cơ chế hiện tại; khách hàng không được cấp quyền quản trị.
