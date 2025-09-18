import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { useI18n } from '@/lib/i18n';
import { useInitials } from '@/hooks/use-initials';

type StatusValue = 'Lunchbox' | 'Buying' | 'Home' | null;

type UserDayRow = {
    id: number;
    user_id: number;
    weekday: number;
    status: StatusValue;
    arrival_time: string | null;
    location: string | null;
};

type PageProps = {
    week: string;
    activeWeekday: number;
    users: Array<{ id: number; name: string; email: string }>;
    statuses: Record<string, Array<UserDayRow>>;
    canEditUserId: number;
};

type UserWithAvatar = PageProps['users'][number] & { avatar?: string };

function useWeekdaysLabels(t: (key: string, fallback?: string) => string) {
    return [
        { value: 1, label: t('Monday', 'Monday') },
        { value: 2, label: t('Tuesday', 'Tuesday') },
        { value: 3, label: t('Wednesday', 'Wednesday') },
        { value: 4, label: t('Thursday', 'Thursday') },
        { value: 5, label: t('Friday', 'Friday') },
    ];
}

function getUserDay(
    statusesByUser: PageProps['statuses'],
    userId: number,
    weekday: number
) {
    const rows = statusesByUser[String(userId)] ?? [];
    return rows.find((r: UserDayRow) => r.weekday === weekday);
}

function getStatusBadgeVariant(status: StatusValue): React.ComponentProps<typeof Badge>["variant"] {
    if (status === 'Lunchbox') return 'secondary'; // Green
    if (status === 'Buying') return 'default'; // Orange/primary
    if (status === 'Home') return 'destructive'; // Red
    return 'outline';
}

function getStatusBadgeClass(status: StatusValue): string {
    // Tailwind utility colors with dark mode variants
    if (status === 'Lunchbox') {
        // Emerald (matched lightness) ensure max contrast
        return 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700 dark:bg-emerald-800 dark:hover:bg-emerald-400 dark:text-white';
    }
    if (status === 'Buying') {
        // Amber (matched lightness) with dark text for better contrast
        return 'bg-amber-600 text-white border-transparent hover:bg-amber-700 dark:bg-amber-800 dark:hover:bg-amber-400 dark:text-white';
    }
    if (status === 'Home') {
        // Rose (matched lightness) ensure max contrast
        return 'bg-rose-600 text-white border-transparent hover:bg-rose-700 dark:bg-rose-800 dark:hover:bg-rose-400 dark:text-white';
    }
    return '';
}

function getBadgeSizeClass(status: StatusValue): string {
    // Slightly larger text for better readability
    if (status === 'Home') {
        return 'text-sm py-0 px-2 whitespace-nowrap';
    }
    return 'text-sm py-0.5 px-2 whitespace-nowrap';
}

function buildBreadcrumbs(t: (key: string, fallback?: string) => string): BreadcrumbItem[] {
    return [
        {
            title: t('Weekly planning', 'Weekly planning'),
            href: dashboard().url,
        },
    ];
}

function getDateFromIsoWeek(isoWeek: string, weekday: number): Date {
    // isoWeek format: YYYY-Www
    const [yearStr, weekPart] = isoWeek.split('-W');
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekPart, 10);
    // ISO week: week 1 is the week with the first Thursday of the year
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Day = (jan4.getUTCDay() || 7); // 1..7 (Mon..Sun)
    const mondayOfWeek1 = new Date(jan4);
    mondayOfWeek1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
    const target = new Date(mondayOfWeek1);
    target.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7 + (weekday - 1));
    // Return local date (no time)
    return new Date(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
}

function formatDateYMD(date: Date): string {
    const d = date.getDate();
    const m = date.getMonth() + 1;
    return `${d}/${m}`;
}


function isSameLocalDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function WeekStatusIndex() {
    const { week, users, statuses, canEditUserId, activeWeekday } = usePage<PageProps>().props;
    const [processing, setProcessing] = React.useState(false);
    const [draftLocations, setDraftLocations] = React.useState<Record<string, string>>({});
    const locationDebounceRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const skipBlurSubmitRef = React.useRef<Record<string, boolean>>({});
    const defaultLocations = React.useMemo(() => ['Bulten', 'Lindholmen'], []);
    const [openCombos, setOpenCombos] = React.useState<Record<string, boolean>>({});
    const { t } = useI18n();
    const getInitials: (name: string) => string = useInitials();
    const weekdays = useWeekdaysLabels(t);
    const breadcrumbs = buildBreadcrumbs(t);
    const [activeDayMobile, setActiveDayMobile] = React.useState<number>(activeWeekday);
    const displayWeek = React.useMemo(() => {
        const parts = week.split('-W');
        return parts.length === 2 ? `${parts[1]}` : week;
    }, [week]);

    // (kept helper here earlier; removed as unused after switching to day-only mobile navigation)

    function submitUpdate(weekday: number, status: StatusValue, arrival_time: string | null, location: string | null) {
        router.post('/week-status',
            {
                iso_week: week,
                weekday,
                status,
                arrival_time,
                location,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            }
        );
    }

    function getCellKey(userId: number, weekday: number): string {
        return `${userId}_${weekday}`;
    }

    function scheduleLocationSubmit(userId: number, weekday: number, status: StatusValue, timeValue: string | null, draftLocation: string | null) {
        const key = getCellKey(userId, weekday);
        if (locationDebounceRef.current[key]) {
            clearTimeout(locationDebounceRef.current[key]);
        }
        locationDebounceRef.current[key] = setTimeout(() => {
            submitUpdate(weekday, status, timeValue, draftLocation);
        }, 2000);
    }

    function submitLocationImmediately(userId: number, weekday: number, status: StatusValue, timeValue: string | null, location: string | null) {
        const key = getCellKey(userId, weekday);
        if (locationDebounceRef.current[key]) {
            clearTimeout(locationDebounceRef.current[key]);
            delete locationDebounceRef.current[key];
        }
        submitUpdate(weekday, status, timeValue, location);
    }

    function clearStatus(weekday: number) {
        const key = getCellKey(canEditUserId, weekday);
        if (locationDebounceRef.current[key]) {
            clearTimeout(locationDebounceRef.current[key]);
            delete locationDebounceRef.current[key];
        }
        setDraftLocations((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        router.delete('/week-status', {
            data: { iso_week: week, weekday },
            preserveScroll: true,
            preserveState: false,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} >

            <Head title={`${t('Week', 'Week')} ${displayWeek}`} />
            <div className="p-3">
                <Badge className="text-sm font-medium flex items-center gap-2 mb-3">
                    <span>{t('Week', 'Week')} {displayWeek}</span>
                </Badge>
                {/* Mobile day navigation */}
                <div className="sm:hidden mb-3 flex items-center justify-between">
                    <button
                        type="button"
                        className="px-3 py-1.5 text-sm rounded-md border"
                        onClick={() => {
                            setActiveDayMobile((d) => (d === 1 ? 5 : d - 1));
                        }}
                    >
                        {t('Previous day', 'Previous day')}
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1.5 text-sm rounded-md border"
                        onClick={() => {
                            setActiveDayMobile((d) => (d === 5 ? 1 : d + 1));
                        }}
                    >
                        {t('Next day', 'Next day')}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px] min-w-[150px]">{t('User', 'User')}</TableHead>
                                    {weekdays.map((d) => {
                                        const date = getDateFromIsoWeek(week, d.value);
                                        const isToday = isSameLocalDate(date, new Date());
                                        return (
                                            <TableHead key={d.value} className={`border-l align-middle w-[150px] min-w-[150px] ${d.value !== activeDayMobile ? 'hidden sm:table-cell' : ''}`}>
                                                <div className="flex flex-col gap-0.5 mt-2 mb-2 text-center text-foreground">
                                                    <span>
                                                        {isToday ? (
                                                            <Badge variant="default" className="px-2 text-sm font-medium py-0.5 align-middle bg-blue-600 text-white dark:bg-blue-500 dark:text-white">
                                                                {d.label}
                                                            </Badge>
                                                        ) : (
                                                            d.label
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{formatDateYMD(date)}</span>
                                                </div>
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="whitespace-nowrap align-middle p-2 w-[150px] min-w-[150px]">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                                                    <AvatarImage src={(u as UserWithAvatar).avatar ? (((u as UserWithAvatar).avatar as string).startsWith('http') ? (u as UserWithAvatar).avatar : `/storage/${(u as UserWithAvatar).avatar}`) : undefined} alt={u.name} />
                                                    <AvatarFallback className="rounded-full bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                        {getInitials(u.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium sm:hidden">{getInitials(u.name)}</span>
                                                <span className="font-medium hidden sm:inline">{u.name}</span>
                                            </div>
                                        </TableCell>
                                        {weekdays.map((d) => {
                                            const current = getUserDay(statuses, u.id, d.value);
                                            const isSelf = u.id === canEditUserId;
                                            const value: StatusValue = current?.status ?? null;
                                            const timeValue = current?.arrival_time ?? '';
                                            const cellKey = getCellKey(u.id, d.value);
                                            const locationValue = (draftLocations[cellKey] ?? (current?.location ?? ''));
                                            return (
                                                <TableCell key={d.value} className={`border-l align-middle p-2 w-[150px] min-w-[150px] ${d.value !== activeDayMobile ? 'hidden sm:table-cell' : ''}`}>
                                                <div className="flex flex-col gap-1.5 w-full">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[11px] text-muted-foreground inline-block text-right ${isSelf ? 'sm:w-11 w-12' : 'sm:w-11 w-12'}`}>{t('Lunch', 'Lunch')}:</span>
                                                            {isSelf ? (
                                                                <Select onValueChange={(v) => {
                                                                    if (v === '__clear__') {
                                                                        clearStatus(d.value);
                                                                        return;
                                                                    }
                                                                    const newStatus = (v || null) as StatusValue;
                                                                    const nextTime = newStatus === 'Home' ? null : (timeValue || null);
                                                                    const nextLocation = newStatus === 'Home' ? null : (locationValue || null);
                                                                    submitUpdate(d.value, newStatus, nextTime, nextLocation);
                                                                }} value={value ?? undefined as unknown as string}>
                                                                    <SelectTrigger className={`h-8 px-2 w-full sm:w-auto [&>svg]:text-current [&>svg]:opacity-90 ${value ? getStatusBadgeClass(value) : ''}`} disabled={processing}>
                                                                        <SelectValue placeholder={t('Lunch', 'Lunch')} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Lunchbox" className="group w-full">
                                                                            <Badge variant={getStatusBadgeVariant('Lunchbox')} className={`w-full justify-center ${getStatusBadgeClass('Lunchbox')} ${getBadgeSizeClass('Lunchbox')} tracking-tight`}>
                                                                                {t('Lunchbox', 'Lunchbox')}
                                                                            </Badge>
                                                                        </SelectItem>
                                                                        <SelectItem value="Buying" className="group w-full">
                                                                            <Badge variant={getStatusBadgeVariant('Buying')} className={`w-full justify-center ${getStatusBadgeClass('Buying')} ${getBadgeSizeClass('Buying')} tracking-tight`}>
                                                                                {t('Buying', 'Buying')}
                                                                            </Badge>
                                                                        </SelectItem>
                                                                        <SelectItem value="Home" className="group w-full">
                                                                            <Badge variant={getStatusBadgeVariant('Home')} className={`w-full justify-center ${getStatusBadgeClass('Home')} ${getBadgeSizeClass('Home')} tracking-tight`}>
                                                                                {t('Home', 'Home')}
                                                                            </Badge>
                                                                        </SelectItem>
                                                                        <div className="my-1 h-px w-full bg-muted" />
                                                                        <SelectItem value="__clear__" disabled={!value && !timeValue && !locationValue} className="group w-full">
                                                                            <Badge className="w-full justify-center text-sm font-medium bg-zinc-800 text-white border-transparent hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 tracking-tight">
                                                                                {t('Clear', 'Clear')}
                                                                            </Badge>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                value ? (
                                                                    <Badge variant={getStatusBadgeVariant(value)} className={`${getStatusBadgeClass(value)} ${getBadgeSizeClass(value)}`}>{
                                                                        value === 'Lunchbox' ? t('Lunchbox', 'Lunchbox') : value === 'Buying' ? t('Buying', 'Buying') : t('Home', 'Home')
                                                                    }</Badge>
                                                                ) : (

                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[11px] text-muted-foreground inline-block text-right ${isSelf ? 'sm:w-11 w-12' : 'sm:w-11 w-12'}`}>{t('Arrival', 'Arrival')}:</span>
                                                            {value !== 'Home' ? (
                                                                isSelf ? (
                                                                    <Input
                                                                        type="time"
                                                                        step="60"
                                                                        aria-label={t('Arrival time to school', 'Arrival time to school')}
                                                                        title={t('Arrival time to school', 'Arrival time to school')}
                                                                        className={`h-8 w-full sm:w-auto bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${!timeValue ? 'text-muted-foreground' : ''}`}
                                                                        value={timeValue || ''}
                                                                        onChange={(e) => submitUpdate(d.value, value, e.target.value || null, locationValue || null)}
                                                                        disabled={processing}
                                                                    />
                                                                ) : (
                                                                    <span className={timeValue ? "text-xs" : "text-xs text-muted-foreground"}>{timeValue || '—'}</span>
                                                                )
                                                            ) : (
                                                                isSelf ? (
                                                                    <Input
                                                                        type="time"
                                                                        step="60"
                                                                        aria-label={t('Arrival time not needed', 'Arrival time not needed')}
                                                                        title={t('Arrival time not needed', 'Arrival time not needed')}
                                                                        className="h-8 w-full sm:w-auto bg-muted text-muted-foreground"
                                                                        value={''}
                                                                        disabled
                                                                        readOnly
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[11px] text-muted-foreground inline-block text-right ${isSelf ? 'sm:w-11 w-12' : 'sm:w-11 w-12'}`}>{t('Location', 'Location')}:</span>
                                                            {value !== 'Home' ? (
                                                                isSelf ? (
                                                                    <div className="relative flex-1 min-w-0 sm:min-w-[100px]">
                                                                        <input
                                                                            type="text"
                                                                            className="h-8 w-full rounded-md border bg-background px-2 text-sm"
                                                                            role="combobox"
                                                                            aria-expanded={!!openCombos[cellKey]}
                                                                            aria-controls={`location-combobox-${cellKey}`}
                                                                            placeholder={t('Where you will be at that time', 'Where you will be at that time')}
                                                                            aria-label={t('Location where you will be at that time', 'Location where you will be at that time')}
                                                                            value={locationValue}
                                                                            onChange={(e) => {
                                                                                const v = e.target.value;
                                                                                setDraftLocations((prev) => ({ ...prev, [cellKey]: v }));
                                                                                setOpenCombos((prev) => ({ ...prev, [cellKey]: true }));
                                                                                scheduleLocationSubmit(u.id, d.value, value, timeValue || null, v || null);
                                                                            }}
                                                                            onFocus={() => setOpenCombos((prev) => ({ ...prev, [cellKey]: true }))}
                                                                            onBlur={() => {
                                                                                setTimeout(() => setOpenCombos((prev) => ({ ...prev, [cellKey]: false })), 150);
                                                                                if (!skipBlurSubmitRef.current[cellKey]) {
                                                                                    scheduleLocationSubmit(u.id, d.value, value, timeValue || null, (locationValue || null));
                                                                                }
                                                                                if (skipBlurSubmitRef.current[cellKey]) {
                                                                                    delete skipBlurSubmitRef.current[cellKey];
                                                                                }
                                                                            }}
                                                                            disabled={processing}
                                                                        />
                                                                        {openCombos[cellKey] && (
                                                                            <div id={`location-combobox-${cellKey}`} className="absolute z-10 mt-1 left-0 right-0 rounded-md border bg-popover shadow-md">
                                                                                {defaultLocations
                                                                                    .filter((loc) => loc.toLowerCase().includes((locationValue || '').toLowerCase()))
                                                                                    .map((loc) => (
                                                                                        <button
                                                                                            type="button"
                                                                                            key={loc}
                                                                                            className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent"
                                                                                            onMouseDown={(e) => {
                                                                                                e.preventDefault();
                                                                                                skipBlurSubmitRef.current[cellKey] = true;
                                                                                            }}
                                                                                            onClick={() => {
                                                                                                setDraftLocations((prev) => ({ ...prev, [cellKey]: loc }));
                                                                                                setOpenCombos((prev) => ({ ...prev, [cellKey]: false }));
                                                                                                submitLocationImmediately(u.id, d.value, value, timeValue || null, loc);
                                                                                            }}
                                                                                        >
                                                                                            {loc}
                                                                                        </button>
                                                                                    ))}
                                                                                {defaultLocations.filter((loc) => loc.toLowerCase().includes((locationValue || '').toLowerCase())).length === 0 && (
                                                                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">{t('No matches', 'No matches')}</div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className={locationValue ? "text-xs" : "text-xs text-muted-foreground"}>{locationValue || '—'}</span>
                                                                )
                                                            ) : (
                                                                isSelf ? (
                                                                    <div className="relative flex-1 min-w-0 sm:min-w-[100px]">
                                                                        <input
                                                                            type="text"
                                                                            className="h-8 w-full rounded-md border bg-muted px-2 text-sm text-muted-foreground"
                                                                            placeholder={t('Not needed', 'Not needed')}
                                                                            value=""
                                                                            disabled
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
            <datalist id="default-locations">
                {defaultLocations.map((loc) => (
                    <option key={loc} value={loc} />
                ))}
            </datalist>
        </AppLayout >
    );
}
