import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react"; // آیکون‌ها
import bankData from "@/data/banks.json";

type BankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  card_number: string;
  iban: string;
  balance: string;
};

type BankInfo = {
  bank_name: string;
  bank_title: string;
  bank_logo: string;
  color: string;
  lighter_color: string;
  darker_color: string;
};

type Props = {
  account: BankAccount;
  onEdit: (acc: BankAccount) => void;
  onDelete: (id: number) => void;
};

const BankCard = ({ account, onEdit, onDelete }: Props) => {
  const findBankInfo = (account: BankAccount): BankInfo | null => {
    return (
      bankData.find(
        (b) =>
          (b.card_regex &&
            new RegExp(b.card_regex).test(account.card_number)) ||
          (b.iban_regex && new RegExp(b.iban_regex).test(account.iban))
      ) || null
    );
  };
  const bankInfo = findBankInfo(account);

  return (
    <div
      className="relative rounded-2xl shadow-md p-4 text-white w-80 flex flex-col items-center overflow-hidden"
      style={{
        background: bankInfo
          ? `linear-gradient(135deg, ${bankInfo.lighter_color}, ${bankInfo.darker_color})`
          : "#333",
      }}
    >
      {/* لایه تزئینی */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute top-1/2 -right-12 w-40 h-40 rounded-full bg-black/10 blur-xl"></div>
        <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white/5 blur-lg"></div>
        <div className="absolute -top-10 -left-20 w-[150%] h-[2px] bg-white/10 rotate-12"></div>
        <div className="absolute top-10 -left-20 w-[150%] h-[2px] bg-white/10 rotate-12"></div>
        <div className="absolute bottom-10 -left-20 w-[150%] h-[2px] bg-white/10 rotate-12"></div>
      </div>

      {/* محتوای کارت */}
      <div className="relative z-10 w-full">
        <div className="flex items-center justify-between mb-4 w-full">
          <div className="flex items-center gap-2">
            {bankInfo && (
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                <Image
                  src={`/bankLogo/${bankInfo.bank_logo}.svg`}
                  alt={bankInfo.bank_name}
                  width={28}
                  height={28}
                />
              </div>
            )}
            <h2 className="text-lg font-bold">
              {bankInfo?.bank_title || "بانک ناشناس"}
            </h2>
          </div>

          {/* دکمه‌ها */}
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(account)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => onDelete(account.id)}
              className="p-2 rounded-full bg-red-500/80 hover:bg-red-600 transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <p
          className="tracking-widest font-mono text-lg mb-2 w-full text-center"
          dir="ltr"
        >
          {account.card_number.replace(/(\d{4})(?=\d)/g, "$1 ")}
        </p>

        <p className="text-sm opacity-80">
          شماره حساب: {account.account_number}
        </p>
        <p className="text-sm opacity-80">شبا: {account.iban}</p>

        <p className="text-right font-bold text-xl mt-4">
          {Number(account.balance).toLocaleString("fa-IR")} ريال
        </p>
      </div>
    </div>
  );
};

export default BankCard;
