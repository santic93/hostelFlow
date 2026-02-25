import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  es: {
    translation: {
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
      common: {
        language: "Idioma",
      },
    },

  },
  en: {
    translation: {
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
      common: {
        language: "Language",
      },
    },
  },
  pt: {
    translation: {
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