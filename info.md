# 🦝 Racoon Roomba Card

A compact, animated Lovelace card for controlling your Roomba vacuum from Home Assistant.

> ⚠️ **This card requires the [ha-roomba-custom](https://github.com/jamesmcginnis/ha-roomba-custom) integration.** Install it before adding this card.

---

<img src="https://raw.githubusercontent.com/jamesmcginnis/racoon-roomba-card/main/preview1.png" width="380" alt="Racoon Roomba Card preview" />
<img src="https://raw.githubusercontent.com/jamesmcginnis/racoon-roomba-card/main/preview2.png" width="380" alt="Racoon Roomba Card cleaning state" />

---

## What it does

- Animated spinning icon and ring while the Roomba is cleaning
- Live state display: Cleaning, Docked, Returning, Paused, Idle, Stuck
- Inline stats: mission time · area cleaned · battery %
- Battery % turns orange below 40%, red below 20%
- **Not Stuck** and **Bin OK** status pills that alert when needed
- Five round control buttons: Start, Pause, Dock, Stop, Find
- Tap anywhere on the card to open the HA more-info popup
- Visual editor — no YAML needed for basic setup

## Required integration

This card is built exclusively for the **ha-roomba-custom** integration:

👉 [github.com/jamesmcginnis/ha-roomba-custom](https://github.com/jamesmcginnis/ha-roomba-custom)

## Minimal configuration

```yaml
type: custom:racoon-roomba-card
entity: vacuum.roomba
```

For full configuration options see the [README](https://github.com/jamesmcginnis/racoon-roomba-card).
