# Architecture Rules

- Keep POS sale-unit conversion, base-stock math, and tier-price calculation in a pure helper module, with POS UI and persistence consuming its validated snapshots so inventory logic can be tested independently.