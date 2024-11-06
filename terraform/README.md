## Requirements

The following requirements are needed by this module:

- <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) (>= 1.5.0, < 2.0.0)

- <a name="requirement_aws"></a> [aws](#requirement\_aws) (~> 5.0)

## Providers

The following providers are used by this module:

- <a name="provider_aws"></a> [aws](#provider\_aws) (5.34.0)

## Modules

The following Modules are called:

### <a name="module_acm"></a> [acm](#module\_acm)

Source: terraform-aws-modules/acm/aws

Version: ~> 4.0

### <a name="module_cdn"></a> [cdn](#module\_cdn)

Source: terraform-aws-modules/cloudfront/aws

Version: ~> 3.0

### <a name="module_cloudfront_log_bucket"></a> [cloudfront\_log\_bucket](#module\_cloudfront\_log\_bucket)

Source: terraform-aws-modules/s3-bucket/aws

Version: ~> 4.0

### <a name="module_env_r53_record"></a> [env\_r53\_record](#module\_env\_r53\_record)

Source: terraform-aws-modules/route53/aws//modules/records

Version: ~> 2.0

### <a name="module_prod_r53_record"></a> [prod\_r53\_record](#module\_prod\_r53\_record)

Source: terraform-aws-modules/route53/aws//modules/records

Version: ~> 2.0

### <a name="module_s3_client_app_bucket"></a> [s3\_client\_app\_bucket](#module\_s3\_client\_app\_bucket)

Source: terraform-aws-modules/s3-bucket/aws

Version: ~> 4.0

### <a name="module_s3_client_log_bucket"></a> [s3\_client\_log\_bucket](#module\_s3\_client\_log\_bucket)

Source: terraform-aws-modules/s3-bucket/aws

Version: ~> 4.0

### <a name="module_this"></a> [this](#module\_this)

Source: gitlab.com/gala-games/terraform-local-labels/local

Version: ~> 1.0

## Resources

The following resources are used by this module:

- [aws_cloudfront_function.default_index](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_function) (resource)
- [aws_s3_bucket_policy.s3_client_app_bucket_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_policy) (resource)
- [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) (data source)
- [aws_canonical_user_id.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/canonical_user_id) (data source)
- [aws_cloudfront_log_delivery_canonical_user_id.cloudfront](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/cloudfront_log_delivery_canonical_user_id) (data source)
- [aws_iam_policy_document.s3_client_app_bucket_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) (data source)
- [aws_route53_zone.zone](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/route53_zone) (data source)
- [aws_wafv2_web_acl.waf](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/wafv2_web_acl) (data source)

## Required Inputs

The following input variables are required:

### <a name="input_env"></a> [env](#input\_env)

Description: Environment

Type: `any`

### <a name="input_region"></a> [region](#input\_region)

Description: AWS Region

Type: `any`

## Optional Inputs

The following input variables are optional (have default values):

### <a name="input_domain_subdomain"></a> [domain\_subdomain](#input\_domain\_subdomain)

Description: Domain Subdomain

Type: `string`

Default: `"connect"`

### <a name="input_domain_tld"></a> [domain\_tld](#input\_domain\_tld)

Description: Domain TLD

Type: `string`

Default: `"gala.com"`

### <a name="input_web_acl_name"></a> [web\_acl\_name](#input\_web\_acl\_name)

Description: Web ACL Name

Type: `any`

Default: `null`

## Outputs

No outputs.
