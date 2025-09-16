<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserDayStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class WeekStatusController extends Controller
{
	public function index(Request $request): Response
	{
		// Auth is enforced by route middleware; no explicit policy needed here

		$weekParam = (string) $request->query('week');
		$week = $weekParam !== '' ? $weekParam : Carbon::now()->isoFormat('GGGG-[W]WW');

		$users = User::query()
			->select(['id', 'name', 'email'])
			->orderBy('name')
			->get();

		$statuses = UserDayStatus::query()
			->where('iso_week', $week)
			->get()
			->groupBy('user_id');

		return Inertia::render('week-status/index', [
			'week' => $week,
			'users' => $users,
			'statuses' => $statuses,
			'canEditUserId' => (int) $request->user()->id,
		]);
	}

	public function upsert(Request $request): RedirectResponse
	{
		$request->validate([
			'iso_week' => ['required', 'string', 'regex:/^\\d{4}-W\\d{2}$/'],
			'weekday' => ['required', 'integer', 'between:1,5'],
			'status' => ['nullable', 'in:Matlåda,Köpa'],
			'arrival_time' => ['nullable', 'date_format:H:i'],
			'location' => ['nullable', 'string', 'max:120'],
		]);

		$userId = (int) $request->user()->id;

		UserDayStatus::updateOrCreate(
			[
				'user_id' => $userId,
				'iso_week' => $request->string('iso_week')->toString(),
				'weekday' => (int) $request->integer('weekday'),
			],
			[
				'status' => $request->input('status'),
				'arrival_time' => $request->input('arrival_time'),
				'location' => $request->input('location'),
			]
		);

		return back();
	}
}
