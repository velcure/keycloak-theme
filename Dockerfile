FROM quay.io/keycloak/keycloak:26.8.1 AS development
COPY --chown=1000:0 themes/velcure /opt/keycloak/themes/velcure

FROM development AS builder
ENV KC_DB=postgres \
    KC_HEALTH_ENABLED=true \
    KC_METRICS_ENABLED=true
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.8.1 AS production
COPY --from=builder --chown=1000:0 /opt/keycloak/ /opt/keycloak/
ENV KC_DB=postgres \
    KC_HEALTH_ENABLED=true \
    KC_METRICS_ENABLED=true
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
