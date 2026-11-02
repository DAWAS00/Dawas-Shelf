# Baduanjin — Tinta y Bruma

Sistema de diseño para un quiosco de práctica de Baduanjin (八段錦). La identidad
transmite respeto por la naturaleza, calma y aire: papel de arroz luminoso, tinta
azulada, niebla verdosa y respiración lenta. El cinabrio es un sello puntual, no
el color de la interfaz.

## Concepto

- **Etéreo, no frío:** superficies translúcidas con blur, degradados de niebla,
  sombras difusas y tenues (los paneles flotan, no se pegan).
- **Respiración qigong:** toda animación cíclica dura 5-6 s (nada de parpadeos de
  1.5-2 s). Entradas con `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Tradición china:** celadón (青瓷) como acento principal, oro viejo para
  puntuaciones, jade para logros, cinabrio solo como sello (errores/énfasis).

## Collage sumi-e (v2)

Idioma visual: **collage sumi-e**. La interfaz se compone como un collage de
papeles rasgados y pinceladas de tinta sobre fondo de niebla.

**Regla de cero bordes:** ningún botón ni panel lleva `border`. Los contornos y
separaciones se dibujan con el borde irregular del papel (clip-path o
`feTurbulence` + `feDisplacementMap`), con pinceladas SVG o con niebla. Únicas
excepciones: el anillo del cursor de mano (halo de puntero, no panel) y la
hairline interna de la lista de resultados (`border-top` celadón al 35 %).

### Piezas

| Pieza | Qué es | Claves |
|---|---|---|
| `TornPanel` | hoja de papel rasgado: `brushBlobPath` distorsionado con `feTurbulence` + `feDisplacementMap`, fibra de papel encima | tonos `paper` / `mist` / `translucent`; sombra `0 14px 22px rgba(52,48,38,0.28)`; padding `2rem 2.4rem` |
| `BrushButton` | pincelada-botón (misma técnica, viewBox 200×64) | `primary`: relleno `--celadon-deep`, hover → tinta `--ink`; `secondary`: papel `rgba(245,241,231,0.92)` con trazo celadón 2.5, hover → trazo `--celadon-deep`; disabled `opacity: 0.45` |
| `Seal` | sello de cinabrio: blob 48×48 + glifo caligráfico | SOLO énfasis ritual (intro, finale); estampado `sello-estampa` 900 ms |
| `InkStroke` | pincelada caligráfica divisoria (`taperedStrokePath`, 300×14) | tonos `ink` / `celadon`; variante `--subtle` al 40 % de opacidad |
| Tira HUD (`.score-panel`) | tira de papel rasgado sobre vídeo | fondo `rgba(245,241,231,0.85)` + clip-path; tinta `--ink` 9.67:1; número `--celadon-deep` |

Reglas de las piezas:

- Cada instancia deriva su semilla de `useId`: ningún papel se repite dos veces.
- El tinte del papel se pinta con `currentColor`; el texto lleva siempre sus
  propios tokens de color (nunca hereda el tinte del papel).
- Hover de `BrushButton`: `scale(1.02)` + cambio de tinta, transición
  `var(--dur-slow) var(--ease-bruma)`. NUNCA cinabrio en hover/primarios.

### Tipografías (pilas exactas)

```css
--font-display: 'Cormorant Garamond', 'Ma Shan Zheng', 'Noto Serif TC', serif;
--font-body: 'Spectral', 'Noto Serif TC', serif;
```

Auto-hospedadas con `@fontsource`: `noto-serif-tc` 400/700/900,
`cormorant-garamond` 600, `spectral` 300/400/600, `ma-shan-zheng` 400. Los
chunks CJK usan `unicode-range`: solo se descargan los tramos con glifos
usados. Display latino → Cormorant Garamond; caligrafía casual → Ma Shan
Zheng; cuerpo → Spectral; fallback CJK → Noto Serif TC.

### Atmósfera

- `.screen-mist`: dos nubes de niebla celadón (radiales de 70vmax) que derivan
  en 30 s y 36 s `ease-in-out alternate`, más dos veladuras de tinta al 6-7 %.
- `.hud-mist`: viñeta `rgba(238,241,238,0.55)` + fibra de papel al 55 % sobre
  el vídeo de cámara.
- Fibra de papel global: SVG `feTurbulence` fractal al 4-5 % de opacidad.

### Transición de bruma

Entre pantallas: `.bruma-enter` — 700 ms `var(--ease-bruma)`, `opacity 0→1` con
`blur(6px)→0`: la pantalla emerge de la niebla. Entrada de sellos:
`sello-estampa` (scale 1.6→1, 900 ms, delay 600 ms). Respiración de esperas:
`bruma-respira` (opacidad 1→0.55→1 en 5.5 s). Con `prefers-reduced-motion:
reduce`: sin niebla animada, sin bruma-enter, sin estampado, sin respiraciones.

## Color

### Papel y tinta

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--paper` | `#f5f1e7` | fondo de pantalla, texto sobre relleno oscuro | — |
| `--paper-deep` | `#e9e3d5` | borde exterior de degradados | — |
| `--paper-mist` | `#eef1ee` | degradado de paneles, fondo de botones | — |
| `--ink` | `#23282a` | texto principal sobre papel | 13.22:1 vs paper |
| `--ink-light` | `#5b6360` | texto secundario | 5.48:1 vs paper |
| `--ink-wash` | `rgba(35,40,42,0.10)` | vinetas, pistas de barra | — |

