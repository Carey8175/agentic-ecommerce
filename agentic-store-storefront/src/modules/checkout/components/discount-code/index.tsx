"use client"

import { Badge, Heading, Input, Label, Text, Button, IconButton } from "@medusajs/ui"
import { ExclamationCircleSolid, XMark } from "@medusajs/icons"
import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")
  const [ineligibleWarning, setIneligibleWarning] = React.useState<string | null>(null)

  // Track pending check: { code, discountBefore }
  const pendingCheck = React.useRef<{ code: string; discountBefore: number } | null>(null)

  const { promotions = [] } = cart

  // After re-render (cart prop updated by server), check if newly applied
  // code actually produced a discount. discount_total and promotions are
  // now included in the cart fields fetched by retrieveCart.
  React.useEffect(() => {
    if (!pendingCheck.current) return
    const { code, discountBefore } = pendingCheck.current

    const codeApplied = promotions.some(
      (p) => p.code?.toLowerCase() === code.toLowerCase()
    )

    if (!codeApplied) return // cart hasn't re-rendered yet

    const discountAfter = cart.discount_total ?? 0
    pendingCheck.current = null

    if (discountAfter <= discountBefore) {
      setIneligibleWarning(
        `"${code.toUpperCase()}" was applied, but none of the items in your cart are eligible for this promotion.`
      )
    }
  }, [promotions, cart.discount_total])

  const removePromotionCode = async (code: string) => {
    setIneligibleWarning(null)
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")
    setIneligibleWarning(null)

    const code = formData.get("code") as string
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const existingCodes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)

    try {
      // Snapshot discount_total before applying so we can compare after re-render
      pendingCheck.current = { code, discountBefore: cart.discount_total ?? 0 }
      await applyPromotions([...existingCodes, code])
    } catch (e: any) {
      pendingCheck.current = null
      setErrorMessage(e.message)
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="w-full bg-white flex flex-col">
      <div className="txt-medium">
        <form action={(a) => addPromotionCode(a)} className="w-full mb-5">
          <Label className="flex gap-x-1 my-2 items-center">
            <Button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              variant="transparent"
              className="txt-medium text-ui-fg-interactive hover:text-ui-fg-interactive-hover p-0"
              data-testid="add-discount-button"
            >
              Add Promotion Code(s)
            </Button>

            {/* <Tooltip content="You can add multiple promotion codes">
              <InformationCircleSolid color="var(--fg-muted)" />
            </Tooltip> */}
          </Label>

          {isOpen && (
            <>
              <div className="flex w-full gap-x-2">
                <Input
                  className="size-full"
                  id="promotion-input"
                  name="code"
                  type="text"
                  autoFocus={false}
                  data-testid="discount-input"
                />
                <SubmitButton
                  variant="secondary"
                  data-testid="discount-apply-button"
                >
                  Apply
                </SubmitButton>
              </div>

              <ErrorMessage
                error={errorMessage}
                data-testid="discount-error-message"
              />
            </>
          )}
        </form>

        {ineligibleWarning && (
          <div
            className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 mb-4 text-sm text-orange-800"
            data-testid="discount-ineligible-warning"
          >
            <ExclamationCircleSolid className="mt-0.5 shrink-0 text-orange-500" />
            <span className="flex-1">{ineligibleWarning}</span>
            <button
              type="button"
              onClick={() => setIneligibleWarning(null)}
              className="ml-1 shrink-0 text-orange-500 hover:text-orange-700"
              aria-label="Dismiss"
            >
              <XMark />
            </button>
          </div>
        )}

        {promotions.length > 0 && (
          <div className="w-full flex items-center">
            <div className="flex flex-col w-full">
              <Heading className="txt-medium mb-2">
                Promotion(s) applied:
              </Heading>

              {promotions.map((promotion) => {
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between w-full max-w-full mb-2"
                    data-testid="discount-row"
                  >
                    <Text className="flex gap-x-1 items-baseline txt-small-plus w-4/5 pr-1">
                      <span className="truncate" data-testid="discount-code">
                        <Badge
                          color={promotion.is_automatic ? "green" : "grey"}
                          size="small"
                        >
                          {promotion.code}
                        </Badge>{" "}
                        (
                        {promotion.application_method?.value !== undefined &&
                          promotion.application_method.currency_code !==
                            undefined && (
                            <>
                              {promotion.application_method.type ===
                              "percentage"
                                ? `${promotion.application_method.value}%`
                                : convertToLocale({
                                    amount: +promotion.application_method.value,
                                    currency_code:
                                      promotion.application_method
                                        .currency_code,
                                  })}
                            </>
                          )}
                        )
                        {/* {promotion.is_automatic && (
                          <Tooltip content="This promotion is automatically applied">
                            <InformationCircleSolid className="inline text-zinc-400" />
                          </Tooltip>
                        )} */}
                      </span>
                    </Text>
                    {!promotion.is_automatic && (
                      <IconButton
                        variant="transparent"
                        size="small"
                        className="flex items-center"
                        onClick={() => {
                          if (!promotion.code) {
                            return
                          }

                          removePromotionCode(promotion.code)
                        }}
                        data-testid="remove-discount-button"
                      >
                        <Trash size={14} />
                        <span className="sr-only">
                          Remove discount code from order
                        </span>
                      </IconButton>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscountCode
