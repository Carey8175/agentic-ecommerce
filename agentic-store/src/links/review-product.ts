import { defineLink } from "@medusajs/framework/utils"
import ReviewModule from "../modules/review"
import ProductModule from "@medusajs/medusa/product"

// Many reviews can link to one product (isList on the review side)
export default defineLink(
  {
    linkable: ReviewModule.linkable.review,
    isList: true,
  },
  ProductModule.linkable.product
)
