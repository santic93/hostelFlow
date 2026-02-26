import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  es: {
    translation: {
      admin: {
  reservations: {
    title: "Reservas",
    guest: "Huésped",
    room: "Habitación",
    email: "Email",
    checkIn: "Check-in",
    checkOut: "Check-out",
    total: "Total",
    status: "Estado",
    actions: "Acciones",
    pending: "Pendiente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    empty: "Todavía no hay reservas.",
  },
 
  shell: {
    brand: "REDSTAYS",
    viewSite: "Ver sitio",
    logout: "Salir",
    menu: {
      dashboard: "Dashboard",
      reservations: "Reservas",
      rooms: "Habitaciones",
    },
  
},
},
      nav: {
        rooms: "HABITACIONES",
        contact: "CONTACTO",
        book: "RESERVAR",
        admin: "Admin",
      },
      home: {
        heroLine1: "...",
        heroLine2: "...",
        title1: "Hostel independiente",
        title2: "en el corazón de la ciudad",
        aboutTitle: "Sobre nuestro hostel",
        aboutP1:
          "Ubicado en el vibrante centro de la ciudad, nuestro hostel combina confort, diseño y comunidad.",
        aboutP2:
          "Desde habitaciones compartidas hasta suites privadas, cada detalle está pensado para inspirar.",
        learnMore: "VER MÁS",
      }, seo: {
        homeTitle: "REDSTAYS — Reservá tu estadía",
        homeTitleWithHostel: "{{hostel}} — Reservá tu estadía",
        homeDesc: "Reservá habitaciones y gestioná tu hostel con REDSTAYS.",
        homeDescWithHostel: "Reservá habitaciones en {{hostel}}. Rápido y simple.",
      },

      footer: {
        rights: "Todos los derechos reservados.",
        terms: "Términos",
        privacy: "Privacidad",

      },
      roomDetail: {
        loading: "Cargando habitación...",
        notFound: "Habitación no encontrada",
        backToRooms: "Volver a habitaciones",
        fromPerNight: "Desde ${{price}} / noche",
        bookThisRoom: "RESERVAR ESTA HABITACIÓN",
      },
      rooms: {
        title: "Nuestras habitaciones",
        fromPerNight: "Desde ${{price}} / noche",
        viewRoom: "VER HABITACIÓN",
        noRooms: "Aún no hay habitaciones disponibles.",
        loading: "Cargando habitaciones...",
      },
      booking: {
        back: "Volver",
        title: "Reservá tu estadía",
        checkIn: "Check-in",
        checkOut: "Check-out",
        fullName: "Nombre completo",
        email: "Email",
        emailInvalid: "Ingresá un email válido",
        confirm: "CONFIRMAR RESERVA",
        processing: "Procesando...",
        unavailable: "Las fechas seleccionadas no están disponibles para esta habitación.",
        errorSaving: "No pudimos guardar la reserva. Intentá de nuevo.",
        successTitle: "Reserva confirmada",
        successText: "Recibimos tu solicitud. Te enviaremos un email de confirmación en breve.",
        summarySelectRoom: "Primero seleccioná una habitación.",
        summaryPerNight: "${{price}} por noche",
        summarySelectDates: "Seleccioná fechas",
        summaryNights: "{{n}} noches",
        summaryTotal: "Total: ${{total}}",
      },
      common: {
        language: "Idioma",
      },
    },

  },
  en: {
    translation: {
      admin: {
  reservations: {
    title: "Reservations",
    guest: "Guest",
    room: "Room",
    email: "Email",
    checkIn: "Check-in",
    checkOut: "Check-out",
    total: "Total",
    status: "Status",
    actions: "Actions",
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    empty: "No reservations yet.",
  },

  shell: {
    brand: "REDSTAYS",
    viewSite: "View site",
    logout: "Logout",
    menu: {
      dashboard: "Dashboard",
      reservations: "Reservations",
      rooms: "Rooms",
    },
  
},
},
      nav: {
        rooms: "ROOMS",
        contact: "CONTACT",
        book: "BOOK YOUR STAY",
        admin: "Admin",
      },
      home: {
        heroLine1: "...",
        heroLine2: "...",
        title1: "Independent hostel",
        title2: "in the heart of the city",
        aboutTitle: "About our hostel",
        aboutP1:
          "Located in the vibrant center of the city, our hostel blends comfort, design and community.",
        aboutP2:
          "From cozy shared rooms to private suites, every detail is crafted to inspire.",
        learnMore: "LEARN MORE",
      },
      seo: {
        homeTitle: "REDSTAYS — Book your stay",
        homeTitleWithHostel: "{{hostel}} — Book your stay",
        homeDesc: "Book rooms and manage your hostel with REDSTAYS.",
        homeDescWithHostel: "Book rooms at {{hostel}}. Fast and simple.",
      },
      footer: {
        rights: "All rights reserved.",
        terms: "Terms",
        privacy: "Privacy",
      },
      roomDetail: {
        loading: "Loading room...",
        notFound: "Room not found",
        backToRooms: "Back to rooms",
        fromPerNight: "From ${{price}} / night",
        bookThisRoom: "BOOK THIS ROOM",
      },
      rooms: {
        title: "Our rooms",
        fromPerNight: "From ${{price}} / night",
        viewRoom: "VIEW ROOM",
        noRooms: "No rooms available yet.",
        loading: "Loading rooms...",
      },
      booking: {
        back: "Back",
        title: "Book your stay",
        checkIn: "Check-in",
        checkOut: "Check-out",
        fullName: "Full name",
        email: "Email address",
        emailInvalid: "Enter a valid email address",
        confirm: "CONFIRM RESERVATION",
        processing: "Processing...",
        unavailable: "Selected dates are not available for this room.",
        errorSaving: "We couldn’t save your reservation. Please try again.",
        successTitle: "Reservation confirmed",
        successText: "We’ve received your booking request. A confirmation email will be sent shortly.",
        summarySelectRoom: "Select a room first.",
        summaryPerNight: "${{price}} per night",
        summarySelectDates: "Select dates",
        summaryNights: "{{n}} nights",
        summaryTotal: "Total: ${{total}}",
      },
      common: {
        language: "Language",
      },
    },
  },
  pt: {
    translation: {
      admin: {
  reservations: {
    title: "Reservas",
    guest: "Hóspede",
    room: "Quarto",
    email: "Email",
    checkIn: "Check-in",
    checkOut: "Check-out",
    total: "Total",
    status: "Status",
    actions: "Ações",
    pending: "Pendente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    empty: "Ainda não há reservas.",
  },

  shell: {
    brand: "REDSTAYS",
    viewSite: "Ver site",
    logout: "Sair",
    menu: {
      dashboard: "Dashboard",
      reservations: "Reservas",
      rooms: "Quartos",
    },
  },

},
      nav: {
        rooms: "QUARTOS",
        contact: "CONTATO",
        book: "RESERVAR",
        admin: "Admin",
      },
      home: {
        heroLine1: "...",
        heroLine2: "...",
        title1: "Hostel independente",
        title2: "no coração da cidade",
        aboutTitle: "Sobre o nosso hostel",
        aboutP1:
          "Localizado no centro vibrante da cidade, nosso hostel combina conforto, design e comunidade.",
        aboutP2:
          "De dormitórios aconchegantes a suítes privadas, cada detalhe foi pensado para inspirar.",
        learnMore: "SAIBA MAIS",
      },
      seo: {
        homeTitle: "REDSTAYS — Reserve sua estadia",
        homeTitleWithHostel: "{{hostel}} — Reserve sua estadia",
        homeDesc: "Reserve quartos e gerencie seu hostel com a REDSTAYS.",
        homeDescWithHostel: "Reserve quartos em {{hostel}}. Rápido e simples.",
      },
      footer: {
        rights: "Todos os direitos reservados.",

        terms: "Termos",

        privacy: "Privacidade",
      },
      roomDetail: {
        loading: "Carregando quarto...",
        notFound: "Quarto não encontrado",
        backToRooms: "Voltar para quartos",
        fromPerNight: "A partir de ${{price}} / noite",
        bookThisRoom: "RESERVAR ESTE QUARTO",
      },
      rooms: {
        title: "Nossos quartos",
        fromPerNight: "A partir de ${{price}} / noite",
        viewRoom: "VER QUARTO",
        noRooms: "Ainda não há quartos disponíveis.",
        loading: "Carregando quartos...",
      },
      booking: {
        back: "Voltar",
        title: "Reserve sua estadia",
        checkIn: "Check-in",
        checkOut: "Check-out",
        fullName: "Nome completo",
        email: "Email",
        emailInvalid: "Digite um email válido",
        confirm: "CONFIRMAR RESERVA",
        processing: "Processando...",
        unavailable: "As datas selecionadas não estão disponíveis para este quarto.",
        errorSaving: "Não foi possível salvar a reserva. Tente novamente.",
        successTitle: "Reserva confirmada",
        successText: "Recebemos sua solicitação. Enviaremos um email de confirmação em breve.",
        summarySelectRoom: "Selecione um quarto primeiro.",
        summaryPerNight: "${{price}} por noite",
        summarySelectDates: "Selecione as datas",
        summaryNights: "{{n}} noites",
        summaryTotal: "Total: ${{total}}",
      },
      common: {
        language: "Idioma",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    supportedLngs: ["es", "en", "pt"],
    interpolation: { escapeValue: false },
    detection: {
      // default español, pero si el usuario elige, queda guardado
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

export const setTenantLanguage = (lng?: string | null) => {
  const allowed = ["es", "en", "pt"];
  const normalized = (lng || "").slice(0, 2).toLowerCase();
  if (!allowed.includes(normalized)) return;

  // ✅ si el usuario eligió manualmente, no pisar
  const userOverride = localStorage.getItem("userLangOverride");
  if (userOverride === "1") return;

  if (i18n.language?.slice(0, 2) !== normalized) {
    i18n.changeLanguage(normalized);
  }
};
export default i18n;