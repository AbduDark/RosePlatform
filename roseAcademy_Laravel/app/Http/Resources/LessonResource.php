<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = Auth::user();
        $canAccess = $this->canUserAccess($user);

        $videoUrl = null;
        $embedUrl = null;

        if ($canAccess && $this->has_video) {
            if ($this->video_source === 'youtube') {
                $embedUrl = $this->getSecureYouTubeEmbedUrl();
            } else {
                $videoUrl = $this->getVideoDirectUrl();
            }
        }

        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'title' => $this->title,
            'description' => $this->description,
            'content' => $this->content,
            'order' => $this->order,
            'duration_minutes' => $this->duration_minutes,
            'is_free' => $this->is_free,
            'target_gender' => $this->target_gender,
            'can_access' => $canAccess,
            'has_video' => $this->has_video,
            'video_source' => $this->video_source ?? 'local',
            'video_url' => $videoUrl,
            'embed_url' => $embedUrl,
            'video_duration_formatted' => $this->has_video ? $this->getFormattedDuration() : null,
            'video_size_formatted' => $this->has_video ? $this->getFormattedSize() : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'course' => $this->whenLoaded('course'),
        ];
    }

    /**
     * تحديد ما إذا كان المستخدم يمكنه الوصول للدرس
     */
    private function canUserAccess(?object $user): bool
    {
        if (!$user) {
            return false;
        }

        // المديرين يمكنهم الوصول لكل شيء
        if ($user->isAdminAny()) {
            return true;
        }

        // الدروس المجانية متاحة للجميع
        if ($this->is_free) {
            return true;
        }

        // التحقق من الاشتراك في الكورس
        return $user->isSubscribedTo($this->course_id);
    }
}