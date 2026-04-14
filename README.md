# FOREVER POS Browser Internet Complete

Bản này được tối ưu để chạy trên trình duyệt và dễ cài hơn trên Mac/Windows vì backend **không dùng native module**.

## Công nghệ
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: `db.json` lưu file JSON
- Auth: JWT
- Phân quyền: admin / cashier

## Tính năng
- Đăng nhập
- Quản lý bàn
- Lưu đơn đang phục vụ
- Thanh toán
- Báo cáo hôm nay
- Quản lý menu
- Quản lý tài khoản
- Chạy trên trình duyệt internet

## Chạy local
### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
Mở terminal thứ 2:
```bash
cd frontend
npm install
npm run dev
```

Mở:
```bash
http://localhost:5173
```

## Tài khoản mặc định
- admin / 123456
- thungan / 123456

## Deploy internet
- Frontend: Vercel / Netlify
- Backend: Render / Railway / VPS
- Sửa `frontend/.env` thành URL backend thật

## Lưu ý
- Bản này lưu dữ liệu vào file `backend/db.json`
- Để chạy internet ổn định lâu dài, bước sau nên đổi sang PostgreSQL hoặc MySQL
