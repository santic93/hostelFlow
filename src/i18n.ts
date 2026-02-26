import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  es: {
    translation: {
      errors: {
        genericTitle: "Algo salió mal",
        genericDesc: "Ocurrió un error inesperado.",
        notFoundTitle: "Página no encontrada (404)",
        notFoundDesc: "El link no existe o fue movido.",
        goHome: "Ir al inicio",
        back: "Volver",
        errorWithStatus: "Error {{status}}",
      },
      auth: {
        entering: "Ingresando...",
        checkingSession: "Verificando sesión...",
      },
      gallery: {
        title: "Galería",
      },
      login: {
        title: "Admin Login",
        seoTitle: "Login — REDSTAYS",
        seoDescription: "Admin login",
        fields: {
          email: "Email",
          password: "Password",
        },
        actions: {
          login: "Ingresar",
          loggingIn: "Ingresando...",
          forgotPassword: "Olvidé mi contraseña",
          createHostel: "Crear mi hostel (registro)",
        },
        messages: {
          resetSent: "Te enviamos un email para resetear tu contraseña ✅",
        },
        errors: {
          noAdminPermissions: "Tu usuario no tiene permisos de administrador.",
          emailRequired: "Ingresá tu email",
          passwordMin: "Password mínimo 6 caracteres",
          invalidCredentials: "Email o contraseña incorrectos.",
          userNotFound: "No existe un usuario con ese email.",
          wrongPassword: "Contraseña incorrecta.",
          emailForReset: "Ingresá tu email para recuperar la contraseña",
          resetFailed: "No se pudo enviar el email de recuperación",
          generic: "Error al iniciar sesión",
          genericWithCode: "Error: {{code}}",
        },
      },
      register: {
        haveAccount: "Ya tengo cuenta (login)",
        title: {
          step1: "Crear cuenta de administrador",
          step2: "Configurar tu hostel",
        },
        steps: {
          account: "1. Cuenta",
          hostel: "2. Hostel",
        },
        fields: {
          email: "Email admin",
          password: "Password",
          hostelName: "Nombre del hostel",
          slug: "Slug (URL)",
        },
        helpers: {
          yourUrl: "Tu URL: /{{slug}}",
          slugExample: "Ej: selina-palermo",
        },
        actions: {
          continue: "Continuar",
          createHostel: "Crear hostel y entrar al panel",
        },
        loading: {
          creatingAccount: "Creando tu cuenta...",
          creatingHostel: "Creando tu hostel...",
        },
        messages: {
          accountCreated: "Cuenta creada ✅ Ahora creá tu hostel.",
          accountCreatedLabel: "Cuenta creada:",
          hostelCreatedRedirecting: "Hostel creado ✅ Redirigiendo al panel...",
        },
        errors: {
          emailRequired: "Ingresá un email",
          passwordMin: "Password mínimo 6 caracteres",
          emailInUse: "Ese email ya está en uso. Probá iniciar sesión en Admin Login.",
          emailInvalid: "Email inválido.",
          generic: "Error creando cuenta",
          genericWithCode: "Error: {{code}}",
          sessionUnavailable: "Sesión no disponible. Reintentá.",
          hostelNameRequired: "Ingresá el nombre del hostel",
          slugInvalid: "Ingresá un slug válido",
          slugTaken: "Ese slug ya está en uso. Elegí otro.",
          hostelCreateGeneric: "Error creando hostel (Firestore). Revisá reglas/permisos.",
        },
      },
      admin: {


        rooms: {

          modal: {
            editTitle: "Editar habitación",
            createTitle: "Crear habitación",
          },
          form: {
            name: "Nombre",
            price: "Precio",
            capacity: "Capacidad",
            description: "Descripción",
            imageUrl: "URL de imagen (opcional)",
            imageUrlHelp: "Ej: https://.../foto.jpg",
            selectedFile: "Seleccionado: {{name}}",
          },
          errors: {
            nameRequired: "El nombre es obligatorio",
            priceRequired: "Precio obligatorio",
            priceMin: "Debe ser mayor a 0",
            capacityRequired: "Capacidad obligatoria",
            capacityMin: "Mínimo 1 persona",
            imageUrlInvalid: "Debe ser una URL válida (http/https)",
          },
          common: {
            save: "Guardar",
            saving: "Guardando...",
            cancel: "Cancelar",
          },
          title: "Gestión de Habitaciones",
          columns: {
            name: "Nombre",
            price: "Precio",
            capacity: "Capacidad",
            actions: "Acciones",
          },
          actions: {
            edit: "Editar",
            delete: "Eliminar",
          },
        },

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
          seoTitle: "Reservas — REDSTAYS",
          seoDescription: "Admin reservas",
          columns: {
            guest: "Huésped",
            room: "Habitación",
            email: "Email",
            checkIn: "Check In",
            checkOut: "Check Out",
            total: "Total",
            status: "Estado",
            actions: "Acciones",
          },
          statusValues: {
            pending: "Pendiente",
            confirmed: "Confirmada",
            cancelled: "Cancelada",
          },
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



        dashboard: {
          title: "Dashboard",
          configTitle: "Configuración del sitio",
          defaultLanguageLabel: "Idioma predeterminado",
          save: "Guardar",
          saving: "Guardando...",
          help: "Esto define el idioma inicial que verán los huéspedes al entrar al sitio del hostel (si no eligieron otro antes).",
          msgSaved: "Idioma predeterminado actualizado ✅",
          msgSaveError: "No se pudo guardar el idioma. Revisá permisos/reglas.",
          cards: {
            revenue: "Ingresos totales",
            reservations: "Reservas totales",
            rooms: "Habitaciones activas",
          },
          languages: {
            es: "Español (ES)",
            en: "English (EN)",
            pt: "Português (PT)",
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
        heroLine1: "Más que una estadía, una experiencia.",
        heroLine2: "Reservá fácil. Viví auténtico.",
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
      tenant: {
        loadingTitle: "Cargando hostel…",
        loadingSubtitle: "Verificando disponibilidad del sitio…",
        notFoundTitle: "Hostel no encontrado",
        notFoundDesc: 'El link "{{slug}}" no existe. Revisá el slug o probá otro.',
        actions: {
          search: "Buscar hostel",
          adminLogin: "Admin login",
        },
      },
      loading: {
        title: "Cargando...",
        subtitle: "Preparando todo para vos…",
      },
    },

  },
  en: {
    translation: {
      errors: {
        genericTitle: "Something went wrong",
        genericDesc: "An unexpected error occurred.",
        notFoundTitle: "Page not found (404)",
        notFoundDesc: "The link does not exist or has been moved.",
        goHome: "Go to home",
        back: "Go back",
        errorWithStatus: "Error {{status}}",
      },
      auth: {
        entering: "Signing in...",
        checkingSession: "Checking session...",
      },
      gallery: {
        title: "Gallery",
      },
      login: {
        title: "Admin Login",
        seoTitle: "Login — REDSTAYS",
        seoDescription: "Admin login",
        fields: {
          email: "Email",
          password: "Password",
        },
        actions: {
          login: "Login",
          loggingIn: "Logging in...",
          forgotPassword: "Forgot password",
          createHostel: "Create my hostel (register)",
        },
        messages: {
          resetSent: "We’ve sent you a password reset email ✅",
        },
        errors: {
          noAdminPermissions: "Your user does not have administrator permissions.",
          emailRequired: "Enter your email",
          passwordMin: "Password must be at least 6 characters",
          invalidCredentials: "Incorrect email or password.",
          userNotFound: "No user found with that email.",
          wrongPassword: "Incorrect password.",
          emailForReset: "Enter your email to reset your password",
          resetFailed: "Could not send reset email",
          generic: "Error signing in",
          genericWithCode: "Error: {{code}}",
        },
      },
      register: {
        haveAccount: "I already have an account (login)",
        title: {
          step1: "Create admin account",
          step2: "Set up your hostel",
        },
        steps: {
          account: "1. Account",
          hostel: "2. Hostel",
        },
        fields: {
          email: "Admin email",
          password: "Password",
          hostelName: "Hostel name",
          slug: "Slug (URL)",
        },
        helpers: {
          yourUrl: "Your URL: /{{slug}}",
          slugExample: "Example: selina-palermo",
        },
        actions: {
          continue: "Continue",
          createHostel: "Create hostel and enter dashboard",
        },
        loading: {
          creatingAccount: "Creating your account...",
          creatingHostel: "Creating your hostel...",
        },
        messages: {
          accountCreated: "Account created ✅ Now create your hostel.",
          accountCreatedLabel: "Account created:",
          hostelCreatedRedirecting: "Hostel created ✅ Redirecting to dashboard...",
        },
        errors: {
          emailRequired: "Enter an email",
          passwordMin: "Password must be at least 6 characters",
          emailInUse: "That email is already in use. Try logging in on Admin Login.",
          emailInvalid: "Invalid email.",
          generic: "Error creating account",
          genericWithCode: "Error: {{code}}",
          sessionUnavailable: "Session unavailable. Please try again.",
          hostelNameRequired: "Enter the hostel name",
          slugInvalid: "Enter a valid slug",
          slugTaken: "That slug is already taken. Choose another one.",
          hostelCreateGeneric: "Error creating hostel (Firestore). Check rules/permissions.",
        },
      },
      tenant: {
        loadingTitle: "Loading hostel…",
        loadingSubtitle: "Checking site availability…",
        notFoundTitle: "Hostel not found",
        notFoundDesc: 'The link "{{slug}}" does not exist. Check the slug or try another one.',
        actions: {
          search: "Find hostel",
          adminLogin: "Admin login",
        },
      },
      admin: {

        rooms: {

          modal: {
            editTitle: "Edit room",
            createTitle: "Create room",
          },
          form: {
            name: "Name",
            price: "Price",
            capacity: "Capacity",
            description: "Description",
            imageUrl: "Image URL (optional)",
            imageUrlHelp: "E.g. https://.../photo.jpg",
            selectedFile: "Selected: {{name}}",
          },
          errors: {
            nameRequired: "Name is required",
            priceRequired: "Price is required",
            priceMin: "Must be greater than 0",
            capacityRequired: "Capacity is required",
            capacityMin: "Minimum 1 person",
            imageUrlInvalid: "Must be a valid URL (http/https)",

          },
          common: {
            save: "Save",
            saving: "Saving...",
            cancel: "Cancel",
          },



          title: "Room Management",
          columns: {
            name: "Name",
            price: "Price",
            capacity: "Capacity",
            actions: "Actions",
          },
          actions: {
            edit: "Edit",
            delete: "Delete",
          },
        },

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
          seoTitle: "Reservations — REDSTAYS",
          seoDescription: "Admin reservations",
          columns: {
            guest: "Guest",
            room: "Room",
            email: "Email",
            checkIn: "Check In",
            checkOut: "Check Out",
            total: "Total",
            status: "Status",
            actions: "Actions",
          },
          statusValues: {
            pending: "Pending",
            confirmed: "Confirmed",
            cancelled: "Cancelled",
          },


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


        dashboard: {
          title: "Dashboard",
          configTitle: "Site settings",
          defaultLanguageLabel: "Default language",
          save: "Save",
          saving: "Saving...",
          help: "This sets the initial language guests will see when they enter the hostel site (if they haven’t chosen another one before).",
          msgSaved: "Default language updated ✅",
          msgSaveError: "Could not save the language. Check permissions/rules.",
          cards: {
            revenue: "Total revenue",
            reservations: "Total reservations",
            rooms: "Active rooms",
          },
          languages: {
            es: "Spanish (ES)",
            en: "English (EN)",
            pt: "Portuguese (PT)",
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
        heroLine1: "More than a stay, an experience.",
        heroLine2: "Book easy. Live authentic.",
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
      loading: {
        title: "Loading...",
        subtitle: "Getting everything ready…",
      },
    },
  },
  pt: {
    translation: {
      errors: {
        genericTitle: "Algo deu errado",
        genericDesc: "Ocorreu um erro inesperado.",
        notFoundTitle: "Página não encontrada (404)",
        notFoundDesc: "O link não existe ou foi movido.",
        goHome: "Ir para o início",
        back: "Voltar",
        errorWithStatus: "Erro {{status}}",
      },
      auth: {
        entering: "Entrando...",
        checkingSession: "Verificando sessão...",
      },
      gallery: {
        title: "Galeria",
      },
      login: {
        title: "Admin Login",
        seoTitle: "Login — REDSTAYS",
        seoDescription: "Admin login",
        fields: {
          email: "Email",
          password: "Senha",
        },
        actions: {
          login: "Entrar",
          loggingIn: "Entrando...",
          forgotPassword: "Esqueci minha senha",
          createHostel: "Criar meu hostel (registro)",
        },
        messages: {
          resetSent: "Enviamos um email para redefinir sua senha ✅",
        },
        errors: {
          noAdminPermissions: "Seu usuário não tem permissões de administrador.",
          emailRequired: "Digite seu email",
          passwordMin: "A senha deve ter no mínimo 6 caracteres",
          invalidCredentials: "Email ou senha incorretos.",
          userNotFound: "Nenhum usuário encontrado com esse email.",
          wrongPassword: "Senha incorreta.",
          emailForReset: "Digite seu email para redefinir sua senha",
          resetFailed: "Não foi possível enviar o email de recuperação",
          generic: "Erro ao entrar",
          genericWithCode: "Erro: {{code}}",
        },
      },
      register: {
        haveAccount: "Já tenho conta (login)",
        title: {
          step1: "Criar conta de administrador",
          step2: "Configurar seu hostel",
        },
        steps: {
          account: "1. Conta",
          hostel: "2. Hostel",
        },
        fields: {
          email: "Email do admin",
          password: "Senha",
          hostelName: "Nome do hostel",
          slug: "Slug (URL)",
        },
        helpers: {
          yourUrl: "Sua URL: /{{slug}}",
          slugExample: "Ex: selina-palermo",
        },
        actions: {
          continue: "Continuar",
          createHostel: "Criar hostel e entrar no painel",
        },
        loading: {
          creatingAccount: "Criando sua conta...",
          creatingHostel: "Criando seu hostel...",
        },
        messages: {
          accountCreated: "Conta criada ✅ Agora crie seu hostel.",
          accountCreatedLabel: "Conta criada:",
          hostelCreatedRedirecting: "Hostel criado ✅ Redirecionando para o painel...",
        },
        errors: {
          emailRequired: "Digite um email",
          passwordMin: "A senha deve ter no mínimo 6 caracteres",
          emailInUse: "Esse email já está em uso. Tente fazer login em Admin Login.",
          emailInvalid: "Email inválido.",
          generic: "Erro ao criar conta",
          genericWithCode: "Erro: {{code}}",
          sessionUnavailable: "Sessão indisponível. Tente novamente.",
          hostelNameRequired: "Digite o nome do hostel",
          slugInvalid: "Digite um slug válido",
          slugTaken: "Esse slug já está em uso. Escolha outro.",
          hostelCreateGeneric: "Erro ao criar hostel (Firestore). Verifique regras/permissões.",
        },
      },
      admin: {

        rooms: {

          modal: {
            editTitle: "Editar quarto",
            createTitle: "Criar quarto",
          },
          form: {
            name: "Nome",
            price: "Preço",
            capacity: "Capacidade",
            description: "Descrição",
            imageUrl: "URL da imagem (opcional)",
            imageUrlHelp: "Ex: https://.../foto.jpg",
            selectedFile: "Selecionado: {{name}}",
          },
          errors: {
            nameRequired: "O nome é obrigatório",
            priceRequired: "Preço obrigatório",
            priceMin: "Deve ser maior que 0",
            capacityRequired: "Capacidade obrigatória",
            capacityMin: "Mínimo 1 pessoa",
            imageUrlInvalid: "Deve ser uma URL válida (http/https)",

          },
          common: {
            save: "Salvar",
            saving: "Salvando...",
            cancel: "Cancelar",
          },

          title: "Gestão de Quartos",
          columns: {
            name: "Nome",
            price: "Preço",
            capacity: "Capacidade",
            actions: "Ações",
          },
          actions: {
            edit: "Editar",
            delete: "Excluir",
          },
        },

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


          seoTitle: "Reservas — REDSTAYS",
          seoDescription: "Admin reservas",
          columns: {
            guest: "Hóspede",
            room: "Quarto",
            email: "Email",
            checkIn: "Check In",
            checkOut: "Check Out",
            total: "Total",
            status: "Status",
            actions: "Ações",
          },
          statusValues: {
            pending: "Pendente",
            confirmed: "Confirmada",
            cancelled: "Cancelada",
          },

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

        dashboard: {
          title: "Dashboard",
          configTitle: "Configurações do site",
          defaultLanguageLabel: "Idioma padrão",
          save: "Salvar",
          saving: "Salvando...",
          help: "Isso define o idioma inicial que os hóspedes verão ao entrar no site do hostel (se não tiverem escolhido outro antes).",
          msgSaved: "Idioma padrão atualizado ✅",
          msgSaveError: "Não foi possível salvar o idioma. Verifique permissões/regras.",
          cards: {
            revenue: "Receita total",
            reservations: "Total de reservas",
            rooms: "Quartos ativos",
          },
          languages: {
            es: "Espanhol (ES)",
            en: "Inglês (EN)",
            pt: "Português (PT)",
          },
        },

      },
      loading: {
        title: "Carregando...",
        subtitle: "Preparando tudo para você…",
      },
      nav: {
        rooms: "QUARTOS",
        contact: "CONTATO",
        book: "RESERVAR",
        admin: "Admin",
      },
      home: {
        heroLine1: "Mais que uma estadia, uma experiência.",
        heroLine2: "Reserve fácil. Viva o autêntico.",
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
      tenant: {
        loadingTitle: "Carregando hostel…",
        loadingSubtitle: "Verificando disponibilidade do site…",
        notFoundTitle: "Hostel não encontrado",
        notFoundDesc: 'O link "{{slug}}" não existe. Verifique o slug ou tente outro.',
        actions: {
          search: "Buscar hostel",
          adminLogin: "Admin login",
        },
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