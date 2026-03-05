"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo, startTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  ListIcon,
  UserCircleIcon,
} from "../icons/index";
import {
  Crown,
  Database,
  ImageIcon,
  NewspaperIcon,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  StarIcon,
  Tags,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/rootReducer";
import { hasReadPermission } from "@/lib/utils/permissions";

type NavItem = {
  name: string;
  /** The permission module name that controls visibility of this item.
   *  Omit for group headers (items with only subItems).
   *  If SUPERADMIN role, all items are visible regardless. */
  moduleName?: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    moduleName?: string; // permission module name for this sub-item
    pro?: boolean;
    new?: boolean;
    icon?: React.ReactNode;
  }[];
};

/** These MUST match the `module` values stored in the DB (AdminPermission.module) */
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    moduleName: "Dashboard",
    path: "/",
  },
  {
    icon: <Tags />,
    name: "Categories",
    moduleName: "Categories",
    path: "/categories",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Products",
    moduleName: "Products",
    path: "/products",
  },
  {
    icon: <ShoppingCart />,
    name: "Orders",
    moduleName: "Orders",
    path: "/orders",
  },
  {
    icon: <UserCircleIcon />,
    name: "Users",
    moduleName: "Users",
    path: "/users",
  },
  {
    icon: <StarIcon />,
    name: "Reviews",
    moduleName: "Reviews",
    path: "/reviews",
  },
  {
    icon: <RefreshCw size={18} />,
    name: "Returns",
    moduleName: "Returns",
    path: "/returns",
  },
  {
    icon: <NewspaperIcon size={18} />,
    name: "Blog",
    moduleName: "Blog",
    path: "/blog",
  },
  {
    name: "Master",
    icon: <Settings />,
    // No top-level moduleName — visibility is derived from sub-items
    subItems: [
      {
        name: "Manage Logo",
        path: "/logo",
        moduleName: "manage logo",
        pro: false,
        icon: <ImageIcon size={18} />,
      },
      {
        name: "User Permission",
        path: "/userPermission",
        moduleName: "User Permission",
        pro: false,
        icon: <ShieldCheck size={18} />,
      },
    ],
  },
];

const othersItems: NavItem[] = [];

type LogoData = { light_url: string | null; favicon_url: string | null } | null;

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  // Track mounting with a ref; set it inside a deferred effect so it doesn't
  // trigger a re-render and avoids the "setState in effect" lint rule.
  const mountedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    startTransition(() => {
      mountedRef.current = true;
      setMounted(true);
    });
  }, []);
  const [logoData, setLogoData] = useState<LogoData>(null);

  // ── Read current user + permissions from Redux ─────────────────────────────
  const { user } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role === "SUPERADMIN";
  // Memoize so array reference is stable between renders
  const userPermissions = useMemo(() => user?.permissions ?? [], [user?.permissions]);

  /**
   * Decide whether a top-level nav item should be visible.
   * - SUPERADMINs see everything.
   * - Items with subItems: visible only if at least one sub-item is visible.
   * - Items with a moduleName: visible if the admin has canRead for that module.
   * - Items without a moduleName and without subItems: always visible.
   */
  const isNavItemVisible = useCallback(
    (nav: NavItem): boolean => {
      if (isSuperAdmin) return true;

      if (nav.subItems) {
        // Visible if any sub-item is accessible
        return nav.subItems.some((sub) =>
          sub.moduleName
            ? hasReadPermission(userPermissions, sub.moduleName)
            : true
        );
      }

      if (nav.moduleName) {
        return hasReadPermission(userPermissions, nav.moduleName);
      }

      // No restriction defined → show
      return true;
    },
    [isSuperAdmin, userPermissions]
  );

  /**
   * Filter sub-items that the admin can see.
   */
  const getVisibleSubItems = useCallback(
    (
      subItems: NonNullable<NavItem["subItems"]>
    ): NonNullable<NavItem["subItems"]> => {
      if (isSuperAdmin) return subItems;
      return subItems.filter((sub) =>
        sub.moduleName
          ? hasReadPermission(userPermissions, sub.moduleName)
          : true
      );
    },
    [isSuperAdmin, userPermissions]
  );

  // Logo fetch — runs on pathname change and on custom 'logo-updated' event
  useEffect(() => {
    const fetchLogoData = () => {
      fetch("/api/logo")
        .then((r) => r.json())
        .then((j) => setLogoData(j.data))
        .catch(() => {});
    };

    fetchLogoData();
    window.addEventListener("logo-updated", fetchLogoData);
    return () => window.removeEventListener("logo-updated", fetchLogoData);
  }, [pathname]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => path === pathname,
    [pathname]
  );

  // Auto-open submenu when a sub-route is active
  useEffect(() => {
    let matched: { type: "main" | "others"; index: number } | null = null;
    (["main", "others"] as const).forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              matched = { type: menuType, index };
            }
          });
        }
      });
    });

    // Use startTransition to defer the state update, avoiding sync setState-in-effect
    startTransition(() => {
      setOpenSubmenu(matched);
    });
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight ?? 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => {
    // Filter to only visible items, then build a new array with filtered subItems
    const visibleItems = items
      .filter((nav) => isNavItemVisible(nav))
      .map((nav) =>
        nav.subItems
          ? { ...nav, subItems: getVisibleSubItems(nav.subItems) }
          : nav
      )
      .filter((nav) => !nav.subItems || nav.subItems.length > 0);

    return (
      <ul className="flex flex-col gap-4">
        {visibleItems.map((nav, index) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group  ${
                  openSubmenu?.type === menuType &&
                  openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={` ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text`}>{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`] ?? 0}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          {subItem.icon && (
                            <span className="flex-shrink-0">{subItem.icon}</span>
                          )}
                          <span>{subItem.name}</span>
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-4 flex w-full ${
          !isExpanded && !isHovered ? "lg:justify-center px-4" : "justify-start px-6"
        }`}
      >
        <Link href="/" className="w-full flex items-center">
          {isExpanded || isHovered || isMobileOpen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="w-full object-cover"
              src={logoData?.light_url ?? "/images/logo/e-comm-logo-resize.png"}
              alt="Logo"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoData?.favicon_url ?? logoData?.light_url ?? "/icon.png"}
              alt="Logo"
              className="w-12 h-12 mx-auto object-cover"
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {renderMenuItems(navItems, "main")}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
