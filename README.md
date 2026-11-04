# Happy Birthday — an interactive love letter in five chapters

A birthday surprise that feels more like a short film than a website. A glowing amber heart leads the visitor through everything: it's born when two lights meet on the opening screen, becomes the full stop on the title, rides the photo deck, slides down the timeline, fills the love meter and finally turns into a candle flame you blow out to make a wish.

Built with plain HTML, CSS and JavaScript. No frameworks, no build step, no dependencies besides Google Fonts.

## The chapters

Each chapter has its own URL (`#/memories`, `#/meter` …), but the site never reloads, so the music keeps playing and the heart flies from page to page. Changing chapter, a warm curtain grows out of your tap, the heart beats alone for a moment, then a circle opens onto the next page.

| Page | What happens |
| --- | --- |
| **Home** | Two lights melt into a heart; tap it and the site is revealed through a growing circle. A scroll-bound portal (panels part, the title splits, warm light leaks through), the love statement, "I love you" in 12 languages, and five photo doors that tilt toward your cursor. |
| **01 · Memories** | A throwable photo deck. Drag past 10% of its width to throw a card, use ← →, or tap a card and it grows into a full-screen view: the photo slowly drifts and zooms, the caption writes itself in, and you swipe between memories. Double-tap sends a kiss. |
| **02 · Our story** | A timeline whose rail draws itself in light as you scroll, then "the little things" table. |
| **03 · Love notes** | A glass jar of folded notes. Tap it: the lid pops, a note flies out, unfolds and types itself. Fold it back or keep it and pull another. |
| **04 · Love meter** | A two-round game. Round one is a quiz with eight hearts that fill as you answer (answers implode and burst between questions). Round two is *Catch the hearts*: 20 seconds on a canvas, catch hearts, dodge broken ones, gold is worth three. The result is a heart that fills with liquid to your score. |
| **05 · The wish** | A two-tier cake with five candles. Hold the button, the flames grow; let go and they blow out one by one, smoke curls up, a heart of light appears and hearts rain down. |

### Motion & VFX
- **One through-line object** (`js/thread.js`): every place the heart can land is marked with `data-thread`. Each frame it picks the one nearest the middle of the screen, measures it, and springs there. It stretches in the direction it moves (a cheap motion blur) and beats "lub-dub" with the music.
- **Hand-written springs and easing** (`js/motion.js`), all in one shared `requestAnimationFrame` loop.
- **Nothing pops in**: everything grows, unfolds or is revealed by a mask, and every page replays its entrance on each visit.
- **Canvas particles** (`js/fx.js`): embers and tiny hearts pushed away by the cursor, hearts that float up wherever you tap, a heart drawn out of light, smoke, and heart rain. Glows are pre-rendered sprites so it stays smooth.
- **Sound made in code** (`js/audio.js`): a 120 BPM music-box track with pads and a heartbeat, plus whooshes, chimes and game sounds, all synthesised with the Web Audio API.
- **Accessible**: keyboard support everywhere (deck, viewer, game, wish), screen-reader text for animated headlines, a phone menu, and with `prefers-reduced-motion` the site goes calm but stays fully usable.

## Run it

ES modules need a local server (opening the file directly won't work):

```bash
python -m http.server 5173
# then open http://localhost:5173
```

## Make one for someone else

1. Open **`js/config.js`**. Everything personal lives there: name, dates, the statement, chapter photos, photo captions, milestones, love notes, quiz questions and the "I love you" languages. `{name}` in any text gets swapped for the name.
2. Put their photos in **`assets/img/`** and update the paths.
3. Optional: drop a song at `assets/audio/song.mp3`. It's git-ignored on purpose (most songs are copyrighted). Without it, the site plays its own music.
4. Change colours or fonts in **`css/tokens.css`**.
5. Deploy: push to GitHub, then **Settings → Pages → Deploy from branch → main / root**. Hash routes work on GitHub Pages with no extra setup.

Tip: keep the name short. The giant footer wordmark is meant to be cropped by the page edge.

## Project structure

```
index.html          the shell: gate, nav, six pages, viewer, footer
css/tokens.css      colours, fonts, easing curves
css/base.css        reset, nav, buttons, type, reveals, the travelling heart
css/sections.css    gate, portal, statement, bands, deck, timeline, table, footer
css/pages.css       page system, transitions, chapters, viewer, jar, game, cake
js/config.js        all personal content  ← edit this
js/main.js          renders content, starts every module and the router
js/router.js        hash routes + the heart curtain transition
js/motion.js        springs, easing, scroll progress, shared rAF loop
js/thread.js        the glowing through-line heart
js/portal.js        scroll-bound hero + camera push
js/reveal.js        split-letter and mask reveals (replayed per visit)
js/band.js          "I love you" language bands
js/deck.js          throwable photo deck
js/viewer.js        full-screen memories
js/timeline.js      timeline rows + self-drawing rail
js/notes.js         the jar of notes
js/meter.js         love meter game flow + liquid heart result
js/quiz.js          round one: the quiz
js/catch.js         round two: catch the hearts (canvas)
js/wish.js          the cake and candles
js/fx.js            particles, force field, heart burst, tap hearts, rain, smoke
js/audio.js         Web Audio music and sound effects
```

## Credits

Design and code by [Perey](https://github.com/Codex-Prime01). Fonts: [Syne](https://fonts.google.com/specimen/Syne), [Sora](https://fonts.google.com/specimen/Sora) and [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif).
