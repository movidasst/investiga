const casos = {
  banda: {
    numero: '01', nivel: 'Guiado', titulo: 'La banda en movimiento',
    alt: 'Ilustración de una banda transportadora con rodillos, resguardo y gabinete de control',
    imagen: 'assets/banda.webp',
    intro: 'Durante una intervención en la línea transportadora 2, un técnico sufrió una lesión en la mano. Examina los registros para reconstruir cómo ocurrió.',
    origen: 'Caso ficticio adaptado del informe de demostración DEMO-AT-2026-001 de la Academia Movida de SST.',
    evidencias: [
      { titulo: 'Gabinete de control', tipo: 'Registro PLC · E02', texto: 'El registro simulado indica accionamiento del motor entre las 08:45 y las 09:01.' },
      { titulo: 'Resguardo y rodillo', tipo: 'Video del área · E03', texto: 'A las 08:58 se observa el resguardo abierto. A las 09:00 se observa el contacto de la mano con el rodillo en movimiento.' },
      { titulo: 'Atención inicial', tipo: 'Parte de primeros auxilios · E04', texto: 'El parte simulado registra una lesión de mano y la primera atención a las 09:05.' },
      { titulo: 'Procedimiento', tipo: 'SST-PMT-07 · E05', texto: 'El procedimiento simulado exige aislar energías y verificar el aislamiento antes de intervenir zonas móviles. El documento describe el requisito.' }
    ],
    hechos: [
      ['H02', 'El motor permaneció energizado durante la intervención.', 'hecho', 'El registro E02 respalda el accionamiento del motor durante ese intervalo.', 0],
      ['H03', 'El resguardo estaba abierto antes del contacto.', 'hecho', 'El video E03 muestra la apertura del resguardo.', 1],
      ['H04', 'La mano contactó el rodillo mientras se movía.', 'hecho', 'El video E03 muestra el contacto y el movimiento.', 1],
      ['P01', 'Se ejecutó el aislamiento de energía antes de intervenir.', 'pendiente', 'E05 establece lo que debía hacerse. Haría falta evidencia de ejecución y verificación.', 3],
      ['J01', 'El técnico actuó con descuido.', 'juicio', 'La frase atribuye una cualidad al técnico. Describe la acción observable y busca su respaldo.', 1]
    ],
    final: 'Atrapamiento y lesión de mano',
    relaciones: [
      { destino: 'H04', origen: ['H02','H03'], tipo: 'conjuncion', ayuda: 'El registro del motor y el video permiten analizar juntos el movimiento y el acceso al rodillo.' },
      { destino: 'final', origen: ['H04'], tipo: 'cadena', ayuda: 'El video y el parte permiten vincular el contacto con la lesión documentada.' }
    ],
    medidas: [
      ['Interbloquear el resguardo', 'Acceso y movimiento', 'Realizar y documentar una prueba funcional de apertura y parada.'],
      ['Verificar el aislamiento antes de intervenir', 'Energía durante la intervención', 'Observar una intervención y comprobar el registro de la verificación.'],
      ['Emitir un recordatorio general', 'Comunicación', 'El recordatorio por sí solo deja abiertas las ramas de acceso y energía.']
    ],
    cierre: 'Árbol de referencia del demo: H02 y H03 convergen en H04. El contacto con el rodillo en movimiento antecede al atrapamiento y a la lesión.'
  },
  silo: {
    numero: '02', nivel: 'Avanzado', titulo: 'El caso del silo 6',
    alt: 'Ilustración de una cantera con silos, dos camiones y una plaza de carga',
    imagen: 'assets/silo.webp',
    intro: 'En una cantera, un conductor fue atropellado por su propio camión. Reconstruye el caso y decide hasta dónde te permite llegar el relato publicado.',
    origen: 'Adaptación didáctica de Sanmiquel y colaboradores, ORP 2019. Escena ilustrativa.',
    fuente: 'https://www.prevencionintegral.com/canal-orp/papers/orp-2019/analisis-accidente-sector-minero-mediante-metodo-arbol-causas-metodo-feyer-williamson',
    evidencias: [
      { titulo: 'Mandos del silo', tipo: 'Relato de la investigación', texto: 'El conductor salió de la cabina para accionar la carga desde una plataforma. Durante la carga, el camión empezó a moverse.' },
      { titulo: 'Vista desde el camión B', tipo: 'Testimonio resumido', texto: 'El conductor B vio al trabajador correr hacia el camión A y observó por el retrovisor el choque entre los vehículos. Después encontró al trabajador en el suelo.' },
      { titulo: 'Plaza y talud', tipo: 'Descripción del lugar', texto: 'La plaza tenía una ligera pendiente. Tras el choque, el camión A giró, siguió desplazándose y se precipitó por el talud.' },
      { titulo: 'Documentación preventiva', tipo: 'Hallazgos publicados', texto: 'Los autores reportan que la carga en silos carecía de evaluación de riesgos y que no se impartió formación específica a los conductores.' }
    ],
    hechos: [
      ['H01', 'El camión A empezó a moverse durante la carga.', 'hecho', 'El relato sitúa el inicio del movimiento durante la carga.', 0],
      ['H02', 'El camión A impactó el volquete del camión B.', 'hecho', 'El conductor B declaró haber visto el impacto por el retrovisor.', 1],
      ['H03', 'La plaza de carga tenía una ligera pendiente.', 'hecho', 'Es una condición del lugar descrita en la investigación.', 2],
      ['H04', 'La operación de carga carecía de evaluación de riesgos.', 'hecho', 'Los autores reportan haber comprobado esta ausencia.', 3],
      ['H05', 'El conductor corrió hacia el camión A.', 'hecho', 'Correr hacia el camión es la acción observada que describe el testimonio.', 1],
      ['P01', 'El choque con el camión B causó el atropello.', 'pendiente', 'La figura 7 presenta ese papel del choque como probable. Hace falta aclarar la trayectoria y el momento del contacto.', 1],
      ['P02', 'La transmisión estaba en punto muerto y el freno no estaba aplicado.', 'pendiente', 'El relato público no detalla una comprobación técnica de ambas condiciones. Conviene investigarlas por separado.', 0],
      ['J01', 'El conductor actuó sin pensar.', 'juicio', 'La frase atribuye un estado mental. El testimonio permite describir que corrió hacia el camión.', 1]
    ],
    final: 'Atropello por el camión A',
    relaciones: [
      { destino: 'H02', origen: ['H01'], tipo: 'cadena', ayuda: 'El desplazamiento del camión A permitió que alcanzara al camión B.' },
      { destino: 'final', origen: [], tipo: 'pendiente', ayuda: 'El relato documenta el atropello. El papel exacto del choque y la posición del trabajador al contacto quedan por aclarar.' }
    ],
    medidas: [
      ['Eliminar la pendiente en la zona de carga', 'Condición del terreno', 'Verificar el diseño y la nivelación de la zona intervenida.'],
      ['Evaluar mandos de carga accesibles desde la cabina', 'Descenso durante la carga', 'Comprobar con una prueba de operación que el conductor puede completar la carga desde el vehículo.'],
      ['Dar formación específica para la carga en silos', 'Práctica de trabajo', 'Verificar la aplicación del procedimiento mediante una demostración práctica.']
    ],
    cierre: 'La figura 7 conecta el desplazamiento y choque con el intento de subir al camión. El texto de la figura califica como probable el papel del choque. Compara esa formulación con la rama que dejaste abierta.'
  }
};

