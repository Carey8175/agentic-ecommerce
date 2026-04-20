"use client"

import React from "react";
import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  // Medusa's StoreUpdateCustomer API does not support email updates.
  // Email changes require re-authentication and are not exposed via the store API.
  return (
    <form className="w-full">
      <AccountInfo
        label="Email"
        currentInfo={`${customer.email}`}
        isSuccess={false}
        isError={false}
        clearState={() => {}}
        data-testid="account-email-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={customer.email}
            disabled
            data-testid="email-input"
          />
          <p className="text-ui-fg-subtle text-small-regular">
            Email address cannot be changed. Please contact support if you need to update your email.
          </p>
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileEmail
