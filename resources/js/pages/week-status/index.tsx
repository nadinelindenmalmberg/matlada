import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea, InputGroupButton, InputGroupText } from '@/components/ui/input-group';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Copy as CopyIcon, ClipboardPaste as PasteIcon, Eraser as EraserIcon, CalendarRange as CalendarRangeIcon, MoreHorizontal as MoreHorizontalIcon, MapPin as MapPinIcon, UtensilsCrossed as UtensilsIcon, ShoppingCart as ShoppingCartIcon, Home as HomeIcon, Plane as PlaneIcon, StickyNote as StickyNoteIcon, ClockIcon, UsersIcon, SandwichIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { useI18n } from '@/lib/i18n';
import { useInitials } from '@/hooks/use-initials';
import { GroupSelector } from '@/components/group-selector';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
// Removed dropdown menu; using inline action buttons instead

type StatusValue = 'Lunchbox' | 'Buying' | 'Home' | 'Away' | null;

type UserDayRow = {
    id: number;
    user_id: number;
    weekday: number;
    status: StatusValue;
    arrival_time: string | null;
    location: string | null;
    start_location?: string | null;
    eat_location?: string | null;
    note?: string | null;
};

type CopiedData = {
    status: StatusValue;
    arrival_time: string | null;
    location: string | null;
    start_location: string | null;
    eat_location: string | null;
    note: string | null;
};

type Group = {
    id: number;
    name: string;
    description?: string;
    code: string;
    invite_link: string;
    is_admin: boolean;
    is_creator: boolean;
    invite_url: string;
    invite_link_url: string;
};

type PageProps = {
    week: string;
    group?: {
        id: number;
        name: string;
        code: string;
    };
    groups: Group[];
    activeWeekday: number;
    users: Array<{ id: number; name: string; email: string; avatar?: string }>;
    statuses: Record<string, Array<UserDayRow>>;
    canEditUserId: number;
};

type UserWithAvatar = PageProps['users'][number] & { avatar?: string; avatar_url?: string };

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
    if (status === 'Away') return 'outline';
    return 'outline';
}

function getStatusBadgeClass(status: StatusValue): string {
    // Tailwind utility colors with dark mode variants
    if (status === 'Lunchbox') {
        // Emerald (matched lightness) ensure max contrast
        return '!bg-emerald-600 !text-white border-transparent dark:!bg-emerald-800 dark:!text-white data-[state=on]:!bg-emerald-600 data-[state=on]:!text-white dark:data-[state=on]:!bg-emerald-800 dark:data-[state=on]:!text-white';
    }
    if (status === 'Buying') {
        // Amber (matched lightness) with dark text for better contrast
        return '!bg-amber-600 !text-white border-transparent dark:!bg-amber-800 dark:!text-white data-[state=on]:!bg-amber-600 data-[state=on]:!text-white dark:data-[state=on]:!bg-amber-800 dark:data-[state=on]:!text-white';
    }
    if (status === 'Home') {
        // Rose (matched lightness) ensure max contrast
        return '!bg-rose-600 !text-white border-transparent dark:!bg-rose-800 dark:!text-white data-[state=on]:!bg-rose-600 data-[state=on]:!text-white dark:data-[state=on]:!bg-rose-800 dark:data-[state=on]:!text-white';
    }
    if (status === 'Away') {
        // Indigo to indicate away
        return '!bg-indigo-600 !text-white border-transparent dark:!bg-indigo-800 dark:!text-white data-[state=on]:!bg-indigo-600 data-[state=on]:!text-white dark:data-[state=on]:!bg-indigo-800 dark:data-[state=on]:!text-white';
    }
    return '';
}

// Removed dot indicator; using badges in dropdown items instead.

