"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/redux/categories/categoriesApi";

import { Pencil, Trash2, Check, X } from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";


/* ---------- Skeleton Loader ---------- */

const Skeleton = () => (
  <div className="bg-white rounded-xl shadow border divide-y animate-pulse">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="p-4 flex justify-between">
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
        <div className="flex gap-3">
          <div className="h-4 w-6 bg-gray-200 rounded" />
          <div className="h-4 w-6 bg-gray-200 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export default function CategoriesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading } = useSelector(
    (state: RootState) => state.categories
  );
  console.log("Categories from Redux:", categories);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    dispatch(getCategories());
  }, []);

  /* ---------- Actions ---------- */

  const handleCreate = () => {
    if (!name.trim()) return;

    dispatch(
      createCategory({
        category_name: name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        is_active: true,
      })
    );

    setName("");
  };

  const startEdit = (id: number, current: string) => {
    setEditId(id);
    setEditName(current);
  };

  const saveEdit = () => {
    if (!editName.trim() || editId === null) return;

    dispatch(
      updateCategory({
        id: editId,
        category_name: editName,
        slug: editName.toLowerCase().replace(/\s+/g, "-"),
      })
    );

    setEditId(null);
    setEditName("");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  /* ---------- UI ---------- */

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold whitespace-nowrap">
          Categories
        </h1>

        <div className="flex gap-3 bg-white p-4 rounded-xl shadow border w-full max-w-xl">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category name"
            className="flex-1 border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </div>
      {/* <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-6">Categories</h1>

        <div className="flex gap-3 mb-6 bg-white p-4 rounded-xl shadow border">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category name"
            className="flex-1 border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div> */}

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Empty */}
      {!loading && categories?.length === 0 && (
        <div className="bg-white p-10 rounded-xl shadow border text-center text-gray-400">
          No categories yet
        </div>
      )}

      {/* Table */}
      {!loading && categories.length > 0 && (
        <div className="bg-white rounded-xl shadow border overflow-hidden">

          <table className="w-full">

            <thead className="bg-gray-100 text-left text-sm sticky top-0">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories?.map((cat) => (
                <tr key={cat.id} className="border-t hover:bg-gray-50">

                  <td className="p-3">
                    {editId === cat.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border px-3 py-1 rounded-lg w-full"
                      />
                    ) : (
                      <span className="font-medium">
                        {cat.category_name}
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-right flex gap-2 justify-end">

                    {editId === cat.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                        >
                          <Check size={18} />
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          startEdit(cat.id, cat.category_name)
                        }
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                      >
                        <Pencil size={18} />
                      </button>
                    )}

                    <DeleteModal
    onConfirm={() => dispatch(deleteCategory(cat.id))}
    parentTitle="Delete category?"
    childTitle="This will permanently delete this category."
  />

                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
    </>
  );
}
