import {
  customerSchema,
  vendorSchema,
  shareholderSchema,
} from "./contactSchema";
import { z } from "zod";

// حذف contact_type برای فرم ویرایش
export const customerUpdateSchema = customerSchema.omit({
  type: true,
});

export type CustomerUpdateFormData = z.infer<typeof customerUpdateSchema>;

export const vendorUpdateSchema = vendorSchema.omit({
  type: true,
});

export type VendorUpdateFormData = z.infer<typeof vendorUpdateSchema>;

export const shareholderUpdateSchema = shareholderSchema.omit({
  type: true,
});

export type ShareholderUpdateFormData = z.infer<typeof shareholderUpdateSchema>;