function getBadgeSizeClass(): string {
    // Match the height of the SelectTrigger (h-8)
    return 'h-8 text-sm px-2 whitespace-nowrap flex items-center';
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
    const { week, group, groups, users, statuses, canEditUserId, activeWeekday } = usePage<PageProps>().props;
    // Removed global processing state for seamless UX
    const [draftLocations, setDraftLocations] = React.useState<Record<string, string>>({});
    const [draftStartLocations, setDraftStartLocations] = React.useState<Record<string, string>>({});
    const [draftEatLocations, setDraftEatLocations] = React.useState<Record<string, string>>({});
    const [draftNotes, setDraftNotes] = React.useState<Record<string, string>>({});
    const locationDebounceRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const startLocationDebounceRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const eatLocationDebounceRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const noteDebounceRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const skipBlurSubmitRef = React.useRef<Record<string, boolean>>({});
    const defaultLocations = React.useMemo(() => ['Bulten', 'Lindholmen'], []);
    const [openCombos, setOpenCombos] = React.useState<Record<string, boolean>>({});
    const [copiedData, setCopiedData] = React.useState<CopiedData | null>(null);
    const [setAllPopoverOpen, setSetAllPopoverOpen] = React.useState<Record<string, boolean>>({});
    // No global/batch loading states to keep interactions seamless
    // const [confirmSetAllOpen, setConfirmSetAllOpen] = React.useState<Record<number, boolean>>({});
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

    function submitUpdate(weekday: number, status: StatusValue, arrival_time: string | null, location: string | null, start_location?: string | null, eat_location?: string | null, note?: string | null) {
        // Ensure we always persist all fields. If some are omitted, pull from current row or draft.
        const current = getUserDay(statuses, canEditUserId, weekday) as any;
        const cellKey = getCellKey(canEditUserId, weekday);
        const finalEat = eat_location !== undefined ? eat_location : (draftEatLocations[cellKey] ?? (current?.eat_location ?? null));
        const finalNote = note !== undefined ? note : (draftNotes[cellKey] ?? (current?.note ?? null));
        const finalStart = start_location !== undefined ? start_location : (current?.start_location ?? null);

        router.post('/week-status',
            {
                iso_week: week,
                weekday,
                status,
                arrival_time,
                location,
                group_id: group?.id || null,
                start_location: finalStart,
                eat_location: finalEat,
                note: finalNote,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => toast.error(t('Failed to save. Please try again.', 'Failed to save. Please try again.')),
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

    function scheduleEatLocationSubmit(userId: number, weekday: number, status: StatusValue, timeValue: string | null, location: string | null, draftEatLocation: string | null) {
        const key = getCellKey(userId, weekday);
        if (eatLocationDebounceRef.current[key]) {
            clearTimeout(eatLocationDebounceRef.current[key]);
        }
        eatLocationDebounceRef.current[key] = setTimeout(() => {
            postPartialUpdate(weekday, { eat_location: draftEatLocation }, status, timeValue, location);
        }, 2000);
    }

    function submitEatLocationImmediately(weekday: number, status: StatusValue, timeValue: string | null, location: string | null, eatLocation: string | null) {
        postPartialUpdate(weekday, { eat_location: eatLocation }, status, timeValue, location);
    }

    function scheduleNoteSubmit(userId: number, weekday: number, status: StatusValue, timeValue: string | null, location: string | null, draftNote: string | null) {
        const key = getCellKey(userId, weekday);
        if (noteDebounceRef.current[key]) {
            clearTimeout(noteDebounceRef.current[key]);
        }
        noteDebounceRef.current[key] = setTimeout(() => {
            postPartialUpdate(weekday, { note: draftNote }, status, timeValue, location);
        }, 1200);
    }

    function submitNoteImmediately(weekday: number, status: StatusValue, timeValue: string | null, location: string | null, note: string | null) {
        postPartialUpdate(weekday, { note }, status, timeValue, location);
    }

    function postPartialUpdate(weekday: number, attrs: Record<string, string | null>, status: StatusValue, arrival_time: string | null, location: string | null) {
        // Always include eat_location and note to avoid overwriting with null on partial saves
        const current = getUserDay(statuses, canEditUserId, weekday) as any;
        const cellKey = getCellKey(canEditUserId, weekday);
        const mergedEat = attrs.hasOwnProperty('eat_location') ? attrs.eat_location : (draftEatLocations[cellKey] ?? (current?.eat_location ?? null));
        const mergedNote = attrs.hasOwnProperty('note') ? attrs.note : (draftNotes[cellKey] ?? (current?.note ?? null));
        const mergedStart = attrs.hasOwnProperty('start_location') ? attrs.start_location : (current?.start_location ?? null);

        router.post('/week-status',
            {
                iso_week: week,
                weekday,
                status,
                arrival_time,
                location,
                start_location: mergedStart,
                eat_location: mergedEat,
                note: mergedNote,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => toast.error(t('Failed to save. Please try again.', 'Failed to save. Please try again.')),
            }
        );
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
            onSuccess: () => toast.success(t('Cleared', 'Cleared')),
            onError: () => toast.error(t('Failed to clear. Please try again.', 'Failed to clear. Please try again.')),
        });
    }

    // function hasOtherDaysFilled(selectedWeekday: number): boolean {
    //     // Check if any other day for the current user has any data filled
    //     return weekdays
    //         .map((d) => d.value)
    //         .filter((w) => w !== selectedWeekday)
    //         .some((w) => {
    //             const row = getUserDay(statuses, canEditUserId, w);
    //             if (!row) return false;
    //             return !!(row.status || row.arrival_time || row.location);
    //         });
    // }

    function copyDayData(weekday: number) {
        const current = getUserDay(statuses, canEditUserId, weekday);
        const data: CopiedData = {
            status: current?.status ?? null,
            arrival_time: current?.arrival_time ?? null,
            location: current?.location ?? null,
            start_location: (current as any)?.start_location ?? null,
            eat_location: (current as any)?.eat_location ?? null,
            note: (current as any)?.note ?? null,
        };
        setCopiedData(data);
        toast.info(t('Copied!', 'Copied!'));
    }

    function pasteDayData(weekday: number) {
        if (!copiedData) return;

        const { status, arrival_time, location, start_location, eat_location, note } = copiedData;
        submitUpdate(weekday, status, arrival_time, location, start_location, eat_location, note);
        toast.success(t('Pasted!', 'Pasted!'));
    }

    function checkForExistingValuesInComingDays(weekday: number): { hasExisting: boolean; affectedDays: number[] } {
        const otherDays = weekdays.map((d) => d.value).filter((v) => v > weekday);
        const affectedDays: number[] = [];

        otherDays.forEach((day) => {
            const existing = getUserDay(statuses, canEditUserId, day);
            if (existing && (existing.status || existing.arrival_time || existing.location)) {
                affectedDays.push(day);
            }
        });

        return {
            hasExisting: affectedDays.length > 0,
            affectedDays
        };
    }

    function generateNaturalStatusText(
        status: StatusValue,
        arrivalTime: string | null,
        location: string | null,
        eatLocation: string | null,
        note: string | null,
        t: (key: string, fallback?: string) => string
    ): React.ReactNode {
        if (status === 'Home') {
            return t("I'll stay home", "I'll stay home");
        }

        if (status === 'Lunchbox') {
            const timeText = arrivalTime ? (
                <>
                    {t("at time", "at ")}<span className="font-bold">{arrivalTime}</span>
                </>
            ) : t("sometime", "sometime");
            const locationText = location ? (
                <>
                    {t("at location", "at ")}<span className="font-bold">{location}</span>
                </>
            ) : t("at school", "at school");
            const parts: React.ReactNode[] = [
                t("I'll arrive", "I'll arrive"),
                locationText,
                timeText,
            ];
            // Eat location intentionally omitted from natural language for others view
            if (note) {
                parts.push(<span className="italic text-muted-foreground">— {note}</span>);
            }
            return <>{parts.map((p, i) => <React.Fragment key={i}>{i > 0 ? ' ' : ''}{p}</React.Fragment>)}</>;
        }

        if (status === 'Buying') {
            const timeText = arrivalTime ? (
                <>
                    {t("at time", "at ")}<span className="font-bold">{arrivalTime}</span>
                </>
            ) : t("sometime", "sometime");
            const locationText = location ? (
                <>
                    {t("at location", "at ")}<span className="font-bold">{location}</span>
                </>
            ) : t("at school", "at school");
            const parts: React.ReactNode[] = [
                t("I'll arrive", "I'll arrive"),
                locationText,
                timeText,
            ];
            // Eat location intentionally omitted from natural language for others view
            if (note) {
                parts.push(<span className="italic text-muted-foreground">— {note}</span>);
            }
            return <>{parts.map((p, i) => <React.Fragment key={i}>{i > 0 ? ' ' : ''}{p}</React.Fragment>)}</>;
        }

        const parts: React.ReactNode[] = [t("No plans yet", "No plans yet")];
        if (note) {
            parts.push(<span className="italic text-muted-foreground">— {note}</span>);
        }
        return <>{parts.map((p, i) => <React.Fragment key={i}>{i > 0 ? ' ' : ''}{p}</React.Fragment>)}</>;
    }

    function setForAllDays(weekday: number) {
        const current = getUserDay(statuses, canEditUserId, weekday);
        const data: CopiedData = {
            status: current?.status ?? null,
            arrival_time: current?.arrival_time ?? null,
            location: current?.location ?? null,
            start_location: null,
            eat_location: null,
            note: null,
        };

        // Only apply to coming days (future days in the same week)
        const otherDays = weekdays.map((d) => d.value).filter((v) => v > weekday);
        if (otherDays.length === 0) {
            toast.info(t('No coming days to update.', 'No coming days to update.'));
            return;
        }

        // Batch apply without blocking UI

        const delayMs = 250;
        otherDays.forEach((day, index) => {
            setTimeout(() => {
                submitUpdate(day, data.status, data.arrival_time, data.location);
            }, index * delayMs);
        });

        const totalDuration = otherDays.length * delayMs + 150; // small buffer
        setTimeout(() => {
            toast.success(t('Set for coming days!', 'Set for coming days!'));
        }, totalDuration);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} >

            <Head title={`${t('Week', 'Week')} ${displayWeek}`} />
            <div className="p-3">
                {/* Group Selector */}
                <div className="mb-6">
                    <GroupSelector groups={groups as any} currentGroupId={group?.id} />
                </div>
                
                <div className="flex items-center justify-between mb-3">
                    <Badge className="text-sm font-medium flex items-center gap-2">
                        <span>{t('Week', 'Week')} {displayWeek}</span>
                        {group && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {group.name}
                            </span>
                        )}
                    </Badge>
                </div>
                {/* Mobile day navigation */}
                <div className="sm:hidden mb-3 flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        className="px-3 py-1.5 text-sm rounded-md"
                        onClick={() => {
                            setActiveDayMobile((d) => (d === 1 ? 5 : d - 1));
                        }}
                    >
                        {t('Previous day', 'Previous day')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="px-3 py-1.5 text-sm rounded-md"
                        onClick={() => {
                            setActiveDayMobile((d) => (d === 5 ? 1 : d + 1));
                        }}
                    >
                        {t('Next day', 'Next day')}
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[52px] min-w-[52px] text-center sm:w-[200px] sm:min-w-[200px] sm:text-left">
                                        <span className="sr-only sm:not-sr-only">{t('User', 'User')}</span>
                                    </TableHead>
                                    {weekdays.map((d) => {
                                        const date = getDateFromIsoWeek(week, d.value);
                                        const isToday = isSameLocalDate(date, new Date());
                                        return (
                                            <TableHead key={d.value} className={`border-l align-middle w-[200px] min-w-[200px] ${d.value !== activeDayMobile ? 'hidden sm:table-cell' : ''}`}>
                                                <div className="flex flex-col gap-0.5 mt-2 mb-2 text-center text-foreground">
                                                    <span className="text-lg font-semibold">
                                                        {isToday ? (
                                                            <Badge variant="default" className="px-2 text-base font-semibold py-0.5 align-middle bg-blue-600 text-white dark:bg-blue-500 dark:text-white">
                                                                {d.label}
                                                            </Badge>
                                                        ) : (
                                                            d.label
                                                        )}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">{formatDateYMD(date)}</span>
                                                </div>
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id} className="hover:bg-transparent">
                                        <TableCell className="whitespace-nowrap align-middle p-2 w-[52px] min-w-[52px] text-center sm:w-[200px] sm:min-w-[200px] sm:text-left">
                                            <div className="flex items-center justify-center gap-0 sm:justify-start sm:gap-2">
                                                <Avatar className="h-8 w-8 overflow-hidden rounded-full mx-auto sm:mx-0">
                                                    <AvatarImage src={(u as UserWithAvatar).avatar_url} alt={u.name} />
                                                    <AvatarFallback className="rounded-full bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                        {getInitials(u.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="hidden sm:inline font-medium">{u.name}</span>
                                            </div>
                                        </TableCell>
                                        {weekdays.map((d) => {
                                            const current = getUserDay(statuses, u.id, d.value);
                                            const isSelf = u.id === canEditUserId;
                                            const value: StatusValue = current?.status ?? null;
                                            const timeValue = current?.arrival_time ?? '';
                                            const cellKey = getCellKey(u.id, d.value);
                                            const locationValue = (draftLocations[cellKey] ?? (current?.location ?? ''));
                                            const eatLocationValue = (draftEatLocations[cellKey] ?? (current?.eat_location ?? ''));
                                            const noteValue = (draftNotes[cellKey] ?? (current?.note ?? ''));
                                            return (
                                                <TableCell key={d.value} className={`group border-l align-top p-2 w-[200px] min-w-[200px] ${d.value !== activeDayMobile ? 'hidden sm:table-cell' : ''}`}>
                                                    {isSelf ? (
                                                        <div className="relative flex gap-1.5 w-full group items-start">
                                                            {/* Main content area (no extra vertical space for actions) */}
                                                            <div className="flex-1 flex flex-col gap-2 pt-4">

                                                                {/* Lunch status */}
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Lunch', 'Lunch')}</div>
                                                                    {isSelf ? (
                                                                        <>
                                                                            <ToggleGroup
                                                                                type="single"
                                                                                value={value ?? undefined as unknown as string}
                                                                                onValueChange={(v) => {
                                                                                    const newStatus = (v || null) as StatusValue;
                                                                                    const isClearingFields = newStatus === 'Home' || newStatus === 'Away';
                                                                                    const nextTime = isClearingFields ? null : (timeValue || null);
                                                                                    const nextLocation = isClearingFields ? null : (locationValue || null);
                                                                                    // When clearing, also clear eat and note; otherwise keep existing values
                                                                                    const nextEat = isClearingFields ? null : (eatLocationValue || null);
                                                                                    const nextNote = isClearingFields ? null : (noteValue || null);
                                                                                    submitUpdate(d.value, newStatus, nextTime, nextLocation, undefined, nextEat, nextNote);
                                                                                }}
                                                                                className="grid grid-cols-2 gap-2"
                                                                                aria-label={t('Lunch status', 'Lunch status')}
                                                                            >
                                                                                <ToggleGroupItem
                                                                                    value="Lunchbox"
                                                                                    className={`${value === 'Lunchbox' ? getStatusBadgeClass('Lunchbox') + ' text-white' : 'bg-muted text-muted-foreground border-transparent'} px-2 gap-1 w-full justify-center rounded-md first:rounded-md last:rounded-md cursor-pointer`}
                                                                                    aria-label={t('Lunchbox', 'Lunchbox')}
                                                                                >
                                                                                    <Icon iconNode={UtensilsIcon} className="size-3.5" />
                                                                                    <span className="sr-only sm:not-sr-only">{t('Lunchbox', 'Lunchbox')}</span>
                                                                                </ToggleGroupItem>
                                                                                <ToggleGroupItem
                                                                                    value="Buying"
                                                                                    className={`${value === 'Buying' ? getStatusBadgeClass('Buying') + ' text-white' : 'bg-muted text-muted-foreground border-transparent'} px-2 gap-1 w-full justify-center rounded-md first:rounded-md last:rounded-md cursor-pointer`}
                                                                                    aria-label={t('Buying', 'Buying')}
                                                                                >
                                                                                    <Icon iconNode={ShoppingCartIcon} className="size-3.5" />
                                                                                    <span className="sr-only sm:not-sr-only">{t('Buying', 'Buying')}</span>
                                                                                </ToggleGroupItem>
                                                                                <ToggleGroupItem
                                                                                    value="Home"
                                                                                    className={`${value === 'Home' ? getStatusBadgeClass('Home') + ' text-white' : 'bg-muted text-muted-foreground border-transparent'} px-2 gap-1 w-full justify-center rounded-md first:rounded-md last:rounded-md cursor-pointer`}
                                                                                    aria-label={t('Home', 'Home')}
                                                                                >
                                                                                    <Icon iconNode={HomeIcon} className="size-3.5" />
                                                                                    <span className="sr-only sm:not-sr-only">{t('Home', 'Home')}</span>
                                                                                </ToggleGroupItem>
                                                                                <ToggleGroupItem
                                                                                    value="Away"
                                                                                    className={`${value === 'Away' ? getStatusBadgeClass('Away') + ' text-white' : 'bg-muted text-muted-foreground border-transparent'} px-2 gap-1 w-full justify-center rounded-md first:rounded-md last:rounded-md cursor-pointer`}
                                                                                    aria-label={t('Not with ya\'ll', 'Not with ya\'ll')}
                                                                                >
                                                                                    <Icon iconNode={UsersIcon} className="size-3.5" />
                                                                                    <span className="sr-only sm:not-sr-only">{t('Not with ya\'ll', 'Not with ya\'ll')}</span>
                                                                                </ToggleGroupItem>
                                                                            </ToggleGroup>
                                                                            {/* Where to eat (placed under toggles) */}
                                                                            <div className="mt-1">
                                                                                <InputGroup aria-labelledby={`eat-label-${cellKey}`}>
                                                                                    <span id={`eat-label-${cellKey}`} className="sr-only">{t('Place to eat', 'Place to eat')}</span>
                                                                                    <InputGroupAddon align="inline-start" aria-hidden="true">
                                                                                        <Icon iconNode={MapPinIcon} className="size-4 text-muted-foreground" />
                                                                                    </InputGroupAddon>
                                                                                    <InputGroupInput
                                                                                        id={`eat-location-${cellKey}`}
                                                                                        type="text"
                                                                                        placeholder={t('Place to eat', 'Place to eat')}
                                                                                        aria-label={t('Place to eat', 'Place to eat')}
                                                                                        value={eatLocationValue}
                                                                                        onChange={(e) => {
                                                                                            const v = (e.target as HTMLInputElement).value;
                                                                                            setDraftEatLocations((prev) => ({ ...prev, [cellKey]: v }));
                                                                                            scheduleEatLocationSubmit(u.id, d.value, value, timeValue || null, locationValue || null, v || null);
                                                                                        }}
                                                                                        onBlur={() => {
                                                                                            scheduleEatLocationSubmit(u.id, d.value, value, timeValue || null, locationValue || null, (eatLocationValue || null));
                                                                                        }}
                                                                                    />
                                                                                </InputGroup>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        value ? (
                                                                            <Badge variant={getStatusBadgeVariant(value)} className={`${getStatusBadgeClass(value)} ${getBadgeSizeClass()} font-semibold w-full justify-start`}>
                                                                                {value === 'Lunchbox' ? t('Lunchbox', 'Lunchbox') : value === 'Buying' ? t('Buying', 'Buying') : value === 'Home' ? t('Home', 'Home') : t('Not with ya\'ll', 'Not with ya\'ll')}
                                                                            </Badge>
                                                                        ) : (
                                                                            <span className="text-xs text-muted-foreground">—</span>
                                                                        )
                                                                    )}
                                                                </div>

                                                                {/* Arrival (time + location) */}
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Arrival', 'Arrival')}</div>
                                                                    {isSelf ? (
                                                                        value !== 'Home' ? (
                                                                            <div className="grid [grid-template-columns:auto_1fr] gap-2">
                                                                                <InputGroup aria-labelledby={`arrival-time-label-${cellKey}`}>
                                                                                    <span id={`arrival-time-label-${cellKey}`} className="sr-only">{t('Arrival time', 'Arrival time')}</span>
                                                                                    <InputGroupAddon align="inline-start" aria-hidden="true">
                                                                                        <Icon iconNode={ClockIcon} className="size-4 text-muted-foreground" />
                                                                                    </InputGroupAddon>
                                                                                    <InputGroupInput
                                                                                        id={`arrival-time-${cellKey}`}
                                                                                        className={`${timeValue ? 'text-white' : 'text-muted-foreground'} text-center w-[84px]`
                                                                                        }
                                                                                        type="time"
                                                                                        step={60}
                                                                                        lang="sv-SE"
                                                                                        aria-label={t('Arrival time to school', 'Arrival time to school')}
                                                                                        title={t('Arrival time to school', 'Arrival time to school')}
                                                                                        value={timeValue || ''}
                                                                                        onChange={(e) => submitUpdate(d.value, value, (e.target as HTMLInputElement).value || null, locationValue || null)}
                                                                                    />
                                                                                </InputGroup>
                                                                                <InputGroup aria-labelledby={`arrival-location-label-${cellKey}`}>
                                                                                    <span id={`arrival-location-label-${cellKey}`} className="sr-only">{t('Arrival location', 'Arrival location')}</span>
                                                                                    <InputGroupAddon align="inline-start" aria-hidden="true">
                                                                                        <Icon iconNode={MapPinIcon} className="size-4 text-muted-foreground" />
                                                                                    </InputGroupAddon>
                                                                                    <InputGroupInput
                                                                                        id={`arrival-location-${cellKey}`}
                                                                                        type="text"
                                                                                        role="combobox"
                                                                                        aria-expanded={!!openCombos[cellKey]}
                                                                                        aria-controls={`location-combobox-${cellKey}`}
                                                                                        aria-autocomplete="list"
                                                                                        list="default-locations"
                                                                                        placeholder={t('Where you will be at that time', 'Where you will be at that time')}
                                                                                        aria-label={t('Location where you will be at that time', 'Location where you will be at that time')}
                                                                                        value={locationValue}
                                                                                        className="w-full"
                                                                                        onChange={(e) => {
                                                                                            const v = (e.target as HTMLInputElement).value;
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
                                                                                    />
                                                                                </InputGroup>
                                                                            </div>
                                                                        ) : (
                                                                            <InputGroup aria-disabled>
                                                                                <InputGroupInput disabled placeholder={t('Arrival not needed', 'Arrival not needed')} />
                                                                            </InputGroup>
                                                                        )
                                                                    ) : (
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className={timeValue ? '' : 'text-muted-foreground'}>{timeValue || '—'}</span>
                                                                            <span className={locationValue ? '' : 'text-muted-foreground'}>{locationValue || '—'}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Section: Notes (own row) */}
                                                                <div className={`flex flex-col gap-1 ${isSelf ? 'pb-2' : ''}`}>
                                                                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Notes', 'Notes')}</div>
                                                                    <div className="flex items-center gap-2">
                                                                        {isSelf ? (
                                                                            <InputGroup aria-labelledby={`notes-label-${cellKey}`}>
                                                                                <span id={`notes-label-${cellKey}`} className="sr-only">{t('Notes for the day', 'Notes for the day')}</span>
                                                                                <InputGroupAddon align="inline-start" aria-hidden="true">
                                                                                    <Icon iconNode={StickyNoteIcon} className="size-4 text-muted-foreground" />
                                                                                </InputGroupAddon>
                                                                                <InputGroupInput
                                                                                    id={`notes-${cellKey}`}
                                                                                    placeholder={t('Notes for the day', 'Notes for the day')}
                                                                                    aria-label={t('Notes for the day', 'Notes for the day')}
                                                                                    value={noteValue}
                                                                                    onChange={(e) => {
                                                                                        const v = (e.target as HTMLInputElement).value;
                                                                                        setDraftNotes((prev) => ({ ...prev, [cellKey]: v }));
                                                                                        scheduleNoteSubmit(u.id, d.value, value, timeValue || null, locationValue || null, v || null);
                                                                                    }}
                                                                                    onBlur={() => {
                                                                                        scheduleNoteSubmit(u.id, d.value, value, timeValue || null, locationValue || null, (noteValue || null));
                                                                                    }}
                                                                                />
                                                                            </InputGroup>
                                                                        ) : (
                                                                            <span className={noteValue ? 'text-xs' : 'text-xs text-muted-foreground'}>{noteValue || '—'}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Self-only actions: conditional paste + dropdown */}
                                                            <div className="absolute right-0 top-0 w-fit pointer-events-auto flex items-center gap-1">
                                                                {copiedData ? (
                                                                    <Tooltip delayDuration={500}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-5 w-5 p-0"
                                                                                aria-label={t('Paste day', 'Paste day')}
                                                                                onClick={() => pasteDayData(d.value)}
                                                                            >
                                                                                <Icon iconNode={PasteIcon} className="size-3.5" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{t('Paste day', 'Paste day')}</TooltipContent>
                                                                    </Tooltip>
                                                                ) : null}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-5 w-5 p-0"
                                                                            aria-label={t('Actions', 'Actions')}
                                                                        >
                                                                            <Icon iconNode={MoreHorizontalIcon} className="size-3.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onSelect={() => copyDayData(d.value)}>
                                                                            <Icon iconNode={CopyIcon} className="size-4" />
                                                                            {t('Copy day', 'Copy day')}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem disabled={!copiedData} onSelect={() => pasteDayData(d.value)}>
                                                                            <Icon iconNode={PasteIcon} className="size-4" />
                                                                            {t('Paste day', 'Paste day')}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onSelect={() => setForAllDays(d.value)}>
                                                                            <Icon iconNode={CalendarRangeIcon} className="size-4" />
                                                                            {t('Set for all coming days', 'Set for all coming days')}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem variant="destructive" onSelect={() => clearStatus(d.value)}>
                                                                            <Icon iconNode={EraserIcon} className="size-4" />
                                                                            {t('Clear status', 'Clear status')}
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="relative flex gap-1.5 w-full items-start">
                                                            {/* Main content area */}
                                                            <div className="flex-1 flex flex-col gap-1.5">
                                                                <div className="space-y-2">
                                                                    {value && (
                                                                        <Badge variant={getStatusBadgeVariant(value)} className={`${getStatusBadgeClass(value)} ${getBadgeSizeClass()} font-semibold w-full justify-start`}>
                                                                            <span className="inline-flex items-center gap-1.5">
                                                                                <Icon
                                                                                    iconNode={
                                                                                        value === 'Lunchbox'
                                                                                            ? UtensilsIcon
                                                                                            : value === 'Buying'
                                                                                                ? ShoppingCartIcon
                                                                                                : value === 'Home'
                                                                                                    ? HomeIcon
                                                                                                    : UsersIcon
                                                                                    }
                                                                                    className="size-3.5"
                                                                                />
                                                                                {value === 'Lunchbox' ? t('Lunchbox', 'Lunchbox') : value === 'Buying' ? t('Buying', 'Buying') : value === 'Home' ? t('Home', 'Home') : t('Not with ya\'ll', 'Not with ya\'ll')}
                                                                            </span>
                                                                            {eatLocationValue ? (
                                                                                <span className="ml-2 inline-flex items-center gap-1 font-normal">
                                                                                    <span className="opacity-60">—</span>
                                                                                    <Icon iconNode={MapPinIcon} className="size-3.5" />
                                                                                    <span className="truncate max-w-[8rem]">{eatLocationValue}</span>
                                                                                </span>
                                                                            ) : null}
                                                                        </Badge>
                                                                    )}
                                                                    <div className="text-sm text-foreground leading-relaxed text-left">
                                                                        {generateNaturalStatusText(value, timeValue || null, locationValue || null, eatLocationValue || null, noteValue || null, t)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Others-only copy action */}
                                                            <div className="absolute right-0 top-0 flex flex-col gap-0.5 w-10 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-100 group-hover:duration-500 pointer-events-none group-hover:pointer-events-auto">
                                                                <Tooltip delayDuration={500}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-7"
                                                                            aria-label={t('Copy day', 'Copy day')}
                                                                            onClick={() => {
                                                                                const data: CopiedData = {
                                                                                    status: value,
                                                                                    arrival_time: timeValue || null,
                                                                                    location: locationValue || null,
                                                                                    start_location: null,
                                                                                    eat_location: null,
                                                                                    note: null,
                                                                                };
                                                                                setCopiedData(data);
                                                                                toast.info(t('Copied!', 'Copied!'));
                                                                            }}
                                                                        >
                                                                            <Icon iconNode={CopyIcon} className="size-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{t('Copy day', 'Copy day')}</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    )}
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
