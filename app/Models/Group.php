<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'code',
        'invite_link',
        'created_by',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($group) {
            if (empty($group->code)) {
                $group->code = static::generateUniqueCode();
            }
            if (empty($group->invite_link)) {
                $group->invite_link = static::generateUniqueInviteLink();
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    public function admins(): BelongsToMany
    {
        return $this->users()->wherePivot('role', 'admin');
    }

    public function members(): BelongsToMany
    {
        return $this->users()->wherePivot('role', 'member');
    }

    public function userDayStatuses(): HasMany
    {
        return $this->hasMany(UserDayStatus::class);
    }

    public function isAdmin(User $user): bool
    {
        return $this->users()
            ->wherePivot('user_id', $user->id)
            ->wherePivot('role', 'admin')
            ->exists();
    }

    public function isMember(User $user): bool
    {
        return $this->users()
            ->wherePivot('user_id', $user->id)
            ->exists();
    }

    public function addUser(User $user, string $role = 'member'): void
    {
        $this->users()->syncWithoutDetaching([
            $user->id => [
                'role' => $role,
                'joined_at' => now(),
            ]
        ]);
    }

    public function removeUser(User $user): void
    {
        $this->users()->detach($user->id);
    }

    public function getInviteUrl(): string
    {
        return route('groups.join', ['code' => $this->code]);
    }

    public function getInviteLinkUrl(): string
    {
        return route('groups.join-link', ['link' => $this->invite_link]);
    }

    private static function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (static::where('code', $code)->exists());

        return $code;
    }

    private static function generateUniqueInviteLink(): string
    {
        do {
            $link = Str::random(32);
        } while (static::where('invite_link', $link)->exists());

        return $link;
    }
}