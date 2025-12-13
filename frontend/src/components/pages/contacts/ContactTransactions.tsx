import React from "react";

interface Transaction {
  amount: string;
  date: string;
  status: boolean;
  type: string;
}

interface ContactTransactionsProps {
  transactions: Transaction[];
}

export const ContactTransactions: React.FC<ContactTransactionsProps> = ({
  transactions,
}) => {
  return (
    <div className="w-full p-4 bg-box rounded-xl shadow-md">
      <div className="flex items-center justify-start mb-4">
        <h2 className="font-bold text-lg">تراکنش‌ها</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right border-separate border-spacing-y-2">
          <thead>
            <tr className="text-sm text-gray-500">
              <th className="px-4 py-2">نوع</th>
              <th className="px-4 py-2">مبلغ</th>
              <th className="px-4 py-2">تاریخ</th>
              <th className="px-4 py-2">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {transactions && transactions.length > 0 ? (
              transactions.map((tx, idx) => (
                <tr key={idx} className="text-sm font-medium">
                  <td colSpan={4} className={`px-4 py-2 rounded-md`}>
                    <div className="flex justify-between">
                      <span>{tx.amount} ريال</span>
                      <span>{tx.date}</span>
                      <span>{tx.status ? "پرداخت شده" : "پرداخت نشده"}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  تراکنشی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
