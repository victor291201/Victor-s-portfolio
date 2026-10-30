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
    "A selection of standout projects":
      "Una selección de proyectos destacados que reflejan mi experiencia en el desarrollo corporativo, freelance y de investigación:",
    "Corporate Web Platforms":
      "Plataformas Web Corporativas & Servicios REST (KillaSoft)",
    "Developed highly responsive":
      "Desarrollo de interfaces web altamente responsivas y modulares utilizando Angular, HTML, CSS y JavaScript. Implementación de servicios backend robustos con Python y Django para asegurar una comunicación eficiente.",
    "Technologies: Angular, Django":
      "Tecnologías: Angular, Django, Python, TypeScript, DevOps (Termius, FileZilla).",
    "Style & Component Library":
      "Biblioteca de Estilos y Componentes (Bromus Software)",
    "Designed and implemented a centralized":
      "Diseño e implementación de una biblioteca de estilos centralizada basada en Bootstrap, CSS y Sass para optimizar el flujo de trabajo del equipo de desarrollo. Desarrollo de funcionalidades web con Angular bajo estándares de pruebas unitarias con Jest.",
    "Technologies: Angular, Sass":
      "Tecnologías: Angular, Sass, Bootstrap, TypeScript, Jest, Git.",
    "Web Systems & Hybrid Apps":
      "Sistemas Web y Aplicaciones Híbridas (SmartP S.A.S.)",
    "Built complex web interfaces":
      "Construcción de interfaces web complejas y lógica de negocio backend mediante PHP y Java (APIs REST). Desarrollo de aplicaciones móviles multiplataforma utilizando Flutter.",
    "Technologies: Java":
      "Tecnologías: Java, PHP, Flutter, Bootstrap, APIs REST.",
    "Infrastructure & Websites":
      "Infraestructura y Sitios Web (La Ingeniería del Agua S.A.S.)",
    "Technical leadership":
      "Liderazgo técnico en el diseño, desarrollo y administración de sitios corporativos personalizados y despliegue de soluciones en la nube de Microsoft Azure.",
    "Technologies: WordPress":
      "Tecnologías: WordPress, PHP, HTML/CSS, Microsoft Azure.",
    "AI Language Detection Model":
      "Modelo de Inteligencia Artificial para Detección de Idioma (Universidad del Magdalena)",
    "Implemented Natural Language Processing":
      "Implementación de algoritmos de Procesamiento de Lenguaje Natural (NLP) y modelos de Machine Learning (Árboles de decisión, Random Forest, Redes Neuronales Profundas) para la clasificación de textos.",
    "Technologies: Python, TensorFlow, Keras":
      "Tecnologías: Python, TensorFlow, Keras, Pandas, Jupyter Notebook.",
    "100 Days of CSS Challenge": "Reto 100 Días de CSS (Proyecto Personal)",
    "Ongoing challenge":
      "Desafío continuo enfocado en el dominio avanzado de CSS, preprocesadores (Sass) y la experimentación con animaciones interactivas bidimensionales y tridimensionales mediante Three.js.",

    "~ About Me ~": "~ Sobre mí ~",
    "Full Stack Developer with 4+":
      "Desarrollador Full Stack con más de 4 años de experiencia",
    "I'm Victor —":
      "Desarrollador Full Stack con más de 4 años de experiencia transformando ideas en aplicaciones web y móviles escalables, eficientes y de alto rendimiento. Mi enfoque combina una sólida base técnica en ingeniería de software con un pensamiento analítico riguroso.",
    "Graduated in Systems Engineering":
      "Graduado en Ingeniería de Sistemas y actualmente complementando mi perfil con Ingeniería Industrial en la Universidad del Magdalena, poseo una visión integral que abarca tanto el desarrollo de código limpio (aplicando principios SOLID, patrones de diseño y arquitectura limpia) como la optimización de procesos y la gestión de proyectos.",
    "I'm passionate about continuous learning":
      "Me apasiona el aprendizaje continuo y la resolución de problemas complejos. Fuera del entorno de desarrollo, disfruto explorando áreas como la ciencia de datos, la inteligencia artificial, la matemática aplicada, así como la práctica de calisthenics y el baile.",
    "Portfolio credits":
      "Créditos e inspiración del portafolio:",
    "Music is called":
      "¡La música se llama Cosmic Star Candy de Daystar Project!",
    "This portfolio was inspired":
      "Este portafolio se inspiró en los Room Portfolios de Bruno Simon y Rachel Wei, y en el arte de Denis Wipart y Nicky Blender.",
    "Also the piano":
      "¡Además, el piano de este portafolio funciona! Pulsa las teclas y toca una canción.",

    "~ Contact ~": "~ Contacto ~",
    "Got a project in mind":
      "¿Tienes un proyecto en mente, una oportunidad laboral o simplemente quieres conectar? ¡Hablemos!",
    "I'm always open to discussing":
      "Siempre estoy abierto a discutir nuevas ideas y retos tecnológicos.",
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
    "A selection of standout projects":
      "Uma seleção de projetos em destaque que refletem minha experiência em desenvolvimento corporativo, freelance e de pesquisa:",
    "Corporate Web Platforms":
      "Plataformas Web Corporativas & Serviços REST (KillaSoft)",
    "Developed highly responsive":
      "Desenvolvimento de interfaces web altamente responsivas e modulares usando Angular, HTML, CSS e JavaScript. Implementação de serviços backend robustos com Python e Django para garantir uma comunicação eficiente.",
    "Technologies: Angular, Django":
      "Tecnologias: Angular, Django, Python, TypeScript, DevOps (Termius, FileZilla).",
    "Style & Component Library":
      "Biblioteca de Estilos e Componentes (Bromus Software)",
    "Designed and implemented a centralized":
      "Concepção e implementação de uma biblioteca de estilos centralizada baseada em Bootstrap, CSS e Sass para otimizar o fluxo de trabalho da equipe de desenvolvimento. Desenvolvimento de funcionalidades web com Angular sob padrões de testes unitários com Jest.",
    "Technologies: Angular, Sass":
      "Tecnologias: Angular, Sass, Bootstrap, TypeScript, Jest, Git.",
    "Web Systems & Hybrid Apps":
      "Sistemas Web e Aplicações Híbridas (SmartP S.A.S.)",
    "Built complex web interfaces":
      "Construção de interfaces web complexas e lógica de negócio backend com PHP e Java (APIs REST). Desenvolvimento de aplicações móveis multiplataforma com Flutter.",
    "Technologies: Java":
      "Tecnologias: Java, PHP, Flutter, Bootstrap, APIs REST.",
    "Infrastructure & Websites":
      "Infraestrutura e Sites (La Ingeniería del Agua S.A.S.)",
    "Technical leadership":
      "Liderança técnica no design, desenvolvimento e administração de sites corporativos personalizados e implantação de soluções na nuvem Microsoft Azure.",
    "Technologies: WordPress":
      "Tecnologias: WordPress, PHP, HTML/CSS, Microsoft Azure.",
    "AI Language Detection Model":
      "Modelo de IA para Detecção de Idioma (Universidad del Magdalena)",
    "Implemented Natural Language Processing":
      "Implementação de algoritmos de Processamento de Linguagem Natural (NLP) e modelos de Machine Learning (Árvores de decisão, Random Forest, Redes Neurais Profundas) para classificação de textos.",
    "Technologies: Python, TensorFlow, Keras":
      "Tecnologias: Python, TensorFlow, Keras, Pandas, Jupyter Notebook.",
    "100 Days of CSS Challenge":
      "Desafio 100 Dias de CSS (Projeto Pessoal)",
    "Ongoing challenge":
      "Desafio contínuo focado no domínio avançado de CSS, pré-processadores (Sass) e experimentação com animações interativas bidimensionais e tridimensionais com Three.js.",

    "~ About Me ~": "~ Sobre mim ~",
    "Full Stack Developer with 4+":
      "Desenvolvedor Full Stack com mais de 4 anos de experiência",
    "I'm Victor —":
      "Desenvolvedor Full Stack com mais de 4 anos de experiência transformando ideias em aplicações web e móveis escaláveis, eficientes e de alto desempenho. Minha abordagem combina uma base técnica sólida em engenharia de software com pensamento analítico rigoroso.",
    "Graduated in Systems Engineering":
      "Graduado em Engenharia de Sistemas e atualmente complementando meu perfil com Engenharia Industrial na Universidad del Magdalena, tenho uma visão integral que abrange tanto o desenvolvimento de código limpo (aplicando princípios SOLID, padrões de projeto e arquitetura limpa) quanto a otimização de processos e a gestão de projetos.",
    "I'm passionate about continuous learning":
      "Sou apaixonado por aprendizado contínuo e pela resolução de problemas complexos. Fora do desenvolvimento, gosto de explorar áreas como ciência de dados, inteligência artificial e matemática aplicada, além de praticar calistenia e dançar.",
    "Portfolio credits":
      "Créditos e inspiração do portfólio:",
    "Music is called":
      "A música se chama Cosmic Star Candy, do Daystar Project!",
    "This portfolio was inspired":
      "Este portfólio foi inspirado nos Room Portfolios de Bruno Simon e Rachel Wei, e na arte de Denis Wipart e Nicky Blender.",
    "Also the piano":
      "Além disso, o piano deste portfólio funciona! Toque as teclas e experimente uma música.",

    "~ Contact ~": "~ Contato ~",
    "Got a project in mind":
      "Tem um projeto em mente, uma oportunidade de trabalho ou só quer conectar? Vamos conversar!",
    "I'm always open to discussing":
      "Estou sempre aberto a discutir novas ideias e desafios tecnológicos.",
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
