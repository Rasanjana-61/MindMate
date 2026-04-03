from youtube_transcript_api import YouTubeTranscriptApi
import sys

def list_transcripts(video_id):
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        print(f"Available transcripts for {video_id}:")
        for transcript in transcript_list:
            print(f"- {transcript.language} ({transcript.language_code}) [Generated: {transcript.is_generated}]")
    except Exception as e:
        print(f"Error listing transcripts: {e}")

if __name__ == "__main__":
    list_transcripts(sys.argv[1])
