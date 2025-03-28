"use client";

import * as React from "react";
import {
  AudioWaveform,
  CirclePlay,
  Command,
  File,
  GalleryVerticalEnd,
  Settings,
  FolderKanban,
  CircleUser,
  
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Admin",
    email: "admin@admin.com",
    avatar: "",
  },
  teams: [
    {
      name: "Spriers",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "OSCorp",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
        title: "Users",
        url: "#",
        icon: CircleUser,
        items: [
          {
            title: "Create user",
            url: "admin-register",
          },
          {
            title: "User details",
            url: "u",
          },
          
        ],
      },
    {
      title: "Documentation",
      url: "#",
      icon: File,
      items: [
        {
          title: "Certificate",
          url: "add-category",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "add model",
          url: "add-model",
        },
        
      ],
    },
    
  ],
  
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isClient, setIsClient] = React.useState(false);
  const [activePath, setActivePath] = React.useState("");

  // Update active state on the client side
  React.useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client side
    setActivePath(window.location.pathname);
  }, []);

  // Modify navMain items based on the current active path
  const updatedNavMain = React.useMemo(
    () =>
      data.navMain.map((item) => ({
        ...item,
        isActive: isClient && activePath === item.items[0].url, // Check active path for the first item
        items: item.items.map((subItem) => ({
          ...subItem,
          isActive: isClient && activePath === subItem.url, // Check active path for sub-items
        })),
      })),
    [isClient, activePath]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={updatedNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
