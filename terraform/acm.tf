module "acm" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 4.0"

  domain_name = "${local.r53_env_record}.${var.domain_tld}"
  zone_id     = data.aws_route53_zone.zone.zone_id

  validation_method = "DNS"

  subject_alternative_names = var.env == "prod" ? [
    "${var.domain_subdomain}.${var.domain_tld}",
  ] : []

  wait_for_validation = true

  tags = module.this.tags_aws
}
