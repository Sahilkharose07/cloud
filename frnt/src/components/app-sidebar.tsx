"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AudioWaveform, CirclePlay, Command, File, GalleryVerticalEnd, Settings } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"


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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const navMain = React.useMemo(
    () => [
      {
        title: "Dashboard",
        url: "#",
        icon: CirclePlay,
        items: [
          {
            title: "Certificate Table",
            url: "/certificateTable",
          },
          {
            title: "Service",
            url: "/service",
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
            url: "/certificate",
          },
          {
            title: "Service",
            url: "/service",
          },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings,
        items: [
          {
            title: "General",
            url: "#",
          },
          {
            title: "Team",
            url: "#",
          },
        ],
      },
    ],
    [pathname],
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

