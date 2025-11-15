package com.example.shared;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/**
 * Utility methods shared between components A and B.
 */
public final class SharedUtils {
    private SharedUtils() {}

    /**
     * Sum amounts (in cents) and return a BigDecimal in units.
     */
    public static BigDecimal sumAmountsInCents(List<Long> cents) {
        Objects.requireNonNull(cents);
        long total = 0L;
        for (Long c : cents) {
            if (c != null) total += c;
        }
        return BigDecimal.valueOf(total).movePointLeft(2);
    }

    /**
     * Simple validation helper for identifier format.
     */
    public static boolean isValidId(String id) {
        return id != null && id.matches("^[a-zA-Z0-9_-]{3,64}$");
    }

    /**
     * Calculate total from a list of products (priceCents * quantity)
     */
    public static BigDecimal calcularTotal(List<Producto> productos) {
        Objects.requireNonNull(productos);
        long totalCents = 0L;
        for (Producto p : productos) {
            if (p != null) totalCents += p.getPriceCents() * p.getQuantity();
        }
        return BigDecimal.valueOf(totalCents).movePointLeft(2);
    }

    /**
     * Generate a simple unique code for an entity type (timestamp + random part)
     */
    public static String generarCodigoUnico(String tipoEntidad) {
        long ts = System.currentTimeMillis();
        int r = (int) (Math.random() * 1_000_000);
        return String.format("%s-%d-%06d", tipoEntidad, ts, r);
    }

    /**
     * Call Componente A to create an order (POST /orders). Returns the created order id or null.
     */
    public static String invokeCreateOrderOnComponentA(String baseUrl, OrderCreate order) {
        try (var client = org.apache.hc.client5.http.impl.classic.HttpClients.createDefault()) {
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String json = mapper.writeValueAsString(order);
            var post = new org.apache.hc.client5.http.classic.methods.HttpPost(baseUrl + "/orders");
            post.setHeader("Content-Type", "application/json");
            post.setEntity(new org.apache.hc.core5.http.io.entity.StringEntity(json, java.nio.charset.StandardCharsets.UTF_8));
            try (var resp = client.execute(post)) {
                int status = resp.getCode();
                if (status >= 200 && status < 300) {
                    var body = resp.getEntity() != null ? java.util.Objects.toString(org.apache.hc.core5.http.io.entity.EntityUtils.toString(resp.getEntity())) : null;
                    if (body != null && !body.isEmpty()) {
                        var node = mapper.readTree(body);
                        if (node.has("id")) return node.get("id").asText();
                    }
                    return null;
                } else {
                    return null;
                }
            }
        } catch (Exception e) {
            // In a library we usually don't swallow exceptions but return null or rethrow a runtime exception.
            return null;
        }
    }
}
