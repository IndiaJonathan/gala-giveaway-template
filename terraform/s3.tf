locals {
  s3_client_app_bucket_name            = "giveaway-client-platform-giveaway-${var.env}-gala.${var.domain_tld}"
  s3_client_app_log_bucket_source_name = "giveaway-client-platform-giveaway-*-gala.${var.domain_tld}"
  s3_client_app_log_bucket_name        = "logs-giveaway-client-platform-giveaway"

  cloudfront_client_app_log_bucket_name = "cloudfront-logs-giveaway-client-platform-giveaway"

  s3_client_log_bucket_domain_name  = "${local.s3_client_app_log_bucket_name}.s3.amazonaws.com"
  cloudfront_log_bucket_domain_name = "${local.cloudfront_client_app_log_bucket_name}.s3.amazonaws.com"
}

data "aws_canonical_user_id" "current" {}
data "aws_cloudfront_log_delivery_canonical_user_id" "cloudfront" {}

module "s3_client_app_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket        = local.s3_client_app_bucket_name
  force_destroy = false

  logging = {
    target_bucket = local.s3_client_app_log_bucket_name
    target_prefix = "${var.env}/"
  }

  tags = module.this.tags_aws
}

module "s3_client_log_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  count = var.env == "dev" ? 1 : 0 # Create during dev only to ensure we can see logs for debugging

  bucket        = local.s3_client_app_log_bucket_name
  force_destroy = false

  control_object_ownership = true

  attach_elb_log_delivery_policy        = true
  attach_lb_log_delivery_policy         = true
  attach_access_log_delivery_policy     = true
  attach_deny_insecure_transport_policy = true
  attach_require_latest_tls_policy      = true

  access_log_delivery_policy_source_accounts = [data.aws_caller_identity.current.account_id]
  access_log_delivery_policy_source_buckets  = ["arn:aws:s3:::${local.s3_client_app_log_bucket_source_name}"]

  lifecycle_rule = [
    {
      id      = "logs"
      enabled = true

      transition = [
        {
          days          = 30
          storage_class = "ONEZONE_IA"
          }, {
          days          = 60
          storage_class = "GLACIER"
        },
      ]

      expiration = {
        days                         = 180
        expired_object_delete_marker = false
      }
    }
  ]

  tags = module.this.tags_aws
}

module "cloudfront_log_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  count = var.env == "dev" ? 1 : 0 # Create during dev only to ensure we can see logs for debugging

  bucket                   = local.cloudfront_client_app_log_bucket_name
  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  grant = [{
    type       = "CanonicalUser"
    permission = "FULL_CONTROL"
    id         = data.aws_canonical_user_id.current.id
    }, {
    type       = "CanonicalUser"
    permission = "FULL_CONTROL"
    id         = data.aws_cloudfront_log_delivery_canonical_user_id.cloudfront.id
    }
  ]

  owner = {
    id = data.aws_canonical_user_id.current.id
  }

  lifecycle_rule = [
    {
      id      = "logs"
      enabled = true

      transition = [
        {
          days          = 30
          storage_class = "ONEZONE_IA"
          }, {
          days          = 60
          storage_class = "GLACIER"
        },
      ]

      expiration = {
        days                         = 90
        expired_object_delete_marker = false
      }
    }
  ]

  force_destroy = false

  tags = module.this.tags_aws
}

data "aws_iam_policy_document" "s3_client_app_bucket_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.s3_client_app_bucket.s3_bucket_arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [module.cdn.cloudfront_distribution_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "s3_client_app_bucket_policy" {
  bucket = module.s3_client_app_bucket.s3_bucket_id
  policy = data.aws_iam_policy_document.s3_client_app_bucket_policy.json
}