### Acentos (sobre papel)

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--celadon` | `#6d8f7d` | trazos de pincel, rellenos, gráficos | 3.17:1 (solo UI/gráfico) |
| `--celadon-deep` | `#4e6b5c` | texto de acento, pincelada primaria | 5.20:1 |
| `--cinnabar` | `#a44a3f` | SOLO errores y énfasis (sello) | 5.13:1 |
| `--gold-ink` | `#7d6329` | oro como texto | 5.05:1 |
| `--jade-ink` | `#4a6b45` | jade como texto (logros) | 5.35:1 |
| `--gold` | `#c2a266` | barras/gradientes de puntuación | gráfico |
| `--jade` | `#7a9a72` | barras/gradientes de estado ok | gráfico |

### Variantes claras (solo sobre vídeo de cámara)

| Token | Valor | Contraste vs `#101413` |
|---|---|---|
| `--moon` | `#f2f4ef` | 16.76:1 |
| `--gold-light` | `#d8bd82` | 10.18:1 |
| `--celadon-light` | `#a9c6b4` | 10.10:1 |
| `--jade-light` | `#9fc3a8` | 9.59:1 |
| `--cinnabar-light` | `#e09a8f` | 8.12:1 |

**Regla de oro:** texto sobre papel → tokens `-ink` / `--celadon-deep`. Gráficos →
`--celadon` / `--gold` / `--jade`. Sobre vídeo → variantes `*-light` + halo.
Nunca bajar la opacidad del texto para suavizar.

## Tipografía

Familias: pilas exactas en «Collage sumi-e (v2)» (`--font-display` /
`--font-body`). Pesos CJK 400/700/900.

| Rol | Peso | Tamaño | Color | Notas |
|---|---|---|---|---|
| Título de pantalla | 700 | `clamp(3rem, 8vw, 6rem)` | `--ink` | tracking `0.12em`, halo de papel |
| Título de ejercicio (vídeo) | 900 | `clamp(3rem, 9vw, 6.5rem)` | `--moon` | halo oscuro `--halo-on-video` |
| Kicker sobre papel | 400 | `1.05-1.1rem` | `--celadon-deep` | tracking `0.24em`, mayúsculas no |
| Kicker sobre vídeo | 700 | `1-1.4rem` | `--gold-light` | halo oscuro |
| Cuerpo | 400 | `1rem` | `--ink` / `--ink-light` | line-height `1.8-2` |
| Número de puntuación | 900 | `clamp(2rem, 5vw, 3.2rem)` | `--gold-light` (vídeo) | halo oscuro |

Halo de texto sobre vídeo (único, suave, nunca dobles sombras duras):

```css
--halo-on-video: 0 1px 3px rgba(10, 14, 12, 0.6), 0 0 28px rgba(10, 14, 12, 0.4);
```

Halo de texto oscuro sobre papel (resplandor de papel alrededor de la tinta):

```css
text-shadow: 0 0 24px rgba(245, 241, 231, 0.9), 0 1px 2px rgba(35, 40, 42, 0.18);
```

## Superficies y textura

- Fondo de pantalla de menú: `--paper` + vineta
  `radial-gradient(ellipse at 50% 50%, transparent 0%, var(--ink-wash) 80%, var(--paper-deep) 100%)`
  + niebla celadón `radial-gradient(120% 80% at 50% 0%, rgba(109,143,125,0.10), transparent 60%)`
  + fibra de papel en SVG con `opacity="0.5"`.
- Paneles: hojas de papel rasgado (`TornPanel`, ver «Collage sumi-e (v2)») —
  sin borde, flotan con sombra difusa `0 14px 22px rgba(52,48,38,0.28)`.
