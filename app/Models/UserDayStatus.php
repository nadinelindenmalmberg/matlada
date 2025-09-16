<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDayStatus extends Model
{
	use HasFactory;

	protected $fillable = [
		'user_id',
		'iso_week',
		'weekday',
		'status',
		'arrival_time',
		'location',
	];

	protected $casts = [
		'weekday' => 'integer',
		'arrival_time' => 'datetime:H:i',
	];

	public function user(): BelongsTo
	{
		return $this->belongsTo(User::class);
	}
}
