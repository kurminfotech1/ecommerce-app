import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

const BUCKET = "logos";
const LOGO_ID = "site-logo";

async function ensureBucket() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`Failed to list buckets: ${listError.message}`);

  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
    });
    if (createError) throw new Error(`Failed to create bucket: ${createError.message}`);
  }
}

async function uploadFile(file: File, prefix: string): Promise<string> {
  await ensureBucket();
  const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
  const filename = `${prefix}-${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

// ─────────────────────────────────────────────────────────────────
// GET /api/logo  — public, no auth required
// ─────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const logo = await prisma.siteLogo.findUnique({ where: { id: LOGO_ID } });
    return NextResponse.json({ data: logo ?? null });
  } catch (error) {
    console.error("GET LOGO ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/logo  — multipart/form-data
// Fields: light (file), favicon (file)
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();

    const lightFile   = form.get("light")   as File | null;
    const faviconFile = form.get("favicon") as File | null;

    const existing = await prisma.siteLogo.findUnique({ where: { id: LOGO_ID } });

    let light_url   = existing?.light_url   ?? null;
    let favicon_url = existing?.favicon_url ?? null;

    if (lightFile   instanceof File) light_url   = await uploadFile(lightFile, "light");
    if (faviconFile instanceof File) favicon_url = await uploadFile(faviconFile, "favicon");

    const logo = await prisma.siteLogo.upsert({
      where: { id: LOGO_ID },
      update: { light_url, favicon_url },
      create: { id: LOGO_ID, light_url, favicon_url },
    });

    return NextResponse.json({ message: "Logo uploaded or changed successfully", data: logo }, { status: 200 });
  } catch (error: any) {
    console.error("POST LOGO ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /api/logo?field=light|favicon  — clear a specific logo field
// ─────────────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const field = new URL(req.url).searchParams.get("field") as "light" | "favicon" | null;
    if (!field || !["light", "favicon"].includes(field)) {
      return NextResponse.json({ error: "Invalid field. Use: light or favicon" }, { status: 400 });
    }

    const key = `${field}_url` as "light_url" | "favicon_url";
    const logo = await prisma.siteLogo.upsert({
      where: { id: LOGO_ID },
      update: { [key]: null },
      create: { id: LOGO_ID },
    });

    return NextResponse.json({ message: "Logo deleted successfully", data: logo });
  } catch (error: any) {
    console.error("DELETE LOGO ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
