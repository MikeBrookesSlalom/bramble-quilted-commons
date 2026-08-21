# Bramble and the Quilted Commons

A whimsical 3D obby (obstacle course) starring **Bramble** — a 3D model of the
chunky blue-and-white knitted bear, built from the photos of the real toy: the
wide flat white head with its plain, faceless front, big marled ears tacked on at
the corners with pink thread, long dangling arms and legs in blue-and-white
marled yarn, and the pink thread tied in a bow at the neck.

Everything in the world is made of cloth: a patchwork-quilt meadow, a pond of
blue felt, giant buttons for stepping stones, sliding ribbon platforms, a tomato
pincushion with springs, a tower of thread spools, bobbing balls of yarn, a
sewing needle for a bridge, and a giant felt flower at the summit.

There are no enemies and nothing to lose — just a world to climb and explore.
Find the Golden Thimble and you can choose to continue into a second level,
**The Midnight Mending Loft** — a genuinely different night-time route: a
quick zigzag of lantern buttons, platforms that sway toward and away from
you instead of side to side, a chain of small bouncy pops, a gondola you
ride across a gap, a switchback spiral up a tower of spools, one huge
spring launch, and a calm silver-needle bridge to a Silver Thimble at the
top. Finishing it (worth more spools than level one) offers the choice to
start the whole game over — your spool balance and unlocked characters are
never reset.

Finish a run and you earn spools of thread — spend them in the Yarn Shop
(the 👗 button) to unlock new knitted friends, each a genuinely different
animal, not just a recolour: **Evalina**, a pink bunny with a bow in her
ears and a little crochet dress; **Clementine**, a peachy fox with a bushy
tail; and **Marina**, a minty seal with flippers instead of paws. Whoever
you're wearing remembers itself between sessions.

Standing still for a couple of seconds sets off a little gesture — a
curious look around, a big stretch, a happy wiggle — and any input
snaps straight back to normal. Double-jump (flutter) now hangs in the
air for a moment before gravity takes back over, useful for lining up
a tricky landing. A bouncy little generative soundtrack — a plucked bassline, a
whimsical repeating melody riff and a soft shaker — plays in the
background (🎵 button to mute). Nothing is a sound file, it's all
synthesized live.

## Playing

Double-click **`Play Bramble.command`**, and the game opens in your browser.

(It starts a small local web server first. Browsers won't run a game like this
straight off the disk, so opening `index.html` by itself will show a blank page.)

To stop playing, close the Terminal window that opened alongside it.

### Controls

| | |
|---|---|
| `W` `A` `S` `D` or arrow keys | wander |
| `Space` | hop — press again in mid-air for a flutter jump |
| mouse drag (or move, once the pointer is locked) | look around |
| scroll wheel | zoom the camera in and out |
| `R` | return to the last thimble checkpoint |

Fall off? You reappear at the last silver thimble you touched. There's no
penalty and no timer.

## The route

1. **The Meadow** — a patchwork island under an embroidery-hoop arch.
2. **Button pond** — five giant buttons bobbing over blue felt water.
3. **Linen Ledge** — a bunting-strung ledge (checkpoint).
4. **Ribbon sliders** — four woven platforms sliding side to side.
5. **The Pincushion** — walk onto a knitted spring and get flung skyward.
6. **Spool tower** — four spools of thread spiralling upward.
7. **The reel lift** — a bobbin that rises and falls on a thread.
8. **Yarn balls** — three bobbing woollen stepping stones.
9. **The needle bridge** — a walk along a giant sewing needle.
10. **The summit flower** — and the Golden Thimble on top.

Twelve gold buttons are scattered along the way. They're optional — the win
screen counts how many you found, and the world stays open afterwards.

## How it is built

Plain JavaScript and [three.js](https://threejs.org) (bundled in `lib/`, so it
works with no internet connection). No build step, no dependencies to install.

| file | what it does |
|---|---|
| `src/textures.js` | paints every fabric — knit stitches, felt, weave, patchwork, wound thread — onto 2D canvases at load time |
| `src/bear.js` | builds the knitted character out of lumpy spheres, parameterized by a "skin" (colours + ear shape), and animates it — walking, jumping, hovering, idle gestures |
| `src/characters.js` | the roster: Bramble, Evalina, Clementine, Marina — each just a set of yarn colours and an ear shape |
| `src/progress.js` | localStorage-backed currency, unlocks and the selected character |
| `src/level.js` | both worlds: platforms, props, collectibles and checkpoints for level 1 and level 2 |
| `src/game.js` | movement, collision, camera, the game loop, and switching between levels |
| `src/particles.js` | puffs of lint, sparkles and confetti scraps |
| `src/sound.js` | a small soft synth for hops, boings, the fanfare, and a generative ambient soundtrack |

Platforms are deliberately **one-way**: you sail up through them and land on
top, so a mistimed jump never bonks you on the head — it keeps the climb
forgiving for small hands.

Want to fiddle? Open the browser console and use `game` — for example
`game.pos.set(0, 34.4, -110)` teleports Bramble to the summit.
