// API bình chọn: GET danh sách phiếu, POST bỏ/đổi phiếu, DELETE xoá phiếu (cần mã quản trị).
import { getStore } from "@netlify/blobs";

const DEADLINE = new Date("2026-11-10T23:59:59+07:00").getTime();
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const norm = (s) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

async function allVotes(store) {
  const { blobs } = await store.list();
  const rows = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  return rows.filter(Boolean).sort((a, b) => a.at - b.at);
}

export default async (req) => {
  const store = getStore({ name: "hoabinh-votes", consistency: "strong" });
  const closed = Date.now() > DEADLINE;

  if (req.method === "GET") {
    const k = req.headers.get("x-admin-key");
    const admin = k ? Boolean(process.env.ADMIN_KEY) && k === process.env.ADMIN_KEY : undefined;
    return json({ votes: await allVotes(store), closed, deadline: DEADLINE, admin });
  }

  if (req.method === "POST") {
    if (closed) return json({ error: "Đã hết hạn bình chọn (hết ngày 10/11).", closed }, 403);
    let body;
    try { body = await req.json(); } catch { return json({ error: "Dữ liệu không hợp lệ." }, 400); }
    const id = String(body.id || "").toLowerCase();
    const name = String(body.name || "").normalize("NFC").trim().replace(/\s+/g, " ");
    const choice = body.choice;
    if (!/^[a-z0-9-]{8,64}$/.test(id)) return json({ error: "Thiết bị không hợp lệ, tải lại trang rồi thử lại." }, 400);
    if (name.length < 2 || name.length > 40) return json({ error: "Tên cần từ 2 đến 40 ký tự." }, 400);
    if (choice !== "A" && choice !== "B") return json({ error: "Chỉ chọn A hoặc B." }, 400);

    const votes = await allVotes(store);
    const clash = votes.find((v) => v.id !== id && norm(v.name) === norm(name));
    if (clash) {
      return json({ error: `Tên “${name}” đã bình chọn từ máy khác. Thêm họ hoặc biệt danh để phân biệt, hoặc nhờ người tổ chức xoá phiếu cũ.` }, 409);
    }
    const prev = votes.find((v) => v.id === id);
    await store.setJSON(id, { id, name, choice, at: prev ? prev.at : Date.now(), updatedAt: Date.now() });
    return json({ ok: true, votes: await allVotes(store), closed });
  }

  if (req.method === "DELETE") {
    const key = process.env.ADMIN_KEY;
    if (!key || req.headers.get("x-admin-key") !== key) return json({ error: "Sai mã quản trị." }, 401);
    const id = new URL(req.url).searchParams.get("id");
    if (id === "*") {
      const { blobs } = await store.list();
      await Promise.all(blobs.map((b) => store.delete(b.key)));
    } else if (id) {
      await store.delete(id);
    } else {
      return json({ error: "Thiếu id." }, 400);
    }
    return json({ ok: true, votes: await allVotes(store), closed });
  }

  return json({ error: "Phương thức không hỗ trợ." }, 405);
};

export const config = { path: "/api/votes" };
