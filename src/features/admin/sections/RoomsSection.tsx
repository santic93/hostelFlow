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
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

import { collection, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, functions } from "../../../services/firebase";
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
  futureReservationsCount: number;
};

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
};

type ReservationStatus = "pending" | "confirmed" | "cancelled";

function AdminEmptyState({
  title,
  desc,
  ctaLabel,
  onCta,
  disabled,
}: {
  title: string;
  desc: string;
  ctaLabel: string;
  onCta: () => void;
  disabled?: boolean;
}) {
  return (
    <Card
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 18 }}>{title}</Typography>
        <Typography sx={{ mt: 0.75, color: "text.secondary" }}>{desc}</Typography>

        <Button
          sx={{
            mt: 2.5,
            borderRadius: 999,
            fontWeight: 900,
            textTransform: "none",
          }}
          variant="contained"
          disabled={disabled}
          startIcon={<AddIcon />}
          onClick={onCta}
          fullWidth
        >
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function getCallableErrorMessage(err: any, fallback: string) {
  const rawMessage = String(err?.message || "").trim();

  if (!rawMessage) return fallback;

  if (rawMessage.toLowerCase().includes("reservas futuras activas")) {
    return "No podés eliminar esta habitación porque tiene reservas futuras activas.";
  }

  return rawMessage;
}

function isActiveFutureReservation(status: string, checkOut: any) {
  const normalizedStatus = String(status || "") as ReservationStatus;
  if (!["pending", "confirmed"].includes(normalizedStatus)) return false;

  const checkOutDate = checkOut?.toDate?.();
  if (!checkOutDate) return false;

  return checkOutDate.getTime() > Date.now();
}