- Modal overlay: `rgba(30,38,34,0.55)` con blur (no negro puro).

## Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--ease-ink` | `cubic-bezier(0.22,0.61,0.36,1)` | transiciones existentes |
| `--ease-bruma` | `cubic-bezier(0.16,1,0.3,1)` | entradas y hover de botones |
| `--dur` | `400ms` | cambios de estado |
| `--dur-slow` | `900ms` | hover/relleno de botones |

Respiración (pistas, kickers de espera): opacidad `1 → 0.55 → 1` en `5.5s ease-in-out`,
infinite. Respetar `prefers-reduced-motion: reduce` desactivando la animación.

## Componentes

### Botón (`BrushButton`, pincelada)

- Sin borde: la silueta es una pincelada SVG (ver piezas v2).
- Primary: relleno `--celadon-deep`, texto `--paper`; hover → tinta `--ink`.
- Secondary: papel `rgba(245,241,231,0.92)` con trazo `--celadon` 2.5, texto
  `--ink`; hover → trazo `--celadon-deep`.
- Transición `var(--dur-slow) var(--ease-bruma)`; disabled `opacity: 0.45`,
  cursor `not-allowed` (sobre tinta, no cinabrio).
- NUNCA: relleno cinabrio en hover/primarios.

### Sello (solo énfasis ritual)

El cinabrio como relleno aparece SOLO en el `Seal` (intro, finale). Los errores
usan tinta cinabrio sin borde (ver Errores).

### Panel / modal

Hoja de papel rasgado (`TornPanel`): sin borde, fibra de papel, sombra difusa
`0 14px 22px rgba(52,48,38,0.28)`. Overlay del modal:
`rgba(30,38,34,0.55)` con blur (no negro puro).

### Input

Sin borde: fondo `rgba(245,241,231,0.9)`, texto `--ink`. El foco revela una
`InkStroke` bajo el campo (opacidad 0 → 0.75, `var(--dur) var(--ease-bruma)`).

### Toggle de idioma (píldora suavizada)

Sin borde: fondo `rgba(238,241,238,0.7)` + blur, `border-radius: 9999px`,
sombra `0 4px 14px rgba(35,40,42,0.14)`.
Activo: relleno `--celadon-deep`, texto `--paper`, peso 700.

### Cursor de mano

`border: 3px solid var(--celadon)`, fondo `rgba(169,198,180,0.25)`,
`box-shadow: 0 0 18px rgba(169,198,180,0.75)` (halo verdoso, no blanco).

### Indicadores

- Barra de pista: `--ink-wash` (papel) o `rgba(242,244,239,0.22)` (vídeo).
- Barra de resultado: `linear-gradient(90deg, var(--celadon-deep), var(--celadon))`.
- Tira HUD de puntuación: papel rasgado `rgba(245,241,231,0.85)` con tinta
  `--ink` (9.67:1 sobre vídeo) y número en `--celadon-deep`.
- Puntuación global: número en `--celadon-deep`; medallas-tira rotadas
  (clip-path) excellent `--jade-ink` / good `--gold-ink` / keepGoing
  `--cinnabar`, texto `--paper`.
- Barra de placement: relleno `--celadon` (sobre vídeo: `--celadon-light`),
  estado ok `--jade` (`--jade-light` sobre vídeo).
- Mensajes motivacionales sobre vídeo: `--jade-light` (alta),
  `--gold-light` (media), `--cinnabar-light` (baja).

### Errores

`.selection-error` en `--cinnabar` sin borde, con veladura
`rgba(164,74,63,0.08)`; `.placement-error` sobre hoja rasgada con texto
`--cinnabar`: es el sello del sistema.

## Efectos 3D

| Elemento | Color |
|---|---|
| Esqueleto (huesos/puntos) | `0xa9c6b4` |
| Partículas de pose | `#6d8f7d` |
| Modelo volumétrico | `#e6efe8` |
| Fallback de oro | `#c2a266` |
| Atlas (oro) | `#c2a266` |
| Atlas (cinabrio) | `#a44a3f` |

## Do's and Don'ts

- DO: papeles rasgados con sombra difusa; pinceladas SVG en botones; respiraciones de 5-6 s.
- DO: halo suave en texto sobre vídeo; aire extra en paneles (padding generoso); degradados de niebla en fondos.
- DON'T: `border` en botones ni paneles (regla de cero bordes del collage sumi-e).
- DON'T: cinabrio como color de hover/primario/relleno general.
- DON'T: sombras de texto dobles y duras; negros puros; parpadeos < 3 s.
- DON'T: bajar la opacidad del texto para ganar "etéreo" a costa del contraste.
