<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'avatar_url',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'avatar',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\UserDayStatus>
     */
    public function dayStatuses()
    {
        return $this->hasMany(UserDayStatus::class);
    }

    /**
     * Get the absolute URL to the user's avatar image.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        $avatar = $this->attributes['avatar'] ?? null;

        if ($avatar === null || $avatar === '') {
            return null;
        }

        if (str_starts_with($avatar, 'http://') || str_starts_with($avatar, 'https://')) {
            return $avatar;
        }

        // Use S3 disk for avatars if configured, otherwise fall back to public disk
        $disk = config('filesystems.default') === 's3' ? 's3' : 'public';
        
        // For S3, generate signed URLs for security
        if ($disk === 's3') {
            $expiration = now()->addHours(config('filesystems.s3_signed_url_expiration', 24));
            return Storage::disk('s3')->temporaryUrl($avatar, $expiration);
        }
        
        return Storage::disk($disk)->url($avatar);
    }

    /**
     * Upload and store a new avatar for the user.
     */
    public function uploadAvatar($file): string
    {
        // Delete old avatar if exists
        if ($this->avatar) {
            $this->deleteAvatar();
        }

        $disk = config('filesystems.default') === 's3' ? 's3' : 'public';
        $filename = 'avatars/' . $this->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        
        // For S3, explicitly set visibility to private for signed URLs
        if ($disk === 's3') {
            Storage::disk('s3')->put($filename, file_get_contents($file), 'private');
        } else {
            Storage::disk($disk)->put($filename, file_get_contents($file));
        }
        
        $this->update(['avatar' => $filename]);
        
        return $filename;
    }

    /**
     * Delete the user's current avatar.
     */
    public function deleteAvatar(): bool
    {
        if (!$this->avatar) {
            return true;
        }

        $disk = config('filesystems.default') === 's3' ? 's3' : 'public';
        
        if (Storage::disk($disk)->exists($this->avatar)) {
            Storage::disk($disk)->delete($this->avatar);
        }

        $this->update(['avatar' => null]);
        
        return true;
    }
}
