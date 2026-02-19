import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyToken } from "@/lib/auth";

const BUCKET = "products";

// ─── Auto-create bucket if it doesn't exist ───────────────────────
async function ensureBucket() {
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`Failed to list buckets: ${listError.message}`);

  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,           // Files publicly accessible via URL
      fileSizeLimit: 5242880, // 5 MB per file
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });
    if (createError) throw new Error(`Failed to create bucket: ${createError.message}`);
    console.log(`✅ Supabase bucket "${BUCKET}" created.`);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST  /api/upload
// FormData: file (single) OR files[] (multiple)
// Returns: { urls: string[] }
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure bucket exists (creates it if not)
    await ensureBucket();

    const form = await req.formData();

    // Support single `file` OR multiple `files`
    const single = form.get("file") as File | null;
    const multiple = form.getAll("files") as File[];

    const filesToUpload: File[] = single ? [single] : multiple;

    if (!filesToUpload.length) {
      return NextResponse.json(
        { error: "No file(s) provided" },
        { status: 400 }
      );
    }

    const urls: string[] = [];

    for (const file of filesToUpload) {
      if (!file || typeof file === "string") continue;

      // Sanitise filename and prefix with timestamp to avoid collisions
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

      urls.push(data.publicUrl);
    }

    return NextResponse.json(
      {
        message: "Uploaded successfully",
        urls,
        // Convenience shorthand for single file upload
        url: urls[0] ?? null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


// ─────────────────────────────────────────────────────────────────
// DELETE  /api/upload
// Body: { urls: string[] }   ← public Supabase URLs to delete
// Returns: { success: true }
// ─────────────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const urls: string[] = body.urls ?? (body.url ? [body.url] : []);

    if (!urls.length) {
      return NextResponse.json(
        { error: "No URLs provided" },
        { status: 400 }
      );
    }

    // Extract storage path (everything after /object/public/<bucket>/)
    const paths = urls
      .map((url) => {
        try {
          const parsed = new URL(url);
          // pathname: /storage/v1/object/public/products/<filename>
          const parts = parsed.pathname.split(`/object/public/${BUCKET}/`);
          return parts[1] ?? null;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];

    if (!paths.length) {
      return NextResponse.json(
        { error: "Could not parse file paths from URLs" },
        { status: 400 }
      );
    }

    const { error: removeError } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove(paths);

    if (removeError) {
      console.error("Storage remove error:", removeError.message);
      return NextResponse.json(
        { error: `Delete failed: ${removeError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted: paths });
  } catch (error) {
    console.error("DELETE UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
