import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BookIcon from "@mui/icons-material/Book";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import { useState } from "react";

type Section = "dashboard" | "reservations" | "rooms";

interface Props {
  children: (section: Section) => React.ReactNode;
}

export const AdminLayout = ({ children }: Props) => {
  const [section, setSection] = useState<Section>("dashboard");
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: "flex" }}>
      {/* SIDEBAR */}
      <Drawer
        variant="permanent"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        sx={{
          width: open ? 220 : 70,
          flexShrink: 0,
          transition: "width 0.3s",
          "& .MuiDrawer-paper": {
            width: open ? 220 : 70,
            overflowX: "hidden",
            transition: "width 0.3s",
            boxSizing: "border-box",
          },
        }}
      >
        <List>
          <ListItemButton onClick={() => setSection("dashboard")}>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Dashboard" />}
          </ListItemButton>

          <ListItemButton onClick={() => setSection("reservations")}>
            <ListItemIcon>
              <BookIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Reservations" />}
          </ListItemButton>

          <ListItemButton onClick={() => setSection("rooms")}>
            <ListItemIcon>
              <MeetingRoomIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Rooms" />}
          </ListItemButton>
        </List>
      </Drawer>

      {/* CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 6,
          transition: "margin 0.3s",
        }}
      >
        {children(section)}
      </Box>
    </Box>
  );
};