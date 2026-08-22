"""Compose PodiMart.lk social covers from branded backgrounds + the real logo."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"E:\Git\podimart")
ASSETS = Path(r"C:\Users\Newline\.cursor\projects\e-Git-podimart\assets")
OUT = ROOT / "branding" / "social"
LOGO_PATH = ROOT / "frontend" / "public" / "images" / "logo-podimart.png"

INK = (22, 50, 74, 255)
CLAY = (47, 134, 196, 255)
MUTED = (90, 115, 136, 255)
CREAM = (238, 246, 252, 255)

SIZES = {
    "facebook-cover.png": (1640, 624),
    "facebook-cover-graphic.png": (1640, 624),
    "twitter-x-cover.png": (1500, 500),
    "linkedin-cover.png": (1584, 396),
    "instagram-post.png": (1080, 1080),
    "profile-photo.png": (1080, 1080),
    "og-image.png": (1200, 630),
}


def font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    names = {
        "regular": "segoeui.ttf",
        "semibold": "segoeuisemibold.ttf",
        "bold": "segoeuib.ttf",
    }
    path = Path(r"C:\Windows\Fonts") / names[weight]
    if not path.exists():
        path = Path(r"C:\Windows\Fonts\segoeui.ttf")
    return ImageFont.truetype(str(path), size)


def fit_cover(img: Image.Image, size: tuple[int, int], focal: str = "center") -> Image.Image:
    tw, th = size
    iw, ih = img.size
    scale = max(tw / iw, th / ih)
    nw, nh = max(1, round(iw * scale)), max(1, round(ih * scale))
    fitted = img.resize((nw, nh), Image.Resampling.LANCZOS)
    if focal == "right":
        left = nw - tw
    elif focal == "left":
        left = 0
    else:
        left = (nw - tw) // 2
    if focal == "top":
        top = 0
    elif focal == "bottom":
        top = nh - th
    else:
        top = (nh - th) // 2
    return fitted.crop((left, top, left + tw, top + th))


def left_wash(size: tuple[int, int], until: float = 0.58, color: tuple[int, int, int] = (255, 255, 255)) -> Image.Image:
    w, h = size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = overlay.load()
    fade_start = int(w * (until - 0.18))
    fade_end = int(w * until)
    for x in range(fade_end):
        if x < fade_start:
            a = 210
        else:
            t = (x - fade_start) / max(1, fade_end - fade_start)
            a = int(210 * (1 - t))
        for y in range(h):
            px[x, y] = (*color, a)
    return overlay


def scale_logo(logo: Image.Image, height: int) -> Image.Image:
    scale = height / logo.height
    return logo.resize((max(1, round(logo.width * scale)), height), Image.Resampling.LANCZOS)


def paste(base: Image.Image, overlay: Image.Image, xy: tuple[int, int]) -> None:
    base.alpha_composite(overlay, dest=xy)


def headline(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int], size: int, fill=INK) -> None:
    draw.text(xy, text, font=font("bold", size), fill=fill)


def subhead(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int], size: int, fill=MUTED) -> None:
    draw.text(xy, text, font=font("regular", size), fill=fill)


def make_facebook_lifestyle(logo: Image.Image, bg: Image.Image) -> Image.Image:
    size = SIZES["facebook-cover.png"]
    canvas = fit_cover(bg, size, focal="right").convert("RGBA")
    paste(canvas, left_wash(size, until=0.62, color=(248, 252, 255)), (0, 0))
    mark = scale_logo(logo, 470)
    # Keep clear of Facebook profile overlap (bottom-left) and mobile side crop.
    x = 70
    y = max(18, (size[1] - mark.height) // 2 - 12)
    paste(canvas, mark, (x, y))
    return canvas


def make_facebook_graphic(logo: Image.Image, bg: Image.Image) -> Image.Image:
    size = SIZES["facebook-cover-graphic.png"]
    canvas = fit_cover(bg, size, focal="center").convert("RGBA")
    paste(canvas, left_wash(size, until=0.55, color=(255, 255, 255)), (0, 0))
    mark = scale_logo(logo, 470)
    paste(canvas, mark, (70, max(18, (size[1] - mark.height) // 2 - 12)))
    return canvas


def make_twitter(logo: Image.Image, bg: Image.Image) -> Image.Image:
    size = SIZES["twitter-x-cover.png"]
    canvas = fit_cover(bg, size, focal="right").convert("RGBA")
    paste(canvas, left_wash(size, until=0.6, color=(248, 252, 255)), (0, 0))
    mark = scale_logo(logo, 400)
    paste(canvas, mark, (64, (size[1] - mark.height) // 2))
    return canvas


def make_linkedin(logo: Image.Image, bg: Image.Image) -> Image.Image:
    size = SIZES["linkedin-cover.png"]
    w, h = size
    canvas = fit_cover(bg, size, focal="right").convert("RGBA")
    paste(canvas, left_wash(size, until=0.72, color=(250, 253, 255)), (0, 0))
    mark = scale_logo(logo, 300)
    paste(canvas, mark, (48, (h - mark.height) // 2))
    draw = ImageDraw.Draw(canvas)
    text_x = 48 + mark.width + 36
    headline(draw, "Marketplace for home businesses", (text_x, h // 2 - 46), 36)
    subhead(draw, "Homemade cakes, crafts & gifts from Sri Lanka", (text_x, h // 2 + 4), 24)
    return canvas


def make_instagram(logo: Image.Image, bg: Image.Image) -> Image.Image:
    size = SIZES["instagram-post.png"]
    canvas = fit_cover(bg, size, focal="center").convert("RGBA")
    wash = Image.new("RGBA", size, (255, 255, 255, 96))
    canvas.alpha_composite(wash)
    mark = scale_logo(logo, 720)
    paste(canvas, mark, ((size[0] - mark.width) // 2, (size[1] - mark.height) // 2))
    return canvas


def make_profile(logo: Image.Image) -> Image.Image:
    size = SIZES["profile-photo.png"]
    canvas = Image.new("RGBA", size, CREAM)
    mark = scale_logo(logo, 780)
    paste(canvas, mark, ((size[0] - mark.width) // 2, (size[1] - mark.height) // 2))
    return canvas


def make_og(logo: Image.Image, bg: Image.Image) -> Image.Image:
    size = SIZES["og-image.png"]
    canvas = fit_cover(bg, size, focal="right").convert("RGBA")
    paste(canvas, left_wash(size, until=0.64, color=(248, 252, 255)), (0, 0))
    mark = scale_logo(logo, 440)
    paste(canvas, mark, (48, (size[1] - mark.height) // 2 - 28))
    draw = ImageDraw.Draw(canvas)
    headline(draw, "Marketplace for home businesses", (72, size[1] - 92), 28)
    subhead(draw, "podimart.lk", (72, size[1] - 54), 22, fill=CLAY)
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    logo = Image.open(LOGO_PATH).convert("RGBA")
    lifestyle = Image.open(ASSETS / "podimart-cover-bg-lifestyle.png")
    graphic = Image.open(ASSETS / "podimart-cover-bg-graphic.png")
    square = Image.open(ASSETS / "podimart-cover-bg-square.png")

    outputs = {
        "facebook-cover.png": make_facebook_lifestyle(logo, lifestyle),
        "facebook-cover-graphic.png": make_facebook_graphic(logo, graphic),
        "twitter-x-cover.png": make_twitter(logo, lifestyle),
        "linkedin-cover.png": make_linkedin(logo, lifestyle),
        "instagram-post.png": make_instagram(logo, square),
        "profile-photo.png": make_profile(logo),
        "og-image.png": make_og(logo, lifestyle),
    }
    for name, image in outputs.items():
        path = OUT / name
        image.convert("RGB").save(path, "PNG", optimize=True)
        print(f"saved {path} {image.size}")


if __name__ == "__main__":
    main()
