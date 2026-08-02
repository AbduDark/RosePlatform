<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'vodafone_number',
        'parent_phone',
        'student_info',
        'payment_proof_image',
        'payment_proof',
        'subscribed_at',
        'expires_at',
        'is_active',
        'is_approved',
        'status',
        'admin_notes',
        'approved_at',
        'rejected_at',
        'approved_by',
        'rejected_by'
    ];

    protected $appends = ['payment_proof_url', 'payment_proof_image_url'];

    protected function casts(): array
    {
        return [
            'subscribed_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
            'is_approved' => 'boolean',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    // ===============================
    // ?? Accessors
    // ===============================
    public function getPaymentProofUrlAttribute()
    {
        return $this->payment_proof 
            ? url('storage/' . $this->payment_proof)
            : null;
    }

    public function getPaymentProofImageUrlAttribute()
    {
        return $this->payment_proof_image
            ? url('storage/' . $this->payment_proof_image)
            : null;
    }

    // ===============================
    // ????????
    // ===============================
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    // ===============================
    // Scopes
    // ===============================
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeExpired($query)
    {
        return $query->whereIn('status', ['expired', 'rejected']);
    }

    // ===============================
    // Helper methods
    // ===============================
    public function isPending()    { return $this->status === 'pending'; }
    public function isApproved()   { return $this->status === 'approved'; }
    public function isRejected()   { return $this->status === 'rejected'; }

    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isActiveAndNotExpired()
    {
        return $this->is_active && $this->status === 'approved' && !$this->isExpired();
    }

    public function getDaysRemaining()
    {
        if (!$this->expires_at) return null;
        $diff = $this->expires_at->diffInDays(now(), false);
        return $this->expires_at->isFuture() ? $diff : 0;
    }

    public function getHoursRemaining()
    {
        if (!$this->expires_at) return null;
        $diff = $this->expires_at->diffInHours(now(), false);
        return $this->expires_at->isFuture() ? $diff : 0;
    }

    public function isExpiringSoon($days = 3)
    {
        return $this->expires_at && $this->getDaysRemaining() <= $days && !$this->isExpired();
    }

    // ===============================
    // Renewal logic
    // ===============================
    public function renew(array $data, UploadedFile $paymentProof): Subscription
    {
        // حفظ ملف إثبات الدفع في storage/app/public/payment_proofs
        $path = $paymentProof->store('payment_proofs', 'public');

        // تعطيل الاشتراك القديم
        $this->update(['is_active' => false]);

        // إنشاء طلب اشتراك جديد
        return self::create([
            'user_id'         => $this->user_id,
            'course_id'       => $this->course_id,
            'vodafone_number' => $data['vodafone_number'],
            'parent_phone'    => $data['parent_phone'],
            'student_info'    => $data['student_info'] ?? 'طلب تجديد الاشتراك',
            'payment_proof'   => $path,
            'status'          => 'pending',
            'is_active'       => false,
            'is_approved'     => false,
        ]);
    }
}
