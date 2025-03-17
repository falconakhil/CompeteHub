import React from "react";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const Logo = ({ size = "medium" }) => {
  const getFontSize = () => {
    switch (size) {
      case "small":
        return { fontSize: "1.2rem" };
      case "large":
        return { fontSize: "2.5rem" };
      default:
        return { fontSize: "1.8rem" };
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography
        component="span"
        sx={{
          ...getFontSize(),
          fontWeight: "bold",
          color: "#ff9800", // Orange color
          letterSpacing: "0.5px",
          textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        Compete
      </Typography>
      <Typography
        component="span"
        sx={{
          ...getFontSize(),
          fontWeight: "bold",
          color: "#2196f3", // Blue color
          letterSpacing: "0.5px",
          textShadow: "1px 1px 2px rgba(0,0,0,0.15)",
        }}
      >
        Hub
      </Typography>
    </Box>
  );
};

export default Logo;
