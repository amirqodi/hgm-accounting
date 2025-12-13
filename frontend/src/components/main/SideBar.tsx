// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronDown,
  FiMenu,
  FiSun,
  FiMoon,
  FiUsers,
  FiCreditCard,
  FiBox,
  FiDollarSign,
  FiX,
  FiBarChart2,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { GrMoney } from "react-icons/gr";

const menu = [
  {
    title: "مخاطبین",
    icon: <FiUsers />,
    items: [
      { label: "مشتریان", href: "/contacts" },
      { label: "فروشندگان", href: "/contacts/vendors" },
      { label: "سهامداران", href: "/contacts/shareholders" },
      { label: "افزودن مخاطب", href: "/contacts/add" },
    ],
  },
  {
    title: "بانکداری",
    icon: <FiCreditCard />,
    items: [
      { label: "افزودن حساب بانکی", href: "/banking/add" },
      { label: "لیست حساب‌ها", href: "/banking" },
      { label: "لیست تنخواه", href: "/cash-holder" },
      { label: "افزودن تنخواه", href: "/cash-holder/add" },
    ],
  },
  {
    title: "کالا و خدمات",
    icon: <FiBox />,
    items: [
      { label: "افزودن کالا/خدمت", href: "/products/add" },
      { label: "لیست کالاها", href: "/products" },
      { label: "لیست خدمات", href: "/services" },
      { label: "مدیریت دسته‌بندی‌ها", href: "/categories" },
    ],
  },
  {
    title: "درآمد و هزینه",
    icon: <FiDollarSign />,
    items: [
      { label: "ثبت تراکنش", href: "/transactions/add" },
      { label: "لیست تراکنش‌ها", href: "/transactions" },
    ],
  },
  {
    title: "ودیعه",
    icon: <GrMoney />,
    items: [
      { label: "ثبت ودیعه", href: "/deposit/add" },
      { label: "لیست ودیعه ها", href: "/deposit" },
    ],
  },
  {
    title: "گزارش‌ها",
    icon: <FiBarChart2 />,
    items: [{ label: "ترازنامه", href: "/reports/balance-sheet" }],
  },
  {
    title: "تنظیمات",
    icon: <FiSettings />,
    items: [
      { label: "تنظیمات سیستم", href: "/settings" },
      { label: "بکاپ و بازیابی", href: "/settings/backup" },
    ],
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});
  const [darkMode, setDarkMode] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedDarkMode = localStorage.getItem("darkMode");
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode === "true");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const toggleMenu = (index: number) => {
    setOpenMenus((prev) => ({ ...prev, [index]: !prev[index] }));
  };
  const handleLogOut = async () => {
    Cookies.remove("auth_token");
    router.push("/auth");
  };

  return (
    <>
      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1.25 right-4 z-50 p-2 
                    text-black dark:text-white ${!isOpen ? "text-white" : ""}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <FiX size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <FiMenu size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ duration: 0.3 }}
            className="static top-0 right-0 w-64 min-h-screen p-4 z-40 overflow-y-auto shadow-lg 
                       bg-box text-foreground"
            dir="rtl"
          >
            <div className="mb-6 text-center">
              <Link href={"/"} className="text-2xl font-bold text-primary">
                داشبورد
              </Link>
            </div>

            {menu.map((section, idx) => (
              <div key={idx} className="mb-4">
                <button
                  onClick={() => toggleMenu(idx)}
                  className="flex items-center justify-between w-full font-semibold text-lg px-2 py-2 
                             rounded transition-colors 
                             hover:bg-background border-transparent border-r-4 hover:border-primary"
                >
                  <span className="flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </span>
                  <motion.span
                    animate={{ rotate: openMenus[idx] ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FiChevronDown />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {openMenus[idx] && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ps-4 mt-2 space-y-1 text-sm"
                    >
                      {section.items.map((item, i) => (
                        <li key={i}>
                          <Link href={item.href}>
                            <span
                              className={`block px-2 py-1 rounded cursor-pointer transition-colors 
                                          border-r-4 
                                          ${
                                            pathname === item.href
                                              ? "bg-background border-primary"
                                              : "border-transparent"
                                          } 
                                          hover:bg-background hover:border-primary`}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Dark Mode Toggle */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={handleLogOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 hover:shadow-md transition-all duration-200"
              >
                <FiLogOut className="w-5 h-5" />
                خروج از حساب
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded bg-primary text-white hover:brightness-110 hover:text-white"
              >
                {darkMode ? <FiMoon /> : <FiSun className="text-black" />}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
