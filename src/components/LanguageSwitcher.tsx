import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Select
      size="small"
      value={i18n.language?.slice(0, 2) || "es"}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      sx={{ minWidth: 110 }}
    >
      <MenuItem value="es">ES</MenuItem>
      <MenuItem value="en">EN</MenuItem>
      <MenuItem value="pt">PT</MenuItem>
    </Select>
  );
}