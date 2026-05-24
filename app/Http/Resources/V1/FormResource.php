<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'ulid'         => $this->ulid,
            'title'        => $this->title,
            'status'       => $this->is_published ? 'published' : 'draft',
            'is_published' => $this->is_published,
            'views'        => $this->views ?? 0,
            'submissions'  => $this->responses_count ?? 0,
            'html_content' => $this->html_content,
            'created_at'   => $this->created_at->toISOString(),
            'updated_at'   => $this->updated_at->toISOString(),
        ];
    }
}
