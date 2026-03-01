import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import RefreshIcon from "@mui/icons-material/Refresh";

import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

import { db, storage } from "../../../services/firebase";
import RoomFormModal from "../components/RoomFormModal";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthContext";

type Room = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrls: string[];
  imagePaths?: string[];
};

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
};

export default function RoomsSection() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width:900px)");
  const { hostelSlug, loading: authLoading, canAccessAdmin, isOwner, isManager } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

  const ready = !authLoading && canAccessAdmin && Boolean(hostelSlug);

  const openToast = (severity: ToastState["severity"], message: string) =>
    setToast({ open: true, severity, message });

  const closeToast = () => setToast((p) => ({ ...p, open: false }));

  const canEditRooms = isOwner; // 🔒 tu decisión: SOLO owner crea/edita
  const canDeleteRooms = isOwner; // 🔒 tu decisión: SOLO owner borra
  // Si querés permitir manager, cambiá a: const canEditRooms = isManager; const canDeleteRooms = isManager;

  const fetchRooms = async () => {
    if (!hostelSlug) return;
    setPageError(null);
    setLoadingRooms(true);

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

      setRooms(
        data.sort((a, b) => {
          const ai = (a.imageUrls?.length ?? 0) > 0 ? 1 : 0;
          const bi = (b.imageUrls?.length ?? 0) > 0 ? 1 : 0;
          if (ai !== bi) return bi - ai;
          return (a.price ?? 0) - (b.price ?? 0);
        })
      );
    } catch (e: any) {
      setPageError(e?.message ?? "Error cargando habitaciones");
    } finally {
      setLoadingRooms(false);
    }
  };

  // auto-open modal if ?new=1
  useEffect(() => {
    if (!ready) return;

    const params = new URLSearchParams(location.search);
    const wantsNew = params.get("new") === "1";

    if (wantsNew) {
      if (!canEditRooms) {
        openToast("error", "No tenés permisos para crear habitaciones.");
        // limpiamos query para que no quede “pegado”
        params.delete("new");
        navigate({ search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
        return;
      }

      setSelectedRoom(null);
      setOpenModal(true);

      params.delete("new");
      navigate({ search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (ready) fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hostelSlug]);

  const askDelete = (id: string, name: string) => {
    if (!canDeleteRooms) {
      openToast("error", "Solo el owner puede eliminar habitaciones.");
      return;
    }
    setDeleteTarget({ id, name });
    setConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!hostelSlug || !deleteTarget) return;

    const id = deleteTarget.id;
    setConfirmOpen(false);
    setDeletingId(id);
    setPageError(null);

    try {
      // 1) leer doc para imagePaths
      const roomRef = doc(db, "hostels", hostelSlug, "rooms", id);
      const snap = await getDoc(roomRef);

      if (snap.exists()) {
        const data = snap.data() as any;
        const paths: string[] = data.imagePaths ?? [];
        if (paths.length) {
          await Promise.allSettled(paths.map((p) => deleteObject(ref(storage, p))));
        }
      }

      // 2) borrar doc
      await deleteDoc(roomRef);

      // 3) update state
      setRooms((prev) => prev.filter((r) => r.id !== id));
      openToast("success", t("admin.rooms.messages.deletedOk", "Habitación eliminada"));
    } catch (e: any) {
      setPageError(e?.message ?? "No se pudo eliminar la habitación");
      openToast("error", e?.message ?? "No se pudo eliminar");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const total = rooms.length;
  const withImages = rooms.filter((r) => (r.imageUrls?.length ?? 0) > 0).length;

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "name", headerName: t("admin.rooms.columns.name"), flex: 1, minWidth: 180 },
      { field: "price", headerName: t("admin.rooms.columns.price"), width: 120, valueGetter: (_, r) => `$${r.price}` },
      { field: "capacity", headerName: t("admin.rooms.columns.capacity"), width: 120 },
      {
        field: "images",
        headerName: t("admin.rooms.columns.images", "Fotos"),
        width: 110,
        sortable: false,
        valueGetter: (_, r) => (r.imageUrls?.length ?? 0),
      },
      {
        field: "actions",
        headerName: t("admin.rooms.columns.actions"),
        width: 260,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const r = params.row as Room;
          const busy = deletingId === r.id;

          return (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                disabled={!canEditRooms}
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
                color="error"
                startIcon={<DeleteOutlineIcon />}
                disabled={!canDeleteRooms || busy}
                onClick={() => askDelete(r.id, r.name)}
              >
                {busy ? t("common.deleting", "Eliminando…") : t("admin.rooms.actions.delete")}
              </Button>
            </Stack>
          );
        },
      },
    ],
    [t, deletingId, canEditRooms, canDeleteRooms]
  );

  if (authLoading) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!canAccessAdmin) {
    return <Alert severity="error">No tenés permisos para acceder al panel.</Alert>;
  }

  if (!hostelSlug) {
    return <Typography sx={{ opacity: 0.75 }}>Cargando tu hostel…</Typography>;
  }

  return (
    <Container disableGutters>
      <Stack spacing={2}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {t("admin.rooms.title")}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              <Chip label={`${total} ${t("admin.rooms.badges.total", "habitaciones")}`} sx={{ borderRadius: 999, fontWeight: 900 }} />
              <Chip
                icon={<ImageIcon />}
                label={`${withImages}/${total} ${t("admin.rooms.badges.withImages", "con fotos")}`}
                sx={{ borderRadius: 999, fontWeight: 900 }}
              />
            </Stack>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchRooms}
              disabled={loadingRooms}
              sx={{ borderRadius: 999, fontWeight: 900, textTransform: "none" }}
            >
              {loadingRooms ? t("common.loading", "Cargando…") : t("common.refresh", "Refrescar")}
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!canEditRooms}
              onClick={() => {
                setSelectedRoom(null);
                setOpenModal(true);
              }}
              sx={{ borderRadius: 999, fontWeight: 900, textTransform: "none" }}
            >
              {t("admin.rooms.modal.createTitle")}
            </Button>
          </Stack>
        </Stack>

        {!canEditRooms && (
          <Alert severity="info">
            Solo el <b>owner</b> puede crear/editar habitaciones. (Esto coincide con tu política.)
          </Alert>
        )}

        {pageError && <Alert severity="error">{pageError}</Alert>}

        <Divider />

        {/* Body */}
        {loadingRooms ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : rooms.length === 0 ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography sx={{ fontWeight: 900 }}>
                {t("admin.rooms.emptyTitle", "Todavía no tenés habitaciones")}
              </Typography>
              <Typography sx={{ mt: 0.5, opacity: 0.75 }}>
                {t("admin.rooms.emptyDesc", "Creá la primera para que el público pueda reservar.")}
              </Typography>

              <Button
                sx={{ mt: 2, borderRadius: 999, fontWeight: 900, textTransform: "none" }}
                variant="contained"
                disabled={!canEditRooms}
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedRoom(null);
                  setOpenModal(true);
                }}
              >
                {t("admin.rooms.modal.createTitle")}
              </Button>
            </CardContent>
          </Card>
        ) : isMobile ? (
          <Stack spacing={1.5}>
            {rooms.map((r) => {
              const busy = deletingId === r.id;
              const imgCount = r.imageUrls?.length ?? 0;

              return (
                <Card key={r.id} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Typography sx={{ fontWeight: 900 }} noWrap>
                          {r.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={imgCount > 0 ? `${imgCount} fotos` : "Sin fotos"}
                          color={imgCount > 0 ? "success" : "default"}
                          sx={{ borderRadius: 999, fontWeight: 900 }}
                        />
                      </Stack>

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
                          startIcon={<EditIcon />}
                          disabled={!canEditRooms}
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
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          disabled={!canDeleteRooms || busy}
                          onClick={() => askDelete(r.id, r.name)}
                        >
                          {busy ? "Eliminando…" : t("admin.rooms.actions.delete")}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
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

        {/* Modal */}
        <RoomFormModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          initialData={selectedRoom}
          onSuccess={() => {
            fetchRooms();
            openToast("success", t("admin.rooms.messages.savedOk", "Guardado"));
          }}
          hostelSlug={hostelSlug}
        />

        {/* Confirm delete */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle sx={{ fontWeight: 900 }}>
            {t("admin.rooms.confirmDeleteTitle", "Eliminar habitación")}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ opacity: 0.8 }}>
              {t("admin.rooms.confirmDeleteDesc", "Vas a borrar la habitación y sus imágenes. Esta acción no se puede deshacer.")}
            </Typography>
            {deleteTarget?.name ? (
              <Typography sx={{ mt: 1, fontWeight: 900 }}>
                {deleteTarget.name}
              </Typography>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button variant="contained" color="error" onClick={handleDeleteConfirmed}>
              {t("common.delete", "Eliminar")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast */}
        <Snackbar
          open={toast.open}
          autoHideDuration={2800}
          onClose={closeToast}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ borderRadius: 3 }}>
            {toast.message}
          </Alert>
        </Snackbar>
      </Stack>
    </Container>
  );
}