import sys
import json
import argparse
from youtube_transcript_api import YouTubeTranscriptApi

def fetch_transcript(video_id):
    try:
        # Create instance as per user's working snippet
        api = YouTubeTranscriptApi()
        
        # Primary Strategy: Try to get the original Sinhala or English transcripts
        try:
            transcript_list = api.list(video_id)
            
            # Use common language codes for Sinhala and English
            # prioritized Sinhala as primary for SL users, then English
            try:
                # find_transcript automatically prioritizes manual over generated
                fetched = transcript_list.find_transcript(['si', 'en', 'en-US', 'en-GB']).fetch()
            except:
                # 3. Fallback: Find any available transcript and attempt to translate to Sinhala
                # (Best for videos mislabeled by YouTube or other foreign content)
                try:
                    best_transcript = next(iter(transcript_list))
                    try:
                        fetched = best_transcript.translate('si').fetch()
                        print("[PYTHON] Translated to Sinhala", file=sys.stderr)
                    except:
                        # If translation to Sinhala fails, check if we can translate to English
                        try:
                            fetched = best_transcript.translate('en').fetch()
                            print("[PYTHON] Translated to English", file=sys.stderr)
                        except:
                            # Final fallback: Original first available
                            fetched = best_transcript.fetch()
                            print(f"[PYTHON] Using original {best_transcript.language_code}", file=sys.stderr)
                except:
                    return {"error": "No transcripts available for this video."}
        except Exception as e_final:
            return {"error": f"Failed to list transcripts: {str(e_final)}"}

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
