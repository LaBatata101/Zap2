# Generated by Django 5.2.3 on 2025-07-17 22:27

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0002_alter_message_content_media"),
    ]

    operations = [
        migrations.CreateModel(
            name="MessageMedia",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("file", models.ImageField(upload_to="chat_media/")),
                (
                    "message",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="media",
                        to="chat.message",
                    ),
                ),
            ],
        ),
        migrations.DeleteModel(
            name="Media",
        ),
    ]
