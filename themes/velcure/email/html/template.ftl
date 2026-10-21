<#macro emailLayout>
<#assign content><#nested></#assign>
<#if content?is_markup_output><#assign content=content?markup_string></#if>
<!DOCTYPE html>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background-color:#f2f6f3;color:#032f2e;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f6f3;"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
<tr><td style="background-color:#032f2e;padding:28px 32px;border-radius:20px 20px 0 0;">
<img src="${url.resourcesUrl}/brand/velcure-logo-white.png" alt="Velcure" width="146" height="39" style="display:block;border:0;width:146px;height:auto;">
</td></tr>
<tr><td style="background-color:#ffffff;padding:28px 32px 32px;font-size:16px;line-height:1.65;border-radius:0 0 20px 20px;">
${content?replace('<a ', '<a style="display:inline-block;background-color:#032f2e;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:bold;overflow-wrap:anywhere;" ')?no_esc}
</td></tr>
<tr><td style="padding:22px 16px 0;font-size:12px;line-height:1.7;color:#4c6258;text-align:center;">Velcure GmbH<br>Kurfürstendamm 106 · 10711 Berlin</td></tr>
</table>
</td></tr></table>
</body></html>
</#macro>
