#!/usr/bin/env bash
set -euo pipefail

target_root="${1:?missing target root}"
upload_root="${2:?missing upload root}"
expected_root='/www/wwwroot/sprout-playland-assets.wdbzk.com/remote'

if [[ "$target_root" != "$expected_root" ]]; then
  echo "Refusing unexpected deployment target: $target_root" >&2
  exit 2
fi

release_id="${GITHUB_RUN_ID:-manual}-$(date +%s)"
stage_root="$target_root/.deploy-$release_id"
bundles=(dino-art resources)

mkdir -p "$stage_root"

for bundle in "${bundles[@]}"; do
  archive="$upload_root/$bundle.tar.gz"
  [[ -f "$archive" ]] || { echo "Missing archive: $archive" >&2; exit 3; }
  tar -xzf "$archive" -C "$stage_root"
  compgen -G "$stage_root/$bundle/config*.json" >/dev/null \
    || { echo "Missing config for bundle: $bundle" >&2; exit 4; }
done

# Bundle files are content-hashed. Merge new files instead of deleting old ones,
# so previously uploaded preview versions continue to resolve their assets.
for bundle in "${bundles[@]}"; do
  mkdir -p "$target_root/$bundle"
  cp -a "$stage_root/$bundle/." "$target_root/$bundle/"
  find "$target_root/$bundle" -type d -exec chmod 755 {} +
  find "$target_root/$bundle" -type f -exec chmod 644 {} +
done

rm -rf "$stage_root" "$upload_root"
echo "Remote assets deployed to $target_root"
