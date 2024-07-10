[![mtgGoldfish](https://github.com/sboulema/mtgGoldfish/actions/workflows/workflow.yml/badge.svg)](https://github.com/sboulema/mtgGoldfish/actions/workflows/workflow.yml) [![Website](https://img.shields.io/website-up-down-green-red/http/shields.io.svg?label=Goldfish)](http://goldfish.sboulema.nl) [![Docker Pulls](https://img.shields.io/docker/pulls/sboulema/mtggoldfish.svg)](https://store.docker.com/community/images/sboulema/mtggoldfish)

# ![logo](img/goldfish.png) MTG Goldfish
Website to playtest (goldfish) Magic The Gathering decks - http://goldfish.sboulema.nl

![screenshot](img/screenshot.png)

## Features
- Load deck and sideboard from text, [MTGStocks](https://www.mtgstocks.com/) or [MTGGoldfish](https://www.mtggoldfish.com/)
- Keep track of life totals
- Custom counter for eg. storm or poison counters
- Keep track of your mana pool
- Keep track of current turn
- Flip or morph cards
- Add counters to cards
- Write custom text on counters
- View cards in all zones (hand, library, graveyard exile, sideboard)
- Keyboard shortcuts
- Select and add tokens
- Create custom tokens
- Start with a specific card in hand
- Tap cards
- Drag & drop cards between all zones
- Custom background

## Building
- npm install
- npm run gulp

## Running

`docker run -p 80:80 sboulema/mtggoldfish`