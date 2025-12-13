"use client";

import { JSX, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/TextArea";
import Cookies from "js-cookie";

interface Category {
  id: number;
  name: string;
  description?: string;
  parent: number | null;
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", description: "", parent: 0 });
  const [editing, setEditing] = useState<number | null>(null);
  const token = Cookies.get("auth_token");

  // ---------------- API ----------------
  // گرفتن لیست دسته‌بندی‌ها
  const fetchCategories = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/categories/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    setCategories(buildTree(data));
  };

  // ایجاد
  const createCategory = async () => {
    const payload: any = {
      name: form.name,
      parent: form.parent || null,
    };

    if (form.description.trim()) {
      payload.description = form.description;
    }

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    await fetchCategories();
  };

  // ویرایش
  const updateCategory = async (id: number) => {
    const payload: any = {
      name: form.name,
      parent: form.parent || null,
    };

    if (form.description.trim()) {
      payload.description = form.description;
    }

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${id}/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    await fetchCategories();
  };

  // حذف
  const deleteCategory = async (id: number) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchCategories();
  };

  // ---------------- Helpers ----------------
  // ساخت درخت از API (که به صورت flat میاد)
  const buildTree = (flat: Category[]): Category[] => {
    const map = new Map<number, Category>();
    flat.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));

    const roots: Category[] = [];
    map.forEach((cat) => {
      if (cat.parent && map.has(cat.parent)) {
        map.get(cat.parent)!.children!.push(cat);
      } else {
        roots.push(cat);
      }
    });
    return roots;
  };

  // ---------------- فرم ----------------
  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await updateCategory(editing);
      setEditing(null);
    } else {
      await createCategory();
    }
    setForm({ name: "", description: "", parent: 0 });
  };

  const handleDelete = async (id: number) => {
    await deleteCategory(id);
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || "",
      parent: cat.parent || 0,
    });
  };

  const renderCategoryOptions = (
    cats: Category[],
    level = 0
  ): JSX.Element[] => {
    return cats.flatMap((cat) => [
      <option key={cat.id} value={cat.id}>
        {"—".repeat(level)} {cat.name}
      </option>,
      ...(cat.children ? renderCategoryOptions(cat.children, level + 1) : []),
    ]);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">مدیریت دسته‌بندی‌ها</h1>

      {/* فرم */}
      <div className="bg-box p-4 rounded-xl shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">
          {editing ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید"}
        </h2>
        <div className="space-y-3">
          <Input
            placeholder="نام دسته‌بندی"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            placeholder="توضیحات (اختیاری)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select
            className="w-full border rounded-md px-3 py-2 bg-box"
            value={form.parent}
            onChange={(e) =>
              setForm({ ...form, parent: Number(e.target.value) })
            }
          >
            <option value={0}>بدون والد</option>
            {renderCategoryOptions(categories)}
          </select>

          <Button onClick={handleSubmit} className="w-full">
            {editing ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}
          </Button>
        </div>
      </div>

      {/* لیست دسته‌بندی‌ها */}
      <div className="bg-box p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-3">دسته‌بندی‌ها</h2>
        <CategoryTree
          categories={categories}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

// ---------------- درخت ----------------
function CategoryTree({
  categories,
  onEdit,
  onDelete,
}: {
  categories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <ul className="space-y-2">
      {categories.map((cat) => (
        <CategoryNode
          key={cat.id}
          category={cat}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function CategoryNode({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <li>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-muted/40 p-2 rounded-md"
      >
        <div className="flex items-center gap-2">
          {category.children && category.children.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500"
            >
              {expanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          )}
          <span className="font-medium">{category.name}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(category)}
            className="text-blue-500 hover:text-blue-700"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && category.children && category.children.length > 0 && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pr-6 mt-2 space-y-2"
          >
            {category.children.map((child) => (
              <CategoryNode
                key={child.id}
                category={child}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}
