// ====================================================================
// Configuración Central de INVERANOLI Joyería (@inveranoli2017)
// Los datos como RIF y WhatsApp se encuentran parametrizados para 
// facilitar su reemplazo inmediato cuando el usuario los suministre.
// ====================================================================

var INVERANOLI_CONFIG = {
  nombre: 'INVERANOLI Joyería',
  marca: 'INVERANOLI',
  eslogan: 'Joyería Fina, Anillos de Grado, Matrimonio & Acero Inoxidable',
  instagram: '@inveranoli2017',
  instagram_url: 'https://www.instagram.com/inveranoli2017/',
  
  // WhatsApp oficial (@inveranoli2017)
  whatsapp: '584125006377',
  telefono_visible: '0412-5006377',
  
  // Dirección física de atención en Valencia, Edo. Carabobo
  direccion: 'Centro Comercial Gran Bazar, Av. Lara, Planta Baja (Diagonal a Colchoganga), Valencia, Edo. Carabobo',
  punto_referencia: 'A una cuadra de la Plaza La Candelaria',
  horario: 'Lunes a Sábado de 9:00 AM a 6:00 PM (Horario Corrido)',
  
  // RIF institucional oficial
  rif: 'J-316090539',

  // Configuración de carruseles de la página de inicio (en segundos)
  carruseles: {
    inicio_segundos: 5,        // Tiempo por banner principal
    descuentos_segundos: 6,    // Tiempo por pase de ofertas
    recomendados_segundos: 7   // Tiempo por pase de joyas destacadas
  },

  // Canales y Métodos de Pago Disponibles en Venezuela (Pago Móvil, Transferencia y Efectivo Divisas/Bs)
  metodos_pago: [
    {
      id: 'pago_movil',
      label: 'Pago Móvil (Recomendado)',
      banco: 'Banesco (0134) / Banco de Venezuela (0102)',
      telefono: '0412-5006377',
      ci: 'J-316090539',
      instruccion: 'Transfiere el monto equivalente en Bs a la tasa oficial BCV y guarda el número de referencia.'
    },
    {
      id: 'transferencia',
      label: 'Transferencia Bancaria Nacional',
      banco: 'Banco de Venezuela',
      cuenta: '0102-0123-45-0000316090',
      titular: 'INVERANOLI Joyería C.A.',
      rif: 'J-316090539',
      instruccion: 'Transferencia a cuenta corriente empresarial. Por favor indicar número de comprobante.'
    },
    {
      id: 'efectivo',
      label: 'Efectivo Divisas ($ USD) / Efectivo Bs',
      datos: 'Pago directo en nuestra tienda física en CC Gran Bazar o al momento de la entrega en Valencia.',
      instruccion: 'Aceptamos divisas en efectivo ($ USD) y Bolívares en billetes de curso legal en buen estado.'
    }
  ],

  // Agencias de Envío Nacional
  envios_nacionales: [
    { id: 'zoom', nombre: 'MRW / Domesa (A toda Venezuela)' },
    { id: 'tealca', nombre: 'Tealca / Zoom Asegurado' },
    { id: 'tienda', nombre: 'Retiro en Tienda Física (CC Gran Bazar Valencia)' }
  ]
};

// Variable alias para compatibilidad y fácil acceso
var TIENDA_CONFIG = INVERANOLI_CONFIG;
