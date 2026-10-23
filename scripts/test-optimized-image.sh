#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

compose=(docker compose -f compose.optimized.yaml)
test_output=$(mktemp -d)
cleanup() {
  result=$?
  if [ "$result" -ne 0 ]; then
    "${compose[@]}" logs --no-color || true
  fi
  "${compose[@]}" down --volumes --remove-orphans
  rm -rf "$test_output"
  exit "$result"
}
trap cleanup EXIT

wait_for_keycloak() {
  curl --fail --silent --show-error --retry 60 --retry-all-errors \
    --retry-delay 2 --max-time 3 \
    http://127.0.0.1:19002/health/ready > "$test_output/health.json"
  grep -q '"status": "UP"' "$test_output/health.json"
  curl --fail --silent --show-error \
    http://127.0.0.1:19002/metrics > "$test_output/metrics.txt"
  grep -q '^# ' "$test_output/metrics.txt"
  curl --fail --silent --show-error \
    http://127.0.0.1:18082/realms/velcure-preview/.well-known/openid-configuration \
    > "$test_output/discovery.json"
  grep -q '"authorization_endpoint"' "$test_output/discovery.json"
  curl --fail --silent --show-error \
    'http://127.0.0.1:18082/realms/velcure-preview/protocol/openid-connect/auth?client_id=theme-preview&redirect_uri=http%3A%2F%2F127.0.0.1%3A4321%2F&response_type=code&scope=openid' \
    > "$test_output/login.html"
  grep -q '/login/velcure/' "$test_output/login.html"
}

"${compose[@]}" up -d --build
wait_for_keycloak
"${compose[@]}" restart keycloak
wait_for_keycloak
"${compose[@]}" logs --no-color keycloak > "$test_output/keycloak.log"
grep -q 'Profile prod activated' "$test_output/keycloak.log"
grep -q 'jdbc-postgresql' "$test_output/keycloak.log"
if grep -Ei 'Updating the configuration|Quarkus augmentation completed|Changes detected in configuration|Running the server in development mode' "$test_output/keycloak.log"; then
  echo 'Unexpected runtime augmentation or development mode.' >&2
  exit 1
fi
echo 'Optimized image: PostgreSQL, readiness, metrics and bundled login theme passed on first start and restart.'
