"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { NavUser } from "@/components/nav-user";
import { NavMain } from "@/components/nav-main";
import { Building2, Files, LayoutDashboard } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/user/dashboard",
      icon: LayoutDashboard,
      items: [],
    },
    {
      title: "Company Info",
      url: "#",
      icon: Building2,
      items: [
        { title: "Create Company", url: "/user/companyform" },
        { title: "Company Record", url: "/user/companyrecord" },
        { title: "Create Contact", url: "/user/contactform" },
        { title: "Contact Record", url: "/user/contactrecord" },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: Files,
      items: [
        { title: "Create Certificate", url: "/user/certificateform" },
        { title: "Certificate Record", url: "/user/certificaterecord" },
        { title: "Create Service", url: "/user/serviceform" },
        { title: "Service Record", url: "/user/servicerecord" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const updatedNavMain = React.useMemo(() => {
    return data.navMain.map((item) => ({
      ...item,
      isActive: pathname === item.url,
      items: item.items?.map((subItem) => ({
        ...subItem,
        isActive: pathname === subItem.url,
      })),
    }));
  }, [pathname]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={updatedNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