export default function RoomsSection() {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery("(max-width:900px)");
  const { hostelSlug, loading: authLoading, canAccessAdmin, isOwner } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

  const ready = !authLoading && canAccessAdmin && Boolean(hostelSlug);

  const canEditRooms = isOwner;
  const canDeleteRooms = isOwner;

  const money = useMemo(() => {
    const lang = (i18n.language || "es").slice(0, 2);
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }, [i18n.language]);

  const openToast = (severity: ToastState["severity"], message: string) => {
    setToast({ open: true, severity, message });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const fetchRooms = async () => {
    if (!hostelSlug) return;

    setPageError(null);
    setLoadingRooms(true);

    try {
      const [roomsSnapshot, reservationsSnapshot] = await Promise.all([
        getDocs(collection(db, "hostels", hostelSlug, "rooms")),
        getDocs(collection(db, "hostels", hostelSlug, "reservations")),
      ]);

      const futureReservationsByRoom = new Map<string, number>();

      reservationsSnapshot.docs.forEach((docSnap) => {
        const raw = docSnap.data() as any;
        const roomId = String(raw.roomId || "");

        if (!roomId) return;
        if (!isActiveFutureReservation(raw.status, raw.checkOut)) return;

        futureReservationsByRoom.set(
          roomId,
          (futureReservationsByRoom.get(roomId) ?? 0) + 1
        );
      });

      const data: Room[] = roomsSnapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as any;

        return {
          id: docSnap.id,
          name: raw.name ?? "",
          price: raw.price ?? 0,
          capacity: raw.capacity ?? 0,
          description: raw.description ?? "",
          imageUrls: raw.imageUrls ?? (raw.imageUrl ? [raw.imageUrl] : []),
          imagePaths: raw.imagePaths ?? [],
          futureReservationsCount: futureReservationsByRoom.get(docSnap.id) ?? 0,
        };
      });

      const sorted = data.sort((a, b) => {
        if (b.futureReservationsCount !== a.futureReservationsCount) {
          return b.futureReservationsCount - a.futureReservationsCount;
        }

        const aHasImages = (a.imageUrls?.length ?? 0) > 0 ? 1 : 0;
        const bHasImages = (b.imageUrls?.length ?? 0) > 0 ? 1 : 0;

        if (aHasImages !== bHasImages) return bHasImages - aHasImages;
        return (a.price ?? 0) - (b.price ?? 0);
      });

      setRooms(sorted);
    } catch (e: any) {
      setPageError(
        e?.message ?? t("admin.rooms.messages.loadError", "Error cargando habitaciones")
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (!ready) return;

    const params = new URLSearchParams(location.search);
    const wantsNew = params.get("new") === "1";

    if (!wantsNew) return;

    if (!canEditRooms) {
      openToast(
        "error",
        t(
          "admin.rooms.errors.noCreatePermission",
          "No tenés permisos para crear habitaciones."
        )
      );

      params.delete("new");
      navigate(
        { search: params.toString() ? `?${params.toString()}` : "" },
        { replace: true }
      );
      return;
    }

    setSelectedRoom(null);
    setOpenModal(true);

    params.delete("new");
    navigate(
      { search: params.toString() ? `?${params.toString()}` : "" },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (ready) {
      fetchRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hostelSlug]);

  const askDelete = (id: string, name: string) => {
    if (!canDeleteRooms) {
      openToast(
        "error",
        t(
          "admin.rooms.errors.noDeletePermission",
          "Solo el owner puede eliminar habitaciones."
        )
      );
      return;
    }

    setDeleteTarget({ id, name });
    setConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!hostelSlug || !deleteTarget) return;

    const roomId = deleteTarget.id;

    setConfirmOpen(false);
    setDeletingId(roomId);
    setPageError(null);

    try {
      const fn = httpsCallable(functions, "adminDeleteRoom");
      await fn({ hostelSlug, roomId });

      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      openToast("success", t("admin.rooms.messages.deletedOk", "Habitación eliminada ✅"));
    } catch (e: any) {
      const fallback = t(
        "admin.rooms.messages.deleteError",
        "No se pudo eliminar la habitación"
      );
      const msg = getCallableErrorMessage(e, fallback);

      setPageError(msg);
      openToast("error", msg);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const openCreateModal = () => {
    setSelectedRoom(null);
    setOpenModal(true);
  };

  const total = rooms.length;
  const withImages = rooms.filter((r) => (r.imageUrls?.length ?? 0) > 0).length;
  const totalFutureReservations = rooms.reduce(
    (acc, room) => acc + room.futureReservationsCount,
    0
  );
  const roomsWithFutureReservations = rooms.filter(
    (room) => room.futureReservationsCount > 0
  ).length;

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "name",
        headerName: t("admin.rooms.columns.name"),
        flex: 1,
        minWidth: 180,
      },
      {
        field: "price",
        headerName: t("admin.rooms.columns.price"),
        width: 140,
        valueGetter: (_, r) => money.format(Number((r as Room).price || 0)),
      },
      {
        field: "capacity",
        headerName: t("admin.rooms.columns.capacity"),
        width: 120,
      },
      {
        field: "futureReservationsCount",
        headerName: t("admin.rooms.columns.futureReservations", "Reservas futuras"),
        width: 160,
        valueGetter: (_, r) => (r as Room).futureReservationsCount ?? 0,
      },
      {
        field: "images",
        headerName: t("admin.rooms.columns.images", "Fotos"),
        width: 110,
        sortable: false,
        valueGetter: (_, r) => ((r as Room).imageUrls?.length ?? 0),
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
                disabled={!canEditRooms || busy}
                onClick={() => {
                  setSelectedRoom(r);
                  setOpenModal(true);
                }}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                {t("admin.rooms.actions.edit")}
              </Button>

              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={
                  busy ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineIcon />
                }
                disabled={!canDeleteRooms || busy}
                onClick={() => askDelete(r.id, r.name)}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                {busy
                  ? t("common.deleting", "Eliminando…")
                  : t("admin.rooms.actions.delete")}
              </Button>
            </Stack>
          );
        },
      },
    ],
    [t, deletingId, canEditRooms, canDeleteRooms, money]
  );

  if (authLoading) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!canAccessAdmin) {
    return (
      <Alert severity="error">
        {t("admin.errors.noPanelAccess", "No tenés permisos para acceder al panel.")}
      </Alert>
    );
  }

  if (!hostelSlug) {
    return (
      <Typography sx={{ opacity: 0.75 }}>
        {t("admin.errors.loadingHostel", "Cargando tu hostel…")}
      </Typography>
    );
  }

  return (
    <Container disableGutters>
      <Stack spacing={2.25}>
        <Card
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={1.5}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {t("admin.rooms.title")}
                </Typography>

                <Typography sx={{ mt: 0.4, color: "text.secondary", fontSize: 13 }}>
                  {t("admin.rooms.subtitle")}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap", gap: 1 }}>
                  <Chip
                    label={`${total} ${t("admin.rooms.badges.total", "habitaciones")}`}
                    sx={{ borderRadius: 999, fontWeight: 900 }}
                  />
                  <Chip
                    icon={<ImageIcon />}
                    label={`${withImages}/${total} ${t(
                      "admin.rooms.badges.withImages",
                      "con fotos"
                    )}`}
                    sx={{ borderRadius: 999, fontWeight: 900 }}
                  />
                  <Chip
                    icon={<EventAvailableIcon />}
                    label={`${totalFutureReservations} ${t(
                      "admin.rooms.badges.futureReservationsTotal",
                      "reservas futuras"
                    )}`}
                    color={totalFutureReservations > 0 ? "primary" : "default"}
                    sx={{ borderRadius: 999, fontWeight: 900 }}
                  />
                  <Chip
                    label={`${roomsWithFutureReservations}/${total} ${t(
                      "admin.rooms.badges.roomsWithFutureReservations",
                      "con reservas"
                    )}`}
                    sx={{ borderRadius: 999, fontWeight: 900 }}
                  />
                </Stack>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={
                    loadingRooms ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />
                  }
                  onClick={fetchRooms}
                  disabled={loadingRooms || deletingId !== null}
                  sx={{
                    borderRadius: 999,
                    fontWeight: 900,
                    textTransform: "none",
                  }}
                  fullWidth={isMobile}
                >
                  {loadingRooms
                    ? t("common.loading", "Cargando…")
                    : t("common.refresh", "Refrescar")}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={!canEditRooms || deletingId !== null}
                  onClick={openCreateModal}
                  sx={{
                    borderRadius: 999,
                    fontWeight: 900,
                    textTransform: "none",
                  }}
                  fullWidth={isMobile}
                >
                  {t("admin.rooms.actions.create", "Crear habitación")}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {!canEditRooms && (
          <Alert severity="info">
            {t(
              "admin.rooms.messages.onlyOwnerCanEdit",
              "Solo el owner puede crear/editar habitaciones."
            )}
          </Alert>
        )}

        {pageError && <Alert severity="error">{pageError}</Alert>}

        <Divider />

        {loadingRooms ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : rooms.length === 0 ? (
          <AdminEmptyState
            title={t("admin.rooms.emptyTitle")}
            desc={t("admin.rooms.emptyDesc")}
            ctaLabel={t("admin.rooms.actions.create", "Crear habitación")}
            onCta={openCreateModal}
            disabled={!canEditRooms}
          />
        ) : isMobile ? (
          <Stack spacing={1.5}>
            {rooms.map((r) => {
              const busy = deletingId === r.id;
              const imgCount = r.imageUrls?.length ?? 0;

              return (
                <Card
                  key={r.id}
                  sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.2}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                      >
                        <Typography sx={{ fontWeight: 900 }} noWrap>
                          {r.name}
                        </Typography>

                        <Chip
                          size="small"
                          label={
                            imgCount > 0
                              ? t("admin.rooms.badges.photosCount", "{{n}} fotos", { n: imgCount })
                              : t("admin.rooms.badges.noPhotos", "Sin fotos")
                          }
                          color={imgCount > 0 ? "success" : "default"}
                          sx={{ borderRadius: 999, fontWeight: 900 }}
                        />
                      </Stack>

                      <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                        {r.description ||
                          t("admin.rooms.fallback.noDescription", "Sin descripción")}
                      </Typography>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontWeight: 900 }}>
                          {money.format(Number(r.price || 0))}{" "}
                          <span style={{ fontWeight: 600, opacity: 0.7 }}>
                            {t("admin.rooms.perNight", "/ noche")}
                          </span>
                        </Typography>

                        <Typography sx={{ fontSize: 13, opacity: 0.8 }}>
                          {t("admin.rooms.labels.capacityShort", "Cap:")} {r.capacity}
                        </Typography>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip
                          icon={<EventAvailableIcon />}
                          label={
                            r.futureReservationsCount > 0
                              ? t("admin.rooms.badges.futureReservationsCount", "{{n}} reservas futuras", {
                                  n: r.futureReservationsCount,
                                })
                              : t("admin.rooms.badges.noFutureReservations", "Sin reservas futuras")
                          }
                          color={r.futureReservationsCount > 0 ? "primary" : "default"}
                          sx={{ borderRadius: 999, fontWeight: 900 }}
                        />
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          disabled={!canEditRooms || busy}
                          onClick={() => {
                            setSelectedRoom(r);
                            setOpenModal(true);
                          }}
                          fullWidth
                          sx={{ textTransform: "none", fontWeight: 800 }}
                        >
                          {t("admin.rooms.actions.edit")}
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={
                            busy ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <DeleteOutlineIcon />
                            )
                          }
                          disabled={!canDeleteRooms || busy}
                          onClick={() => askDelete(r.id, r.name)}
                          fullWidth
                          sx={{ textTransform: "none", fontWeight: 800 }}
                        >
                          {busy
                            ? t("common.deleting", "Eliminando…")
                            : t("admin.rooms.actions.delete")}
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
              loading={loadingRooms}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
              sx={{
                borderRadius: 4,
                borderColor: "divider",
                backgroundColor: "background.paper",
                "& .MuiDataGrid-columnHeaders": {
                  fontWeight: 900,
                },
              }}
            />
          </Box>
        )}

        <RoomFormModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          initialData={selectedRoom}
          onSuccess={() => {
            fetchRooms();
            openToast("success", t("admin.rooms.messages.savedOk", "Guardado ✅"));
          }}
          hostelSlug={hostelSlug}
        />

        <Dialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle sx={{ fontWeight: 900 }}>
            {t("admin.rooms.confirmDelete.title", "Eliminar habitación")}
          </DialogTitle>

          <DialogContent>
            <Typography sx={{ color: "text.secondary" }}>
              {t(
                "admin.rooms.confirmDelete.desc",
                "Vas a borrar la habitación y sus imágenes. Esta acción no se puede deshacer."
              )}
            </Typography>

            {deleteTarget?.name ? (
              <Typography sx={{ mt: 1.25, fontWeight: 900 }}>{deleteTarget.name}</Typography>
            ) : null}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={deletingId !== null}>
              {t("common.cancel", "Cancelar")}
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirmed}
              disabled={deletingId !== null}
              startIcon={
                deletingId !== null ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DeleteOutlineIcon />
                )
              }
            >
              {deletingId !== null
                ? t("common.deleting", "Eliminando…")
                : t("common.delete", "Eliminar")}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={toast.open}
          autoHideDuration={2800}
          onClose={closeToast}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={closeToast}
            severity={toast.severity}
            variant="filled"
            sx={{ borderRadius: 3 }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Stack>
    </Container>
  );
}