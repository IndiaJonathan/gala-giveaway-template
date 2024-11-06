locals {
  r53_env_record = "${var.env}-${var.domain_subdomain}"
  r53_records = [
    {
      name = local.r53_env_record
      type = "A"
      alias = {
        name    = module.cdn.cloudfront_distribution_domain_name
        zone_id = module.cdn.cloudfront_distribution_hosted_zone_id
      }
    },
    {
      name = local.r53_env_record
      type = "AAAA"
      alias = {
        name    = module.cdn.cloudfront_distribution_domain_name
        zone_id = module.cdn.cloudfront_distribution_hosted_zone_id
      }
  }]
}

data "aws_route53_zone" "zone" {
  name = var.domain_tld
}

module "env_r53_record" {
  source  = "terraform-aws-modules/route53/aws//modules/records"
  version = "~> 2.0"

  zone_name = data.aws_route53_zone.zone.name

  records = local.r53_records
}

module "prod_r53_record" {
  source  = "terraform-aws-modules/route53/aws//modules/records"
  version = "~> 2.0"

  count = var.env == "prod" ? 1 : 0

  zone_name = data.aws_route53_zone.zone.name

  records = [
    {
      name = var.domain_subdomain
      type = "CNAME"
      ttl  = "300"
      records = [
        "prod-${var.domain_subdomain}.${var.domain_tld}",
      ]
    },
  ]
}
