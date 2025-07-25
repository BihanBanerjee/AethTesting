// src/app/(protected)/dashboard/app-sidebar.tsx
'use client'

import { Button } from "@/components/ui/button"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  useSidebarContext
} from "@/components/ui/custom-sidebar"
import useProject from "@/hooks/use-project"
import { cn } from "@/lib/utils"
import { Bot, Code2, CreditCard, LayoutDashboard, Plus, Presentation } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
    {
        title: "Dashboard",
        url: '/dashboard',
        icon: LayoutDashboard
    },
    {
        title: "Q&A",
        url: '/qa',
        icon: Bot
    },
    {
        title: "Code Assistant", // New item
        url: '/code-assistant',
        icon: Code2
    },
    {
        title: "Meetings",
        url: '/meetings',
        icon: Presentation
    },
    {
        title: "Billing",
        url: '/billing',
        icon: CreditCard
    }
]

export function AppSidebar() {
    const pathname = usePathname()
    const { isExpanded } = useSidebarContext();
    const { projects, projectId, setProjectId } = useProject()
    
    return (
        <Sidebar>
            <SidebarHeader className="pb-6">
                <div className="flex items-center gap-3">
                    {/* Logo container with enhanced visibility */}
                    <div className="relative rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 p-1 border border-white/30 shadow-lg">
                        <Image 
                          src="/aetheria-logo.svg" 
                          alt="logo" 
                          width={56} 
                          height={56} 
                          className="filter drop-shadow-lg animate-pulse-shadow" 
                          style={{ filter: "drop-shadow(0 0 8px rgba(167, 139, 250, 0.7))" }}
                        />
                    </div>
                    {isExpanded && (
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 bg-size-200 animate-gradient">
                            Aetheria
                        </h1>
                    )}
                </div>
            </SidebarHeader>
            
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton 
                                        asChild
                                        active={pathname === item.url}
                                    >
                                        <Link href={item.url} className="flex items-center w-full h-full">
                                            <item.icon className="mr-2 h-4 w-4" />
                                            {isExpanded && <span>{item.title}</span>}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {projects?.map(project => (
                                <SidebarMenuItem key={project.name}>
                                    <SidebarMenuButton 
                                        onClick={() => setProjectId(project.id)}
                                        active={project.id === projectId}
                                        className="w-full h-full"
                                    >
                                        <div className="flex items-center gap-2 w-full h-full">
                                            <div className={cn('rounded-sm border size-6 flex items-center justify-center text-sm bg-indigo-600/70 text-white flex-shrink-0', 
                                            {'bg-white/20 backdrop-blur-md text-white' : project.id === projectId})}>
                                                {project.name[0]}
                                            </div>
                                            {isExpanded && (
                                                <span className="flex-1 text-left truncate">{project.name}</span>
                                            )}
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            
                            {isExpanded && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="w-full h-full">
                                        <Link href={'/create'} className="w-full h-full flex items-center pl-1 pr-2 py-2">
                                            <Button 
                                              size='sm' 
                                              variant='outline' 
                                              className="w-full h-auto py-2 px-3 border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                                            > 
                                                <Plus className="h-4 w-4" /> 
                                                <span>Create Project</span>
                                            </Button>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}