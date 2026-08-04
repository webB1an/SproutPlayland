from __future__ import annotations

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "docs" / "generated-assets" / "gameplay-sources"


def square_asset(image: Image.Image, size: int = 512, padding: int = 18) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        raise ValueError("generated sprite cell is empty")
    cropped = image.crop(bbox)
    scale = min((size - padding * 2) / cropped.width, (size - padding * 2) / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )
    output = Image.new("RGBA", (size, size))
    output.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return output


def split_grid(source_name: str, columns: int, rows: int, names: list[str], destination: Path) -> None:
    source = Image.open(SOURCES / source_name).convert("RGBA")
    destination.mkdir(parents=True, exist_ok=True)
    if len(names) != columns * rows:
        raise ValueError("sprite name count does not match grid")
    for index, name in enumerate(names):
        column = index % columns
        row = index // columns
        left = round(column * source.width / columns) + 10
        right = round((column + 1) * source.width / columns) - 10
        top = round(row * source.height / rows) + 10
        bottom = round((row + 1) * source.height / rows) - 10
        cell = source.crop((left, top, right, bottom))
        square_asset(cell).save(destination / f"{name}.png")


def save_background(source_name: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCES / source_name).convert("RGB")
    source.resize((1536, 864), Image.Resampling.LANCZOS).save(destination, optimize=True)


def main() -> None:
    split_grid(
        "global-buttons-alpha.png",
        3,
        2,
        ["ui-back", "ui-help", "ui-replay", "ui-next", "ui-menu", "ui-play"],
        ROOT / "assets" / "resources" / "art" / "common" / "ui-generated",
    )
    split_grid(
        "color-fruit-baskets-alpha.png",
        5,
        2,
        [
            "fruit-red", "fruit-orange", "fruit-yellow", "fruit-green", "fruit-purple",
            "basket-red", "basket-orange", "basket-yellow", "basket-green", "basket-purple",
        ],
        ROOT / "assets" / "resources" / "art" / "games" / "color" / "play",
    )
    split_grid(
        "shape-pieces-alpha.png",
        4,
        2,
        [
            "shape-triangle", "shape-rectangle", "shape-circle", "shape-square",
            "shape-star", "shape-heart", "shape-oval", "shape-hexagon",
        ],
        ROOT / "assets" / "resources" / "art" / "games" / "shape" / "play",
    )
    split_grid(
        "color-theme-objects-alpha.png",
        5,
        4,
        [
            "theme-sunny-item", "theme-orchard-item", "theme-ocean-item", "theme-candy-item", "theme-forest-item",
            "theme-sunset-item", "theme-rain-item", "theme-flower-item", "theme-melon-item", "theme-rainbow-item",
            "theme-sunny-target", "theme-orchard-target", "theme-ocean-target", "theme-candy-target", "theme-forest-target",
            "theme-sunset-target", "theme-rain-target", "theme-flower-target", "theme-melon-target", "theme-rainbow-target",
        ],
        ROOT / "assets" / "resources" / "art" / "games" / "color" / "play",
    )
    save_background(
        "color-orchard-background.png",
        ROOT / "assets" / "resources" / "art" / "games" / "color" / "play" / "color-orchard-bg.png",
    )
    save_background(
        "shape-workshop-background.png",
        ROOT / "assets" / "resources" / "art" / "games" / "shape" / "play" / "shape-workshop-bg.png",
    )


if __name__ == "__main__":
    main()
