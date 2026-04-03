from youtube_transcript_api import YouTubeTranscriptApi
import sys

def check_langs(video_id):
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        for t in transcript_list:
              print(f"[{t.language_code}] {t.language} - Generated: {t.is_generated} - Translateable: {t.is_translatable}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_langs(sys.argv[1])
