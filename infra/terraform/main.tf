resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  bucket_name = "${var.project_name}-${random_id.suffix.hex}"

  # Only upload your actual website assets from the repo root
  site_files = {
    "index.html" = "${var.site_dir}/index.html"
    "script.js"  = "${var.site_dir}/script.js"
    "styles.css" = "${var.site_dir}/styles.css"
  }

  content_types = {
    "html" = "text/html"
    "css"  = "text/css"
    "js"   = "application/javascript"
  }
}

resource "aws_s3_bucket" "site" {
  bucket = local.bucket_name
}

# Required for S3 static website hosting
resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  index_document {
    suffix = "index.html"
  }

  # For SPAs you often want index.html as the error doc too
  error_document {
    key = "index.html"
  }
}

# Allow public reads (website hosting needs public access unless you put CloudFront in front)
resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = false
  ignore_public_acls      = false
  block_public_policy     = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "public_read" {
  statement {
    sid     = "PublicReadGetObject"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    resources = [
      "${aws_s3_bucket.site.arn}/*"
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.public_read.json

  depends_on = [aws_s3_bucket_public_access_block.site]
}

# Upload your website assets
resource "aws_s3_object" "site_assets" {
  for_each = local.site_files

  bucket = aws_s3_bucket.site.id
  key    = each.key
  source = each.value
  etag   = filemd5(each.value)

  content_type = lookup(
    local.content_types,
    split(".", each.key)[length(split(".", each.key)) - 1],
    "application/octet-stream"
  )
}

