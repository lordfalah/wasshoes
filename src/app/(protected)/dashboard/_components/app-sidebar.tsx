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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <span className="text-base font-semibold">Acme Inc.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondaryTemp items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <React.Suspense fallback={<p>Loadingg.....</p>}>
          <NavUser user={data.user} />
        </React.Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