casos.banda.mision = {
  titulo: 'La orden está escrita. ¿Se aplicó?',
  dilema: 'El procedimiento exige aislar la energía. Antes de cerrar la investigación, ¿qué evidencia buscarías para comprobar si se ejecutó y verificó el aislamiento?',
  opciones: [
    ['Revisar el registro de aislamiento y contrastarlo con el PLC y el video', 'Puedes contrastar la hora, el equipo y la verificación registrada con el estado observado. Si el registro falta o no coincide, mantén abierta la pregunta.'],
    ['Pedir otra copia del procedimiento', 'Obtendrías el requisito escrito. Para comprobar su ejecución necesitas evidencia de lo que ocurrió durante esta intervención.'],
    ['Dar por aplicado el aislamiento porque estaba previsto', 'Cerrarías la investigación con un supuesto. El procedimiento por sí solo no acredita qué se hizo.']
  ],
  insignia: 'Rastreador de evidencias'
};

casos.silo.mision = {
  titulo: 'Una rama abierta en el silo 6',
  dilema: 'El testigo observó el choque por el retrovisor. ¿Qué diligencia priorizarías para aclarar si el choque influyó en el atropello?',
  opciones: [
    ['Reconstruir trayectorias, campo visual y posición del conductor', 'Puedes contrastar el croquis, las huellas y las declaraciones para ubicar el contacto. Si la evidencia sigue siendo insuficiente, conserva la rama abierta.'],
    ['Entrevistar otra vez al conductor B y pedirle que confirme toda la secuencia', 'Su declaración puede precisar qué vio, desde dónde y cuándo. Su campo visual limita qué partes del contacto puede confirmar.'],
    ['Dar por probado el vínculo porque el choque ocurrió antes', 'La proximidad temporal no basta para establecer la relación. El mecanismo del atropello quedaría sin sustento.']
  ],
  insignia: 'Guardián de la evidencia'
};
