package com.example.shared;

import java.util.List;

public class OrderCreate {
    private String clientId;
    private List<Producto> items;

    public OrderCreate() {}

    public OrderCreate(String clientId, List<Producto> items) {
        this.clientId = clientId;
        this.items = items;
    }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public List<Producto> getItems() { return items; }
    public void setItems(List<Producto> items) { this.items = items; }
}
