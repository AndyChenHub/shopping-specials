#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

: "${VERSION:?Missing VERSION}"
: "${BUILD_NUMBER:?Missing BUILD_NUMBER}"
: "${TAG_NAME:?Missing TAG_NAME}"
: "${IPA_FILENAME:?Missing IPA_FILENAME}"
: "${GIT_SHA:?Missing GIT_SHA}"

IPA_PATH="app/${IPA_FILENAME}"
SHA_PATH="app/${IPA_FILENAME}.sha256"

if [ ! -f "$IPA_PATH" ]; then
  echo "Error: Expected IPA not found at $IPA_PATH"
  exit 1
fi

SHA256_HASH=$(awk '{print $1}' "$SHA_PATH")
IPA_SIZE=$(du -h "$IPA_PATH" | awk '{print $1}')

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

# Commit bumped version manifests back to main if we are building on main
if [ "${GITHUB_REF:-}" = "refs/heads/main" ]; then
  git add package.json app/package.json app/app.json app/src/versionInfo.json
  if ! git diff --cached --quiet; then
    git commit -m "chore(release): ${TAG_NAME} (build ${BUILD_NUMBER}) [skip ci]"
    git pull --rebase --autostash origin main
    git push origin HEAD:main
  fi
fi

# Create & push annotated version tag
git tag -fa "$TAG_NAME" -m "Aussie Specials ${TAG_NAME} (Build ${BUILD_NUMBER})"
git push origin "$TAG_NAME" --force

NOTES=$(cat <<EOF
### iOS IPA Build Details
| Field | Value |
| :--- | :--- |
| **App Version** | \`${VERSION}\` |
| **iOS Build Number** | \`${BUILD_NUMBER}\` |
| **Source Commit** | \`${GIT_SHA}\` |
| **IPA File** | \`${IPA_FILENAME}\` (${IPA_SIZE}) |
| **SHA-256** | \`${SHA256_HASH}\` |

> **Install / Update**: Download \`${IPA_FILENAME}\` below and install with **Sideloadly**, **AltStore**, or **SideStore**.
EOF
)

echo "==> Publishing GitHub Release ${TAG_NAME}..."
if gh release view "$TAG_NAME" >/dev/null 2>&1; then
  gh release upload "$TAG_NAME" "$IPA_PATH" "$SHA_PATH" --clobber
else
  gh release create "$TAG_NAME" "$IPA_PATH" "$SHA_PATH" \
    --title "Aussie Specials ${TAG_NAME} (Build ${BUILD_NUMBER})" \
    --notes "$NOTES" \
    --generate-notes
fi

echo "==> Published GitHub Release ${TAG_NAME} successfully!"
