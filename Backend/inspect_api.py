from youtube_transcript_api import YouTubeTranscriptApi
import inspect

methods = [m for m, _ in inspect.getmembers(YouTubeTranscriptApi, predicate=inspect.isfunction)]
print("Methods in YouTubeTranscriptApi:")
for m in methods:
    print(f"- {m}")

try:
    # Try the instance approach
    api = YouTubeTranscriptApi()
    print("Instance methods:")
    instance_methods = [m for m, _ in inspect.getmembers(api, predicate=inspect.ismethod)]
    for m in instance_methods:
        print(f"  - {m}")
except Exception as e:
    print(f"Error instantiating: {e}")
