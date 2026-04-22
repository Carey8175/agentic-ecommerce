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
  const [droppedCode, setDroppedCode] = React.useState<string | null>(null)

  const { promotions = [] } = cart

  // Find applied manual promotions that have no effect on the cart
  const ineffectivePromotions = React.useMemo(() => {
    if (!promotions || promotions.length === 0) return []
    
    const effectivePromotionIds = new Set<string>()
    
    cart.items?.forEach(item => {
      item.adjustments?.forEach(adj => {
        if (adj.promotion_id) effectivePromotionIds.add(adj.promotion_id)
      })
    })
    
    cart.shipping_methods?.forEach(sm => {
      sm.adjustments?.forEach(adj => {
        if (adj.promotion_id) effectivePromotionIds.add(adj.promotion_id)
      })
    })
    
    return promotions.filter(p => !p.is_automatic && p.id && !effectivePromotionIds.has(p.id))
  }, [promotions, cart.items, cart.shipping_methods])

  const removePromotionCode = async (code: string) => {
    setDroppedCode(null)
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")
    setDroppedCode(null)

    const code = formData.get("code") as string
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const existingCodes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)

    try {
      const updatedCart = await applyPromotions([...existingCodes, code])
      
      // Medusa drops the promo code silently if it is invalid for the items in the cart
      const isApplied = updatedCart?.promotions?.some(
        (p: any) => p.code?.toLowerCase() === code.toLowerCase()
      )

      if (!isApplied) {
        setDroppedCode(`"${code.toUpperCase()}" is not applicable to any items in your cart.`)
      }
    } catch (e: any) {
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

        {droppedCode && (
          <div
            className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 mb-4 text-sm text-orange-800"
            data-testid="discount-dropped-warning"
          >
            <ExclamationCircleSolid className="mt-0.5 shrink-0 text-orange-500" />
            <span className="flex-1">{droppedCode}</span>
            <button
              type="button"
              onClick={() => setDroppedCode(null)}
              className="ml-1 shrink-0 text-orange-500 hover:text-orange-700"
              aria-label="Dismiss"
            >
              <XMark />
            </button>
          </div>
        )}

        {ineffectivePromotions.length > 0 && (
          <div
            className="flex flex-col gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 mb-4 text-sm text-orange-800"
            data-testid="discount-ineffective-warning"
          >
            {ineffectivePromotions.map((promotion) => (
              <div key={promotion.id} className="flex items-start gap-2">
                <ExclamationCircleSolid className="mt-0.5 shrink-0 text-orange-500" />
                <span className="flex-1">
                  "{promotion.code?.toUpperCase()}" is applied, but none of the items in your cart are eligible for this promotion.
                </span>
              </div>
            ))}
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
