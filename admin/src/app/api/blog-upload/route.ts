import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyToken } from "@/lib/auth";

const BUCKET = "blog";

// ─── Auto-create bucket if it doesn't exist ───────────────────────
async function ensureBucket() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`Failed to list buckets: ${listError.message}`);

  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5242880, // 5 MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });
    if (createError) throw new Error(`Failed to create bucket: ${createError.message}`);
    console.log(`✅ Supabase bucket "${BUCKET}" created.`);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST  /api/blog-upload
// FormData: file (single)
// Returns: { url: string }
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureBucket();

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
    const filename = `${Date.now()}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filename);

    return NextResponse.json(
      {
        message: "Uploaded successfully",
        url: data.publicUrl,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("BLOG UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
