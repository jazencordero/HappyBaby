"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, Users, Settings, ListChecks } from "lucide-react";

import type { BabyRole } from "@/lib/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: typeof ListChecks;
};

type Props = {
  babyId: string;
  babyName: string;
  role: BabyRole;
};

export function BabySidebar({ babyId, babyName, role }: Props) {
  const pathname = usePathname();
  const base = `/babies/${babyId}`;

  const items: NavItem[] = [
    { href: base, label: "Records", icon: ListChecks },
    { href: `${base}/doctor-visit`, label: "Doctor Visit", icon: Stethoscope },
    ...(role === "parent"
      ? [
          { href: `${base}/caregivers`, label: "Caregivers", icon: Users },
          { href: `${base}/settings`, label: "Settings", icon: Settings },
        ]
      : []),
  ];

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-3">
        <p className="truncate font-heading text-sm font-semibold">{babyName}</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  item.href === base ? pathname === base : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
