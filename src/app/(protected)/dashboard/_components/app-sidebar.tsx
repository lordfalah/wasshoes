"use client";

import * as React from "react";
import {
  ArrowUpCircleIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  Package,
  SearchIcon,
  SettingsIcon,
  ShieldUser,
  Store,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavDocuments } from "./nav-documents";
import { NavUser } from "./nav-user";
import { NavSecondaryTemp } from "./nav-secondary";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { NavItem } from "@/types";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/images/avatar-fallback.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: Users,
    },

    {
      title: "Roles",
      url: "/dashboard/role",
      icon: ShieldUser,
    },

    {
      title: "Store",
      icon: Store,
      url: "/dashboard/store",

      items: [
        {
          title: "Create",
          url: "/dashboard/store/build",
        },
        {
          title: "View",
          url: "/dashboard/store",
        },
      ],
    },

    {
      title: "Package",
      icon: Package,
      url: "/dashboard/package",

      items: [
        {
          title: "Create",
          url: "/dashboard/package/build",
        },
        {
          title: "View",
          url: "/dashboard/package",
        },
      ],
    },

    {
      title: "Projects",
      url: "#",
      icon: FolderIcon,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: CameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileCodeIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/setting",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
    {
      title: "Search",
      url: "#",
      icon: SearchIcon,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: DatabaseIcon,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardListIcon,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileIcon,
    },
  ],
};

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & { role?: UserRole }) {
  const filteredNavMain = filterNavItemsByRole(
    props.role,
    data.navMain as never,
  );

  const filteredNavSecondary = filterNavItemsByRole(
    props.role,
    data.navSecondary as never,
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Wasshoes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavMain.length > 0 && (
          <NavMain items={filteredNavMain as never} />
        )}
        <NavDocuments items={data.documents} />
        {filteredNavSecondary.length > 0 && (
          <NavSecondaryTemp items={data.navSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

function filterNavItemsByRole(
  role: UserRole | undefined,
  items: NavItem[],
): NavItem[] {
  if (role === UserRole.SUPERADMIN) {
    return items;
  } else if (role === UserRole.ADMIN) {
    return items.filter((item) =>
      ["Dashboard", "Settings"].includes(item.title),
    );
  } else if (role === UserRole.USER) {
    return items.filter((item) => item.title === "Settings");
  } else {
    return [];
  }
}
