#!/bin/bash
IMAGE="gemini-cli:latest"

echo "--- VERIFICATION TESTS ---"

echo "[TEST 1] Wrapper Help Argument"
if docker run --rm $IMAGE --help 2>&1 | grep -q "allow-domain"; then
    echo "PASS: Wrapper help displayed"
else
    echo "FAIL: Wrapper help not found"
fi

echo "[TEST 2] Network Block (Default)"
# run wget. Should fail.
if docker run --rm $IMAGE -- wget -q -T 5 http://example.com 2>/dev/null; then
    echo "FAIL: Network was allowed (expected block)"
else
    echo "PASS: Network blocked"
fi

echo "[TEST 3] Network Allow"
# run wget with whitelist. Should pass.
if docker run --rm $IMAGE --allow-domain example.com -- wget -q -T 5 http://example.com >/dev/null; then
    echo "PASS: Network allowed"
else
    echo "FAIL: Network blocked (expected allow)"
fi

echo "[TEST 4] FileSystem Restriction"
# access /root which is likely not allowed if restrict-fs is ON (and enforced by srt).
# Note: srt enforcement depends on bubblewrap configuration.
if docker run --rm $IMAGE --restrict-fs -- touch /root/testfile 2>/dev/null; then
    echo "FAIL: Setup allowed write to /root"
else
    echo "PASS: Write to /root blocked"
fi

echo "[TEST 5] Gemini Version"
if docker run --rm $IMAGE --version 2>&1 | grep -q "gemini"; then
    echo "PASS: Gemini executable works"
else
    echo "FAIL: Gemini executable failed"
fi
