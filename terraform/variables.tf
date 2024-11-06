variable "env" {
  description = "Environment"
}

variable "region" {
  description = "AWS Region"
}

variable "domain_tld" {
  description = "Domain TLD"
  default     = "gala.com"
}

variable "domain_subdomain" {
  description = "Domain Subdomain"
  default     = "giveaway"
}

variable "web_acl_name" {
  description = "Web ACL Name"
  default     = null
}
