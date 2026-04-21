"use client"

import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  return (
    <div className="text-small-regular" data-testid="account-email-editor">
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="uppercase text-ui-fg-base">Email</span>
          <span className="font-semibold" data-testid="current-info">
            {customer.email}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProfileEmail
