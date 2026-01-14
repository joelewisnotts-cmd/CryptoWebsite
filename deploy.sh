#!/usr/bin/env bash
# deploy.sh — Deploy Joe's Crypto static site to an S3 bucket and enable static website hosting.
# WARNING: Edit BUCKET and REGION before running.
#
# Requirements:
# - AWS CLI v2 configured (aws configure)
# - jq (optional; script will fall back to sed if jq is not available)
# - The repo root must contain: index.html, styles.css, script.js, README.md, bucket-policy.json
#
# Usage:
# 1. Edit BUCKET and REGION below.
# 2. Make executable: chmod +x deploy.sh
# 3. ./deploy.sh

set -euo pipefail

# ---- EDIT THESE ----
BUCKET="your-unique-bucket-name"   # <<< change this to a globally unique bucket name
REGION="us-east-1"                 # <<< change region if needed
# --------------------

if [[ -z "$BUCKET" || "$BUCKET" == "your-unique-bucket-name" ]]; then
  echo "ERROR: Please set BUCKET to a unique, valid S3 bucket name inside this script before running."
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: AWS CLI not found. Install and configure it (https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)."
  exit 1
fi

echo "Deploying to S3 bucket: $BUCKET (region: $REGION)"

# Create bucket (works for most regions using aws s3 mb)
echo "Creating bucket (if it doesn't exist)..."
aws s3 mb "s3://$BUCKET" --region "$REGION" || true

# Enable website hosting
echo "Enabling static website hosting..."
aws s3 website "s3://$BUCKET" --index-document index.html --error-document index.html

# Prepare and apply bucket policy (make sure bucket-policy.json exists)
if [[ ! -f bucket-policy.json ]]; then
  echo "ERROR: bucket-policy.json not found in the current directory."
  exit 1
fi

echo "Preparing bucket policy..."
tmp_policy="$(mktemp /tmp/bucket-policy.XXXXXX.json)"
if command -v jq >/dev/null 2>&1; then
  # Use jq to replace Resource array with the correct ARN
