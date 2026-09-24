'use client'
import { useEffect, useRef } from 'react'

/* ══════════════════════════════════════════════════════════════════════════
   LA SEÑAL — cómo se ve Atlas cuando está presente
   ══════════════════════════════════════════════════════════════════════════

   POR QUÉ UNA LÍNEA Y NO UNA CARA

   La tentación era un orbe girando, anillos, cromo: el repertorio de JARVIS.
   Pero eso es un mayordomo actuando para su dueño, y no es lo que pasa aquí.
   Lo que pasa aquí es que alguien pregunta algo con un cliente esperando y del
   otro lado hay algo que escucha y contesta — o que admite que no sabe.

   Así que no hay avatar. La señal ES la presencia: una línea viva en el borde
   entre lo que tú escribes y lo que yo soy. No tiene rostro porque no lo
   tengo; tiene ritmo, porque eso sí.

   CUATRO ESTADOS, Y CADA UNO ES UN ESTADO REAL DE LA APLICACIÓN — no es
   decoración que se mueve porque sí:

     disponible  respiración lenta, amplitud mínima. «Estoy aquí, no pasa nada.»
     escuchando  sube al escribir tú. Te está siguiendo.
     pensando    se acelera y la recorre un pulso. Está consultando de verdad.
     dormida     una línea recta y tenue. Nada que fingir.

   LO QUE NO HACE
   No finge actividad cuando no la hay. Si la señal se mueve rápido es porque
   hay una consulta corriendo; si está casi quieta es porque no hay nada. Una
   animación que late igual pase lo que pase enseña a no mirarla.

   Y quien pidió menos movimiento recibe la línea QUIETA. Una animación
   permanente que no se puede apagar es hostil para quien tiene sensibilidad
   vestibular o déficit de atención — y esto se abre durante toda la jornada.
   ══════════════════════════════════════════════════════════════════════════ */

export type EstadoSenal = 'dormida' | 'disponible' | 'escuchando' | 'pensando'

/** Amplitud (px), velocidad y brillo de cada estado. Se INTERPOLA entre ellos:
 *  un salto seco delataría que son cuatro animaciones distintas en vez de una
 *  sola cosa que cambia de ánimo. */
const PERFIL: Record<EstadoSenal, { amp: number; vel: number; brillo: number; pulso: number }> = {
  dormida:    { amp: 0.4, vel: 0.15, brillo: 0.18, pulso: 0 },
  disponible: { amp: 3.2, vel: 0.55, brillo: 0.40, pulso: 0 },
  escuchando: { amp: 7.5, vel: 1.05, brillo: 0.62, pulso: 0 },
  pensando:   { amp: 13,  vel: 2.10, brillo: 0.95, pulso: 1 },
}

