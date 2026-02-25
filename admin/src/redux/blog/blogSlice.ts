import { createSlice } from "@reduxjs/toolkit";
import {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadBlogImage,
  Blog,
} from "./blogApi";

interface BlogState {
  loading: boolean;
  submitting: boolean;
  uploading: boolean;
  blogs: Blog[];
  blog: Blog | null;
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  error: string | null;
}

const initialState: BlogState = {
  loading: false,
  submitting: false,
  uploading: false,
  blogs: [],
  blog: null,
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  error: null,
};

const blogSlice = createSlice({
  name: "blogs",
  initialState,
  reducers: {
    clearBlog: (state) => {
      state.blog = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // ── GET list ────────────────────────────────────────────
      .addCase(getBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload.data;
        state.totalRecords = action.payload.totalRecords;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(getBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed";
      })

      // ── GET single ─────────────────────────────────────────
      .addCase(getBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.blog = action.payload;
      })
      .addCase(getBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed";
        state.blog = null;
      })

      // ── CREATE ──────────────────────────────────────────────
      .addCase(createBlog.pending, (state) => {
        state.submitting = true;
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.submitting = false;
        state.blogs.unshift(action.payload);
        state.totalRecords += 1;
      })
      .addCase(createBlog.rejected, (state) => {
        state.submitting = false;
      })

      // ── UPDATE ──────────────────────────────────────────────
      .addCase(updateBlog.pending, (state) => {
        state.submitting = true;
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.submitting = false;
        const i = state.blogs.findIndex((b) => b.id === action.payload.id);
        if (i !== -1) state.blogs[i] = action.payload;
      })
      .addCase(updateBlog.rejected, (state) => {
        state.submitting = false;
      })

      // ── DELETE ──────────────────────────────────────────────
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.blogs = state.blogs.filter((b) => b.id !== action.payload);
        state.totalRecords -= 1;
      })

      // ── UPLOAD IMAGE ────────────────────────────────────────
      .addCase(uploadBlogImage.pending, (state) => {
        state.uploading = true;
      })
      .addCase(uploadBlogImage.fulfilled, (state) => {
        state.uploading = false;
      })
      .addCase(uploadBlogImage.rejected, (state) => {
        state.uploading = false;
      });
  },
});

export const { clearBlog } = blogSlice.actions;
export default blogSlice.reducer;
