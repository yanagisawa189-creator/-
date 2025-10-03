#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SerpAPI接続テスト
"""
import os
import sys
from dotenv import load_dotenv

# Windows console encoding fix
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

try:
    from serpapi import GoogleSearch
    print("OK serpapi module loaded successfully")
except ImportError as e:
    print(f"ERROR Failed to import serpapi: {e}")
    exit(1)

# APIキーの確認
api_key = os.getenv('SERPAPI_KEY')
if api_key:
    print(f"OK API Key found: {api_key[:10]}...")
else:
    print("ERROR SERPAPI_KEY not found in environment")
    exit(1)

# テスト検索
print("\n=== Testing SerpAPI ===")
search_params = {
    "q": "不動産 東京都",
    "api_key": api_key,
    "num": 5
}

print(f"Search query: {search_params['q']}")

try:
    search = GoogleSearch(search_params)
    results = search.get_dict()

    print(f"\nOK Search successful!")
    print(f"Response keys: {list(results.keys())}")

    if 'organic_results' in results:
        print(f"OK Found {len(results['organic_results'])} organic results")
        for i, result in enumerate(results['organic_results'][:3], 1):
            print(f"\n  Result {i}:")
            print(f"    Title: {result.get('title', 'N/A')}")
            print(f"    Link: {result.get('link', 'N/A')}")
            print(f"    Snippet: {result.get('snippet', 'N/A')[:100]}...")
    else:
        print("ERROR No 'organic_results' in response")
        print(f"Available keys: {list(results.keys())}")
        if 'error' in results:
            print(f"Error: {results['error']}")

except Exception as e:
    print(f"\nERROR Search failed: {e}")
    import traceback
    traceback.print_exc()
