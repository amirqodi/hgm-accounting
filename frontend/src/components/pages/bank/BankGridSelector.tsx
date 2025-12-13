"use client";

import { useState, useEffect, useRef } from "react";
import myBanksJson from "@/data/banks.json";
import type { Bank } from "iranian-bank-list";
import Image from "next/image";

interface BankSelectorProps {
  value?: string;
  onChange: (bankCode: string) => void;
  cardNumber?: string;
}

export default function BankSelector({
  value,
  onChange,
  cardNumber,
}: BankSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const allBanks: Bank[] = myBanksJson;

  const normalize = (str: string) =>
    str?.toLowerCase().replace(/\s+/g, "") ?? "";

  const filteredBanks = allBanks.filter((bank) => {
    const faName = normalize(bank.bank_title);
    const enName = normalize(bank.bank_name);
    const query = normalize(search);
    return faName.includes(query) || enName.includes(query);
  });

  // Auto-select bank after 6 digits
  useEffect(() => {
    if (!cardNumber || cardNumber.length < 6) return;

    const sanitizedCardNumber = cardNumber.replace(/\s+/g, "");
    const first6Digits = sanitizedCardNumber.slice(0, 6);

    const matchedBank = allBanks.find((bank) => {
      const prefixMatch = bank.card_regex.match(/^\^(\d+)/);
      if (!prefixMatch) return false;
      const prefix = prefixMatch[1];
      return first6Digits.startsWith(prefix);
    });

    if (matchedBank) {
      setSelectedBank(matchedBank);
      onChange(matchedBank.bank_title);
    }
  }, [cardNumber, allBanks, onChange]);

  useEffect(() => {
    if (value) {
      const bank = allBanks.find((b) => b.bank_title === value);
      if (bank) setSelectedBank(bank);
    }
  }, [value, allBanks]);

  const handleSelect = (bank: Bank) => {
    setSelectedBank(bank);
    onChange(bank.bank_title ?? "");
    setSearch("");
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="w-full relative">
      <div className="relative flex items-center border rounded-lg p-2 bg-box gap-3 h-12">
        {selectedBank && (
          <Image
            width={32}
            height={32}
            src={`/bankLogo/${selectedBank.bank_logo}.svg`}
            alt={selectedBank.bank_name}
            className="w-8 h-8 mr-2"
          />
        )}
        <input
          type="text"
          placeholder="جستجوی بانک..."
          value={search || selectedBank?.bank_title || ""}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-transparent focus:outline-none"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full max-h-64 overflow-y-auto border rounded-lg bg-box mt-1 shadow-lg">
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bank, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(bank)}
                className="flex items-center gap-2 w-full p-2 text-left hover:bg-primary/20 transition-colors"
              >
                <Image
                  width={32}
                  height={32}
                  src={`/bankLogo/${bank.bank_logo}.svg`}
                  alt={bank.bank_name}
                  className="w-8 h-8"
                />
                <span>{bank.bank_title}</span>
              </button>
            ))
          ) : (
            <p className="p-2 text-muted text-sm text-center">بانکی یافت نشد</p>
          )}
        </div>
      )}
    </div>
  );
}
