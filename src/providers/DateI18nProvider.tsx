import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { enUS, esES, ptBR } from "@mui/x-date-pickers/locales";

// Dayjs locales
import "dayjs/locale/es";
import "dayjs/locale/pt-br";

type Props = { children: React.ReactNode };

export default function DateI18nProvider({ children }: Props) {
  const { i18n } = useTranslation();

  const lng = (i18n.language || "es").slice(0, 2); // es | en | pt

  const adapterLocale = lng === "pt" ? "pt-br" : lng === "en" ? "en" : "es";

  useEffect(() => {
    dayjs.locale(adapterLocale);
  }, [adapterLocale]);

  const localeText = useMemo(() => {
    if (lng === "pt") return ptBR.components.MuiLocalizationProvider.defaultProps.localeText;
    if (lng === "en") return enUS.components.MuiLocalizationProvider.defaultProps.localeText;
    return esES.components.MuiLocalizationProvider.defaultProps.localeText;
  }, [lng]);

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={adapterLocale}
      localeText={localeText}
    >
      {children}
    </LocalizationProvider>
  );
}