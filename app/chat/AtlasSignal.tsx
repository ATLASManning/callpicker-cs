'use client'
import { useEffect, useRef } from 'react'

/* ══════════════════════════════════════════════════════════════════════════
   LA SEÑAL — cómo se ve Atlas cuando está presente
   ══════════════════════════════════════════════════════════════════════════

   POR QUÉ BARRAS Y NO UNA CARA

   La tentación era un orbe girando, anillos, cromo: el repertorio de JARVIS.
   Pero eso es un mayordomo actuando para su dueño, y no es lo que pasa aquí.
   Lo que pasa aquí es que alguien pregunta algo con un cliente esperando y del
   otro lado hay algo que escucha y contesta — o que admite que no sabe.

   Así que no hay avatar. La señal ES la presencia: una secuencia de voz en el
   borde entre lo que tú escribes y lo que yo soy. Empezó siendo una línea de
   onda; son barras porque una secuencia de voz se LEE como voz, y una curva
   suelta se lee como decoración. No tiene rostro porque no lo tengo; tiene
   ritmo, porque eso sí.

   CUATRO ESTADOS, Y CADA UNO ES UN ESTADO REAL DE LA APLICACIÓN — no es
   decoración que se mueve porque sí:

     disponible  respiración lenta, barras bajas. «Estoy aquí, no pasa nada.»
     escuchando  suben al escribir tú. Te está siguiendo.
     pensando    se aceleran y las recorre un pulso. Consultando de verdad.
     dormida     casi planas y apagadas. Nada que fingir.

   LO QUE NO HACE
   No finge actividad cuando no la hay. Si las barras se mueven rápido es
   porque hay una consulta corriendo; si están casi quietas es porque no hay
   nada. Una animación que late igual pase lo que pase enseña a no mirarla.

   Y quien pidió menos movimiento recibe las barras QUIETAS. Una animación
   permanente que no se puede apagar es hostil para quien tiene sensibilidad
   vestibular o déficit de atención — y esto se abre durante toda la jornada.
   ══════════════════════════════════════════════════════════════════════════ */

export type EstadoSenal = 'dormida' | 'disponible' | 'escuchando' | 'pensando'

/** Altura relativa, velocidad, brillo y pulso de cada estado. Se INTERPOLA
 *  entre ellos: un salto seco delataría que son cuatro animaciones distintas
 *  en vez de una sola cosa que cambia de ánimo. */
const PERFIL: Record<EstadoSenal, { amp: number; vel: number; brillo: number; pulso: number }> = {
  dormida:    { amp: 0.06, vel: 0.15, brillo: 0.20, pulso: 0 },
  disponible: { amp: 0.20, vel: 0.55, brillo: 0.46, pulso: 0 },
  escuchando: { amp: 0.48, vel: 1.10, brillo: 0.70, pulso: 0 },
  pensando:   { amp: 0.82, vel: 2.10, brillo: 1.00, pulso: 1 },
}

const ANCHO_BARRA = 3
const HUECO = 4

