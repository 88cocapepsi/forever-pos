# FOREVER POS PRO Production

Bản production web POS cho quán cà phê, dùng qua trình duyệt internet.

## Stack
- Frontend: React + Vite + Tailwind + Socket.IO Client + PWA
- Backend: Node.js + Express + PostgreSQL + Socket.IO + JWT
- Database: PostgreSQL
- Deploy gợi ý:
  - Backend: Render / Railway / VPS
  - Frontend: Netlify / Vercel
  - Database: Neon / Supabase Postgres / Render Postgres

## Chức năng hiện có trong source
- Đăng nhập JWT, phân quyền `admin` / `staff`
- 10 bàn + mang về + giao đi
- Tạo order, thêm món, cập nhật số lượng
- Thanh toán hóa đơn
- Realtime đồng bộ order qua Socket.IO
- Notification bill realtime trong web app
- Báo cáo doanh thu ngày
- Quản lý sản phẩm cơ bản
- Nhật ký thao tác cơ bản
- PWA nền để cài lên iPhone

## 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run db:init
npm run dev
```

Backend chạy mặc định: `http://localhost:4000`

## 2. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend chạy mặc định: `http://localhost:5173`

## Tài khoản mẫu sau khi init DB
- admin / 123456
- staff / 123456

## Biến môi trường backend
Xem `backend/.env.example`

## Biến môi trường frontend
Xem `frontend/.env.example`

## PostgreSQL local nhanh bằng Docker
```bash
docker run --name forever-pos-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=forever_pos \
  -p 5432:5432 -d postgres:16
```

## Deploy production
### Backend
- Tạo database Postgres
- Set env theo `.env.example`
- Chạy:
```bash
npm install
npm run db:init
npm start
```

### Frontend
- Set `VITE_API_BASE=https://your-backend-domain/api`
- Set `VITE_SOCKET_URL=https://your-backend-domain`
- Build:
```bash
npm install
npm run build
```

## Push notification iPhone
Source đã có nền PWA + notification trong app.
Để push nền thực sự trên iPhone cần:
- domain HTTPS thật
- user mở bằng Safari
- Add to Home Screen
- service worker hoạt động
- tích hợp VAPID/Web Push server nếu muốn đẩy khi app không mở

Bản source này đã chuẩn bị kiến trúc cho giai đoạn đó nhưng hiện mặc định dùng realtime in-app notifications để ổn định hơn.
