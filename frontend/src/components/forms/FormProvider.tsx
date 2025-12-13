import { useForm, FormProvider } from "react-hook-form";
import FormDatePicker from "../pages/transactions/ui/FormDatePicker";

const TransactionsFilter = () => {
  const methods = useForm({
    defaultValues: { startDate: "", endDate: "" },
  });

  return (
    <FormProvider {...methods}>
      <form>
        <FormDatePicker name="startDate" label="از تاریخ" optional />
        <FormDatePicker name="endDate" label="تا تاریخ" optional />
      </form>
    </FormProvider>
  );
};
