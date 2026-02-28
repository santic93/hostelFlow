import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import type { Room } from "../../../../../types/room";
import { Seo } from "../../../../../components/Seo";
import { db } from "../../../../../services/firebase";

export default function AdminRoomsPage() {
  const { t } = useTranslation();
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const [rooms, setRooms] = useState<Room[]>([]);

  const fetchRooms = async () => {
    if (!hostelSlug) return;

    const q = query(
      collection(db, "hostels", hostelSlug, "rooms"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const data: Room[] = snapshot.docs.map((d) => {
      const raw = d.data() as any;
      return {
        id: d.id,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelSlug]);

  const handleDelete = async (id: string) => {
    if (!hostelSlug) return;
    await deleteDoc(doc(db, "hostels", hostelSlug, "rooms", id));
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const columns = useMemo<GridColDef[]>(() => [
    { field: "name", headerName: t("admin.rooms.columns.name"), flex: 1 },
    { field: "price", headerName: t("admin.rooms.columns.price"), width: 120 },
    { field: "capacity", headerName: t("admin.rooms.columns.capacity"), width: 120 },
    {
      field: "actions",
      headerName: t("admin.rooms.columns.actions"),
      width: 220,
      renderCell: (params) => (
        <>
          <Button size="small" disabled>
            {t("admin.rooms.actions.edit")}
          </Button>
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
  ], [t]);

  return (
    <>
      <Seo
        title={t("admin.rooms.seoTitle")}
        description={t("admin.rooms.seoDescription")}
        noindex
      />

      <Box>
        <Typography variant="h3" gutterBottom>
          {t("admin.rooms.title")}
        </Typography>

        <DataGrid
          rows={rooms}
          columns={columns}
          autoHeight
          pageSizeOptions={[5, 10]}
        />
      </Box>
    </>
  );
}