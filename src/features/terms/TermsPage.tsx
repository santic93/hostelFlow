import { Container, Divider, Stack, Typography } from "@mui/material";

import { useParams } from "react-router-dom";
import { Seo } from "../../components/Seo";

import { Box,  Link } from "@mui/material";


function List({ items }: { items: React.ReactNode[] }) {
  return (
    <Box
      component="ul"
      sx={{
        m: 0,
        pl: 2.2,
        display: "grid",
        gap: 0.75,
        "& li": { lineHeight: 1.6 },
      }}
    >
      {items.map((it, idx) => (
        <Box component="li" key={idx}>
          <Typography variant="body2">{it}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={1.2} id={id} sx={{ scrollMarginTop: 90 }}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

export function TermsPage() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const base = window.location.origin;
  const canonical = hostelSlug ? `${base}/${hostelSlug}/terms` : `${base}/terms`;

  return (
    <>
      <Seo title="Terms — HOSTLY" description="Terms and conditions." canonical={canonical} noindex />

      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
        <Stack spacing={3}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Términos y Condiciones
          </Typography>

          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
            Última actualización: 1 de marzo de 2026
          </Typography>

          {/* Índice (opcional pero recomendado) */}
          <Box
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          >
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Índice</Typography>
            <Stack spacing={0.5}>
              {[
                ["que-es", "1. ¿Qué es Hostly?"],
                ["cuenta", "2. Cuenta de administrador"],
                ["contenido", "3. Responsabilidad sobre el contenido"],
                ["reservas", "4. Reservas realizadas por huéspedes"],
                ["uso", "5. Uso adecuado de la plataforma"],
                ["disponibilidad", "6. Disponibilidad del servicio"],
                ["limitacion", "7. Limitación de responsabilidad"],
                ["propiedad", "8. Propiedad intelectual"],
                ["modificaciones", "9. Modificaciones"],
                ["jurisdiccion", "10. Jurisdicción"],
              ].map(([id, label]) => (
                <Link key={id} href={`#${id}`} underline="hover" sx={{ fontSize: 14 }}>
                  {label}
                </Link>
              ))}
            </Stack>
          </Box>

          <Divider />

          <Section id="que-es" title="1. ¿Qué es Hostly?">
            <Typography variant="body2">
              Hostly es una plataforma SaaS (Software as a Service) que permite a hostels y pequeños alojamientos:
            </Typography>
            <List
              items={[
                "Crear su propio sitio web de reservas",
                "Gestionar habitaciones",
                "Administrar reservas",
                "Configurar idiomas y contenido",
                "Visualizar estadísticas básicas",
              ]}
            />
            <Typography variant="body2">
              Hostly no es una agencia de viajes ni un intermediario de pagos (salvo que se indique expresamente en el futuro).
            </Typography>
          </Section>

          <Section id="cuenta" title="2. Cuenta de administrador">
            <Typography variant="body2">Para utilizar el panel administrativo es necesario:</Typography>
            <List items={["Crear una cuenta con email y contraseña", "Ser mayor de 18 años", "Proporcionar información veraz del alojamiento"]} />
            <Typography variant="body2">El administrador es responsable de:</Typography>
            <List items={["Mantener segura su contraseña", "Gestionar el contenido publicado", "Administrar las reservas recibidas"]} />
            <Typography variant="body2">
              Hostly no se responsabiliza por accesos indebidos derivados de negligencia del usuario.
            </Typography>
          </Section>

          <Section id="contenido" title="3. Responsabilidad sobre el contenido">
            <Typography variant="body2">Cada hostel es único y opera de manera independiente.</Typography>
            <Typography variant="body2">El administrador es el único responsable de:</Typography>
            <List items={["Precios publicados", "Fotografías subidas", "Descripciones", "Disponibilidad", "Políticas internas del alojamiento"]} />
            <Typography variant="body2">
              Hostly no valida ni garantiza la exactitud del contenido cargado por cada usuario.
            </Typography>
          </Section>

          <Section id="reservas" title="4. Reservas realizadas por huéspedes">
            <Typography variant="body2">Cuando un huésped realiza una reserva:</Typography>
            <List
              items={[
                "La solicitud se almacena en la cuenta del hostel correspondiente",
                "El hostel es responsable de confirmarla o gestionarla",
                "Hostly actúa únicamente como herramienta tecnológica",
              ]}
            />
            <Typography variant="body2">Hostly no es parte del contrato entre huésped y alojamiento.</Typography>
          </Section>

          <Section id="uso" title="5. Uso adecuado de la plataforma">
            <Typography variant="body2">Está prohibido:</Typography>
            <List
              items={[
                "Usar la plataforma para actividades ilegales",
                "Subir contenido ofensivo, falso o engañoso",
                "Intentar vulnerar la seguridad del sistema",
                "Utilizar la plataforma para spam o fraude",
              ]}
            />
            <Typography variant="body2">Hostly se reserva el derecho de suspender cuentas que incumplan estas normas.</Typography>
          </Section>

          <Section id="disponibilidad" title="6. Disponibilidad del servicio">
            <Typography variant="body2">Trabajamos para mantener la plataforma operativa 24/7, pero:</Typography>
            <List
              items={[
                "No garantizamos disponibilidad ininterrumpida",
                "Puede haber mantenimientos o fallas técnicas",
                "Podemos realizar mejoras y actualizaciones sin previo aviso",
              ]}
            />
          </Section>

          <Section id="limitacion" title="7. Limitación de responsabilidad">
            <Typography variant="body2">Hostly no será responsable por:</Typography>
            <List
              items={[
                "Cancelaciones realizadas por el alojamiento",
                "Errores en precios cargados por el administrador",
                "Daños derivados del uso indebido de la plataforma",
                "Problemas contractuales entre huésped y hostel",
              ]}
            />
            <Typography variant="body2">
              La responsabilidad total de Hostly, en cualquier caso, no superará el monto abonado por el servicio (si aplica).
            </Typography>
          </Section>

          <Section id="propiedad" title="8. Propiedad intelectual">
            <Typography variant="body2">La plataforma Hostly, incluyendo:</Typography>
            <List items={["Diseño", "Código", "Marca", "Sistema"]} />
            <Typography variant="body2">Es propiedad exclusiva de Hostly.</Typography>
            <Typography variant="body2">El usuario conserva los derechos sobre su contenido (imágenes, textos, etc.).</Typography>
          </Section>

          <Section id="modificaciones" title="9. Modificaciones">
            <Typography variant="body2">Hostly puede modificar estos Términos en cualquier momento.</Typography>
            <Typography variant="body2">Las modificaciones entrarán en vigencia una vez publicadas en esta página.</Typography>
          </Section>

          <Section id="jurisdiccion" title="10. Jurisdicción">
            <Typography variant="body2">
              Estos Términos se rigen por las leyes de <b>Argentina</b> (o la jurisdicción que definas).
            </Typography>
          </Section>

          <Divider />

          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            Si tenés preguntas sobre estos Términos, escribinos a: <b>support@hostly.app</b>
          </Typography>
        </Stack>
      </Container>
    </>
  );
}