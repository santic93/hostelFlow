# Hostly — Status / Roadmap

## Objetivo de producto
Sistema simple para hostels/hoteles pequeños:
- Web pública por slug
- Reservas directas (sin comisión)
- Panel Admin (rooms + reservas)
- Dashboard simple (métricas)
- Estados: PENDING / CONFIRMED / CANCELLED

## Restricciones / decisiones
- Sin channel manager / sync Booking al inicio
- Sin personalizaciones a medida (solo logo/colores básicos más adelante)
- Soporte solo por email (24–48h)
- Mobile-first, UX y estabilidad

## Estado actual
- Multi-tenant base con slug público
- Auth OK
- Firestore guarda rooms y reservas (base)
- Admin Rooms: lista + borra doc (pendiente borrar imagen)
- Loader/UX base
- Proyecto en Blaze

## Sprint 1 (máxima prioridad): Firebase Storage rooms images
Requerimientos:
- Path: hostels/{hostelId}/rooms/{roomId}/{filename}
- Guardar en Firestore:
  - imageUrls: string[]
  - imagePaths: string[]
Flujo:
- addDoc room -> roomId
- upload Storage -> downloadURL
- updateDoc room con imageUrls + imagePaths
UX:
- file input accept="image/*"
- preview con URL.createObjectURL
- validaciones: <= 2MB final, jpg/png/webp
- delete total: room delete -> Storage delete (si existe)
Seguridad:
- MVP: rules validan ownerUid en hostels/{hostelId}
- Luego: custom claims (request.auth.token.hostelId == hostelId)

## Sprint 2: Reservas (modelo + estados + anti-overbooking)
- Estados: PENDING / CONFIRMED / CANCELLED
- Campos: hostelId, roomId, guestName, guestEmail, fromDate, toDate, status, createdAt, totalPrice
- Regla: al confirmar, bloquear solapamiento de CONFIRMED por roomId (transacción)

## Sprint 3: Dashboard MVP (últimos 30 días)
KPIs:
- total reservas creadas
- total confirmadas
- ingresos estimados (sum totalPrice confirmadas)
- ocupación estimada %
MVP: cálculo en frontend por rango

## Roadmap 60 días (alto nivel)
- Semanas 1–3: Estabilidad (tenant, rutas protegidas, loading/error, estructura Firestore)
- Semanas 4–6: UX Pro (admin usable, formularios, emails, mobile perfecto)
- Semanas 7–8: Vender (landing+demo, términos/privacidad, dominio, cobro manual al inicio)