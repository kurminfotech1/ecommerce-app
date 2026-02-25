"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";
import { getBlog, deleteBlog } from "@/redux/blog/blogApi";
import { clearBlog } from "@/redux/blog/blogSlice";
import { DeleteModal } from "@/components/common/DeleteModal";

import {
  ArrowLeft, Calendar, Clock, CheckCircle2, XCircle,
  Star, User, Tag, Globe, FileText, Pencil,
  Trash2, ExternalLink, Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";

// ── Helpers ────────────────────────────────────────────────────────
const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }) + " at " + d.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
};

// ── Badge ──────────────────────────────────────────────────────────
const Badge = ({ children, color = "gray" }: { children: React.ReactNode; color?: string }) => {
  const colors: Record<string, string> = {
    green: "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/20 dark:text-success-400 dark:border-success-500/30",
    red: "bg-error-50 text-error-600 border-error-200 dark:bg-error-500/20 dark:text-error-400 dark:border-error-500/30",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
    amber: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/20 dark:text-warning-400 dark:border-warning-500/30",
    gray: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30",
    purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

// ── Info Row ───────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | React.ReactNode }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
    <div className="mt-0.5 text-gray-400 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="text-sm text-gray-800 dark:text-gray-200 font-medium break-words">{value || "—"}</div>
    </div>
  </div>
);

// ── Skeleton ───────────────────────────────────────────────────────
const DetailSkeleton = () => (
  <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-3 bg-gray-100 dark:bg-gray-600 rounded" />)}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════
export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { blog, loading } = useSelector((s: RootState) => s.blogs);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const blogId = params?.id as string;

  useEffect(() => {
    if (blogId) {
      dispatch(getBlog(blogId));
    }
    return () => {
      dispatch(clearBlog());
    };
  }, [blogId, dispatch]);

  const handleDelete = async () => {
    if (!blog) return;
    setDeleteLoading(true);
    await dispatch(deleteBlog(blog.id));
    setDeleteLoading(false);
    setDeleteOpen(false);
    router.push("/blog");
  };

  if (loading || !blog) {
    return <DetailSkeleton />;
  }

  return (
    <>
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* ── Back + Actions ── */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <Link
              href="/blog"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-[#155dfc] transition"
            >
              <ArrowLeft size={16} /> Back to Blog
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteOpen(true)}
                className="ib ib-red"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* ── Main Content Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left Column: Content ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Featured Image */}
              {blog.featured_image ? (
                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                  <Image
                    src={blog.featured_image}
                    alt={blog.title}
                    className=" object-cover"
                    width={500}
                    height={500}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-48 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                  <ImageIcon size={40} />
                  <p className="text-xs text-gray-400 mt-2">No featured image</p>
                </div>
              )}

              {/* Title & Badges */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
                  {blog.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {blog.is_published ? (
                    <Badge color="green"><CheckCircle2 size={10} /> Published</Badge>
                  ) : (
                    <Badge color="gray"><XCircle size={10} /> Draft</Badge>
                  )}
                  {blog.is_featured && (
                    <Badge color="amber"><Star size={10} fill="currentColor" /> Featured</Badge>
                  )}
                  {blog.tags && blog.tags.length > 0 && blog.tags.map((tag) => (
                    <Badge key={tag.id} color="blue">
                      <Tag size={9} /> {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Excerpt */}
              {blog.excerpt && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Excerpt</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    {blog.excerpt}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={12} /> Content
                  </p>
                </div>
                <div
                  className="px-5 py-5 prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              </div>
            </div>

            {/* ── Right Column: Sidebar ── */}
            <div className="space-y-5">

              {/* Details Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Details</p>
                <InfoRow
                  icon={<User size={14} />}
                  label="Author"
                  value={
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#155dfc]/10 text-[#155dfc] flex items-center justify-center text-[10px] font-bold">
                        {blog.author?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span>{blog.author || "—"}</span>
                    </div>
                  }
                />
                <InfoRow
                  icon={<Tag size={14} />}
                  label="Category"
                  value={blog.category || "—"}
                />
                <InfoRow
                  icon={<Calendar size={14} />}
                  label="Created"
                  value={formatDateTime(blog.created_at)}
                />
                <InfoRow
                  icon={<Clock size={14} />}
                  label="Updated"
                  value={formatDateTime(blog.updated_at)}
                />
                {blog.is_published && blog.published_at && (
                  <InfoRow
                    icon={<CheckCircle2 size={14} />}
                    label="Published At"
                    value={formatDateTime(blog.published_at)}
                  />
                )}
              </div>

              {/* SEO Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Globe size={12} /> SEO
                </p>
                <InfoRow
                  icon={<FileText size={14} />}
                  label="Slug"
                  value={<code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{blog.slug}</code>}
                />
                <InfoRow
                  icon={<FileText size={14} />}
                  label="Meta Title"
                  value={blog.meta_title || "—"}
                />
                <InfoRow
                  icon={<FileText size={14} />}
                  label="Meta Description"
                  value={blog.meta_desc || "—"}
                />
                {blog.canonical_url && (
                  <InfoRow
                    icon={<ExternalLink size={14} />}
                    label="Canonical URL"
                    value={
                      <a href={blog.canonical_url} target="_blank" rel="noopener noreferrer" className="text-[#155dfc] hover:underline break-all">
                        {blog.canonical_url}
                      </a>
                    }
                  />
                )}
              </div>

              {/* Tags Card */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Tag size={12} /> Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-medium border border-violet-100 dark:border-violet-500/20"
                      >
                        <Tag size={10} /> {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats Card */}
              {(() => {
                const text = blog.content?.replace(/<[^>]*>/g, "") || "";
                const words = text.split(/\s+/).filter(Boolean).length;
                const readMin = Math.max(1, Math.ceil(words / 200));
                return (
                  <div className="bg-gradient-to-br from-[#155dfc] to-[#1246cc] rounded-2xl shadow-sm p-5 text-white">
                    <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Quick Stats</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-bold">{words.toLocaleString()}</p>
                        <p className="text-[10px] text-white/60 uppercase tracking-wider mt-0.5">Words</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{readMin}</p>
                        <p className="text-[10px] text-white/60 uppercase tracking-wider mt-0.5">Min Read</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{text.length.toLocaleString()}</p>
                        <p className="text-[10px] text-white/60 uppercase tracking-wider mt-0.5">Chars</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Modal ── */}
      <DeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        parentTitle={`Delete "${blog.title}"?`}
        childTitle="This will permanently delete this blog post. This action cannot be undone."
        loading={deleteLoading}
      />
    </>
  );
}
