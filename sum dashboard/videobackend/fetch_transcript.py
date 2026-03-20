import sys
import json
import argparse
from youtube_transcript_api import YouTubeTranscriptApi

def fetch_transcript(video_id):
    try:
        # Create instance as per user's working snippet
        api = YouTubeTranscriptApi()
        
        # Try to fetch in English
        try:
            fetched = api.fetch(video_id, languages=['en'])
        except Exception as e:
            # Fallback to any available transcript
            try:
                transcript_list = api.list(video_id)
                en_transcript = transcript_list.find_transcript(['en'])
                fetched = en_transcript.fetch()
            except:
                # Last resort: first available
                try:
                    transcript_list = api.list(video_id)
                    first_transcript = next(iter(transcript_list))
                    fetched = first_transcript.fetch()
                except Exception as e_final:
                    return {"error": f"No transcript found: {str(e_final)}"}

        # Convert objects to serializable list of dicts
        result = []
        for entry in fetched:
            # Handle both dictionary and object formats
            if isinstance(entry, dict):
                text = entry.get('text', '')
                start = entry.get('start', 0)
                duration = entry.get('duration', 0)
            else:
                text = getattr(entry, 'text', '')
                start = getattr(entry, 'start', 0)
                duration = getattr(entry, 'duration', 0)
            
            result.append({
                'text': text,
                'start': start,
                'duration': duration
            })
        return result

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("video_id", help="The YouTube Video ID")
    args = parser.parse_args()

    result = fetch_transcript(args.video_id)
    print(json.dumps(result))
