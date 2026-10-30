import type { IFeeEntry } from "@/utils/interfaces"

export const FEES_DATA: IFeeEntry[] = [
  { id: "f-1", month: "January 2026", amount: "PKR 2,500", dueDate: "2026-01-31", status: "pending" },
  { id: "f-2", month: "February 2026", amount: "PKR 2,500", dueDate: "2026-02-28", status: "pending" },
  { id: "f-3", month: "March 2026", amount: "PKR 2,500", dueDate: "2026-03-31", status: "pending" },
]

export const BANK_DETAILS = {
  accountNumber: "03257720992",
  bankName: "NayaPay",
  accountTitle: "Saeed ur Rehman",
} as const
