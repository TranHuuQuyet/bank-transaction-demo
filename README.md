🏦 Demo Chuyển Tiền Ngân Hàng

Đây là một ứng dụng web đơn giản mô phỏng hệ thống chuyển tiền giữa các tài khoản ngân hàng.
Người dùng có thể chọn tài khoản và thực hiện chuyển tiền giữa các tài khoản.

Dự án này được xây dựng nhằm mục đích học tập về Transaction và Concurrency Control trong Database.

📌 Chức năng
Hiển thị danh sách các tài khoản ngân hàng
Chọn tài khoản gửi tiền
Chọn tài khoản nhận tiền
Thực hiện chuyển tiền giữa các tài khoản
Cập nhật số dư trong cơ sở dữ liệu
Minh họa cách hoạt động của database transaction

*🛠 Công nghệ sử dụng*
Frontend
HTML
CSS
JavaScript
Backend
Node.js
Cơ sở dữ liệu
MySQL
Container hóa
Docker
Docker Compose

📂 Cấu trúc thư mục dự án
bank-transaction/
│
├── public/             # Các file frontend
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── ic.png
│
├── server.js           # Server backend
├── db.sql              # Cấu trúc database
├── init.sql            # Dữ liệu khởi tạo
│
├── Dockerfile
├── docker-compose.yml
│
├── package.json
└── README.md
⚙️ Cách chạy dự án
1️⃣ Clone repository
git clone https://github.com/yourusername/bank-transfer-demo.git
cd bank-transfer-demo
2️⃣ Khởi động hệ thống bằng Docker
docker-compose up --build

Lệnh này sẽ khởi động:

Server Node.js

Database MySQL

3️⃣ Mở ứng dụng web

Mở trình duyệt và truy cập:

http://localhost:3000
💰 Cách hệ thống chuyển tiền hoạt động

Chọn tài khoản gửi

Chọn tài khoản nhận

Nhập số tiền cần chuyển

Nhấn Transfer

Hệ thống sẽ thực hiện:

Bắt đầu database transaction

Trừ tiền từ tài khoản gửi

Cộng tiền vào tài khoản nhận

Commit transaction

Nếu xảy ra lỗi, transaction sẽ được rollback để đảm bảo dữ liệu không bị sai lệch.
