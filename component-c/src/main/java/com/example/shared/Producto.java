package com.example.shared;

import java.math.BigDecimal;

public class Producto {
    private String sku;
    private int quantity;
    private long priceCents; // price per unit in cents

    public Producto() {}

    public Producto(String sku, int quantity, long priceCents) {
        this.sku = sku;
        this.quantity = quantity;
        this.priceCents = priceCents;
    }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public long getPriceCents() { return priceCents; }
    public void setPriceCents(long priceCents) { this.priceCents = priceCents; }

    public BigDecimal totalPrice() {
        return java.math.BigDecimal.valueOf(priceCents * quantity).movePointLeft(2);
    }
}
