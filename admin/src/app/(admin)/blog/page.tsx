"use client";

import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";
import Link from "next/link";

import {
  getBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadBlogImage,
  Blog,
} from "@/redux/blog/blogApi";

import {
  Search, Plus, Pencil, X, Loader2,
  Trash2, Eye, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Star, Calendar,
  FileText, Globe, Image as ImageIcon, Tag,
  ArrowUpDown, ArrowUp, ArrowDown, RotateCcw,
  Upload,
} from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";
import { usePermission } from "@/hooks/usePermission";

// ── Helpers ────────────────────────────────────────────────────────
const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
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

// ── Field ──────────────────────────────────────────────────────────
const Field = ({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) => (
  <div className={span === 2 ? "col-span-2" : ""}>
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#155dfc] focus:bg-white dark:focus:bg-gray-700 transition placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white";

// ── TagInput ───────────────────────────────────────────────────────
const TagInput = ({ tags, setTags, placeholder }: { tags: string[], setTags: (t: string[]) => void, placeholder: string }) => {
  const [val, setVal] = useState("");
  const add = () => {
    if (val.trim() && !tags.includes(val.trim())) {
      setTags([...tags, val.trim()]);
      setVal("");
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={e => { e.preventDefault(); add(); }}
          className="px-4 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-500 cursor-pointer"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-[13px] font-medium border border-violet-100 dark:border-violet-500/20">
            {t}
            <button type="button" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} className="hover:text-violet-800 dark:hover:text-white transition cursor-pointer">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Image Preview Modal ──────────────────────────────────────────
const ImagePreview = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
    <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition cursor-pointer" onClick={onClose}>
      <X size={20} />
    </button>
    <img src={url} alt="Preview" className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
  </div>
);

// ── Skeleton ───────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

// ── Sort types ─────────────────────────────────────────────────────
type SortField = "title" | "created_at" | "published_at" | "author" | "category";
type SortDir = "asc" | "desc";

// ── SortIcon ───────────────────────────────────────────────────────
const SortIcon = ({ field, activeField, dir }: { field: SortField; activeField: SortField; dir: SortDir }) => {
  if (activeField !== field) return <ArrowUpDown size={12} className="text-gray-300" />;
  return dir === "asc"
    ? <ArrowUp size={12} className="text-[#155dfc]" />
    : <ArrowDown size={12} className="text-[#155dfc]" />;
};

// ════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════
export default function BlogPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { blogs, totalPages, totalRecords, loading, submitting, uploading } =
    useSelector((s: RootState) => s.blogs);

  // ── Permission flags ──
  const { canCreate, canUpdate, canDelete } = usePermission("Blog");

  // ── List state ─────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const [draftFilter, setDraftFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [page, setPage] = useState(1);

  // ── Sort state ─────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Modal state ────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteBlogItem, setDeleteBlogItem] = useState<Blog | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Preview ────────────────────────────────────────────────────
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<"code" | "preview">("code");

  // ── Form ───────────────────────────────────────────────────────
  const emptyForm = {
    title: "", slug: "", excerpt: "", content: "",
    featured_image: "",  // uploaded URL
    category: "", author: "",
    blog_tags: [] as string[],  // tag name strings
    meta_title: "", meta_desc: "", canonical_url: "",
    is_published: false, is_draft: false, is_featured: false,
  };

  const [form, setForm] = useState(emptyForm);
  const [pendingFile, setPendingFile] = useState<File | null>(null); // queued for upload

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchBlogs = useCallback(() => {
    dispatch(getBlogs({
      page,
      limit: 5,
      search,
      published: publishedFilter || undefined,
      draft: draftFilter || undefined,
      featured: featuredFilter || undefined,
    }));
  }, [page, search, publishedFilter, draftFilter, featuredFilter, dispatch]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  // ── Keyboard / scroll lock ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = previewImage || modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [previewImage, modalOpen]);

  // ── Sort locally ───────────────────────────────────────────────
  const sortedBlogs = [...(blogs || [])].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "title":
        cmp = (a.title || "").localeCompare(b.title || "");
        break;
      case "created_at":
        cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        break;
      case "published_at":
        cmp = new Date(a.published_at || 0).getTime() - new Date(b.published_at || 0).getTime();
        break;
      case "author":
        cmp = (a.author || "").localeCompare(b.author || "");
        break;
      case "category":
        cmp = (a.category || "").localeCompare(b.category || "");
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  // ── Sort toggle ────────────────────────────────────────────────
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ── Helpers ────────────────────────────────────────────────────
  const handleTitle = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setPendingFile(null);
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (blog: Blog) => {
    setEditId(blog.id);
    setPendingFile(null);
    setForm({
      title: blog.title,
      slug: blog.slug ?? "",
      excerpt: blog.excerpt ?? "",
      content: blog.content ?? "",
      featured_image: blog.featured_image ?? "",
      category: blog.category ?? "",
      author: blog.author ?? "",
      blog_tags: blog.tags?.map((t) => t.name) ?? [],
      meta_title: blog.meta_title ?? "",
      meta_desc: blog.meta_desc ?? "",
      canonical_url: blog.canonical_url ?? "",
      is_published: blog.is_published,
      is_draft: blog.is_draft,
      is_featured: blog.is_featured,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setPendingFile(null);
  };

  // ── Image handling ─────────────────────────────────────────────
  const handleFileSelect = (files: FileList | null) => {
    if (!files || !files[0]) return;
    setPendingFile(files[0]);
  };

  const removeUploadedImage = () => {
    setForm((f) => ({ ...f, featured_image: "" }));
  };

  const removePendingFile = () => {
    setPendingFile(null);
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title || !form.slug || !form.content || !form.category || !form.author) {
      alert("Title, slug, content, category and author are required.");
      return;
    }

    // Upload pending image first
    let imageUrl = form.featured_image;
    if (pendingFile) {
      const uploadRes = await dispatch(uploadBlogImage(pendingFile));
      if (uploadBlogImage.fulfilled.match(uploadRes)) {
        imageUrl = uploadRes.payload;
      } else {
        return; // upload failed, toast already shown
      }
    }

    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || null,
      content: form.content,
      featured_image: imageUrl || null,
      category: form.category,
      author: form.author,
      meta_title: form.meta_title || null,
      meta_desc: form.meta_desc || null,
      canonical_url: form.canonical_url || null,
      is_published: form.is_published,
      is_draft: form.is_draft,
      is_featured: form.is_featured,
      blog_tags: form.blog_tags, // tag name strings — API upserts & connects them
    };

    let result: any;
    if (editId) {
      result = await dispatch(updateBlog({ id: editId, ...payload }));
    } else {
      result = await dispatch(createBlog(payload));
    }

    if (createBlog.fulfilled.match(result) || updateBlog.fulfilled.match(result)) {
      closeModal();
      fetchBlogs();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteBlogItem) return;
    setDeleteLoading(true);
    await dispatch(deleteBlog(deleteBlogItem.id));
    setDeleteLoading(false);
    setDeleteBlogItem(null);
    // If this was the last item on the current page, go back one page
    const remainingOnPage = (blogs?.length ?? 0) - 1;
    if (remainingOnPage === 0 && page > 1) {
      setPage((p) => p - 1);
    } else {
      fetchBlogs();
    }
  };

  const resetFilters = () => {
    setSearch("");
    setPublishedFilter("");
    setDraftFilter("");
    setFeaturedFilter("");
    setSortField("created_at");
    setSortDir("desc");
    setPage(1);
  };

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────
  return (
    <>
      {previewImage && <ImagePreview url={previewImage} onClose={() => setPreviewImage(null)} />}

      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 w-full flex-1">

          {/* ── Header ── */}
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={22} className="text-[#155dfc]" />
                Blog Posts
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {totalRecords} post{totalRecords !== 1 ? "s" : ""} total
              </p>
            </div>
            {canCreate && (
              <button onClick={openCreate} className="c-btn-add">
                <Plus size={16} /> Add Blog Post
              </button>
            )}
          </div>

          {/* ── Filters Bar ── */}
          <div className="flex gap-2 flex-wrap items-center bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search by title..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className={`${inputCls} pl-9`}
              />
            </div>

            <select
              value={publishedFilter}
              onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155dfc] transition text-gray-900 dark:text-white cursor-pointer"
            >
              <option value="">Status: All</option>
              <option value="true">Published</option>
              <option value="false">Not Published</option>
            </select>

            <select
              value={draftFilter}
              onChange={(e) => { setDraftFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155dfc] transition text-gray-900 dark:text-white cursor-pointer"
            >
              <option value="">Draft: All</option>
              <option value="true">Drafts Only</option>
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155dfc] transition text-gray-900 dark:text-white cursor-pointer"
            >
              <option value="">Featured: All</option>
              <option value="true">Featured Only</option>
            </select>

            <button
              onClick={resetFilters}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition cursor-pointer"
              title="Reset filters"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* ── Table ── */}
          {loading && blogs.length === 0 ? (
            <Skeleton />
          ) : sortedBlogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={28} className="text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">No blog posts yet</p>
              <p className="text-sm text-gray-400 mb-6">Start by creating your first blog post.</p>
              {canCreate && (
                <button onClick={openCreate} className="c-btn-add">
                  <Plus size={16} /> Add First Post
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">
                        <button onClick={() => toggleSort("title")} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer">
                          Title <SortIcon field="title" activeField={sortField} dir={sortDir} />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">
                        <button onClick={() => toggleSort("category")} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer">
                          Category <SortIcon field="category" activeField={sortField} dir={sortDir} />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">
                        <button onClick={() => toggleSort("author")} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer">
                          Author <SortIcon field="author" activeField={sortField} dir={sortDir} />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">
                        <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer">
                          Created <SortIcon field="created_at" activeField={sortField} dir={sortDir} />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {sortedBlogs.map((blog: Blog) => (
                      <tr key={blog.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition group">
                        {/* Title + Image */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shrink-0 overflow-hidden flex items-center justify-center">
                              {blog.featured_image ? (
                                <img src={blog.featured_image} alt={blog.title} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={18} className="text-gray-300 dark:text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link href={`/blog/${blog.id}`} title={blog.title} className="font-semibold text-gray-800 dark:text-white hover:text-[#155dfc] transition text-sm block truncate max-w-[200px] lg:max-w-[300px]">
                                {blog.title}
                              </Link>
                              {blog.excerpt && (
                                <p title={blog.excerpt} className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px] lg:max-w-[300px]">
                                  {blog.excerpt}
                                </p>
                              )}
                              {blog.is_featured && (
                                <Badge color="amber">
                                  <Star size={9} fill="currentColor" /> Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge color="purple">
                            <Tag size={10} />
                            {blog.category || "—"}
                          </Badge>
                        </td>

                        {/* Author */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#155dfc]/10 text-[#155dfc] flex items-center justify-center text-[10px] font-bold shrink-0">
                              {blog.author?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                              {blog.author || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {blog.is_published ? (
                            <Badge color="green">
                              <CheckCircle2 size={10} /> Published
                            </Badge>
                          ) : (
                            <Badge color="gray">
                              <XCircle size={10} /> Draft
                            </Badge>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar size={11} />
                            {formatDate(blog.created_at)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/blog/${blog.id}`} className="ib ib-green" title="View">
                              <Eye size={13} />
                            </Link>
                            {canUpdate && (
                              <button onClick={() => openEdit(blog)} title="Edit" className="ib ib-blue">
                                <Pencil size={13} />
                              </button>
                            )}
                            {canDelete && (
                              <button className="ib ib-red" title="Delete" onClick={() => setDeleteBlogItem(blog)}>
                                <Trash2 size={13} />
                              </button>
                            )}
                            {!canUpdate && !canDelete && (
                              <span className="text-[10px] text-gray-400 italic">Read only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page <span className="font-semibold text-gray-700 dark:text-gray-300">{page}</span> of{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">{totalPages}</span>
              </p>
              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>

                {/* Page numbers with ellipsis */}
                {(() => {
                  const delta = 1; // pages around current
                  const pages: (number | "...")[] = [];
                  const left = page - delta;
                  const right = page + delta;

                  for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
                      pages.push(i);
                    } else if (
                      (i === left - 1 && left - 1 > 1) ||
                      (i === right + 1 && right + 1 < totalPages)
                    ) {
                      pages.push("...");
                    }
                  }

                  return pages.map((p, idx) =>
                    p === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-sm text-gray-400 select-none">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[34px] h-[34px] text-sm rounded-xl border transition cursor-pointer ${
                          page === p
                            ? "bg-[#155dfc] text-white border-[#155dfc] font-semibold shadow-sm"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}

                {/* Next */}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          Create / Edit Modal
      ══════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl z-10 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editId ? "Edit Blog Post" : "Add New Blog Post"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editId ? "Update blog post details" : "Fill in the details to create a new blog post"}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">

              {/* ── Section: Basic Info ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText size={12} /> Basic Info
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Title *">
                    <input
                      placeholder="Enter blog title"
                      value={form.title}
                      onChange={(e) => handleTitle(e.target.value)}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Slug *">
                    <input
                      placeholder="auto-generated-slug"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  <div>
                    <Field label="Category *">
                      <input
                        placeholder="e.g. Technology, Lifestyle"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <Field label="Author *">
                    <input
                      placeholder="e.g. John Doe"
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Excerpt" span={2}>
                    <textarea
                      rows={2}
                      placeholder="Brief summary of the blog post"
                      value={form.excerpt}
                      onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                      className={inputCls + " resize-none"}
                    />
                  </Field>

                  <Field label="Content *" span={2}>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      {/* Tabs */}
                      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <button
                          type="button"
                          onClick={() => setContentTab("code")}
                          className={`px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                            contentTab === "code"
                              ? "text-[#155dfc] border-b-2 border-[#155dfc] bg-white dark:bg-gray-800"
                              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                        >
                          &lt;/&gt; Code
                        </button>
                        <button
                          type="button"
                          onClick={() => setContentTab("preview")}
                          className={`px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                            contentTab === "preview"
                              ? "text-[#155dfc] border-b-2 border-[#155dfc] bg-white dark:bg-gray-800"
                              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                        >
                          <Eye size={12} className="inline mr-1" /> Preview
                        </button>
                      </div>

                      {/* Content area */}
                      {contentTab === "code" ? (
                        <textarea
                          rows={8}
                          placeholder="Write HTML content here...&#10;&#10;Example:&#10;<h2>My Heading</h2>&#10;<p>Some <strong>bold</strong> content.</p>"
                          value={form.content}
                          onChange={(e) => setForm({ ...form, content: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 text-sm font-mono text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none resize-none"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-white dark:bg-gray-800 min-h-[200px]">
                          {form.content ? (
                           <div
  className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 
             [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal"
  dangerouslySetInnerHTML={{ __html: form.content }}
/>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Nothing to preview yet. Write some HTML in the Code tab.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>
              </div>

              {/* ── Section: Featured Image ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Upload size={12} /> Featured Image
                </p>

                {/* Thumbnail preview */}
                {(form.featured_image || pendingFile) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {/* Already-uploaded image */}
                    {form.featured_image && !pendingFile && (
                      <div className="relative group w-24 h-24">
                        <img
                          src={form.featured_image}
                          alt="Featured"
                          onClick={() => setPreviewImage(form.featured_image)}
                          className="w-24 h-24 object-cover rounded-xl border border-gray-200 dark:border-gray-600 cursor-zoom-in"
                        />
                        <button
                          type="button"
                          onClick={removeUploadedImage}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}

                    {/* Pending file (local preview) */}
                    {pendingFile && (
                      <div className="relative group w-24 h-24">
                        <img
                          src={URL.createObjectURL(pendingFile)}
                          alt="Pending upload"
                          onClick={() => setPreviewImage(URL.createObjectURL(pendingFile))}
                          className="w-24 h-24 object-cover rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-500 cursor-zoom-in"
                        />
                        <div className="absolute inset-0 bg-violet-500/10 rounded-xl flex items-end justify-center pb-1.5 pointer-events-none">
                          <span className="text-[9px] text-violet-700 dark:text-violet-300 font-bold bg-white/80 dark:bg-gray-800/80 px-1.5 rounded">Pending</span>
                        </div>
                        <button
                          type="button"
                          onClick={removePendingFile}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload trigger */}
                <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 hover:border-[#155dfc] dark:hover:border-[#155dfc] hover:bg-[#155dfc]/5 dark:hover:bg-[#155dfc]/10 rounded-xl cursor-pointer transition group">
                  <Upload size={14} className="text-gray-400 dark:text-gray-500 group-hover:text-[#155dfc] transition shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-[#155dfc] transition">
                    {form.featured_image || pendingFile
                      ? "Replace featured image"
                      : "Upload featured image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </label>
              </div>

              {/* ── Section: Tags ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Tag size={12} /> Tags
                </p>
                <TagInput
                  tags={form.blog_tags}
                  setTags={(t) => setForm({ ...form, blog_tags: t })}
                  placeholder="Add a tag and press Enter"
                />
              </div>

              {/* ── Section: SEO ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Globe size={12} /> SEO
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Meta Title">
                    <input
                      placeholder="SEO Title"
                      value={form.meta_title}
                      onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Canonical URL">
                    <input
                      placeholder="https://..."
                      value={form.canonical_url}
                      onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Meta Description" span={2}>
                    <textarea
                      rows={2}
                      placeholder="SEO Description"
                      value={form.meta_desc}
                      onChange={(e) => setForm({ ...form, meta_desc: e.target.value })}
                      className={inputCls + " resize-none"}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Section: Status ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Status
                </p>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          is_published: e.target.checked,
                          is_draft: e.target.checked ? false : form.is_draft,
                          ...(!e.target.checked && { is_featured: false }), // If unpublishing, remove featured
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#155dfc] focus:ring-[#155dfc]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Published</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_draft}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          is_draft: e.target.checked,
                          is_published: e.target.checked ? false : form.is_published,
                          ...(e.target.checked && { is_featured: false }), // Drafts cannot be featured
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Draft</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          is_featured: e.target.checked,
                          ...(e.target.checked && { is_published: true, is_draft: false }), // Featured implies published
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#155dfc] focus:ring-[#155dfc]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Featured</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl sticky bottom-0 justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="c-btn-add"
              >
                {(submitting || uploading) ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {uploading ? "Uploading..." : editId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editId ? "Update Post" : "Create Post"
                )}
              </button>
              <button
                onClick={closeModal}
                className="px-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      <DeleteModal
        open={!!deleteBlogItem}
        onClose={() => setDeleteBlogItem(null)}
        onConfirm={handleDeleteConfirm}
        parentTitle={`Delete "${deleteBlogItem?.title}"?`}
        childTitle="This will permanently delete this blog post. This action cannot be undone."
        loading={deleteLoading}
      />
    </>
  );
}