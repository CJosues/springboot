package com.example.shared;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.classic.CloseableHttpClient;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;

import java.nio.charset.StandardCharsets;

public class IntegrationClient implements AutoCloseable {
    private final CloseableHttpClient client;
    private final ObjectMapper mapper = new ObjectMapper();

    public IntegrationClient() {
        this.client = HttpClients.createDefault();
    }

    public String createOrder(String baseUrl, OrderCreate order) throws Exception {
        HttpPost post = new HttpPost(baseUrl + "/orders");
        post.setHeader("Content-Type", "application/json");
        String json = mapper.writeValueAsString(order);
        post.setEntity(new StringEntity(json, StandardCharsets.UTF_8));
        try (var resp = client.execute(post)) {
            int status = resp.getCode();
            if (status >= 200 && status < 300) {
                var body = resp.getEntity() != null ? org.apache.hc.core5.http.io.entity.EntityUtils.toString(resp.getEntity()) : null;
                if (body != null) {
                    var node = mapper.readTree(body);
                    if (node.has("id")) return node.get("id").asText();
                }
            }
        }
        return null;
    }

    @Override
    public void close() throws Exception {
        client.close();
    }
}
