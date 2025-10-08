import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { CalendarCheck, Heart, LineChart, Users } from 'lucide-react';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Github } from 'lucide-react';
import AppLogo from './app-logo';
import { useI18n } from '@/lib/i18n';

const mainNavItems: NavItem[] = [
    {
        title: 'Vecka',
        href: '/week-status',
        icon: CalendarCheck,
    },
    {
        title: 'Groups',
        href: '/groups',
        icon: Users,
    },
    {
        title: 'Alignment',
        href: '/alignment',
        icon: LineChart,
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/filipsjolanderr/matlada',
        icon: Github,
    },
    {
        title: 'Made by Filip Sjölander',
        href: 'https://github.com/filipsjolanderr',
        icon: Heart,
    },
];

export function AppSidebar() {
    const { t } = useI18n();
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={[
                    { ...footerNavItems[0], title: t('Repository') },
                    { ...footerNavItems[1], title: t('Made by Filip Sjölander') },
                ]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
