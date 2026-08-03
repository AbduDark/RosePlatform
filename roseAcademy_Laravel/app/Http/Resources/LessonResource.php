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

        $videoStatus = $this->video_status ?? ($this->has_video ? 'ready' : null);

        $videoUrl = null;
        $embedUrl = null;

        if ($canAccess && $this->has_video) {
            if ($this->video_source === 'youtube') {
                $embedUrl = $this->getSecureYouTubeEmbedUrl();
            } else if ($videoStatus === 'ready' || empty($this->video_status)) {
                // Pass the raw bearer token so VideoJS range requests can be authenticated
                // without needing Authorization headers (browser <video> elements can't send them)
                $rawToken = $request->bearerToken();
                $videoUrl = $this->getSignedStreamUrl(240, $rawToken);
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
            'video_status' => $videoStatus,
            'video_status_message' => $this->getVideoStatusMessage(),
            'video_url' => $videoUrl,
            'embed_url' => $embedUrl,
            'video_duration_formatted' => $this->has_video ? $this->getFormattedDuration() : null,
            'video_size_formatted' => $this->has_video ? $this->getFormattedSize() : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'course' => $this->whenLoaded('course'),
        ];
    }

    private function canUserAccess(?object $user): bool
    {
        // الدروس المجانية متاحة للجميع (سواء مسجل أو زائر)
        if ($this->is_free) {
            return true;
        }

        if (!$user) {
            return false;
        }

        // المديرين يمكنهم الوصول لكل شيء
        if ($user->isAdminAny()) {
            return true;
        }

        // التحقق من الاشتراك في الكورس
        return $user->isSubscribedTo($this->course_id);
    }
}