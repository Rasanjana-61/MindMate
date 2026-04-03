from youtube_transcript_api import YouTubeTranscriptApi
import sys
import json

video_id = "uwBNYXpZ9Xk"
try:
    api = YouTubeTranscriptApi()
    transcript_list = api.list(video_id)
    print("Available transcripts:")
    for transcript in transcript_list:
        print(f"- {transcript.language} ({transcript.language_code}) [Generated: {transcript.is_generated}] [Translatable: {transcript.is_translatable}]")
        if transcript.is_translatable:
             # Just show first few for brevity
             print(f"  Translatable languages (first 5): {list(transcript.translation_languages)[:5]}")
except Exception as e:
    print(f"Error: {e}")
