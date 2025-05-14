"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { state, toggleSidebar } = useSidebar();
  const [activePath, setActivePath] = useState<string>("");
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setActivePath(path);

      // Auto-open dropdowns whose subitems match the path
      const newOpenStates: Record<string, boolean> = {};
      items.forEach((item) => {
        if (item.items?.some((sub) => sub.url === path)) {
          newOpenStates[item.title] = true;
        }
      });
      setOpenStates((prev) => ({ ...prev, ...newOpenStates }));
    }
  }, [items]);

  const toggleOpen = (title: string) => {
    setOpenStates((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isItemActive = (url: string) => activePath === url;

  return (
    <SidebarGroup>
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mb-4"
      >
        <div className="flex aspect-square size-50 items-center justify-center rounded-lg text-sidebar-primary-foreground">
          <img src="/img/rps.png" className="w-full h-auto max-w-[160px]" />
        </div>
      </SidebarMenuButton>

      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;
          const isOpen = openStates[item.title] || false;

          // If no subitems, create a simple menu item
          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

      
          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={(e) => {
                      if (state === "collapsed") {
                        e.preventDefault();
                        toggleSidebar();
                      } else {
                        e.preventDefault();
                        toggleOpen(item.title); 
                      }
                    }}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight
                      className={`ml-auto transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {(item.items || []).map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
