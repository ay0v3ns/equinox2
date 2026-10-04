# Equinox

Equinox is being built tab-by-tab from the authoritative Equinox game document.

## Current implementation

### Roll
- Roll… button
- Canonical Aura roster (687 Aura records)
- Canonical Luck list-value selection foundation
- Basic Luck + Special Luck + Final Multiplier ordering
- 2× Bonus Roll every tenth roll
- Breakthrough multiplier handling
- Five most recent rolls
- Biome / Day-Night / Dimension display
- Personal ground-item spawning every minute
- Click collection
- Local prototype persistence

### Inventory
- Four documented categories: Auras, Potions, Gears, Miscellaneous
- 20 starting Aura slots
- Non-stacking Aura counts
- Highest Rarity / Most Recently Rolled / Alphabetical sorting
- Aura search
- Inventory item counts

The remaining tabs and systems are being implemented incrementally so each finished system can be tested before the next one is added.


## Current implementation status
- NPC systems are connected to rolling, inventory, crafting, Potions, Gear effects, quests, Bank compounding, and the tutorial.
- Tutorial Part I/II is implemented, including the exact ten-roll gate, Tutorial Potions, NPC tasks, and Auto Roll unlock.
- Global tab UI is implemented with leaderboard/chat/player-display structures and a local fallback.
- Supabase synchronization is intentionally pending while the connected project is unavailable; no fake shared-player data is generated.
