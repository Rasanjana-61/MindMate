from youtube_transcript_api import YouTubeTranscriptApi
import sys

def check_translatable(video_id):
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        best_transcript = next(iter(transcript_list))
        print(f"Transcript: {best_transcript.language} ({best_transcript.language_code})")
        print(f"Translatable: {best_transcript.is_translatable}")
        if best_transcript.is_translatable:
            # List some translatable languages
            langs = best_transcript.translation_languages
            is_si_present = any(l['language_code'] == 'si' for l in langs)
            print(f"Is Sinhala (si) in translatable languages? {is_si_present}")
            if not is_si_present:
                 print("Translatable languages:", [l['language_code'] for l in langs[:10]])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_translatable(sys.argv[1])
