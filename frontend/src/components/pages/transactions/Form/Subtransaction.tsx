{
  /* ساب‌تراکنش‌ها */
}
import { Controller, useFieldArray } from "react-hook-form";
import NumberInput from "../ui/FormNumberInput";
import FormDatePicker from "../ui/FormDatePicker";
import { FaRegTrashCan } from "react-icons/fa6";

function SubTransactionsSection({ control, errors }: any) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "sub_transactions",
  });

  return (
    <div className="space-y-2 border border-border/20 rounded-xl p-4">
      <h3 className="font-semibold text-base">اقساط ها</h3>

      {fields.map((field, idx) => (
        <div
          key={field.id}
          className="grid grid-cols-3 gap-2 items-center bg-background p-5 rounded-2xl"
        >
          {/* مبلغ */}
          <Controller
            name={`sub_transactions.${idx}.amount`}
            control={control}
            render={({ field }) => (
              <NumberInput
                {...field}
                control={control} // ⭐ اینجا پاس بده
                label={`مبلغ ${idx + 1}`}
                placeholder="مبلغ"
              />
            )}
          />
          {errors.sub_transactions?.[idx]?.amount && (
            <p className="text-red-500 text-sm col-span-3">
              {errors.sub_transactions[idx]?.amount?.message as string}
            </p>
          )}

          {/* تاریخ سررسید */}
          <Controller
            name={`sub_transactions.${idx}.due_date`}
            control={control}
            render={({ field }) => (
              <FormDatePicker
                {...field}
                label="تاریخ سررسید"
                placeholder="تاریخ سررسید"
              />
            )}
          />
          {errors.sub_transactions?.[idx]?.due_date && (
            <p className="text-red-500 text-sm col-span-3">
              {errors.sub_transactions[idx]?.due_date?.message as string}
            </p>
          )}

          {/* دکمه حذف */}
          <button
            type="button"
            className="px-2 py-1 bg-red-500 text-white rounded-full w-fit aspect-square mb-auto mr-auto cursor-pointer hover:brightness-120"
            onClick={() => remove(idx)}
          >
            <FaRegTrashCan />
          </button>
        </div>
      ))}

      {errors.sub_transactions?.message && (
        <p className="text-red-500 text-sm">
          {errors.sub_transactions.message as string}
        </p>
      )}

      {/* دکمه اضافه کردن */}
      <button
        type="button"
        className="px-4 py-2 bg-primary text-white rounded mt-2"
        onClick={() => append({ amount: 0, due_date: "", is_paid: false })}
      >
        اضافه کردن اقساط
      </button>
    </div>
  );
}

export default SubTransactionsSection;
