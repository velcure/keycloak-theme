FROM quay.io/keycloak/keycloak:26.8.1
COPY --chown=1000:0 themes/velcure /opt/keycloak/themes/velcure
