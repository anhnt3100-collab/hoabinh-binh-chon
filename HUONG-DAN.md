# Đưa trang bình chọn Hòa Bình lên Netlify

Trang gồm: `public/index.html` (trang bình chọn), `public/admin.html` (trang quản lý),
`netlify/functions/votes.mjs` (lưu phiếu bằng Netlify Blobs), `netlify.toml`, `package.json`.

Lưu ý: kéo-thả thư mục vào Netlify Drop KHÔNG chạy được phần lưu phiếu. Dùng cách 1 hoặc cách 2.

## Cách 1: GitHub + Netlify (không cần cài gì)
1. Tạo tài khoản GitHub (github.com) và Netlify (app.netlify.com, đăng nhập bằng GitHub).
2. GitHub: New repository → tên `hoabinh-binh-chon` → Create.
3. Bấm "uploading an existing file" → kéo TẤT CẢ file/thư mục bên trong thư mục đã giải nén
   (netlify.toml, package.json, public, netlify, HUONG-DAN.md) → Commit changes.
   Không kéo thư mục node_modules (nếu có).
4. Netlify: Add new site (Add new project) → Import an existing project → GitHub → chọn repo.
   Giữ nguyên cấu hình (đã có trong netlify.toml) → Deploy.
5. Đặt mã quản trị: Site configuration → Environment variables → Add a variable
   Key: ADMIN_KEY, Value: một mật khẩu bạn tự đặt → Save.
   Sau đó Deploys → Trigger deploy → Deploy site để áp dụng.
6. Đổi tên link: Site configuration → Change site name → ví dụ `hoabinh-2111`
   → link thành https://hoabinh-2111.netlify.app

## Cách 2: Netlify CLI (máy đã cài Node.js)
    npm install
    npx netlify-cli login
    npx netlify-cli deploy --prod
    npx netlify-cli env:set ADMIN_KEY "mat-khau-cua-ban"
    npx netlify-cli deploy --prod

## Dùng
- Gửi link https://<ten-site>.netlify.app cho nhóm. Mỗi người ghi tên → bấm chọn A hoặc B.
- Kết quả tự cập nhật mỗi 5 giây trên mọi máy.
- Quản lý: https://<ten-site>.netlify.app/admin.html → nhập ADMIN_KEY → xem tên, giờ bỏ phiếu,
  xoá phiếu sai/trùng, sao chép kết quả.
- Hạn bình chọn: hết 23:59 ngày 10/11/2026 (giờ VN), máy chủ tự khoá. Muốn đổi hạn: sửa dòng
  `DEADLINE` trong `netlify/functions/votes.mjs` và `public/index.html` (tìm "2026-11-10").
- Hai người không thể dùng cùng một tên. Mỗi máy/trình duyệt giữ một phiếu, đổi ý thì bấm phương án kia.