export default function AtlasSignal({
  estado = 'disponible',
  altura = 72,
}: { estado?: EstadoSenal; altura?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /** El estado vive en una ref y no en el closure del bucle: así cambiar de
   *  ánimo NO reinicia la animación — las barras siguen donde iban. */
  const objetivo = useRef(PERFIL[estado])
  /** Repintar un cuadro suelto. Lo publica el efecto de montaje para que el
   *  cambio de estado pueda usarlo cuando NO hay bucle corriendo. */
  const repinta = useRef<null | (() => void)>(null)

  useEffect(() => {
    objetivo.current = PERFIL[estado]
    /* Con «reducir movimiento» no hay bucle, así que sin esto las barras se
       quedarían congeladas en la altura de «disponible» para siempre: dirían
       que no pasa nada mientras hay una consulta corriendo. Un cuadro suelto
       por cambio de estado no es animación — es informar. */
    repinta.current?.()
  }, [estado])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    /* EL ESTADO DE LAS BARRAS, ARRIBA DEL TODO. `medir()` se llama nada más
       definirse y termina repintando, así que todo lo que el pintado lea tiene
       que existir ya. Declararlo más abajo con `let` lo dejaba en la zona
       muerta temporal: eso tumbó la pantalla entera una vez. Las funciones se
       elevan; `let` y `const` no. */
    let raf = 0
    let amp = PERFIL[estado].amp
    let brillo = PERFIL[estado].brillo
    let pulso = 0
    let t = 0
    let ancho = 0
    let alto = 0
    let dpr = 1

    /* La preferencia se ESCUCHA, no se lee una vez. Quien la activa a media
       jornada —porque le empezó a molestar— esperaría que se apague sola, no
       tener que recargar la pantalla. */
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let quieto = mq.matches
    const cambioPreferencia = () => {
      quieto = mq.matches
      cancelAnimationFrame(raf)
      raf = 0
      dibuja()   // si quedó en quieto, pinta un cuadro y no pide otro
    }
    mq.addEventListener('change', cambioPreferencia)

    /* MEDIR BORRA EL DIBUJO. Asignar `canvas.width` reinicia el bitmap por
       especificación, aunque se le ponga el mismo número. Con la animación
       encendida no se nota, pero con «reducir movimiento» NO HAY cuadro
       siguiente: las barras se borraban al cambiar el tamaño de la ventana y
       no volvían nunca. Por eso `medir()` termina repintando siempre.
       El `dpr` se remide aquí: si la ventana se arrastra a otro monitor con
       distinta densidad, fijarlo al montar dejaría el dibujo borroso. */
    function medir() {
      const r = canvas!.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      ancho = Math.max(1, Math.floor(r.width))
      alto = Math.max(1, Math.floor(r.height))
      canvas!.width = ancho * dpr
      canvas!.height = alto * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (ancho > 1) pinta()
    }

    /* Con la pestaña oculta el navegador ya frena el requestAnimationFrame,
       pero no en todas partes ni siempre: se corta explícitamente. Esta
       pantalla se queda abierta toda la jornada en una pestaña de fondo, y
       pintar barras que nadie mira es gastar batería por nada. */
    function visibilidad() {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0 }
      else if (!raf && !quieto) dibuja()
    }

    /* AVANZAR y PINTAR van separados: `pinta()` dibuja un cuadro con el estado
       que haya, sin tocar el reloj ni pedir el siguiente, así puede llamarse
       desde `medir()` aunque la animación esté apagada. */
    function avanza(dt: number) {
      const o = objetivo.current
      /* Persecución exponencial CORREGIDA POR TIEMPO. Antes era un 6% por
         FOTOGRAMA, así que en un monitor de 144 Hz todo iba 2.4× más rápido:
         la «respiración lenta» salía nerviosa. Ahora el 6% es por cuadro de
         60 Hz y se reescala al delta real. */
      const k = 1 - Math.pow(1 - 0.07, dt * 60)
      amp += (o.amp - amp) * k
      brillo += (o.brillo - brillo) * k
      pulso += (o.pulso - pulso) * (1 - Math.pow(1 - 0.05, dt * 60))
      t += dt * o.vel
    }

    function pinta() {
      const o = objetivo.current
      ctx!.clearRect(0, 0, ancho, alto)

      const paso = ANCHO_BARRA + HUECO
      const n = Math.max(2, Math.floor(ancho / paso))
      const sobra = ancho - n * paso + HUECO
      const x0 = sobra / 2
      const medio = alto / 2
      const maxAlt = alto * 0.86

      /* El pulso que recorre las barras cuando está pensando. Sale por la
         derecha y vuelve por la izquierda; no se ve el salto porque en los
         extremos la envolvente vale cero. */
      const pu = (t * 0.30) % 1.5 - 0.25
      const sigma = 0.09

      for (let i = 0; i < n; i++) {
        const u = n > 1 ? i / (n - 1) : 0.5
        /* Envolvente: las barras nacen y mueren bajas en los bordes. Sin esto
           parece un trozo recortado de algo más grande. */
        const env = Math.sin(Math.PI * u) ** 0.82
        /* Tres armónicos, no uno: una sinusoide pura se lee como máquina. El
           tercero es rápido y de poca altura — es el titileo. */
        const onda =
          0.58 * Math.sin(u * 8.0 + t * 1.9) +
          0.28 * Math.sin(u * 15.0 - t * 2.6) +
          0.14 * Math.sin(u * 27.0 + t * 4.3)
        const bulto = pulso * 0.55 * Math.exp(-((u - pu) ** 2) / (2 * sigma * sigma))
        /* Suelo del 7%: una barra a cero se lee como hueco, y un hueco en
           mitad de la secuencia parece un fallo, no reposo. */
        const h = Math.max(alto * 0.055, (Math.abs(onda) * amp + bulto) * env * maxAlt)

        const x = x0 + i * paso
        /* BLANCA. Era cian y sobre este fondo se leía apagada, como un
           elemento secundario de la pantalla. La secuencia es la presencia, no
           un adorno: va en blanco.
           El centro brilla más que los extremos —la secuencia tiene foco— y el
           pulso que la recorre al pensar sube a blanco pleno. Con un solo tono,
           la diferencia la lleva la opacidad, que es lo que el ojo lee como
           intensidad de voz. */
        const a = brillo * (0.34 + 0.66 * env)
        ctx!.fillStyle = `rgba(255,255,255,${Math.min(1, a + bulto * 0.9)})`
        ctx!.beginPath()
        // Barras con las puntas redondeadas, centradas en el eje.
        const y = medio - h / 2
        const r = ANCHO_BARRA / 2
        ctx!.moveTo(x + r, y)
        ctx!.arcTo(x + ANCHO_BARRA, y, x + ANCHO_BARRA, y + h, r)
        ctx!.arcTo(x + ANCHO_BARRA, y + h, x, y + h, r)
        ctx!.arcTo(x, y + h, x, y, r)
        ctx!.arcTo(x, y, x + ANCHO_BARRA, y, r)
        ctx!.fill()
      }

      // El eje: una línea tenue que sostiene la secuencia cuando está casi
      // plana, para que el reposo no se lea como pantalla apagada. Blanco
      // también, y muy bajo: acompaña, no compite con las barras.
      ctx!.fillStyle = `rgba(255,255,255,${0.07 + brillo * 0.08})`
      ctx!.fillRect(x0, medio - 0.5, ancho - sobra, 1)
      void o
    }

    let anterior = 0
    function dibuja(ts?: number) {
      // Si aún no hay ancho —el contenedor no se ha medido— se remide y se
      // salta el cuadro: dibujar contra 1px dejaría todo aplastado.
      if (ancho <= 1) {
        medir()
        if (ancho <= 1) {
          raf = quieto ? 0 : requestAnimationFrame(dibuja)
          return
        }
      }
      /* El tope de 50 ms evita el salto tras volver de una pestaña en segundo
         plano: sin él, un delta de varios segundos dispararía las barras. */
      const ahora = ts ?? anterior
      const dt = anterior ? Math.min((ahora - anterior) / 1000, 0.05) : 0.016
      anterior = ahora
      avanza(dt)
      pinta()
      raf = (quieto || document.hidden) ? 0 : requestAnimationFrame(dibuja)
    }

    medir()
    window.addEventListener('resize', medir)
    document.addEventListener('visibilitychange', visibilidad)
    dibuja()

    /* Se publica el repintado para el efecto de `estado`. En modo quieto salta
       directo al perfil nuevo —no hay bucle que interpole— y pinta una vez. */
    repinta.current = () => {
      if (!quieto || ancho <= 1) return
      const o = objetivo.current
      amp = o.amp; brillo = o.brillo; pulso = o.pulso
      pinta()
    }

    return () => {
      repinta.current = null
      cancelAnimationFrame(raf)
      raf = 0
      window.removeEventListener('resize', medir)
      document.removeEventListener('visibilitychange', visibilidad)
      mq.removeEventListener('change', cambioPreferencia)
    }
    // Solo al montar: el cambio de estado entra por la ref, a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: altura }}
    />
  )
}
