# 🦝 Racoon Roomba Card

A compact, animated Lovelace card for controlling your Roomba vacuum from Home Assistant.

> ⚠️ **This card requires this [ha-roomba-custom](https://github.com/jamesmcginnis/ha-roomba-custom) integration.** Install it before adding this card.

---

<img src="https://raw.githubusercontent.com/jamesmcginnis/racoon-roomba-card/main/preview1.png" width="380" alt="Racoon Roomba Card preview" />
<img src="https://raw.githubusercontent.com/jamesmcginnis/racoon-roomba-card/main/preview2.png" width="380" alt="Racoon Roomba Card cleaning state" />

---

## What it does

- **Connected** pill on the left, **battery %** pill on the right — colour shifts amber below 40%, red below 20%
- Animated robot icon with spinning ring while cleaning
- Ring colour reflects state: green cleaning, blue docked, amber returning, red error
- Device name displayed inside the robot circle
- Five round control buttons: Start, Pause, Dock, Stop, Find
- Tap anywhere on the card to open the HA more-info popup
- Visual editor — no YAML needed for basic setup

## Required integration

This card is built exclusively for the **ha-roomba-custom** integration:

👉 [github.com/jamesmcginnis/ha-roomba-custom](https://github.com/jamesmcginnis/ha-roomba-custom)

## Install via HACS

[![Add to HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jamesmcginnis&repository=racoon-roomba-card&category=plugin)

## Minimal configuration

```yaml
type: custom:racoon-roomba-card
entity: vacuum.roomba
```

For full configuration options see the [README](https://github.com/jamesmcginnis/racoon-roomba-card).
