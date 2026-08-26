#!/bin/bash
# Usage: ./rollback.sh <commit-sha-tag>
# Example: ./rollback.sh a1b2c3d

if [ -z "$1" ]; then
  echo "Usage: $0 <commit-sha-tag>"
  echo "Tip: check last_successful_tag.txt or your Docker Hub tags list."
  exit 1
fi

export IMAGE_TAG=$1

echo "Rolling back to image tag: $IMAGE_TAG"

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

echo "Rollback complete. Now running tag: $IMAGE_TAG"
