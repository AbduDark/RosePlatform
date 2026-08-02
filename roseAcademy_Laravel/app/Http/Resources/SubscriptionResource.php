<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ],
            'course' => [
                'id' => $this->course->id,
                'title' => $this->course->title,
                'price' => $this->course->price,
                'image' => $this->course->image ? url($this->course->image) : null,
            ],
            'vodafone_number' => $this->vodafone_number,
            'parent_phone' => $this->parent_phone,
            'student_info' => $this->student_info,
            'payment_proof_image' => $this->payment_proof_image ? url($this->payment_proof_image) : null,
            'payment_proof_url' => $this->payment_proof ? url('api/payment-proofs/' . $this->payment_proof) : null,
            'status' => $this->status,
            'is_active' => $this->is_active,
            'is_approved' => $this->is_approved,
            'admin_notes' => $this->admin_notes,
            'subscribed_at' => $this->subscribed_at?->format('Y-m-d H:i:s'),
            'expires_at' => $this->expires_at?->format('Y-m-d H:i:s'),
            'approved_at' => $this->approved_at?->format('Y-m-d H:i:s'),
            'rejected_at' => $this->rejected_at?->format('Y-m-d H:i:s'),
            'approved_by' => $this->approvedBy ? [
                'id' => $this->approvedBy->id,
                'name' => $this->approvedBy->name,
            ] : null,
            'rejected_by' => $this->rejectedBy ? [
                'id' => $this->rejectedBy->id,
                'name' => $this->rejectedBy->name,
            ] : null,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
