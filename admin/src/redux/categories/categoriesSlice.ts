import { createSlice } from "@reduxjs/toolkit";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  Category,
} from "./categoriesApi";

interface CategoryState {
  loading: boolean;
  categories: Category[]; // tree
  error: string | null;
}

const initialState: CategoryState = {
  loading: false,
  categories: [],
  error: null,
};

/* ── helpers ── */

/** Deep-insert a new category into the tree */
function insertIntoTree(tree: Category[], newCat: Category): Category[] {
  if (!newCat.parentId) {
    return [...tree, { ...newCat, children: [] }];
  }
  return tree.map((node) => {
    if (node.id === newCat.parentId) {
      return {
        ...node,
        children: [...(node.children ?? []), { ...newCat, children: [] }],
      };
    }
    return {
      ...node,
      children: insertIntoTree(node.children ?? [], newCat),
    };
  });
}

/** Deep-update a node in the tree */
function updateInTree(tree: Category[], updated: Category): Category[] {
  return tree.map((node) => {
    if (node.id === updated.id) return { ...updated, children: node.children };
    return { ...node, children: updateInTree(node.children ?? [], updated) };
  });
}

/** Deep-remove a node by id */
function removeFromTree(tree: Category[], id: string): Category[] {
  return tree
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: removeFromTree(node.children ?? [], id),
    }));
}

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(getCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(getCategories.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch categories";
      })

      // CREATE
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = insertIntoTree(state.categories, action.payload);
      })
      .addCase(createCategory.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Create failed";
      })

      // UPDATE
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = updateInTree(state.categories, action.payload);
      })
      .addCase(updateCategory.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Update failed";
      })

      // DELETE
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = removeFromTree(state.categories, action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Delete failed";
      });
  },
});

export default categoriesSlice.reducer;
