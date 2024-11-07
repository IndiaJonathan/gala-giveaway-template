module "cdn" {
  source  = "terraform-aws-modules/cloudfront/aws"
  version = "~> 3.0"

  comment = var.env != "prod" ? "CDN for ${var.env}-${var.domain_subdomain}.${var.domain_tld}" : "CDN for ${var.domain_subdomain}.${var.domain_tld}"

  aliases = var.env != "prod" ? [
    "${local.r53_env_record}.${var.domain_tld}",
    ] : [
    "${local.r53_env_record}.${var.domain_tld}",
    "${var.domain_subdomain}.${var.domain_tld}",
  ]

  http_version                   = "http2and3"
  is_ipv6_enabled                = true
  create_monitoring_subscription = true
  default_root_object            = "index.html"

  price_class = var.env != "prod" ? "PriceClass_100" : "PriceClass_All"

  create_origin_access_control = true
  origin_access_control = {
    "${local.r53_env_record}.${var.domain_tld}-origin-access-control" = {
      description      = "${local.r53_env_record}.${var.domain_tld}"
      origin_type      = "s3"
      signing_behavior = "always"
      signing_protocol = "sigv4"
    }
  }

  origin = {
    client = {
      domain_name           = module.s3_client_app_bucket.s3_bucket_bucket_regional_domain_name
      origin_access_control = "${local.r53_env_record}.${var.domain_tld}-origin-access-control"
    },
    # api = {
    #   domain_name = "dex-api-platform-dex-${var.env}-gala.${var.domain_tld}"

    #   custom_origin_config = {
    #     http_port              = 80
    #     https_port             = 443
    #     origin_protocol_policy = "https-only"
    #     origin_ssl_protocols   = ["TLSv1.2"]
    #   }

    #   origin_shield = {
    #     enabled              = true
    #     origin_shield_region = "us-east-1"
    #   }
    # }
  }

  default_cache_behavior = {
    target_origin_id       = "client"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    use_forwarded_values   = false

    cache_policy_id          = "658327ea-f89d-4fab-a63d-7e88639e58f6" # https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html#managed-cache-caching-optimized
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html#managed-origin-request-policy-cors-s3

    function_association = {
      viewer-request = {
        function_arn = aws_cloudfront_function.default_index.arn
      }
    }
  }

  # ordered_cache_behavior = [
  #   {
  #     path_pattern     = "/api/*"
  #     target_origin_id = "api"

  #     viewer_protocol_policy = "redirect-to-https"
  #     allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
  #     cached_methods         = ["GET", "HEAD"]
  #     compress               = true
  #     use_forwarded_values   = false

  #     cache_policy_id            = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html#managed-cache-policy-caching-disabled
  #     origin_request_policy_id   = "216adef6-5c7f-47e4-b989-5492eafa07d3" # https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html#managed-origin-request-policy-all-viewer
  #     response_headers_policy_id = "eaab4381-ed33-4a86-88ca-d9558dc6cd63" # https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-response-headers-policies.html#managed-response-headers-policies-cors-preflight-security

  #     # lambda_function_association = {
  #     #   origin-request = {
  #     #     lambda_arn = module.lambda_origin_remove_prefix.lambda_function_qualified_arn
  #     #   }
  #     # }
  #   },
  # ]

  custom_error_response = [{
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }]

  viewer_certificate = {
    acm_certificate_arn = module.acm.acm_certificate_arn
    ssl_support_method  = "sni-only"
  }

  logging_config = {
    bucket          = local.cloudfront_log_bucket_domain_name
    include_cookies = false
    prefix          = "${var.env}/"
  }

  web_acl_id = var.web_acl_name != null ? data.aws_wafv2_web_acl.waf[0].arn : null

  retain_on_delete    = false
  wait_for_deployment = false

  tags = module.this.tags_aws
}

data "aws_wafv2_web_acl" "waf" {
  count = var.web_acl_name != null ? 1 : 0

  name  = var.web_acl_name
  scope = "CLOUDFRONT"
}

resource "aws_cloudfront_function" "default_index" {
  name    = "${var.env}-${var.domain_subdomain}-default-index"
  runtime = "cloudfront-js-2.0"
  code    = file("${path.module}/lambda/default-index/index.js")
}
