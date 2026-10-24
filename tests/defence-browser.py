"""Compatibility entry: the mounted-archery audit supersedes the rotating-weapon defence loop."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('archery-browser.py')),run_name='__main__')
