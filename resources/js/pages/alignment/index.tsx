import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useI18n } from '@/lib/i18n';
import { BreadcrumbItem } from '@/types';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';

type StatusValue = 'Lunchbox' | 'Buying' | 'Home' | null;

type UserDayRow = {
    id: number;
    user_id: number;
    iso_week: string;
    weekday: number; // 1-5
    status: StatusValue;
    arrival_time: string | null;
    location: string | null;
};

type PageProps = {
    week: string;
    activeWeekday: number;
    users: Array<{ id: number; name: string; email: string; avatar?: string | null }>;
    statuses: UserDayRow[];
};

function buildBreadcrumbs(t: (k: string) => string): BreadcrumbItem[] {
    return [
        { title: t('Alignment'), href: '/alignment' },
    ];
}

function useWeekdaysLabels(t: (k: string, fallback?: string) => string): string[] {
    return [t('Monday', 'Monday'), t('Tuesday', 'Tuesday'), t('Wednesday', 'Wednesday'), t('Thursday', 'Thursday'), t('Friday', 'Friday')];
}

export default function AlignmentIndex() {
    const { t } = useI18n();
    const { week, statuses, users } = usePage<PageProps>().props;
    const breadcrumbs = buildBreadcrumbs(t);
    const weekdays = useWeekdaysLabels(t);
    const displayWeek = React.useMemo(() => {
        const parts = week.split('-W');
        return parts.length === 2 ? `${parts[1]}` : week;
    }, [week]);

    const grouped = React.useMemo(() => {
        const base = new Map<number, { Lunchbox: number; Buying: number; Home: number; Unknown: number }>();
        for (let d = 1; d <= 5; d++) {
            base.set(d, { Lunchbox: 0, Buying: 0, Home: 0, Unknown: 0 });
        }
        for (const s of statuses) {
            const bucket = base.get(s.weekday);
            if (!bucket) continue;
            if (s.status === 'Lunchbox') bucket.Lunchbox++;
            else if (s.status === 'Buying') bucket.Buying++;
            else if (s.status === 'Home') bucket.Home++;
            else bucket.Unknown++;
        }
        return base;
    }, [statuses]);

    // Totals not needed for chart; kept logic minimal in chartData

    const chartConfig: ChartConfig = {
        Lunchbox: { label: t('Lunchbox'), color: '#28a745' },
        Buying: { label: t('Buying'), color: '#FFC107' },
        Home: { label: t('Home'), color: '#DC3545' },
        Unknown: { label: t('Unknown'), color: 'var(--muted-foreground)' },
    };

    const chartData = React.useMemo(() => {
        return [1, 2, 3, 4, 5].map((d) => {
            const g = grouped.get(d)!;
            return {
                day: weekdays[d - 1],
                Lunchbox: g.Lunchbox,
                Buying: g.Buying,
                Home: g.Home,
                Unknown: g.Unknown,
            };
        });
    }, [grouped, weekdays]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Alignment')} />
            <div className="p-3">
                <Badge className="text-sm font-medium flex items-center gap-2 mb-3">
                    <span>{t('Week', 'Week')} {displayWeek}</span>
                </Badge>
                <ChartContainer config={chartConfig} className="mt-4">
                    <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, users.length]}
                            ticks={Array.from({ length: users.length + 1 }, (_, i) => i)}
                            width={28}
                            tickMargin={4}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="Lunchbox" stackId="a" fill="#28a745" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="Buying" stackId="a" fill="#FFC107" />
                        <Bar dataKey="Home" stackId="a" fill="#DC3545" />
                        <Bar dataKey="Unknown" stackId="a" fill="var(--color-Unknown)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </div>
        </AppLayout>
    );
}
