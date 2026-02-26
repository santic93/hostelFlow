import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import type { Room } from "../../types/room";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid, } from "@mui/x-data-grid";
import { Button, Box, Typography } from "@mui/material";
import { db } from "../../services/firebase";
import { useTranslation } from "react-i18next";


export default function AdminRoomsPage() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);

  const fetchRooms = async () => {
    const snapshot = await getDocs(collection(db, "rooms"));

    const data: Room[] = snapshot.docs.map((docSnap) => {
      const raw = docSnap.data() as any;

      return {
        id: docSnap.id,
        name: raw.name ?? "",
        description: raw.description ?? "",
        price: raw.price ?? 0,
        capacity: raw.capacity ?? 0,
        imageUrl: raw.imageUrl ?? "",
        createdAt: raw.createdAt?.toDate?.() ?? null,
      };
    });

    setRooms(data);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "rooms", id));
    setRooms((prev) => prev.filter((room) => room.id !== id));
  };

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "name", headerName: t("admin.rooms.columns.name"), flex: 1 },
      { field: "price", headerName: t("admin.rooms.columns.price"), width: 120 },
      { field: "capacity", headerName: t("admin.rooms.columns.capacity"), width: 140 },
      {
        field: "actions",
        headerName: t("admin.rooms.columns.actions"),
        width: 220,
        renderCell: (params) => (
          <>
            <Button size="small">{t("admin.rooms.actions.edit")}</Button>
            <Button
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              {t("admin.rooms.actions.delete")}
            </Button>
          </>
        ),
      },
    ],
    [t]
  );

  return (
    <Box>
      <Typography variant="h4" mb={2}>
        {t("admin.rooms.title")}
      </Typography>

      <DataGrid rows={rooms} columns={columns} autoHeight pageSizeOptions={[5, 10]} />
    </Box>
  );
}