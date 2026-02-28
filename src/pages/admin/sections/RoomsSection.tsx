import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
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
  const isMobile = useMediaQuery("(max-width:900px)");

  const { hostelSlug, role, loading } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

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
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setPageError(e?.message ?? "No se pudo eliminar la habitación");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "name", headerName: t("admin.rooms.columns.name"), flex: 1, minWidth: 160 },
      { field: "price", headerName: t("admin.rooms.columns.price"), width: 120 },
      { field: "capacity", headerName: t("admin.rooms.columns.capacity"), width: 120 },
      {
        field: "actions",
        headerName: t("admin.rooms.columns.actions"),
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const id = params.row.id as string;
          return (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedRoom(params.row);
                  setOpenModal(true);
                }}
              >
                {t("admin.rooms.actions.edit")}
              </Button>

              <Button
                size="small"
                variant="contained"
                disabled={deletingId === id}
                onClick={() => handleDelete(id)}
              >
                {deletingId === id ? "Eliminando..." : t("admin.rooms.actions.delete")}
              </Button>
            </Stack>
          );
        },
      },
    ],
    [t, deletingId]
  );

  if (loading) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (role !== "admin") {
    return <Alert severity="error">No tenés permisos de administrador.</Alert>;
  }

  if (!hostelSlug) {
    return <Typography sx={{ opacity: 0.75 }}>Cargando tu hostel…</Typography>;
  }

  return (
    <Container disableGutters>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          spacing={1}
        >
          <Typography variant="h5">{t("admin.rooms.title")}</Typography>

          <Button
            variant="contained"
            onClick={() => {
              setSelectedRoom(null);
              setOpenModal(true);
            }}
          >
            {t("admin.rooms.modal.createTitle")}
          </Button>
        </Stack>

        {pageError && <Alert severity="error">{pageError}</Alert>}

        {isMobile ? (
          <Stack spacing={1.5}>
            {rooms.map((r) => (
              <Card key={r.id}>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography sx={{ fontWeight: 900 }}>{r.name}</Typography>
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                      {r.description || "-"}
                    </Typography>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontWeight: 900 }}>
                        ${r.price} <span style={{ fontWeight: 600, opacity: 0.7 }}>/ noche</span>
                      </Typography>
                      <Typography sx={{ fontSize: 13, opacity: 0.8 }}>
                        Cap: {r.capacity}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedRoom(r);
                          setOpenModal(true);
                        }}
                      >
                        {t("admin.rooms.actions.edit")}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={deletingId === r.id}
                        onClick={() => handleDelete(r.id)}
                      >
                        {deletingId === r.id ? "Eliminando..." : t("admin.rooms.actions.delete")}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <Box sx={{ width: "100%" }}>
            <DataGrid
              autoHeight
              rows={rooms}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            />
          </Box>
        )}

        <RoomFormModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          initialData={selectedRoom}
          onSuccess={fetchRooms}
          hostelSlug={hostelSlug}
        />
      </Stack>
    </Container>
  );
}