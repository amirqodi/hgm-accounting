"use client";
import { useState, useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { IoIosArrowDown } from "react-icons/io";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  parent: number | null;
  children?: Category[];
}

interface TreeSelectProps {
  name: string;
  label?: string;
  placeholder?: string;
}

export default function CategoryTreeSelect({
  name,
  label,
  placeholder = "انتخاب دسته‌بندی",
}: TreeSelectProps) {
  const { control, setValue } = useFormContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const token = Cookies.get("auth_token");

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setCategories(buildTree(data));
    };
    fetchCategories();
  }, [token]);

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

  const findLabel = (
    cats: Category[],
    id: number | undefined
  ): string | undefined => {
    for (const c of cats) {
      if (c.id === id) return c.name;
      if (c.children) {
        const found = findLabel(c.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const handleSelect = (id: number) => {
    setValue(name, id);
    setOpen(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-medium mb-1 block">{label}</label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className={cn(
                "h-11 w-full border px-3 rounded-lg bg-box text-foreground flex items-center justify-between",
                "focus:ring-2 focus:ring-primary focus:outline-none",
                fieldState.error
                  ? "border-destructive" // وقتی ارور وجود دارد
                  : "border border-border/20" // حالت پیش‌فرض
              )}
            >
              <span>{findLabel(categories, field.value) || placeholder}</span>
              <motion.span
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <IoIosArrowDown />
              </motion.span>
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-20 mt-1 w-full bg-box border border-border rounded-lg shadow-lg max-h-64 overflow-auto"
                >
                  <CategoryTreeList
                    categories={categories}
                    onSelect={handleSelect}
                    level={0}
                  />
                </motion.div>
              )}
              {fieldState.error && (
                <p className="mt-1 text-xs text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </AnimatePresence>
          </div>
        )}
      />
    </div>
  );
}

function CategoryTreeList({
  categories,
  onSelect,
  level,
}: {
  categories: Category[];
  onSelect: (id: number) => void;
  level: number;
}) {
  return (
    <div className="flex flex-col">
      {categories.map((cat, index) => (
        <CategoryTreeNode
          key={index}
          category={cat}
          onSelect={onSelect}
          level={level}
        />
      ))}
    </div>
  );
}

function CategoryTreeNode({
  category,
  onSelect,
  level,
}: {
  category: Category;
  onSelect: (id: number) => void;
  level: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-muted/15"
        style={{ paddingRight: `${level * 16}px` }}
        onClick={() =>
          !hasChildren ? onSelect(category.id) : setExpanded(!expanded)
        }
      >
        <div className="flex flex-row-reverse items-center gap-1 p-2">
          {hasChildren &&
            (expanded ? (
              <IoIosArrowDown size={16} className="transition-transform" />
            ) : (
              <IoIosArrowDown className="rotate-[-90deg] transition-transform" />
            ))}
          <span>{category.name}</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CategoryTreeList
              categories={category.children!}
              onSelect={onSelect}
              level={level + 1}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
