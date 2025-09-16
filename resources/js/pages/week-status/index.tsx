import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

type StatusValue = 'Matlåda' | 'Köpa' | null;

type PageProps = {
	week: string;
	users: Array<{ id: number; name: string; email: string }>;
	statuses: Record<string, Array<{ id: number; user_id: number; weekday: number; status: StatusValue; arrival_time: string | null }>>;
	canEditUserId: number;
};

const weekdays = [
	{ value: 1, label: 'Måndag' },
	{ value: 2, label: 'Tisdag' },
	{ value: 3, label: 'Onsdag' },
	{ value: 4, label: 'Torsdag' },
	{ value: 5, label: 'Fredag' },
];

function getUserDay(
	statusesByUser: PageProps['statuses'],
	userId: number,
	weekday: number
) {
	const rows = statusesByUser[String(userId)] ?? [];
	return rows.find((r) => r.weekday === weekday);
}

function getStatusBadgeVariant(status: StatusValue): React.ComponentProps<typeof Badge>["variant"] {
	if (status === 'Matlåda') return 'secondary';
	if (status === 'Köpa') return 'default';
	return 'outline';
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Veckoplanering',
        href: dashboard().url,
    },
];

export default function WeekStatusIndex() {
	const { week, users, statuses, canEditUserId } = usePage<PageProps>().props;
	const [processing, setProcessing] = React.useState(false);

	function submitUpdate(weekday: number, status: StatusValue, arrival_time: string | null) {
		router.post('/week-status',
			{
				iso_week: week,
				weekday,
				status,
				arrival_time,
			},
			{
				preserveScroll: true,
				preserveState: true,
				onStart: () => setProcessing(true),
				onFinish: () => setProcessing(false),
			}
		);
	}

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Vecka ${week}`} />
			<div className="p-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between gap-2">
						<div>
							<CardTitle>Veckoplanering ({week})</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Användare</TableHead>
												{weekdays.map((d) => (
													<TableHead key={d.value}>{d.label}</TableHead>
												))}
											</TableRow>
										</TableHeader>
										<TableBody>
											{users.map((u) => (
												<TableRow key={u.id}>
													<TableCell className="whitespace-nowrap font-medium">{u.name}</TableCell>
													{weekdays.map((d) => {
														const current = getUserDay(statuses, u.id, d.value);
														const isSelf = u.id === canEditUserId;
														const value: StatusValue = current?.status ?? null;
														const timeValue = current?.arrival_time ?? '';
														return (
															<TableCell key={d.value}>
																<div className="flex flex-col gap-2 min-w-[160px]">
																	{isSelf ? (
																		<Select onValueChange={(v) => submitUpdate(d.value, (v || null) as StatusValue, timeValue || null)} value={value ?? undefined as unknown as string}>
																			<SelectTrigger className="h-9" disabled={processing}>
																				<SelectValue placeholder="Välj status" />
																			</SelectTrigger>
																			<SelectContent>
																				<SelectItem value="Matlåda">Matlåda</SelectItem>
																				<SelectItem value="Köpa">Köpa</SelectItem>
																			</SelectContent>
																		</Select>
																	) : (
																		value ? (
																			<Badge variant={getStatusBadgeVariant(value)}>{value}</Badge>
																		) : (
																			<span className="text-sm text-muted-foreground">—</span>
																		)
																	)}
																	{isSelf ? (
																		<Input type="time" value={timeValue} onChange={(e) => submitUpdate(d.value, value, e.target.value || null)} disabled={processing} />
																	) : (
																		<div className="text-xs text-muted-foreground">
																			{timeValue || '—'}
																		</div>
																	)}
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
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}


