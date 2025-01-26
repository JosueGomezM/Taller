-- Actualizar la URL del logo
UPDATE system_settings
SET value = 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/multiservicios-ecologicos-logo.png',
    updated_at = now()
WHERE key = 'logo_url';