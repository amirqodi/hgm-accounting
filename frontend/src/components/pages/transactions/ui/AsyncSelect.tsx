import { Controller } from "react-hook-form";
import AsyncSelect from "react-select/async";
import { IoIosArrowDown } from "react-icons/io";
import { motion } from "framer-motion";

type OptionType = {
  value: string | number;
  label: string;
};

type Props = {
  control: any;
  loadOptions: (input: string) => Promise<OptionType[]>;
};

export default function ContactAsyncSelect({ control, loadOptions }: Props) {
  return (
    <Controller
      name="contact_id"
      control={control}
      render={({ field }) => (
        <AsyncSelect<OptionType, false>
          cacheOptions
          defaultOptions
          loadOptions={loadOptions}
          value={
            field.value
              ? { value: field.value, label: String(field.value) } // یا می‌تونی label واقعی رو ست کنی
              : null
          }
          onChange={(val) => field.onChange(val ? val.value : null)}
          placeholder="جستجو و انتخاب مخاطب..."
          className="text-right"
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: "44px",
              borderRadius: "0.5rem",
              border: state.isFocused
                ? "2px solid hsl(var(--primary))"
                : "1px solid hsl(var(--border)/0.2)",
              backgroundColor: "hsl(var(--box))",
              boxShadow: "none",
              "&:hover": {
                borderColor: "hsl(var(--primary))",
              },
            }),
            valueContainer: (base) => ({
              ...base,
              paddingInline: "0.75rem",
            }),
            placeholder: (base) => ({
              ...base,
              color: "hsl(var(--muted-foreground))",
            }),
            input: (base) => ({
              ...base,
              color: "hsl(var(--foreground))",
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused
                ? "hsl(var(--muted)/0.25)"
                : "transparent",
              color: "hsl(var(--foreground))",
              cursor: "pointer",
              fontSize: "0.875rem",
            }),
            menu: (base) => ({
              ...base,
              marginTop: "4px",
              borderRadius: "0.5rem",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--box))",
              zIndex: 50,
            }),
          }}
          components={{
            DropdownIndicator: (props) => (
              <motion.div
                animate={{ rotate: props.selectProps.menuIsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="px-2 text-gray-500"
              >
                <IoIosArrowDown />
              </motion.div>
            ),
            IndicatorSeparator: () => null,
          }}
        />
      )}
    />
  );
}
