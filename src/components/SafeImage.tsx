import { useState } from "react";
import BrokenImageOutlinedIcon from "@mui/icons-material/BrokenImageOutlined";
import { Box } from "@mui/material";

type Props = {
  src?: string;
  alt?: string;
  sx?: any;
};

export default function SafeImage({ src, alt, sx }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <Box
        sx={{
          width: "100%",
          aspectRatio: "4 / 3",
          borderRadius: 2,
          bgcolor: "grey.100",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "grey.500",
          ...sx,
        }}
      >
        <BrokenImageOutlinedIcon sx={{ fontSize: 64 }} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt ?? ""}
      onError={() => setFailed(true)}
      sx={{
        width: "100%",
        aspectRatio: "4 / 3",
        objectFit: "cover",
        borderRadius: 2,
        display: "block",
        ...sx,
      }}
    />
  );
}