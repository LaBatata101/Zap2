from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageSequence
from rest_framework import serializers


def crop_avatar_img(image_file, filename, crop_data: dict[str, int | float]):
    try:
        img = Image.open(image_file)
    except Exception:
        raise serializers.ValidationError("Failed to open image file")

    natural_width, natural_height = img.size

    scale = crop_data["scale"]
    pos_x = crop_data["x"]
    pos_y = crop_data["y"]
    container_width = crop_data["container_width"]
    container_height = crop_data["container_height"]
    output_size = crop_data["crop_size"]

    center_x = container_width / 2
    center_y = container_height / 2

    scaled_width = natural_width * scale
    scaled_height = natural_height * scale

    image_left_in_container = center_x - (scaled_width / 2) + pos_x
    image_top_in_container = center_y - (scaled_height / 2) + pos_y

    crop_left_in_container = center_x - (output_size / 2)
    crop_top_in_container = center_y - (output_size / 2)

    source_left = (crop_left_in_container - image_left_in_container) / scale
    source_top = (crop_top_in_container - image_top_in_container) / scale
    source_size = output_size / scale

    box = (
        int(source_left),
        int(source_top),
        int(source_left + source_size),
        int(source_top + source_size),
    )

    # Create a circular mask
    mask = Image.new("L", (output_size * 3, output_size * 3), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, output_size * 3, output_size * 3), fill=255)
    mask = mask.resize((output_size, output_size), Image.Resampling.LANCZOS)

    def process_image(image: Image.Image):
        cropped_img = image.crop(box)
        resized_img = cropped_img.resize((output_size, output_size), Image.Resampling.LANCZOS).convert("RGBA")

        result = Image.new("RGBA", (output_size, output_size), (0, 0, 0, 0))
        result.paste(resized_img, (0, 0), mask)
        return result

    if img.format == "GIF":
        frames = []
        duration = img.info.get("duration", 100)
        loop = img.info.get("loop", 0)

        for frame in ImageSequence.Iterator(img):
            processed_frame = process_image(frame)
            frames.append(processed_frame.convert("P", palette=Image.Palette.ADAPTIVE))

        if not frames:
            image_file.seek(0)
            return image_file

        output_buffer = BytesIO()
        frames[0].save(
            output_buffer,
            format="GIF",
            save_all=True,
            append_images=frames[1:],
            optimize=False,
            duration=duration,
            loop=loop,
            disposal=2,
        )
        output_buffer.seek(0)
        return ContentFile(output_buffer.read(), name=f"{filename}.gif")

    else:
        processed_image = process_image(img)
        output_buffer = BytesIO()
        processed_image.save(output_buffer, format="PNG", quality=95)
        output_buffer.seek(0)
        return ContentFile(output_buffer.read(), name=f"{filename}.png")
