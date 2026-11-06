import type { Config } from "@netlify/functions";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { votes } from "../../db/schema.js";

// ===== Cấu hình cuộc bình chọn (sửa ở đây) =====
const TITLE = "Bình chọn Hòa Bình";
const QUESTION = "Bạn chọn phương án nào?";
const OPTIONS = { A: "Phương án A", B: "Phương án B" } as const;
// Hạn bình chọn: 23:59 ngày 10/11/2026 giờ Việt Nam
const DEADLINE = "2026-11-10T23:59:59+07:00";
// ===============================================

type Choice = keyof typeof OPTIONS;

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

const isClosed = () => Date.now() > new Date(DEADLINE).getTime();

const nameKeyOf = (name: string) =>
  name.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

const isAdmin = (req: Request) => {
  const key = process.env.ADMIN_KEY;
  return !!key && req.headers.get("x-admin-key") === key;
};

async function summary(voterId?: string | null) {
  const rows = await db
    .select({ choice: votes.choice, count: sql<number>`count(*)::int` })
    .from(votes)
    .groupBy(votes.choice);
  const counts: Record<string, number> = { A: 0, B: 0 };
  for (const r of rows) counts[r.choice] = r.count;

  let mine = null;
  if (voterId) {
    const [row] = await db
      .select({ name: votes.name, choice: votes.choice })
      .from(votes)
      .where(eq(votes.voterId, voterId));
    mine = row ?? null;
  }

  return {
    title: TITLE,
    question: QUESTION,
    options: OPTIONS,
    deadline: DEADLINE,
    closed: isClosed(),
    counts,
    total: counts.A + counts.B,
    mine,
  };
}

export default async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (url.searchParams.get("admin") === "1") {
      if (!isAdmin(req)) return json({ error: "Sai mã quản trị." }, 401);
      const list = await db
        .select({
          id: votes.id,
          name: votes.name,
          choice: votes.choice,
          createdAt: votes.createdAt,
          updatedAt: votes.updatedAt,
        })
        .from(votes)
        .orderBy(asc(votes.createdAt));
      return json({ ...(await summary()), votes: list });
    }
    return json(await summary(url.searchParams.get("voterId")));
  }

  if (req.method === "POST") {
    if (isClosed()) return json({ error: "Đã hết hạn bình chọn." }, 403);

    let body: { voterId?: string; name?: string; choice?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Dữ liệu không hợp lệ." }, 400);
    }
    const voterId = String(body.voterId ?? "").trim();
    const name = String(body.name ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
    const choice = String(body.choice ?? "") as Choice;

    if (!voterId || voterId.length > 100) return json({ error: "Thiếu mã thiết bị." }, 400);
    if (name.length < 2 || name.length > 60)
      return json({ error: "Vui lòng nhập tên (2–60 ký tự)." }, 400);
    if (!(choice in OPTIONS)) return json({ error: "Phương án không hợp lệ." }, 400);

    const nameKey = nameKeyOf(name);
    const [taken] = await db
      .select({ id: votes.id })
      .from(votes)
      .where(and(eq(votes.nameKey, nameKey), ne(votes.voterId, voterId)));
    if (taken) return json({ error: "Tên này đã có người dùng. Vui lòng ghi rõ hơn (ví dụ thêm họ)." }, 409);

    try {
      await db
        .insert(votes)
        .values({ voterId, name, nameKey, choice })
        .onConflictDoUpdate({
          target: votes.voterId,
          set: { name, nameKey, choice, updatedAt: new Date() },
        });
    } catch {
      return json({ error: "Tên này đã có người dùng. Vui lòng ghi rõ hơn." }, 409);
    }
    return json(await summary(voterId));
  }

  if (req.method === "DELETE") {
    if (!isAdmin(req)) return json({ error: "Sai mã quản trị." }, 401);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isInteger(id)) return json({ error: "Thiếu mã phiếu." }, 400);
    await db.delete(votes).where(eq(votes.id, id));
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config: Config = {
  path: "/api/votes",
};
