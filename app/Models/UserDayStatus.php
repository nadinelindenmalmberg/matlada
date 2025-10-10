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
        'group_id',
        'iso_week',
        'weekday',
        'status',
        'arrival_time',
        'location',
        'start_location',
        'eat_location',
        'note',
        'visibility',
    ];

    protected $casts = [
        'weekday' => 'integer',
        'arrival_time' => 'datetime:H:i',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function isGroupOnly(): bool
    {
        return $this->visibility === 'group_only';
    }

    public function isAllGroups(): bool
    {
        return $this->visibility === 'all_groups';
    }

}
