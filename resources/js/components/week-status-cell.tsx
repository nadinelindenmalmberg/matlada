import React from 'react';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Icon } from '@/components/ui/icon';
import { Clock as ClockIcon, ChevronDown as ChevronDownIcon, MapPin as MapPinIcon, StickyNote as StickyNoteIcon, UtensilsCrossed as UtensilsIcon, Copy as CopyIcon, ClipboardPaste as PasteIcon, Trash2 as TrashIcon, MoreHorizontal as MoreHorizontalIcon, Repeat as RepeatIcon, Check as CheckIcon } from 'lucide-react';

type StatusValue = 'Lunchbox' | 'Buying' | 'Home' | 'Away' | null;

type CopiedData = {
    status: StatusValue;
    arrival_time: string | null;
    location: string | null;
    start_location: string | null;
    eat_location: string | null;
    note: string | null;
};

function useInputWrapDetection(cellKey: string) {
    const [isWrapped, setIsWrapped] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const timeInputRef = React.useRef<HTMLDivElement>(null);
    const locationInputRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const container = containerRef.current;
        const timeInput = timeInputRef.current;
        const locationInput = locationInputRef.current;

        if (!container || !timeInput || !locationInput) return;

        const checkWrap = () => {
            const timeRect = timeInput.getBoundingClientRect();
            const locationRect = locationInput.getBoundingClientRect();
            const wrapped = locationRect.top > timeRect.bottom + 2;
            setIsWrapped(wrapped);
        };

        checkWrap();
        const resizeObserver = new ResizeObserver(checkWrap);
        resizeObserver.observe(container);
        resizeObserver.observe(timeInput);
        resizeObserver.observe(locationInput);
        window.addEventListener('resize', checkWrap);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', checkWrap);
        };
    }, [cellKey]);

    return { isWrapped, containerRef, timeInputRef, locationInputRef };
}

export type WeekStatusCellProps = {
    cellKey: string;
    d: { value: number };
    value: StatusValue;
    timeValue: string;
    locationValue: string;
    eatLocationValue: string;
    noteValue: string;
    isSaving: boolean;
    isTyping: boolean;
    u: { id: number };
    t: (key: string, fallback?: string) => string;
    getStatusDotClass: (status: StatusValue) => string;
    submitUpdate: (weekday: number, status: StatusValue, arrival_time: string | null, location: string | null, start_location?: string | null, eat_location?: string | null, note?: string | null, clearDrafts?: boolean) => void;
    copyDayData: (weekday: number) => void;
    pasteDayData: (weekday: number) => void;
    setForAllDays: (weekday: number) => void;
    clearStatus: (weekday: number) => void;
    copiedData: CopiedData | null;
    setDraftLocations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setOpenCombos: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    scheduleLocationSubmit: (userId: number, weekday: number, status: StatusValue, timeValue: string | null, draftLocation: string | null) => void;
    clearTypingState: (cellKey: string) => void;
    skipBlurSubmitRef: React.MutableRefObject<Record<string, boolean>>;
    setDraftEatLocations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    scheduleEatLocationSubmit: (userId: number, weekday: number, status: StatusValue, timeValue: string | null, location: string | null, draftEatLocation: string | null) => void;
    setDraftNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    scheduleNoteSubmit: (userId: number, weekday: number, status: StatusValue, timeValue: string | null, location: string | null, draftNote: string | null) => void;
    defaultLocations: string[];
    openCombos: Record<string, boolean>;
};

