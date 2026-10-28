export const DEFAULT_LANGUAGE = "es";
export const SUPPORTED_LANGUAGES = ["es", "pt", "en"];

// Las claves sin "$" son prefijos del texto original en inglés. El traductor
// recorre los nodos de texto y sustituye el nodo completo cuando su contenido
// empieza por esa clave. Las claves con "$" son textos dinámicos de la UI.
export const translations = {
  es: {
    "$meta.title": "Victors Portfolio",
    "$meta.description":
      "Portafolio 3D interactivo de Victor. Explora su cuarto, descubre sus proyectos y ponte en contacto.",
    "$loading.loading": "Cargando...",
    "$loading.enter": "¡Entrar!",
    "$loading.hello": "~ Hola ~",
    "$loading.noSound": "Entrar sin sonido :(",
    "$loading.error": "Error al cargar el modelo",

    "use left/right click": "¡Usa clic izquierdo/derecho y la rueda del mouse para navegar!",
    "use one or two fingers": "¡Usa uno o dos dedos para navegar!",
    "~ My Work ~": "~ Mi trabajo ~",
    "Community Leader": "Líder comunitario",
    "Organized several events":
      "Organicé varios eventos y actividades con comunidades y negocios locales para ayudar a estudiantes internacionales a familiarizarse con la cultura coreana.",
    "Skills: Leadership":
      "Habilidades: Liderazgo, Comunicación, Construcción de comunidad, Trabajo en equipo",
    "During my piano teaching":
      "Durante mi experiencia enseñando piano, creé MeloMochi, una herramienta de composición impulsada por IA que ayuda a los estudiantes a aprender teoría musical mediante la exploración práctica. Diseñé el sistema para generar ejercicios y piezas cortas de piano que se adaptan al nivel de cada estudiante, combinando mi experiencia como pianista con mis conocimientos de machine learning. Usando TensorFlow y pretty_midi, entrené modelos con repertorio clásico para crear ejercicios musicales que también trabajan retos técnicos específicos. La interfaz web que construí con React permite a los estudiantes interactuar con las piezas generadas, visualizar patrones e incluso modificarlos en tiempo real. Trabajar de cerca con mis estudiantes durante el desarrollo me ayudó a refinar el sistema para que realmente apoye su aprendizaje, haciendo la teoría musical más atractiva y práctica.",
    "Skills: Music Generation":
      "Habilidades: Generación musical, TensorFlow, pretty_midi, Aprendizaje adaptativo, React, Teoría musical, Diseño UX, ML generativo, Tecnología educativa, Web Audio API",
    "PianoScope is my passion":
      "PianoScope es mi proyecto personal que combina mi amor por el piano y el machine learning. Co-creé esta herramienta impulsada por IA con otros músicos para entender mejor nuestros patrones de interpretación. Usando deep learning y procesamiento de audio en Python y TensorFlow, el sistema analiza grabaciones para detectar matices en el tiempo, la dinámica y el pedal. Construí la interfaz de visualización interactiva con React, permitiendo a los intérpretes ver cómo evolucionan estos elementos.",
    "Skills: Audio Processing":
      "Habilidades: Procesamiento de audio, Análisis de señales, Machine learning, Visualización de datos, TensorFlow, React, Python, DSP (procesamiento digital de señales), Análisis de interpretación, Clasificación de audio",
    "~ About Me ~": "~ Sobre mí ~",
    "Engineer, musician":
      "Ingeniero, músico, creativo y gamer de corazón 💜",
    "Hi, I'm Victor!":
      "¡Hola, soy Victor! Me encanta combinar habilidades técnicas y creativas para construir cosas bonitas. Este es mi portafolio 3D interactivo, donde puedes explorar mi cuarto y conocerme mejor.",
    "In my free time":
      "En mi tiempo libre me encontrarás escuchando música, jugando y trabajando en proyectos creativos. También me gusta salir a caminar por mi barrio.",
    "What I'm Up To:": "En qué estoy:",
    "I'm currently building":
      "Actualmente estoy creando experiencias web interactivas y escenas 3D.",
    "I'm looking for opportunities":
      "Busco oportunidades para colaborar en proyectos creativos de desarrollo.",
    "I'm always learning":
      "Siempre estoy aprendiendo nuevas herramientas de diseño, música y código.",
    "Portfolio credits":
      "Créditos e inspiración del portafolio:",
    "Music is called":
      "¡La música se llama Cosmic Star Candy de Daystar Project!",
    "This portfolio was inspired":
      "Este portafolio se inspiró en los Room Portfolios de Bruno Simon y Rachel Wei, y en el arte de Denis Wipart y Nicky Blender.",
    "Also the piano":
      "¡Además, el piano de este portafolio funciona! Pulsa las teclas y toca una canción.",
    "~ Say hello! ~": "~ ¡Saluda! ~",
    "If you'd like to collaborate":
      "Si quieres colaborar o simplemente saludar, ¡conectemos!",
  },

  pt: {
    "$meta.title": "Victors Portfolio",
    "$meta.description":
      "Portfólio 3D interativo do Victor. Explore seu quarto, descubra seus projetos e entre em contato.",
    "$loading.loading": "Carregando...",
    "$loading.enter": "Entrar!",
    "$loading.hello": "~ Olá ~",
    "$loading.noSound": "Entrar sem som :(",
    "$loading.error": "Erro ao carregar o modelo",

    "use left/right click": "Use o clique esquerdo/direito e a roda do mouse para navegar!",
    "use one or two fingers": "Use um ou dois dedos para navegar!",
    "~ My Work ~": "~ Meu trabalho ~",
    "Community Leader": "Líder comunitário",
    "Organized several events":
      "Organizei vários eventos e ações com comunidades e empresas locais para ajudar estudantes internacionais a se familiarizar com a cultura coreana.",
    "Skills: Leadership":
      "Habilidades: Liderança, Comunicação, Construção de comunidade, Trabalho em equipe",
    "During my piano teaching":
      "Durante minha jornada ensinando piano, criei o MeloMochi, uma ferramenta de composição com IA que ajuda os alunos a aprender teoria musical por meio da exploração prática. Projetei o sistema para gerar exercícios e pequenas peças de piano que se adaptam ao nível de cada aluno, combinando minha experiência como pianista com meus conhecimentos em machine learning. Usando TensorFlow e pretty_midi, treinei modelos com repertório clássico para criar exercícios musicais que também trabalham desafios técnicos específicos. A interface web que construí com React permite que os alunos interajam com as peças geradas, visualizem padrões e até os modifiquem em tempo real. Trabalhar de perto com meus alunos durante o desenvolvimento me ajudou a refinar o sistema para que ele realmente apoie o aprendizado, tornando a teoria musical mais envolvente e prática.",
    "Skills: Music Generation":
      "Habilidades: Geração musical, TensorFlow, pretty_midi, Aprendizagem adaptativa, React, Teoria musical, Design UX, ML generativo, Tecnologia educacional, Web Audio API",
    "PianoScope is my passion":
      "PianoScope é meu projeto pessoal que combina meu amor pelo piano e pelo machine learning. Co-criei esta ferramenta com IA com outros músicos para entender melhor nossos padrões de interpretação. Usando deep learning e processamento de áudio em Python e TensorFlow, o sistema analisa gravações para detectar nuances de tempo, dinâmica e pedal. Construí a interface de visualização interativa com React, permitindo que os intérpretes vejam como esses elementos evoluem.",
    "Skills: Audio Processing":
      "Habilidades: Processamento de áudio, Análise de sinais, Machine learning, Visualização de dados, TensorFlow, React, Python, DSP (processamento digital de sinais), Análise de performance, Classificação de áudio",
    "~ About Me ~": "~ Sobre mim ~",
    "Engineer, musician":
      "Engenheiro, músico, criativo e gamer de coração 💜",
    "Hi, I'm Victor!":
      "Olá, eu sou o Victor! Adoro combinar habilidades técnicas e criativas para construir coisas bonitas. Este é meu portfólio 3D interativo, onde você pode explorar meu quarto e me conhecer melhor.",
    "In my free time":
      "No meu tempo livre, você vai me encontrar ouvindo música, jogando e trabalhando em projetos criativos. Também gosto de caminhar pelo meu bairro.",
    "What I'm Up To:": "No que estou trabalhando:",
    "I'm currently building":
      "Atualmente estou criando experiências web interativas e cenas 3D.",
    "I'm looking for opportunities":
      "Estou procurando oportunidades para colaborar em projetos criativos de desenvolvimento.",
    "I'm always learning":
      "Estou sempre aprendendo novas ferramentas de design, música e código.",
    "Portfolio credits":
      "Créditos e inspiração do portfólio:",
    "Music is called":
      "A música se chama Cosmic Star Candy, do Daystar Project!",
    "This portfolio was inspired":
      "Este portfólio foi inspirado nos Room Portfolios de Bruno Simon e Rachel Wei, e na arte de Denis Wipart e Nicky Blender.",
    "Also the piano":
      "Além disso, o piano deste portfólio funciona! Toque as teclas e experimente uma música.",
    "~ Say hello! ~": "~ Diga olá! ~",
    "If you'd like to collaborate":
      "Se você quiser colaborar ou apenas dizer olá, vamos nos conectar!",
  },

  en: {
    "$meta.title": "Victors Portfolio",
    "$meta.description":
      "Victors Portfolio — an interactive 3D room portfolio.",
    "$loading.loading": "Loading...",
    "$loading.enter": "Enter!",
    "$loading.hello": "~ Hello ~",
    "$loading.noSound": "Enter without Sound :(",
    "$loading.error": "Error loading the model",
  },
};
