import { useMemo } from "react";
import { FieldValues, UseFormStateReturn } from "react-hook-form";

export function useIsDirty<TFieldValues extends FieldValues>(
  formState: UseFormStateReturn<TFieldValues>
) {
  const { dirtyFields, isSubmitting } = formState;

  // فقط وقتی فیلدی تغییر کرده باشه و فرم در حال ارسال نباشه
  return useMemo(
    () => Object.keys(dirtyFields).length > 0 && !isSubmitting,
    [dirtyFields, isSubmitting]
  );
}
