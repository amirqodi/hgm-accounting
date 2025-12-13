declare module "iranian-bank-list" {
  export interface Bank {
    bank_name: string; // e.g., "ansar"
    bank_title: string; // e.g., "بانک انصار"
    card_no: number; // e.g., 627381
    card_regex: string; // e.g., "^627381\\d{10}$"
    iban: string; // e.g., "015"
    iban_regex: string; // e.g., "^IR\\d{2}015\\d{19}$"
    color: string; // e.g., "#c8393b"
    darker_color?: string; // e.g., "#a02e2f"
    lighter_color?: string; // e.g., "#f04447"
    bank_logo: string; // SVG string
  }

  export function getAllBanks(): Bank[];
  export function getBankByCode(code: string): Bank | undefined;
  export function getBankBySheba(sheba: string): Bank | undefined;
}