export default function AtlasSignal({
  estado = 'disponible',
  altura = 56,
}: { estado?: EstadoSenal; altura?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /** El estado vive en una ref y no en el closure del bucle: así cambiar de
   *  ánimo NO reinicia la animación — la línea sigue donde iba y se acomoda. */
  const objetivo = useRef(PERFIL[estado])
  /** Repintar un cuadro suelto. Lo publica el efecto de montaje para que el
   *  cambio de estado pueda usarlo cuando NO hay bucle corriendo. */
  const repinta = useRef<null | (() => void)>(null)

  useEffect(() => {
    objetivo.current = PERFIL[estado]
    /* Con «reducir movimiento» no hay bucle, así que sin esto la línea se
       quedaba congelada en la amplitud de «disponible» para siempre: decía
       que no pasaba nada mientras había una consulta corriendo. Un cuadro
       suelto por cambio de estado no es animación — es informar. */
    repinta.current?.()
  }, [estado])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    /* El identificador del cuadro pendiente. Va ARRIBA del todo aunque no se
       use hasta más abajo: los manejadores de eventos lo leen, y declararlo
       después de ellos funciona —no se ejecutan hasta que el efecto termina—
       pero obliga a razonar sobre la zona muerta temporal para convencerse.
       Un 0 significa «no hay cuadro pedido». */
    let raf = 0

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

    let ancho = 0
    let alto = 0
    // El dpr se remide en cada `medir()`: si la ventana se arrastra a otro
    // monitor con distinta densidad, fijarlo al montar dejaría la línea borrosa.
    let dpr = 1

    /* MEDIR BORRA EL DIBUJO. Asignar `canvas.width` reinicia el bitmap a
       transparente por especificación, aunque se le ponga el mismo número. Con
       la animación encendida no se nota —el siguiente cuadro repinta—, pero
       con «reducir movimiento» activo NO HAY siguiente cuadro: la línea se
       borraba al cambiar el tamaño de la ventana y no volvía nunca. Por eso
       `medir()` termina repintando siempre. */
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
    medir()
    window.addEventListener('resize', medir)

    /* Con la pestaña oculta el navegador ya frena el requestAnimationFrame,
       pero no en todas partes ni siempre: se corta explícitamente. Esta
       pantalla se queda abierta toda la jornada en una pestaña de fondo, y
       pintar una onda que nadie mira es gastar batería por nada. */
    function visibilidad() {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0 }
      else if (!raf && !quieto) dibuja()
    }
    document.addEventListener('visibilitychange', visibilidad)

    // Estado actual, que persigue al objetivo sin dar saltos.
    let amp = PERFIL[estado].amp
    let brillo = PERFIL[estado].brillo
    let pulso = 0
    let t = 0

    /* AVANZAR y PINTAR están separados a propósito.
       `pinta()` dibuja un cuadro con el estado que haya, sin tocar el tiempo ni
       pedir el siguiente. Así puede llamarse desde `medir()` —que acaba de
       borrar el bitmap— aunque la animación esté apagada. `avanza()` mueve el
       reloj. `dibuja()` es el bucle: avanza, pinta y pide otro. */
    function avanza(dt: number) {
      const o = objetivo.current
      /* Persecución exponencial CORREGIDA POR TIEMPO. Antes era un 6% por
         FOTOGRAMA, así que en un monitor de 144 Hz todo iba 2.4× más rápido:
         la «respiración lenta» salía nerviosa y el pensando, frenético. Ahora
         el 6% es por cuadro de 60 Hz y se reescala al delta real. */
      const k = 1 - Math.pow(1 - 0.06, dt * 60)
      amp += (o.amp - amp) * k
      brillo += (o.brillo - brillo) * k
      pulso += (o.pulso - pulso) * (1 - Math.pow(1 - 0.05, dt * 60))
      t += dt * o.vel
    }

    function pinta() {
      const o = objetivo.current
      ctx!.clearRect(0, 0, ancho, alto)
      const medio = alto / 2

      /* El pulso que recorre la línea cuando está pensando. Sale por la
         derecha y vuelve a entrar por la izquierda; no se ve el salto porque
         en los extremos la envolvente vale cero y además `pulso` solo es > 0
         mientras el estado es «pensando». */
      const px = ((t * 0.28 * (o.vel || 1)) % 1.4 - 0.2) * ancho
      const sigma = ancho * 0.07

      function y(x: number): number {
        const u = x / ancho
        // Envolvente: la línea nace y muere plana en los bordes. Sin esto
        // parece un trozo recortado de una onda más grande.
        const env = Math.sin(Math.PI * u)
        // Tres armónicos, no uno: una sinusoide pura se lee como máquina.
        const onda =
          0.62 * Math.sin(u * 7.0 + t * 1.7) +
          0.27 * Math.sin(u * 13.0 - t * 2.3) +
          0.11 * Math.sin(u * 23.0 + t * 3.1)
        const bulto = pulso * 14 * Math.exp(-((x - px) ** 2) / (2 * sigma * sigma))
        return medio - (onda * amp + bulto) * env
      }

      // Estela: la misma curva, más gruesa y difusa, por debajo.
      const grad = ctx!.createLinearGradient(0, 0, ancho, 0)
      grad.addColorStop(0, 'rgba(0,87,255,0)')
      grad.addColorStop(0.16, `rgba(56,132,255,${brillo * 0.55})`)
      grad.addColorStop(0.5, `rgba(125,211,252,${brillo})`)
      grad.addColorStop(0.84, `rgba(56,132,255,${brillo * 0.55})`)
      grad.addColorStop(1, 'rgba(0,87,255,0)')

      ctx!.beginPath()
      for (let x = 0; x <= ancho; x += 2) {
        const yy = y(x)
        if (x === 0) ctx!.moveTo(x, yy)
        else ctx!.lineTo(x, yy)
      }
      ctx!.strokeStyle = grad
      ctx!.lineWidth = 6
      ctx!.globalAlpha = 0.16
      ctx!.lineCap = 'round'
      ctx!.stroke()

      // La línea misma, fina y nítida encima de su propia estela.
      ctx!.globalAlpha = 1
      ctx!.lineWidth = 1.6
      ctx!.stroke()
    }

    let anterior = 0
    function dibuja(ts?: number) {
      // Si aún no hay ancho —el contenedor no se ha medido— se remide y se
      // salta el cuadro: dibujar contra 1px dejaría la línea aplastada.
      if (ancho <= 1) {
        medir()
        if (ancho <= 1) {
          raf = quieto ? 0 : requestAnimationFrame(dibuja)
          return
        }
      }
      /* El tope de 50 ms evita el salto tras volver de una pestaña en segundo
         plano o de un bloqueo: sin él, un delta de varios segundos dispararía
         la onda de golpe. */
      const ahora = ts ?? anterior
      const dt = anterior ? Math.min((ahora - anterior) / 1000, 0.05) : 0.016
      anterior = ahora
      avanza(dt)
      pinta()
      raf = (quieto || document.hidden) ? 0 : requestAnimationFrame(dibuja)
    }

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