export function WeekStatusCell(props: WeekStatusCellProps) {
    const {
        cellKey,
        d,
        value,
        timeValue,
        locationValue,
        eatLocationValue,
        noteValue,
        isSaving,
        isTyping,
        u,
        t,
        getStatusDotClass,
        submitUpdate,
        copyDayData,
        pasteDayData,
        setForAllDays,
        clearStatus,
        copiedData,
        setDraftLocations,
        setOpenCombos,
        scheduleLocationSubmit,
        clearTypingState,
        skipBlurSubmitRef,
        setDraftEatLocations,
        scheduleEatLocationSubmit,
        setDraftNotes,
        scheduleNoteSubmit,
        defaultLocations,
        openCombos,
    } = props;

    const { containerRef, timeInputRef, locationInputRef } = useInputWrapDetection(cellKey);

    return (
        <div className="relative w-full group">
            <div className="flex flex-col gap-1.5 p-2 bg-muted/30 rounded-lg border relative">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <InputGroupButton variant="outline" className="!pr-2 h-8 min-w-32 justify-start dark:bg-foreground/1 text-xs [--radius:0.95rem]" aria-label={t('Status', 'Status')}>
                                    <span className={`h-3 w-3 rounded-full ${getStatusDotClass(value)}`} />
                                    <span className="ml-2 font-medium truncate">
                                        {value === 'Lunchbox' ? t('Lunchbox', 'Lunchbox') : value === 'Buying' ? t('Buying', 'Buying') : value === 'Home' ? t('Home', 'Home') : value === 'Away' ? t("Not with ya'll", "Not with ya'll") : t('Select status', 'Select status')}
                                    </span>
                                    <Icon iconNode={ChevronDownIcon} className="size-3 ml-auto opacity-60" />
                                </InputGroupButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="[--radius:0.95rem]  text-xs">
                                <DropdownMenuItem onSelect={() => {
                                    const newStatus: StatusValue = 'Lunchbox';
                                    const isClearing = false;
                                    const nextTime = isClearing ? null : (timeValue || null);
                                    const nextLocation = isClearing ? null : (locationValue || null);
                                    const nextEat = isClearing ? null : (eatLocationValue || null);
                                    const nextNote = isClearing ? null : (noteValue || null);
                                    submitUpdate(d.value, newStatus, nextTime, nextLocation, undefined, nextEat, nextNote);
                                }}>
                                    <span className="inline-flex items-center gap-2">
                                        <span className={`h-3 w-3 rounded-full ${getStatusDotClass('Lunchbox')}`} />
                                        {t('Lunchbox', 'Lunchbox')}
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => {
                                    const newStatus: StatusValue = 'Buying';
                                    const isClearing = false;
                                    const nextTime = isClearing ? null : (timeValue || null);
                                    const nextLocation = isClearing ? null : (locationValue || null);
                                    const nextEat = isClearing ? null : (eatLocationValue || null);
                                    const nextNote = isClearing ? null : (noteValue || null);
                                    submitUpdate(d.value, newStatus, nextTime, nextLocation, undefined, nextEat, nextNote);
                                }}>
                                    <span className="inline-flex items-center gap-2">
                                        <span className={`h-3 w-3 rounded-full ${getStatusDotClass('Buying')}`} />
                                        {t('Buying', 'Buying')}
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => {
                                    const newStatus: StatusValue = 'Home';
                                    const isClearing = true;
                                    const nextTime = isClearing ? null : (timeValue || null);
                                    const nextLocation = isClearing ? null : (locationValue || null);
                                    const nextEat = isClearing ? null : (eatLocationValue || null);
                                    const nextNote = isClearing ? null : (noteValue || null);
                                    submitUpdate(d.value, newStatus, nextTime, nextLocation, undefined, nextEat, nextNote);
                                }}>
                                    <span className="inline-flex items-center gap-2">
                                        <span className={`h-3 w-3 rounded-full ${getStatusDotClass('Home')}`} />
                                        {t('Home', 'Home')}
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => {
                                    const newStatus: StatusValue = 'Away';
                                    const isClearing = true;
                                    const nextTime = isClearing ? null : (timeValue || null);
                                    const nextLocation = isClearing ? null : (locationValue || null);
                                    const nextEat = isClearing ? null : (eatLocationValue || null);
                                    const nextNote = isClearing ? null : (noteValue || null);
                                    submitUpdate(d.value, newStatus, nextTime, nextLocation, undefined, nextEat, nextNote);
                                }}>
                                    <span className="inline-flex items-center gap-2">
                                        <span className={`h-3 w-3 rounded-full ${getStatusDotClass('Away')}`} />
                                        {t("Not with ya'll", "Not with ya'll")}
                                    </span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isSaving && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                                <Icon iconNode={CheckIcon} className="size-3" />
                            </div>
                        )}
                        {isTyping && !isSaving && (
                            <div className="size-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7" aria-label={t('Actions', 'Actions')}>
                                    <Icon iconNode={MoreHorizontalIcon} className="size-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
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
                                    <Icon iconNode={RepeatIcon} className="size-4" />
                                    {t('Set for coming days', 'Set for coming days')}
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onSelect={() => clearStatus(d.value)}>
                                    <Icon iconNode={TrashIcon} className="size-4" />
                                    {t('Clear', 'Clear')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div ref={containerRef} className="flex gap-1 flex-wrap">
                    <InputGroup ref={timeInputRef} className="w-[6rem] flex-shrink-0 h-8">
                        <InputGroupAddon align="inline-start" aria-hidden="true">
                            <Icon iconNode={ClockIcon} className="size-3.5 text-muted-foreground" />
                        </InputGroupAddon>
                        <InputGroupInput
                            id={`arrival-time-${cellKey}`}
                            className={`${timeValue ? 'text-black dark:text-white' : 'text-muted-foreground'} text-xs`}
                            type="time"
                            step={60}
                            lang="sv-SE"
                            aria-label={t('Arrival time', 'Arrival time')}
                            title={t('Arrival time', 'Arrival time')}
                            value={timeValue || ''}
                            onChange={(e) => submitUpdate(d.value, value, (e.target as HTMLInputElement).value || null, locationValue || null)}
                        />
                    </InputGroup>
                    <InputGroup ref={locationInputRef} className="min-w-[100px] flex-1 h-8">
                        <InputGroupAddon align="inline-start" aria-hidden="true">
                            <Icon iconNode={MapPinIcon} className="size-3.5 text-muted-foreground" />
                        </InputGroupAddon>
                        <InputGroupInput
                            id={`arrival-location-${cellKey}`}
                            type="text"
                            aria-expanded={!!openCombos[cellKey]}
                            aria-controls={`location-combobox-${cellKey}`}
                            aria-autocomplete="list"
                            list="default-locations"
                            placeholder={t('Location', 'Location')}
                            aria-label={t('Location', 'Location')}
                            value={locationValue}
                            className="w-full text-xs"
                            onChange={(e) => {
                                const v = (e.target as HTMLInputElement).value;
                                setDraftLocations((prev) => ({ ...prev, [cellKey]: v }));
                                setOpenCombos((prev) => ({ ...prev, [cellKey]: true }));
                                scheduleLocationSubmit(u.id, d.value, value, timeValue || null, v || null);
                            }}
                            onFocus={() => setOpenCombos((prev) => ({ ...prev, [cellKey]: true }))}
                            onBlur={() => {
                                setTimeout(() => setOpenCombos((prev) => ({ ...prev, [cellKey]: false })), 150);
                                clearTypingState(cellKey);
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

                <InputGroup className="h-8">
                    <InputGroupAddon align="inline-start" aria-hidden="true">
                        <Icon iconNode={UtensilsIcon} className="size-3.5 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                        id={`eat-location-inline-${cellKey}`}
                        type="text"
                        placeholder={t('Where to eat', 'Where to eat')}
                        aria-label={t('Where to eat', 'Where to eat')}
                        value={eatLocationValue}
                        className="text-xs"
                        onChange={(e) => {
                            const v = (e.target as HTMLInputElement).value;
                            setDraftEatLocations((prev) => ({ ...prev, [cellKey]: v }));
                            scheduleEatLocationSubmit(u.id, d.value, value, timeValue || null, locationValue || null, v || null);
                        }}
                        onBlur={() => {
                            clearTypingState(cellKey);
                            scheduleEatLocationSubmit(u.id, d.value, value, timeValue || null, locationValue || null, (eatLocationValue || null));
                        }}
                    />
                </InputGroup>

                <InputGroup aria-labelledby={`notes-label-${cellKey}`} className="h-8">
                    <span id={`notes-label-${cellKey}`} className="sr-only">{t('Notes', 'Notes')}</span>
                    <InputGroupAddon align="inline-start" aria-hidden="true">
                        <Icon iconNode={StickyNoteIcon} className="size-3.5 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                        id={`notes-${cellKey}`}
                        placeholder={t('Notes', 'Notes')}
                        aria-label={t('Notes', 'Notes')}
                        value={noteValue}
                        className="text-xs"
                        onChange={(e) => {
                            const v = (e.target as HTMLInputElement).value;
                            setDraftNotes((prev) => ({ ...prev, [cellKey]: v }));
                            scheduleNoteSubmit(u.id, d.value, value, timeValue || null, locationValue || null, v || null);
                        }}
                        onBlur={() => {
                            clearTypingState(cellKey);
                            scheduleNoteSubmit(u.id, d.value, value, timeValue || null, locationValue || null, (noteValue || null));
                        }}
                    />
                </InputGroup>
            </div>
        </div>
    );
}


