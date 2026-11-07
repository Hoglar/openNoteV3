from io import BytesIO

from django.conf import settings
from rest_framework.exceptions import ParseError
from rest_framework.parsers import JSONParser


class BoundedJSONParser(JSONParser):
    """Bound memory before decoding and reject characters PostgreSQL cannot store."""

    def parse(self, stream, media_type=None, parser_context=None):
        raw = stream.read(settings.DATA_UPLOAD_MAX_MEMORY_SIZE + 1)
        if len(raw) > settings.DATA_UPLOAD_MAX_MEMORY_SIZE:
            raise ParseError('Forespørselen er for stor (maks 512 kB).')
        try:
            value = super().parse(BytesIO(raw), media_type, parser_context)
        except RecursionError:
            raise ParseError('JSON-strukturen er for dypt nestet.')

        def check(item):
            if isinstance(item, str):
                if '\x00' in item or any(0xD800 <= ord(char) <= 0xDFFF for char in item):
                    raise ParseError('Teksten inneholder ugyldige tegn.')
            elif isinstance(item, dict):
                for key, child in item.items():
                    check(key)
                    check(child)
            elif isinstance(item, list):
                for child in item:
                    check(child)

        try:
            check(value)
        except RecursionError:
            raise ParseError('JSON-strukturen er for dypt nestet.')
        return value
