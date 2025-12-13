import React from "react";

interface InfoCartData {
  titel: string;
  Icon: React.ElementType;
  color: string;
  amount: string;
}

const InfoCart: React.FC<InfoCartData> = ({ titel, Icon, color, amount }) => {
  return (
    <div
      className={`bg-box text-foreground flex flex-col gap-y-12 p-4 rounded-xl overflow-hidden pb-8 relative`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center justify-between gap-2 font-semibold">
          <span className={`rounded-full ${color} p-1`}>
            <Icon className={`text-2xl rounded-full text-white`} />{" "}
          </span>
          <h3>{titel}</h3>
        </div>
      </div>
      <p className="text-2xl font-semibold text-left" dir="ltr">
        {amount + " "} <span className="text-xs">ريال</span>
      </p>
      <span className={`absolute w-full bottom-0 right-0 h-2 ${color}`}></span>
    </div>
  );
};

export default InfoCart;
