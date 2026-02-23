#!/usr/bin/env python3
"""
Simple video frame extractor for Telegram bot
Extracts a frame from the middle of the video without AI/ML dependencies
"""

import argparse
import json
import os
import subprocess
import sys

def extract_frame_simple(video_path: str, output_path: str) -> bool:
    """
    Extract a frame from the middle of the video using ffmpeg
    """
    try:
        # Get video duration
        duration_cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path
        ]
        
        result = subprocess.run(duration_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error getting video duration: {result.stderr}", file=sys.stderr)
            return False
        
        try:
            duration = float(result.stdout.strip())
        except ValueError:
            print(f"Invalid duration: {result.stdout}", file=sys.stderr)
            return False
        
        # Extract frame from middle of video
        timestamp = duration / 2.0
        
        extract_cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
            "-ss", str(timestamp),
            "-i", video_path,
            "-frames:v", "1",
            "-q:v", "2",  # High quality
            output_path
        ]
        
        result = subprocess.run(extract_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error extracting frame: {result.stderr}", file=sys.stderr)
            return False
        
        return os.path.exists(output_path)
        
    except Exception as e:
        print(f"Exception during frame extraction: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="Extract a frame from video")
    parser.add_argument("--video", required=True, help="Path to input video")
    parser.add_argument("--output", required=True, help="Path to output image")
    parser.add_argument("--note", default="", help="Note (unused in simple version)")
    
    args = parser.parse_args()
    
    success = extract_frame_simple(args.video, args.output)
    
    if success:
        print(json.dumps({
            "success": True,
            "output": os.path.abspath(args.output),
            "message": "Frame extracted successfully"
        }))
        sys.exit(0)
    else:
        print(json.dumps({
            "success": False,
            "error": "Failed to extract frame"
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
