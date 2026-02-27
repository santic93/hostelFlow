import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid, } from "@mui/x-data-grid";
import { Alert, Box, Button, Typography } from "@mui/material";
import { db, storage } from "../../../services/firebase";
import RoomFormModal from "../components/RoomFormModal";
import { deleteObject, ref } from "firebase/storage";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
type Room = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrls: string[];
  imagePaths?: string[];
};

export default function RoomsSection() {
  const { t } = useTranslation();
  const { hostelSlug, role, loading } = useAuth();

  const [openModal, setOpenModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const ready = !loading && role === "admin" && Boolean(hostelSlug);

  const fetchRooms = async () => {
    if (!hostelSlug) return;

    setPageError(null);

    try {
      const snapshot = await getDocs(collection(db, "hostels", hostelSlug, "rooms"));

      const data: Room[] = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as any;

        return {
          id: docSnap.id,
          name: raw.name ?? "",
          price: raw.price ?? 0,
          capacity: raw.capacity ?? 0,
          description: raw.description ?? "",
          imageUrls: raw.imageUrls ?? (raw.imageUrl ? [raw.imageUrl] : []),
          imagePaths: raw.imagePaths ?? [],
        };
      });

      setRooms(data);
    } catch (e: any) {
      setPageError(e?.message ?? "Error cargando habitaciones");
    }
  };

  useEffect(() => {
    if (ready) fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hostelSlug]);

  const handleDelete = async (id: string) => {
    if (!hostelSlug) return;

    // confirm simple (MVP)
    const ok = window.confirm("¿Eliminar esta habitación? Esto también borra sus imágenes.");
    if (!ok) return;

    setDeletingId(id);
    setPageError(null);

    try {
      const roomRef = doc(db, "hostels", hostelSlug, "rooms", id);
      const snap = await getDoc(roomRef);

      if (snap.exists()) {
        const data = snap.data() as any;
        const paths: string[] = data.imagePaths ?? [];

        if (paths.length) {
          await Promise.allSettled(paths.map((p) => deleteObject(ref(storage, p))));
        }
      }

      await deleteDoc(roomRef);
      setRooms((prev) => prev.filter((room) => room.id !== id));
    } catch (e: any) {
      setPageError(e?.message ?? "No se pudo eliminar la habitación");
    } finally {
      setDeletingId(null);
    }
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: t("admin.rooms.columns.name"), flex: 1 },
    { field: "price", headerName: t("admin.rooms.columns.price"), width: 120 },
    { field: "capacity", headerName: t("admin.rooms.columns.capacity"), width: 120 },
    {
      field: "actions",
      headerName: t("admin.rooms.columns.actions"),
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const id = params.row.id as string;

        return (
          <>
            <Button
              size="small"
              onClick={() => {
                setSelectedRoom(params.row);
                setOpenModal(true);
              }}
            >
              {t("admin.rooms.actions.edit")}
            </Button>

            <Button
              size="small"
              color="error"
              disabled={deletingId === id}
              onClick={() => handleDelete(id)}
            >
              {deletingId === id ? "Eliminando..." : t("admin.rooms.actions.delete")}
            </Button>
          </>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Box>
        <Typography variant="h6">{t("loading.title")}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t("loading.subtitle")}
        </Typography>
      </Box>
    );
  }

  if (role !== "admin") {
    return (
      <Box>
        <Alert severity="error">No tenés permisos de administrador.</Alert>
      </Box>
    );
  }

  if (!hostelSlug) {
    return (
      <Box>
        <Alert severity="info">Cargando tu hostel…</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={2}>
        {t("admin.rooms.title")}
      </Typography>

      {pageError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {pageError}
        </Alert>
      )}

      <Button
        variant="contained"
        sx={{ mb: 2 }}
        onClick={() => {
          setSelectedRoom(null);
          setOpenModal(true);
        }}
      >
        {t("admin.rooms.modal.createTitle")}
      </Button>

      <DataGrid rows={rooms} columns={columns} autoHeight pageSizeOptions={[5, 10]} />

      <RoomFormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        initialData={selectedRoom}
        onSuccess={fetchRooms}
        hostelSlug={hostelSlug}
      />
    </Box>
  );
}