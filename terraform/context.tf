module "this" {
  source  = "gitlab.com/gala-games/terraform-local-labels/local"
  version = "~> 1.0"

  product_domain = "platform"
  product        = "giveaway"
  env            = var.env
  service        = "client"
  region         = var.region
  owners         = ["devops"]
}
