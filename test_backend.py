#!/usr/bin/env python3
"""
Quick smoke-test for the Seva backend.
Run:  python test_backend.py [BASE_URL]
Defaults to http://localhost:8000 if no URL provided.
"""

import sys
import json
import urllib.request
import urllib.error


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    base = base.rstrip("/")
    passed = 0
    failed = 0

    # --- Test 1: Health check ---
    print(f"\n[1/3] GET {base}/health")
    try:
        req = urllib.request.Request(f"{base}/health")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            assert data.get("status") == "ok", f"Unexpected body: {data}"
            print(f"  ✅  status=ok  environment={data.get('environment')}")
            passed += 1
    except Exception as e:
        print(f"  ❌  {e}")
        failed += 1

    # --- Test 2: Chat endpoint (streaming) ---
    print(f"\n[2/3] POST {base}/chat  (streaming response)")
    try:
        payload = json.dumps({
            "messages": [{"role": "user", "content": "Hi, what can you help with?"}]
        }).encode()
        req = urllib.request.Request(
            f"{base}/chat",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode()
            assert len(body) > 0, "Empty response"
            preview = body[:120].replace("\n", " ")
            print(f"  ✅  Got {len(body)} chars: \"{preview}...\"")
            passed += 1
    except Exception as e:
        print(f"  ❌  {e}")
        failed += 1

    # --- Test 3: Invalid request ---
    print(f"\n[3/3] POST {base}/chat  (empty body → expect 422)")
    try:
        req = urllib.request.Request(
            f"{base}/chat",
            data=b"{}",
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10)
        print("  ❌  Expected 422 but got 200")
        failed += 1
    except urllib.error.HTTPError as e:
        if e.code == 422:
            print(f"  ✅  Got 422 as expected")
            passed += 1
        else:
            print(f"  ❌  Expected 422, got {e.code}")
            failed += 1
    except Exception as e:
        print(f"  ❌  {e}")
        failed += 1

    # --- Summary ---
    print(f"\n{'='*40}")
    print(f"Results: {passed} passed, {failed} failed")
    if failed:
        print("Some tests failed – check the output above.")
        sys.exit(1)
    else:
        print("All tests passed! 🎉")


if __name__ == "__main__":
    main()
