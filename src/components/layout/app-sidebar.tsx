"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Map,
  Navigation,
  BookOpen,
  Settings2,
  Ellipsis,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navigationGroups = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        title: "Campus Map",
        icon: Map,
        href: "/campus-map",
      },
      {
        title: "Navigation",
        icon: Navigation,
        href: "/navigation",
      },
      {
        title: "Campus Directory",
        icon: BookOpen,
        href: "/directory",
      },
    ],
  },
  {
    label: "PREFERENCES",
    items: [
      {
        title: "Settings",
        icon: Settings2,
        href: "/settings",
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* BRAND */}
      <SidebarHeader className="px-3 pt-4 pb-3">
        <div className="flex h-12 items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-foreground text-sm font-bold text-sidebar">
            GU
          </div>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-semibold tracking-wide text-sidebar-foreground">
              GALGOTIAS
            </h2>

            <p className="text-[10px] tracking-[0.12em] text-sidebar-foreground/55">
              INDOOR NAVIGATOR
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* NAVIGATION */}
      <SidebarContent className="px-2 pt-3">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="px-3 pb-2 text-[10px] font-semibold tracking-[0.12em] text-sidebar-foreground/45">
              {group.label}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-10 rounded-lg px-3 text-[13px] font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                        render={<Link href={item.href} />}
                      >
                        <Icon
                          className="size-[17px] shrink-0"
                          strokeWidth={1.8}
                        />

                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* USER PROFILE */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-1 py-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-foreground text-sm font-semibold text-sidebar">
            U
          </div>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">
              Campus User
            </p>

            <p className="text-[11px] text-sidebar-foreground/50">Student</p>
          </div>

          <Ellipsis className="size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
